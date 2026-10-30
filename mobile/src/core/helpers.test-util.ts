import { kvMemoria } from './kv';
import type { Session, SessionStore } from './http';

export const json = (status: number, corpo?: unknown) =>
  new Response(corpo === undefined ? null : JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } });

export const storeMemoria = (inicial: Session | null = null): SessionStore & { atual: Session | null } => {
  const s = { atual: inicial,
    load: async () => s.atual, save: async (x: Session) => { s.atual = x; }, clear: async () => { s.atual = null; } };
  return s;
};

export const sessao = (extra: Partial<Session> = {}): Session => ({
  accessToken: 'A1', accessExpiraEm: new Date(Date.now() + 3600_000).toISOString(), refreshToken: 'R1', usuarioId: 2, nome: 'Ana', perfil: 1, ...extra,
});

export const chamadoApi = (id: number, extra: object = {}) => ({
  id, titulo: 'T', descricao: '', status: 1, dataAbertura: '2026-10-30T10:00:00', contratoId: 1,
  contratoNumero: 'C-1', clienteId: 2, clienteNome: 'Ana', ...extra,
});
export { kvMemoria };
