import { beforeEach, describe, expect, it } from 'vitest';
import { createApi } from './api';
import { createCache } from './cache';
import { createHttp } from './http';
import { chamadoApi, json, kvMemoria, sessao, storeMemoria } from './helpers.test-util';
import { createOutbox } from './outbox';
import { createSync } from './sync';

function setup() {
  const servidor = { refresh: 200 as number, online: true, chamados: [] as any[], posts: [] as any[], modo: null as null | ((b: any) => Response) };
  const fetchImpl = (async (u: string, i: RequestInit) => {
    if (!servidor.online) throw new TypeError('offline');
    const url = String(u);
    if (url.endsWith('/auth/refresh')) return json(servidor.refresh, servidor.refresh === 200 ? { token: 'A2', refreshToken: 'R2', expiraEm: new Date(Date.now() + 3600_000).toISOString(), usuarioId: 2, nome: 'Ana', perfil: 1 } : undefined);
    if (url.endsWith('/chamados') && i.method === 'POST') {
      const b = JSON.parse(String(i.body));
      servidor.posts.push(b);
      if (servidor.modo) return servidor.modo(b);
      // servidor idempotente: mesma chave => mesmo chamado
      let c = servidor.chamados.find(x => x.chave === b.chaveIdempotencia);
      if (!c) { c = { ...chamadoApi(servidor.chamados.length + 1, { titulo: b.titulo }), chave: b.chaveIdempotencia }; servidor.chamados.push(c); }
      return json(201, c);
    }
    if (url.endsWith('/chamados/meus')) return json(200, servidor.chamados);
    if (url.endsWith('/meus-contratos')) return json(200, []);
    return json(404);
  }) as unknown as typeof fetch;

  const store = storeMemoria(sessao());
  const http = createHttp({ baseUrl: 'http://x', store, fetchImpl });
  const api = createApi(http, store);
  const kv = kvMemoria();
  let n = 0;
  const outbox = createOutbox(kv, 2, () => `id-${++n}`);
  const cache = createCache(kv, 2);
  return { servidor, outbox, cache, sync: createSync(api, outbox, cache), kv };
}
const novo = (t: string) => ({ contratoId: 1, contratoNumero: 'C-1', titulo: t, descricao: '' });

