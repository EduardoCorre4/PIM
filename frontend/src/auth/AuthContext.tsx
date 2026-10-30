import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, setOnUnauthorized, setToken } from '../api/client';

interface Sessao { token: string; nome: string; expiraEm: string; perfil: number }
interface AuthCtx {
  nome: string | null;
  perfil: number | null;
  autenticado: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  sair: () => void;
}

const CHAVE = 'jake.sessao';
const Ctx = createContext<AuthCtx | null>(null);

function lerSessao(): Sessao | null {
  try {
    const s = JSON.parse(sessionStorage.getItem(CHAVE) ?? 'null') as Sessao | null;
    return s && typeof s.perfil === 'number' && new Date(s.expiraEm + (s.expiraEm.endsWith('Z') ? '' : 'Z')) > new Date() ? s : null;
  } catch { return null; }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Sessao | null>(() => {
    const s = lerSessao();
    setToken(s?.token ?? null);
    return s;
  });

  const sair = useCallback(() => {
    sessionStorage.removeItem(CHAVE);
    setToken(null);
    setSessao(null);
  }, []);

  useEffect(() => setOnUnauthorized(sair), [sair]);

  const entrar = useCallback(async (email: string, senha: string) => {
    const r = await api.login(email, senha);
    const s = { token: r.token, nome: r.nome, expiraEm: r.expiraEm, perfil: r.perfil };
    sessionStorage.setItem(CHAVE, JSON.stringify(s)); // some ao fechar a aba
    setToken(s.token);
    setSessao(s);
  }, []);

  const value = useMemo(
    () => ({ nome: sessao?.nome ?? null, perfil: sessao?.perfil ?? null, autenticado: !!sessao, entrar, sair }),
    [sessao, entrar, sair]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth fora do AuthProvider');
  return c;
};
