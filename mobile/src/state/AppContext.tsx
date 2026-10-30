import NetInfo from '@react-native-community/netinfo';
import * as Crypto from 'expo-crypto';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { PERFIL_CLIENTE, atendeFila, createApi } from '../core/api';
import { createCache, type Cache } from '../core/cache';
import { ApiError, createHttp } from '../core/http';
import { createOutbox, type Outbox } from '../core/outbox';
import { createSync, type Sync } from '../core/sync';
import type { Chamado, ChamadoPendente, Contrato, NovoChamado } from '../core/types';
import { API_URL } from '../config';
import { dataKV, sessionStore } from '../platform/storage';

export type ResultadoAbertura =
  | { tipo: 'enviado' }
  | { tipo: 'guardado' } // sem conexão: está na fila e será enviado depois
  | { tipo: 'falhou'; erro: string };

interface Ctx {
  pronto: boolean;
  usuario: { id: number; nome: string; perfil: number } | null;
  /** Funcionário/Gerente: atendem a fila e alteram status; Cliente abre os próprios chamados. */
  atendente: boolean;
  online: boolean;
  sincronizando: boolean;
  ultimaSincronizacao: string | null;
  contratos: Contrato[];
  chamados: Chamado[];
  pendentes: ChamadoPendente[];
  entrar(email: string, senha: string): Promise<void>;
  sair(): Promise<void>;
  atualizar(): Promise<void>;
  alterarStatus(id: number, status: number): Promise<void>;
  abrirChamado(n: NovoChamado): Promise<ResultadoAbertura>;
  tentarDeNovo(localId: string): Promise<void>;
  descartar(localId: string): Promise<void>;
}
const C = createContext<Ctx | null>(null);

interface Servicos { outbox: Outbox; cache: Cache; sync: Sync }

export function AppProvider({ children }: { children: ReactNode }) {
  const [pronto, setPronto] = useState(false);
  const [usuario, setUsuario] = useState<Ctx['usuario']>(null);
  const [online, setOnline] = useState(true);
  const [sincronizando, setSincronizando] = useState(false);
  const [ultima, setUltima] = useState<string | null>(null);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [pendentes, setPendentes] = useState<ChamadoPendente[]>([]);
  const serv = useRef<Servicos | null>(null);
  const onlineRef = useRef(true);

  const api = useMemo(() => {
    const http = createHttp({
      baseUrl: API_URL,
      store: sessionStore,
      // Renovação recusada pelo servidor: volta para o login, mantendo cache e fila para quando entrar de novo.
      onSessionLost: () => { serv.current = null; setUsuario(null); },
    });
    return createApi(http, sessionStore);
  }, []);

  const recarregar = useCallback(async () => {
    const s = serv.current;
    if (!s) return;
    const [c, p] = await Promise.all([s.cache.ler(), s.outbox.listar()]);
    setContratos(c.contratos); setChamados(c.chamados); setUltima(c.atualizadoEm); setPendentes(p);
  }, []);

  const sincronizar = useCallback(async () => {
    const s = serv.current;
    if (!s) return;
    setSincronizando(true);
    try { await s.sync.sincronizar(); } catch { /* erros de sessão já tratados em onSessionLost */ }
    finally { setSincronizando(false); await recarregar(); }
  }, [recarregar]);

  const iniciar = useCallback(async (id: number, nome: string, perfil: number) => {
    const kv = dataKV;
    const outbox = createOutbox(kv, id, () => Crypto.randomUUID());
    const cache = createCache(kv, id);
    serv.current = { outbox, cache, sync: createSync(api, outbox, cache, perfil) };
    setUsuario({ id, nome, perfil });
    await recarregar(); // mostra imediatamente o que está guardado, mesmo sem internet
    void sincronizar();
  }, [api, recarregar, sincronizar]);

  // Abertura do app: retoma a sessão guardada.
  useEffect(() => {
    (async () => {
      const s = await sessionStore.load();
      if (s) await iniciar(s.usuarioId, s.nome, s.perfil ?? PERFIL_CLIENTE);
      setPronto(true);
    })();
  }, [iniciar]);

  // Conectividade: ao voltar a internet, envia a fila e atualiza.
  useEffect(() => {
    const un = NetInfo.addEventListener(st => {
      const on = !!st.isConnected && st.isInternetReachable !== false;
      const voltou = on && !onlineRef.current;
      onlineRef.current = on;
      setOnline(on);
      if (voltou) void sincronizar();
    });
    const sub = AppState.addEventListener('change', e => { if (e === 'active' && onlineRef.current) void sincronizar(); });
    return () => { un(); sub.remove(); };
  }, [sincronizar]);

  // Enquanto houver chamado na fila, tenta de novo a cada 30 s (cobre rede instável sem evento de "voltou").
  const temFila = pendentes.some(p => p.estado === 'pendente');
  useEffect(() => {
    if (!temFila || !usuario) return;
    const t = setInterval(() => { if (onlineRef.current) void sincronizar(); }, 30_000);
    return () => clearInterval(t);
  }, [temFila, usuario, sincronizar]);

  const value = useMemo<Ctx>(() => ({
    pronto, usuario, atendente: !!usuario && atendeFila(usuario.perfil), online, sincronizando, ultimaSincronizacao: ultima, contratos, chamados, pendentes,

    async entrar(email, senha) {
      const s = await api.login(email.trim(), senha);
      await iniciar(s.usuarioId, s.nome, s.perfil);
    },

    async sair() {
      const s = serv.current;
      await api.logout();
      // Saída voluntária apaga os dados do aparelho (privacidade). Perda de sessão, não.
      await Promise.all([s?.cache.limpar(), s?.outbox.limpar()]);
      serv.current = null;
      setUsuario(null); setChamados([]); setContratos([]); setPendentes([]); setUltima(null);
    },

    async atualizar() { await sincronizar(); },

    /** Funcionário/Gerente: muda a situação no servidor (exige internet) e atualiza a cópia local. */
    async alterarStatus(id, status) {
      const novo = await api.alterarStatus(id, status);
      const s = serv.current;
      if (s) {
        const c = await s.cache.ler();
        await s.cache.gravar({ ...c, chamados: c.chamados.map(x => (x.id === id ? { ...x, status: novo.status } : x)) });
      }
      await recarregar();
    },

    async abrirChamado(n) {
      const s = serv.current!;
      const item = await s.outbox.adicionar(n); // 1º grava no aparelho: nada se perde, com ou sem internet
      await recarregar();
      if (onlineRef.current) {
        await s.sync.enviarFila().catch(() => {});
        await recarregar();
      }
      const ainda = (await s.outbox.listar()).find(i => i.localId === item.localId);
      if (!ainda) { void sincronizar(); return { tipo: 'enviado' }; }
      if (ainda.estado === 'falhou') return { tipo: 'falhou', erro: ainda.erro ?? 'O chamado não pôde ser aberto.' };
      return { tipo: 'guardado' };
    },

    async tentarDeNovo(localId) {
      await serv.current?.outbox.reenfileirar(localId);
      await recarregar();
      await sincronizar();
    },

    async descartar(localId) {
      await serv.current?.outbox.remover(localId);
      await recarregar();
    },
  }), [pronto, usuario, online, sincronizando, ultima, contratos, chamados, pendentes, api, iniciar, recarregar, sincronizar]);

  return <C.Provider value={value}>{children}</C.Provider>;
}

export const useApp = () => {
  const c = useContext(C);
  if (!c) throw new Error('useApp fora do AppProvider');
  return c;
};
export { ApiError };
