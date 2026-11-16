import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export const TAMANHOS = [100, 125, 150, 175] as const;

interface Ctx {
  tamanho: number;
  altoContraste: boolean;
  escuro: boolean;
  alternarTema: () => void;
  aumentar: () => void;
  diminuir: () => void;
  restaurar: () => void;
  alternarContraste: () => void;
}
const C = createContext<Ctx | null>(null);

// Preferências ficam salvas no navegador para valer também na próxima visita.
const ler = <T,>(k: string, padrao: T): T => {
  try { return JSON.parse(localStorage.getItem(k) ?? 'null') ?? padrao; } catch { return padrao; }
};

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [tamanho, setTamanho] = useState<number>(() => ler('jake.fonte', 100));
  const [altoContraste, setAlto] = useState<boolean>(() =>
    ler('jake.contraste', window.matchMedia?.('(prefers-contrast: more)').matches ?? false));

  useEffect(() => {
    document.documentElement.style.fontSize = `${tamanho}%`; // todo o layout usa rem
    localStorage.setItem('jake.fonte', JSON.stringify(tamanho));
  }, [tamanho]);
  const [escuro, setEscuro] = useState<boolean>(() => ler('jake.escuro', false));
  useEffect(() => {
    document.documentElement.dataset.tema = altoContraste ? 'contraste' : escuro ? 'escuro' : 'claro';
    localStorage.setItem('jake.contraste', JSON.stringify(altoContraste));
    localStorage.setItem('jake.escuro', JSON.stringify(escuro));
  }, [altoContraste, escuro]);

  const passo = (d: number) => setTamanho(t => {
    const i = Math.max(0, Math.min(TAMANHOS.length - 1, TAMANHOS.indexOf(t as never) + d));
    return TAMANHOS[i];
  });

  return (
    <C.Provider value={{
      tamanho, altoContraste, escuro, alternarTema: () => setEscuro(v => !v),
      aumentar: () => passo(1), diminuir: () => passo(-1), restaurar: () => setTamanho(100),
      alternarContraste: () => setAlto(v => !v),
    }}>{children}</C.Provider>
  );
}

export const useAccessibility = () => {
  const c = useContext(C);
  if (!c) throw new Error('useAccessibility fora do provider');
  return c;
};
