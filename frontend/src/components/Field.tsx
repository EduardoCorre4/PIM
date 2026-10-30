import { useId, type ReactNode } from 'react';

interface Props {
  rotulo: string;
  erro?: string;
  ajuda?: string;
  obrigatorio?: boolean;
  children: (p: { id: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean; 'aria-required'?: boolean }) => ReactNode;
}

/** Campo com rótulo visível, ajuda e mensagem de erro ligados ao controle (leitor de tela). */
export function Field({ rotulo, erro, ajuda, obrigatorio, children }: Props) {
  const id = useId();
  const ids = [ajuda ? `${id}-ajuda` : '', erro ? `${id}-erro` : ''].filter(Boolean).join(' ');
  return (
    <div className="campo">
      <label htmlFor={id}>
        {rotulo}{obrigatorio && <span className="obrig"> (obrigatório)</span>}
      </label>
      {ajuda && <p id={`${id}-ajuda`} className="ajuda">{ajuda}</p>}
      {children({
        id,
        'aria-describedby': ids || undefined,
        'aria-invalid': erro ? true : undefined,
        'aria-required': obrigatorio || undefined,
      })}
      {erro && <p id={`${id}-erro`} className="erro-campo">{erro}</p>}
    </div>
  );
}
