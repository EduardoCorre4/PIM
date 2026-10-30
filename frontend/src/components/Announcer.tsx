import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

const C = createContext<(msg: string) => void>(() => {});

/** Região "ao vivo": leitores de tela leem a mensagem sem mudar o foco; também aparece na tela. */
export function AnnouncerProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState('');
  const anunciar = useCallback((m: string) => {
    setMsg('');
    setTimeout(() => setMsg(m), 50); // limpa antes para repetir mensagens iguais
    setTimeout(() => setMsg(''), 6000);
  }, []);
  return (
    <C.Provider value={anunciar}>
      {children}
      <div role="status" aria-live="polite" className={msg ? 'aviso' : 'aviso vazio'}>{msg}</div>
    </C.Provider>
  );
}
export const useAnunciar = () => useContext(C);
