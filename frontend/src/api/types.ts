export type Tipo = 1 | 2 | 3;
export type StatusContrato = 1 | 2 | 3;
export type StatusChamado = 1 | 2 | 3 | 4;

export interface AuthResponse { token: string; expiraEm: string; usuarioId: number; nome: string; perfil: number }
export interface Contrato {
  id: number; numero: string; descricao: string; tipo: Tipo; status: StatusContrato;
  dataInicio: string; dataFim: string; clienteId: number; clienteNome: string | null;
}
export type ContratoCliente = Omit<Contrato, 'clienteNome'>;
export type ContratoInput = Omit<Contrato, 'id' | 'clienteNome'>;
export interface Chamado {
  id: number; titulo: string; descricao: string; status: StatusChamado; dataAbertura: string;
  contratoId: number; contratoNumero: string | null; clienteId: number; clienteNome: string | null;
}
export interface ItemContagem { rotulo: string; total: number }
export interface RelatorioResumo {
  de: string; ate: string; totalChamados: number;
  chamadosPorSituacao: ItemContagem[]; chamadosPorMes: ItemContagem[]; chamadosPorTipoContrato: ItemContagem[];
  clientesComMaisChamados: ItemContagem[];
  chamadosSemSolucaoHaMaisDe7Dias: number;
  contratosAtivosVencendoEm30Dias: number; contratosAtivosVencendoEm60Dias: number; contratosAtivosVencendoEm90Dias: number;
  contratosAtivosJaVencidos: number;
}
export interface Usuario { id: number; nome: string; email: string; perfil: number }
export interface Indicadores {
  chamadosPorStatus: Record<string, number>;
  contratosPorStatus: Record<string, number>;
  contratosAtivosVencendoEm30Dias: number;
}
