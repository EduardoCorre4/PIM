/** Logo com versão para fundo claro e para fundo escuro (a troca é feita no CSS pelo tema). */
export function Logo({ tipo, alt = '', className = '' }: { tipo: 'horizontal' | 'vertical'; alt?: string; className?: string }) {
  return (
    <>
      <img src={`/logo-${tipo}.svg`} alt={alt} className={`logo-claro ${className}`} />
      <img src={`/logo-${tipo}-negativo.svg`} alt={alt} className={`logo-escuro ${className}`} />
    </>
  );
}
