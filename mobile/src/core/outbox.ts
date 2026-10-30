import { gravarJson, lerJson, type KV } from './kv';
import type { ChamadoPendente, NovoChamado } from './types';

/**
 * Fila persistente de chamados criados sem confirmação do servidor.
 * Sobrevive ao fechamento do app. É uma fila por usuário (a chave inclui o id).
 */
export function createOutbox(kv: KV, usuarioId: number, novoId: () => string, agora: () => Date = () => new Date()) {
  const chave = `outbox:${usuarioId}`;
  let trava: Promise<unknown> = Promise.resolve();

  // Serializa leituras+escritas: duas ações ao mesmo tempo não podem se sobrescrever.
  const atomico = <T>(fn: (lista: ChamadoPendente[]) => Promise<T> | T): Promise<T> => {
    const p = trava.then(async () => {
      const lista = await lerJson<ChamadoPendente[]>(kv, chave, []);
      const r = await fn(lista);
      await gravarJson(kv, chave, lista);
      return r;
    });
    trava = p.catch(() => {});
    return p;
  };

  return {
    listar: () => atomico(l => [...l]),
    adicionar: (n: NovoChamado) => atomico(l => {
      const item: ChamadoPendente = {
        ...n, localId: novoId(), chaveIdempotencia: novoId(), criadoEm: agora().toISOString(), estado: 'pendente', tentativas: 0,
      };
      l.push(item);
      return item;
    }),
    remover: (localId: string) => atomico(l => { const i = l.findIndex(x => x.localId === localId); if (i >= 0) l.splice(i, 1); }),
    marcarFalha: (localId: string, erro: string) => atomico(l => {
      const x = l.find(i => i.localId === localId);
      if (x) { x.estado = 'falhou'; x.erro = erro; x.tentativas++; }
    }),
    registrarTentativa: (localId: string) => atomico(l => { const x = l.find(i => i.localId === localId); if (x) x.tentativas++; }),
    /** Coloca de novo na fila um item que falhou (o usuário pediu para tentar outra vez). */
    reenfileirar: (localId: string) => atomico(l => {
      const x = l.find(i => i.localId === localId);
      if (x) { x.estado = 'pendente'; x.erro = undefined; }
    }),
    limpar: () => atomico(l => { l.length = 0; }),
  };
}
export type Outbox = ReturnType<typeof createOutbox>;