describe('sincronização', () => {
  let c: ReturnType<typeof setup>;
  beforeEach(() => { c = setup(); });

  it('offline: o chamado fica na fila e nada é perdido', async () => {
    c.servidor.online = false;
    await c.outbox.adicionar(novo('Sem internet'));
    const r = await c.sync.enviarFila();
    expect(r).toMatchObject({ enviados: 0, restantes: 1, semConexao: true });
    expect((await c.outbox.listar())[0].tentativas).toBe(1);
  });

  it('ao voltar a conexão, envia em ordem e esvazia a fila', async () => {
    c.servidor.online = false;
    await c.outbox.adicionar(novo('primeiro'));
    await c.outbox.adicionar(novo('segundo'));
    await c.sync.enviarFila();
    c.servidor.online = true;
    const r = await c.sync.enviarFila();
    expect(r).toMatchObject({ enviados: 2, restantes: 0 });
    expect(c.servidor.posts.map(p => p.titulo)).toEqual(['primeiro', 'segundo']);
    expect(await c.outbox.listar()).toHaveLength(0);
    expect((await c.cache.ler()).chamados).toHaveLength(2);
  });

  it('a fila sobrevive a reiniciar o app (persistida)', async () => {
    c.servidor.online = false;
    await c.outbox.adicionar(novo('guardado'));
    const depois = createOutbox(c.kv, 2, () => 'x'); // "novo processo", mesmo armazenamento
    expect(await depois.listar()).toHaveLength(1);
  });

  it('reenvio após resposta perdida não duplica (chave de idempotência)', async () => {
    const item = await c.outbox.adicionar(novo('uma vez só'));
    // 1ª tentativa: o servidor cria, mas a resposta se perde (timeout) -> app acha que falhou
    const original = c.servidor.modo;
    c.servidor.modo = b => { c.servidor.chamados.push({ ...chamadoApi(1), chave: b.chaveIdempotencia }); throw new TypeError('timeout'); };
    await c.sync.enviarFila();
    c.servidor.modo = original;
    await c.sync.enviarFila();
    expect(c.servidor.chamados).toHaveLength(1);
    expect(new Set(c.servidor.posts.map(p => p.chaveIdempotencia)).size).toBe(1);
    expect(c.servidor.posts[0].chaveIdempotencia).toBe(item.chaveIdempotencia);
  });

  it('recusa definitiva (400): marca como falhou e segue para o próximo', async () => {
    await c.outbox.adicionar(novo('ruim'));
    await c.outbox.adicionar(novo('bom'));
    c.servidor.modo = b => (b.titulo === 'ruim' ? json(400, { title: 'O contrato não está ATIVO.' }) : json(201, chamadoApi(9)));
    const r = await c.sync.enviarFila();
    expect(r).toMatchObject({ enviados: 1, falhas: 1, restantes: 0 });
    const [falhou] = await c.outbox.listar();
    expect(falhou).toMatchObject({ estado: 'falhou', erro: 'O contrato não está ATIVO.' });
  });

  it('erro 500 mantém na fila para tentar depois (não é recusa)', async () => {
    await c.outbox.adicionar(novo('x'));
    c.servidor.modo = () => json(500);
    const r = await c.sync.enviarFila();
    expect(r).toMatchObject({ enviados: 0, restantes: 1, semConexao: true });
  });

  it('item que falhou só volta à fila quando o usuário pede', async () => {
    const it = await c.outbox.adicionar(novo('x'));
    await c.outbox.marcarFalha(it.localId, 'erro');
    expect((await c.sync.enviarFila()).enviados).toBe(0);
    await c.outbox.reenfileirar(it.localId);
    expect((await c.sync.enviarFila()).enviados).toBe(1);
  });

  it('duas sincronizações ao mesmo tempo não enviam duas vezes', async () => {
    await c.outbox.adicionar(novo('x'));
    await Promise.all([c.sync.enviarFila(), c.sync.enviarFila(), c.sync.enviarFila()]);
    expect(c.servidor.posts).toHaveLength(1);
  });

  it('atualizar offline mantém o cache anterior', async () => {
    c.servidor.chamados.push({ ...chamadoApi(1), chave: 'k' });
    expect(await c.sync.atualizar()).toBe(true);
    c.servidor.online = false;
    expect(await c.sync.atualizar()).toBe(false);
    expect((await c.cache.ler()).chamados).toHaveLength(1);
  });

  it('sincronizar: envia a fila e depois traz a lista atualizada', async () => {
    await c.outbox.adicionar(novo('novo'));
    const r = await c.sync.sincronizar();
    expect(r.envio.enviados).toBe(1);
    expect(r.atualizado).toBe(true);
    expect((await c.cache.ler()).chamados).toHaveLength(1);
  });

  it('sessão perdida (refresh recusado) interrompe e NÃO descarta nem marca a fila como falha', async () => {
    await c.outbox.adicionar(novo('x'));
    c.servidor.modo = () => json(401);
    c.servidor.refresh = 401;
    const r = await c.sync.enviarFila();
    expect(r).toMatchObject({ enviados: 0, falhas: 0, restantes: 1 });
    expect((await c.outbox.listar())[0].estado).toBe('pendente');
  });

  it('com a sessão renovada no meio do caminho, o envio continua normalmente', async () => {
    await c.outbox.adicionar(novo('x'));
    let primeira = true;
    c.servidor.modo = b => { if (primeira) { primeira = false; return json(401); } return json(201, chamadoApi(5, { titulo: b.titulo })); };
    const r = await c.sync.enviarFila();
    expect(r).toMatchObject({ enviados: 1, restantes: 0 });
  });
});
