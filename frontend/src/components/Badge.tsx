import { SITUACAO_CHAMADO, SITUACAO_CONTRATO, TIPO_CONTRATO } from '../labels';

// Sempre cor + ponto + texto: a cor nunca é a única informação.
const CHAMADO = ['', 'aberto', 'atendimento', 'resolvido', 'fechado'];

export function BadgeChamado({ status }: { status: number }) {
  return <span className={`jk-badge jk-badge--${CHAMADO[status] ?? 'fechado'}`}>{SITUACAO_CHAMADO[status]}</span>;
}

const hojeIso = () => new Date().toISOString().slice(0, 10);

/** Contrato ativo com prazo já passado aparece como "Contrato vencido". */
export function BadgeContrato({ status, dataFim }: { status: number; dataFim?: string }) {
  if (status === 1 && dataFim && dataFim.slice(0, 10) < hojeIso()) {
    return <span className="jk-badge jk-badge--vencido">Contrato vencido</span>;
  }
  const classe = status === 1 ? 'resolvido' : status === 2 ? 'atendimento' : 'fechado';
  return <span className={`jk-badge jk-badge--${classe}`}>{SITUACAO_CONTRATO[status]}</span>;
}

/** Etiqueta de tipo de contrato: 1 = Sistema, 2 = Suporte, 3 = Cloud Security. */
export function TipoContrato({ tipo }: { tipo: number }) {
  const classe = tipo === 1 ? ' jk-tipo--sistema' : tipo === 3 ? ' jk-tipo--cloud' : '';
  return <span className={`jk-tipo${classe}`}>{TIPO_CONTRATO[tipo]}</span>;
}
