import { useEffect, useId, useRef, type ReactNode } from 'react';

interface Props { aberto: boolean; titulo: string; onFechar: () => void; children: ReactNode }

/**
 * Usa o <dialog> nativo: o navegador prende o foco dentro da janela, fecha com Esc
 * e devolve o foco ao botão que a abriu.
 */
export function Modal({ aberto, titulo, onFechar, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const tituloId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (aberto && !d.open) d.showModal();
    if (!aberto && d.open) d.close();
  }, [aberto]);

  return (
    <dialog ref={ref} aria-labelledby={tituloId} onCancel={e => { e.preventDefault(); onFechar(); }}>
      {aberto && (
        <div className="modal-corpo">
          <h2 id={tituloId}>{titulo}</h2>
          {children}
        </div>
      )}
    </dialog>
  );
}
