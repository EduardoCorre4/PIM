export type SituacaoContrato = 1 | 2 | 3; // 1=Ativo, 2=Inativo, 3=Encerrado
export type SituacaoChamado = 1 | 2 | 3 | 4; // 1=Aberto, 2=Em andamento, 3=Resolvido, 4=Fechado

export interface Contrato {
  id: number; numero: string; descricao: string; tipo: number; status: SituacaoContrato;
  dataInicio: string; dataFim: string; clienteId: number;
}
export interface Chamado {
  id: number; titulo: string; descricao: string; status: SituacaoChamado; dataAbertura: string;
  contratoId: number; contratoNumero: string | null; clienteId: number; clienteNome: string | null;
}

/** Chamado criado no aparelho, ainda não confirmado pelo servidor. */
export interface ChamadoPendente {
  localId: string;
  /** Enviada ao servidor para que um reenvio nunca crie o chamado duas vezes. */
  chaveIdempotencia: string;
  contratoId: number;
  contratoNumero: string;
  titulo: string;
  descricao: string;
  criadoEm: string;
  estado: 'pendente' | 'falhou';
  erro?: string;
  tentativas: number;
}

export interface NovoChamado { contratoId: number; contratoNumero: string; titulo: string; descricao: string }
