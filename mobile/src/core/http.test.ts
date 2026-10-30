import { describe, expect, it, vi } from 'vitest';
import { ApiError, createHttp } from './http';
import { json, sessao, storeMemoria } from './helpers.test-util';

const auth = (token: string, refresh: string) => ({
  token, refreshToken: refresh, expiraEm: new Date(Date.now() + 3600_000).toISOString(), usuarioId: 2, nome: 'Ana', perfil: 1,
});

function setup(handler: (url: string, init: RequestInit) => Response | Promise<Response>, s = sessao()) {
  const store = storeMemoria(s);
  const onLost = vi.fn();
  const fetchImpl = vi.fn(async (u: string | URL | Request, i?: RequestInit) => handler(String(u), i ?? {}));
  const http = createHttp({ baseUrl: 'http://x', store, fetchImpl: fetchImpl as never, onSessionLost: onLost });
  return { store, onLost, fetchImpl, http };
}
const bearer = (i: RequestInit) => (i.headers as Record<string, string>).Authorization;

describe('http', () => {
  it('envia o token de acesso', async () => {
    const { http, fetchImpl } = setup(() => json(200, [1]));
    expect(await http.request('/meus-contratos')).toEqual([1]);
    expect(bearer(fetchImpl.mock.calls[0][1] as RequestInit)).toBe('Bearer A1');
  });

  it('renova no 401 e repete a requisição com o novo token', async () => {
    const { http, store, fetchImpl } = setup((u, i) =>
      u.endsWith('/auth/refresh') ? json(200, auth('A2', 'R2'))
      : bearer(i) === 'Bearer A2' ? json(200, { ok: true }) : json(401));
    expect(await http.request('/chamados/meus')).toEqual({ ok: true });
    expect(store.atual?.refreshToken).toBe('R2'); // o refresh token novo foi guardado
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it('várias requisições com 401 ao mesmo tempo fazem UMA só renovação', async () => {
    let renovacoes = 0;
    const { http } = setup(async (u, i) => {
      if (u.endsWith('/auth/refresh')) { renovacoes++; await new Promise(r => setTimeout(r, 20)); return json(200, auth('A2', 'R2')); }
      return bearer(i) === 'Bearer A2' ? json(200, 'ok') : json(401);
    });
    await Promise.all([http.request('/a'), http.request('/b'), http.request('/c')]);
    expect(renovacoes).toBe(1); // refresh token é de uso único: duas renovações derrubariam a sessão
  });

  it('renova antes de enviar se o token está para vencer', async () => {
    const { http, fetchImpl } = setup((u) => u.endsWith('/auth/refresh') ? json(200, auth('A2', 'R2')) : json(200, 'ok'),
      sessao({ accessExpiraEm: new Date(Date.now() + 5_000).toISOString() }));
    await http.request('/x');
    expect(String(fetchImpl.mock.calls[0][0])).toContain('/auth/refresh');
  });

  it('refresh recusado: apaga a sessão e avisa o app', async () => {
    const { http, store, onLost } = setup((u) => (u.endsWith('/auth/refresh') ? json(401) : json(401)));
    await expect(http.request('/x')).rejects.toMatchObject({ status: 401 });
    expect(store.atual).toBeNull();
    expect(onLost).toHaveBeenCalledOnce();
  });

  it('sem internet durante a renovação: MANTÉM a sessão', async () => {
    const { http, store, onLost } = setup((u) => {
      if (u.endsWith('/auth/refresh')) throw new TypeError('Network request failed');
      return json(401);
    });
    await expect(http.request('/x')).rejects.toMatchObject({ network: true });
    expect(store.atual?.refreshToken).toBe('R1');
    expect(onLost).not.toHaveBeenCalled();
  });

  it('erro 5xx na renovação não derruba a sessão', async () => {
    const { http, store } = setup((u) => (u.endsWith('/auth/refresh') ? json(503) : json(401)));
    await expect(http.request('/x')).rejects.toBeInstanceOf(ApiError);
    expect(store.atual).not.toBeNull();
  });

  it('login com senha errada (auth:false) não encerra sessão nem tenta renovar', async () => {
    const { http, fetchImpl, onLost } = setup(() => json(401, { title: 'Credenciais inválidas.' }), null as never);
    await expect(http.request('/auth/login', { method: 'POST', body: {}, auth: false })).rejects.toThrow('Credenciais inválidas.');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(onLost).not.toHaveBeenCalled();
  });

  it('falha de rede vira ApiError.network', async () => {
    const { http } = setup(() => { throw new TypeError('x'); });
    await expect(http.request('/x')).rejects.toMatchObject({ network: true, status: 0 });
  });
});
