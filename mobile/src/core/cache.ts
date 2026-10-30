import { gravarJson, lerJson, type KV } from './kv';
import type { Chamado, Contrato } from './types';

export interface Instantaneo { contratos: Contrato[]; chamados: Chamado[]; atualizadoEm: string | null }

/** Última cópia dos dados do servidor, para consulta sem internet. Separada por usuário. */
export function createCache(kv: KV, usuarioId: number) {
  const chave = `cache:${usuarioId}`;
  const vazio: Instantaneo = { contratos: [], chamados: [], atualizadoEm: null };
  return {
    ler: () => lerJson<Instantaneo>(kv, chave, vazio),
    gravar: (d: Instantaneo) => gravarJson(kv, chave, d),
    limpar: () => kv.removeItem(chave),
  };
}
export type Cache = ReturnType<typeof createCache>;
