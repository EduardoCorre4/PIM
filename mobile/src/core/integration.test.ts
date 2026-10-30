// Teste de integração contra a API REAL. Só roda se JAKE_API_URL estiver definido:
//   JAKE_API_URL=http://localhost:8080 JAKE_TEST_EMAIL=cliente@x.com JAKE_TEST_SENHA=... npm run test:integration
// O cliente precisa ter ao menos um contrato ativo e vigente.
import { describe, expect, it } from 'vitest';
import { createApi } from './api';
import { createCache } from './cache';
import { createHttp, type Session } from './http';
import { kvMemoria } from './kv';
import { createOutbox } from './outbox';
import { contratoElegivel } from './regras';
import { createSync } from './sync';

const URL = process.env.JAKE_API_URL;
const roda = URL ? describe : describe.skip;

roda('integração com a API real', () => {
  const montar = () => {
    let atual: Session | null = null;
    const store = { load: async () => atual, save: async (s: Session) => { atual = s; }, clear: async () => { atual = null; } };
    let rede = true;
    const fetchImpl = ((u: any, i: any) => (rede ? fetch(u, i) : Promise.reject(new TypeError('offline')))) as typeof fetch;
    const http = createHttp({ baseUrl: URL!, store, fetchImpl });
    const api = createApi(http, store);
    const kv = kvMemoria();
    let n = 0;
    const outbox = createOutbox(kv, 1, () => `${Date.now()}-${++n}-${Math.random().toString(36).slice(2)}`);
    const cache = createCache(kv, 1);
    return { api, store, outbox, cache, sync: createSync(api, outbox, cache), offline: () => { rede = false; }, online: () => { rede = true; } };
  };

  it('login, renovação forçada, fila offline, envio e idempotência', async () => {
    const t = montar();
    const sessao = await t.api.login(process.env.JAKE_TEST_EMAIL!, process.env.JAKE_TEST_SENHA!);
    expect(sessao.refreshToken.length).toBeGreaterThan(20);

    // força o token de acesso a "vencer": o cliente deve renovar sozinho e guardar o refresh token novo
    await t.store.save({ ...sessao, accessExpiraEm: new Date(Date.now() - 1000).toISOString() });
    const contratos = await t.api.meusContratos();
    const depois = (await t.store.load())!;
    expect(depois.refreshToken).not.toBe(sessao.refreshToken);

    // token de acesso inválido (401): também renova e repete
    await t.store.save({ ...depois, accessToken: 'lixo' });
    await t.api.meusChamados();
    expect((await t.store.load())!.accessToken).not.toBe('lixo');

    const contrato = contratos.find(c => contratoElegivel(c));
    expect(contrato, 'o cliente de teste precisa de um contrato ativo').toBeDefined();

    // offline: o chamado vai para a fila
    const titulo = `Integração ${Date.now()}`;
    await t.outbox.adicionar({ contratoId: contrato!.id, contratoNumero: contrato!.numero, titulo, descricao: 'teste' });
    t.offline();
    const off = await t.sync.sincronizar();
    expect(off.envio).toMatchObject({ enviados: 0, restantes: 1, semConexao: true });

    // volta a internet: a fila é enviada e o chamado aparece
    t.online();
    const on = await t.sync.sincronizar();
    expect(on.envio).toMatchObject({ enviados: 1, restantes: 0 });
    const lista = await t.api.meusChamados();
    expect(lista.filter(c => c.titulo === titulo)).toHaveLength(1);

    // reenvio com a mesma chave (resposta perdida): o servidor devolve o mesmo chamado
    const existente = lista.find(c => c.titulo === titulo)!;
    const chave = 'chave-fixa-' + Date.now();
    const a = await t.api.abrirChamado({ contratoId: contrato!.id, titulo: titulo + ' B', descricao: '', chaveIdempotencia: chave });
    const b = await t.api.abrirChamado({ contratoId: contrato!.id, titulo: titulo + ' B', descricao: '', chaveIdempotencia: chave });
    expect(b.id).toBe(a.id);
    expect(a.id).not.toBe(existente.id);

    // logout revoga o refresh token no servidor
    const ultimo = (await t.store.load())!.refreshToken;
    await t.api.logout();
    const r = await fetch(`${URL}/api/auth/refresh`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: ultimo }) });
    expect(r.status).toBe(401);
  }, 30000);

  it('gerente também entra no app e vê a fila', async () => {
    const t = montar();
    const s = await t.api.login(process.env.JAKE_GERENTE_EMAIL ?? 'gerente@jake.local', process.env.JAKE_GERENTE_SENHA ?? 'x');
    expect(s.perfil).toBe(3);
    expect(Array.isArray(await t.api.fila())).toBe(true);
  });
});
