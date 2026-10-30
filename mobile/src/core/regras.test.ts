import { describe, expect, it } from 'vitest';
import { contratoElegivel } from './regras';
import type { Contrato } from './types';

const c = (extra: Partial<Contrato>): Contrato => ({
  id: 1, numero: 'C', descricao: '', tipo: 1, status: 1, dataInicio: '2026-01-01T00:00:00', dataFim: '2026-12-31T00:00:00', clienteId: 2, ...extra,
});

describe('contratoElegivel (mesma regra da sp_AbrirChamado)', () => {
  it('ativo e dentro da vigência', () => expect(contratoElegivel(c({}), '2026-06-15')).toBe(true));
  it('aceita o primeiro e o último dia', () => {
    expect(contratoElegivel(c({}), '2026-01-01')).toBe(true);
    expect(contratoElegivel(c({}), '2026-12-31')).toBe(true);
  });
  it('recusa vencido, futuro, inativo e encerrado', () => {
    expect(contratoElegivel(c({}), '2027-01-01')).toBe(false);
    expect(contratoElegivel(c({}), '2025-12-31')).toBe(false);
    expect(contratoElegivel(c({ status: 2 }), '2026-06-15')).toBe(false);
    expect(contratoElegivel(c({ status: 3 }), '2026-06-15')).toBe(false);
  });
});
