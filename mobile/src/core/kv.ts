/** Armazenamento chave-valor mínimo (AsyncStorage e SecureStore se encaixam nesta forma). */
export interface KV {
  getItem(k: string): Promise<string | null>;
  setItem(k: string, v: string): Promise<void>;
  removeItem(k: string): Promise<void>;
}

export const lerJson = async <T>(kv: KV, k: string, padrao: T): Promise<T> => {
  try {
    const s = await kv.getItem(k);
    return s ? (JSON.parse(s) as T) : padrao;
  } catch { return padrao; }
};
export const gravarJson = (kv: KV, k: string, v: unknown) => kv.setItem(k, JSON.stringify(v));

/** Memória, para testes. */
export const kvMemoria = (): KV & { dados: Map<string, string> } => {
  const dados = new Map<string, string>();
  return {
    dados,
    getItem: async k => dados.get(k) ?? null,
    setItem: async (k, v) => { dados.set(k, v); },
    removeItem: async k => { dados.delete(k); },
  };
};
