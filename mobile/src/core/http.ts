export class ApiError extends Error {
  constructor(message: string, public status: number, public network = false, public detalhe = '') { super(message); }
}

export interface Session {
  accessToken: string;
  accessExpiraEm: string;
  refreshToken: string;
  usuarioId: number;
  nome: string;
  perfil: number;
}
export interface SessionStore {
  load(): Promise<Session | null>;
  save(s: Session): Promise<void>;
  clear(): Promise<void>;
}

export interface AuthPayload { token: string; expiraEm: string; refreshToken?: string | null; usuarioId: number; nome: string; perfil: number }
export const sessaoDe = (r: AuthPayload): Session => ({
  accessToken: r.token, accessExpiraEm: r.expiraEm, refreshToken: r.refreshToken ?? '', usuarioId: r.usuarioId, nome: r.nome, perfil: r.perfil,
});

interface Opcoes {
  baseUrl: string;
  store: SessionStore;
  fetchImpl?: typeof fetch;
  /** Chamado quando a sessão não pode mais ser renovada (usuário precisa entrar de novo). */
  onSessionLost?: () => void;
  timeoutMs?: number;
  now?: () => number;
}

const MSG_REDE = 'Sem conexão com o servidor.';

export function createHttp(o: Opcoes) {
  const f = o.fetchImpl ?? fetch;
  const agora = o.now ?? Date.now;
  let renovando: Promise<Session> | null = null;

  async function enviar(path: string, init: RequestInit, token?: string): Promise<Response> {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), o.timeoutMs ?? 15000); // rede ruim não pode travar o app
    const url = `${o.baseUrl}/api${path}`;
    try {
      return await f(url, {
        ...init,
        signal: ctrl.signal,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
    } catch (e) {
      // A mensagem para o usuário continua genérica; o motivo real (URL e erro) vai em `detalhe` para diagnóstico.
      const motivo = (e as Error)?.name === 'AbortError' ? 'tempo esgotado' : String((e as Error)?.message ?? e);
      throw new ApiError(MSG_REDE, 0, true, `${url} -> ${motivo}`);
    } finally { clearTimeout(t); }
  }

  async function perderSessao(): Promise<never> {
    await o.store.clear();
    o.onSessionLost?.();
    throw new ApiError('Sua sessão terminou. Entre novamente.', 401);
  }

  /** Renova o token. Chamadas simultâneas compartilham uma única renovação (o refresh token é de uso único). */
  function renovar(): Promise<Session> {
    renovando ??= (async () => {
      const atual = await o.store.load();
      if (!atual?.refreshToken) return perderSessao();
      const res = await enviar('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken: atual.refreshToken }) });
      if (res.ok) {
        const nova = sessaoDe(await res.json());
        await o.store.save(nova);
        return nova;
      }
      // Recusado de forma definitiva: encerra. Erro do servidor (5xx): mantém a sessão para tentar depois.
      if (res.status === 400 || res.status === 401 || res.status === 403) return perderSessao();
      throw new ApiError('Servidor indisponível. Tente de novo em instantes.', res.status);
    })().finally(() => { renovando = null; });
    return renovando;
  }

  const expirando = (s: Session) => {
    const t = Date.parse(s.accessExpiraEm);
    return !Number.isNaN(t) && t - agora() < 30_000;
  };

  async function request<T>(path: string, init: { method?: string; body?: unknown; auth?: boolean } = {}): Promise<T> {
    const auth = init.auth ?? true;
    const req: RequestInit = { method: init.method ?? 'GET', body: init.body === undefined ? undefined : JSON.stringify(init.body) };

    let sessao = auth ? await o.store.load() : null;
    if (auth && !sessao) throw new ApiError('Faça login para continuar.', 401);
    if (sessao && expirando(sessao)) sessao = await renovar();

    let res = await enviar(path, req, sessao?.accessToken);
    if (res.status === 401 && auth) {
      sessao = await renovar();
      res = await enviar(path, req, sessao.accessToken);
      if (res.status === 401) return perderSessao();
    }
    if (res.status === 204) return undefined as T;

    const corpo = await res.json().catch(() => null);
    if (!res.ok) {
      const msg =
        res.status === 403 ? 'Você não tem permissão para fazer isso.'
        : corpo?.errors ? 'Confira os dados e tente de novo.'
        : corpo?.title && res.status < 500 ? String(corpo.title)
        : 'Algo deu errado do nosso lado. Tente de novo em instantes.';
      throw new ApiError(msg, res.status);
    }
    return corpo as T;
  }

  return { request };
}
export type Http = ReturnType<typeof createHttp>;
