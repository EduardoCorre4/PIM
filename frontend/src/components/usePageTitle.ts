import { useEffect } from 'react';

/** Atualiza o título da aba (primeira coisa que o leitor de tela anuncia ao mudar de página). */
export function usePageTitle(titulo: string) {
  useEffect(() => { document.title = `${titulo} – JAKE Tecnologia`; }, [titulo]);
}
