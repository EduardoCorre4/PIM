import type { ItemContagem } from '../api/types';

/**
 * Lista de valores com barras. A barra é só reforço visual (aria-hidden); o número ao lado
 * leva a informação, então nada depende de cor ou de enxergar o gráfico.
 */
export function Distribuicao({ titulo, itens, vazio = 'Sem dados no período.' }: { titulo: string; itens: ItemContagem[]; vazio?: string }) {
  const max = Math.max(1, ...itens.map(i => i.total));
  const id = `d-${titulo.replace(/\W+/g, '-')}`;
  return (
    <section className="cartao" aria-labelledby={id}>
      <h2 id={id}>{titulo}</h2>
      {itens.length === 0 || itens.every(i => i.total === 0) ? <p>{vazio}</p> : (
        <dl className="lista-ind">
          {itens.map(i => (
            <div key={i.rotulo}>
              <dt>{i.rotulo}</dt>
              <dd>
                <strong>{i.total}</strong>
                <span className="barra" aria-hidden="true"><span style={{ width: `${(i.total / max) * 100}%` }} /></span>
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
