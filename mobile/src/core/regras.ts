import type { Contrato } from './types';

/** "2026-01-31T00:00:00" -> "2026-01-31" (datas de contrato não têm hora nem fuso). */
const dia = (iso: string) => iso.slice(0, 10);
export const hojeLocal = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/**
 * Mesma regra do servidor (Service e sp_AbrirChamado): só se abre chamado em contrato
 * ATIVO e dentro da vigência. Aqui serve para só oferecer ao cliente contratos válidos;
 * a decisão final continua sendo do servidor.
 */
export function contratoElegivel(c: Contrato, hoje = hojeLocal()): boolean {
  return c.status === 1 && dia(c.dataInicio) <= hoje && hoje <= dia(c.dataFim);
}

export const formatarData = (iso: string) => dia(iso).split('-').reverse().join('/');
export const formatarDataHora = (iso: string) =>
  new Date(iso.endsWith('Z') ? iso : `${iso}Z`).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

export const SITUACAO_CHAMADO: Record<number, string> = { 1: 'Aberto', 2: 'Em andamento', 3: 'Resolvido', 4: 'Fechado' };
