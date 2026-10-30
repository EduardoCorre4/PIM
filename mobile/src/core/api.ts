import { sessaoDe, type AuthPayload, type Http, type SessionStore } from './http';
import type { Chamado, Contrato } from './types';

export const PERFIL_CLIENTE = 1;
export const PERFIL_FUNCIONARIO = 2;
export const PERFIL_GERENTE = 3;
/** Funcionário e Gerente atendem a fila; Cliente só vê e abre os próprios chamados. */
export const atendeFila = (perfil: number) => perfil === PERFIL_FUNCIONARIO || perfil === PERFIL_GERENTE;

export interface AbrirChamadoInput { contratoId: number; titulo: string; descricao: string; chaveIdempotencia: string }

export function createApi(http: Http, store: SessionStore) {
  return {
    async login(email: string, senha: string) {
      const r = await http.request<AuthPayload>('/auth/login', { method: 'POST', body: { email, senha }, auth: false });
      const s = sessaoDe(r);
      await store.save(s);
      return s;
    },
    /** Encerra no servidor (revoga o refresh token) e apaga a sessão local, mesmo sem internet. */
    async logout() {
      const s = await store.load();
      await store.clear();
      if (s?.refreshToken) {
        await http.request('/auth/logout', { method: 'POST', body: { refreshToken: s.refreshToken }, auth: false }).catch(() => {});
      }
    },
    meusContratos: () => http.request<Contrato[]>('/meus-contratos'),
    meusChamados: () => http.request<Chamado[]>('/chamados/meus'),
    /** Fila de atendimento (Funcionário/Gerente). */
    fila: () => http.request<Chamado[]>('/chamados'),
    alterarStatus: (id: number, status: number) =>
      http.request<Chamado>(`/chamados/${id}/status`, { method: 'PATCH', body: { status } }),
    abrirChamado: (i: AbrirChamadoInput) => http.request<Chamado>('/chamados', { method: 'POST', body: i }),
  };
}
export type Api = ReturnType<typeof createApi>;
