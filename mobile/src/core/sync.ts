import { PERFIL_CLIENTE, atendeFila, type Api } from './api';
import type { Cache } from './cache';
import { ApiError } from './http';
import type { Outbox } from './outbox';

export interface ResultadoEnvio { enviados: number; falhas: number; restantes: number; semConexao: boolean }

/** Erros do servidor que não se resolvem repetindo (dados rejeitados): o item vai para "falhou". */
const REJEICAO_DEFINITIVA = new Set([400, 403, 404, 409, 422]);

export function createSync(api: Api, outbox: Outbox, cache: Cache, perfil: number = PERFIL_CLIENTE) {
  let enviando: Promise<ResultadoEnvio> | null = null;
  let atualizando: Promise<boolean> | null = null;

  /** Envia a fila em ordem. Para ao primeiro problema de rede/servidor e tenta de novo depois. */
  function enviarFila(): Promise<ResultadoEnvio> {
    enviando ??= (async () => {
      let enviados = 0, falhas = 0, semConexao = false;
      const fila = (await outbox.listar()).filter(i => i.estado === 'pendente');
      for (const item of fila) {
        try {
          const criado = await api.abrirChamado({
            contratoId: item.contratoId, titulo: item.titulo, descricao: item.descricao, chaveIdempotencia: item.chaveIdempotencia,
          });
          await outbox.remover(item.localId);
          const c = await cache.ler();
          if (!c.chamados.some(x => x.id === criado.id)) c.chamados.unshift(criado);
          await cache.gravar(c);
          enviados++;
        } catch (e) {
          if (e instanceof ApiError && REJEICAO_DEFINITIVA.has(e.status)) {
            await outbox.marcarFalha(item.localId, e.message);
            falhas++;
            continue; // um item recusado não trava os próximos
          }
          if (e instanceof ApiError && e.status === 401) { semConexao = false; break; } // sessão perdida: o app trata
          await outbox.registrarTentativa(item.localId);
          semConexao = true; // rede ou servidor fora do ar: mantém na fila
          break;
        }
      }
      const restantes = (await outbox.listar()).filter(i => i.estado === 'pendente').length;
      return { enviados, falhas, restantes, semConexao };
    })().finally(() => { enviando = null; });
    return enviando;
  }

  /** Baixa contratos e chamados. Sem rede, mantém o cache e devolve false. */
  function atualizar(): Promise<boolean> {
    atualizando ??= (async () => {
      try {
        // Funcionário/Gerente vêem a fila de todos os clientes e não abrem chamados (sem contratos próprios).
        const [contratos, chamados] = atendeFila(perfil)
          ? [[], await api.fila()]
          : await Promise.all([api.meusContratos(), api.meusChamados()]);
        await cache.gravar({ contratos, chamados, atualizadoEm: new Date().toISOString() });
        return true;
      } catch (e) {
        if (e instanceof ApiError && (e.network || e.status >= 500)) return false;
        throw e;
      }
    })().finally(() => { atualizando = null; });
    return atualizando;
  }

  /** Primeiro envia o que está na fila, depois atualiza os dados (assim o chamado novo já vem na lista). */
  async function sincronizar() {
    const envio = await enviarFila();
    const atualizado = envio.semConexao ? false : await atualizar();
    return { envio, atualizado };
  }

  return { enviarFila, atualizar, sincronizar };
}
export type Sync = ReturnType<typeof createSync>;
