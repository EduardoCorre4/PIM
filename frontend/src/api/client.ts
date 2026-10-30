import type { AuthResponse, Chamado, ContratoCliente, Contrato, ContratoInput, Indicadores, RelatorioResumo, Usuario } from './types';

export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

let token: string | null = null;
let onUnauthorized: () => void = () => {};
export const setToken = (t: string | null) => { token = t; };
export const setOnUnauthorized = (fn: () => void) => { onUnauthorized = fn; };

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch {
    throw new ApiError('Não foi possível conectar ao servidor. Verifique sua internet e tente de novo.', 0);
  }

  if (res.status === 401 && token) { onUnauthorized(); throw new ApiError('Sua sessão terminou. Entre novamente.', 401); }
  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const msg =
      res.status === 403 ? 'Você não tem permissão para fazer isso.'
      : body?.errors ? 'Confira os campos preenchidos e tente de novo.'
      : body?.title && res.status < 500 ? body.title
      : 'Algo deu errado do nosso lado. Tente de novo em instantes.';
    throw new ApiError(msg, res.status);
  }
  return body as T;
}

const json = (data: unknown) => JSON.stringify(data);

/** Baixa um arquivo (CSV) da API enviando o token, e entrega ao navegador como download. */
async function baixar(path: string, nomePadrao: string): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  } catch {
    throw new ApiError('Não foi possível conectar ao servidor. Verifique sua internet e tente de novo.', 0);
  }
  if (res.status === 401 && token) { onUnauthorized(); throw new ApiError('Sua sessão terminou. Entre novamente.', 401); }
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(body?.title && res.status < 500 ? body.title : 'Não foi possível gerar o arquivo. Tente de novo.', res.status);
  }
  const nome = /filename="?([^";]+)"?/.exec(res.headers.get('Content-Disposition') ?? '')?.[1] ?? nomePadrao;
  const url = URL.createObjectURL(await res.blob());
  const a = Object.assign(document.createElement('a'), { href: url, download: nome });
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

const qs = (p: Record<string, string | number | undefined>) => {
  const q = Object.entries(p).filter(([, v]) => v !== undefined && v !== '' && v !== 0).map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`);
  return q.length ? `?${q.join('&')}` : '';
};

export const api = {
  login: (email: string, senha: string) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: json({ email, senha }) }),
  indicadores: () => request<Indicadores>('/painel/indicadores'),
  clientes: () => request<Usuario[]>('/usuarios?perfil=1'),
  contratos: () => request<Contrato[]>('/contratos'),
  criarContrato: (c: ContratoInput) => request<Contrato>('/contratos', { method: 'POST', body: json(c) }),
  editarContrato: (id: number, c: ContratoInput) =>
    request<Contrato>(`/contratos/${id}`, { method: 'PUT', body: json(c) }),
  excluirContrato: (id: number) => request<void>(`/contratos/${id}`, { method: 'DELETE' }),
  chamados: (status?: number) => request<Chamado[]>(`/chamados${status ? `?status=${status}` : ''}`),
  meusChamados: () => request<Chamado[]>('/chamados/meus'),
  meusContratos: () => request<ContratoCliente[]>('/meus-contratos'),
  abrirChamado: (c: { contratoId: number; titulo: string; descricao: string; chaveIdempotencia: string }) =>
    request<Chamado>('/chamados', { method: 'POST', body: json(c) }),
  relatorioResumo: (de?: string, ate?: string) => request<RelatorioResumo>(`/relatorios/resumo${qs({ de, ate })}`),
  relatorioChamados: (f: { de?: string; ate?: string; status?: number }) => request<Chamado[]>(`/relatorios/chamados${qs(f)}`),
  baixarChamadosCsv: (f: { de?: string; ate?: string; status?: number }) =>
    baixar(`/relatorios/chamados${qs({ ...f, formato: 'csv' })}`, 'chamados.csv'),
  baixarContratosCsv: (f: { venceEmDias?: number }) =>
    baixar(`/relatorios/contratos${qs({ ...f, formato: 'csv' })}`, 'contratos.csv'),
  alterarStatusChamado: (id: number, status: number) =>
    request<Chamado>(`/chamados/${id}/status`, { method: 'PATCH', body: json({ status }) }),
};
