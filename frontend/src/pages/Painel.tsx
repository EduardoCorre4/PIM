import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { Indicadores } from '../api/types';
import { usePageTitle } from '../components/usePageTitle';
import { NOME_INDICADOR } from '../labels';

function Bloco({ titulo, dados }: { titulo: string; dados: Record<string, number> }) {
  const total = Object.values(dados).reduce((a, b) => a + b, 0);
  return (
    <section className="cartao" aria-labelledby={`t-${titulo}`}>
      <h2 id={`t-${titulo}`}>{titulo}</h2>
      <p className="total">Total: <strong>{total}</strong></p>
      <dl className="lista-ind">
        {Object.entries(dados).map(([k, v]) => (
          <div key={k}>
            <dt>{NOME_INDICADOR[k] ?? k}</dt>
            <dd>
              <strong>{v}</strong>
              {/* A barra é só um reforço visual; o número ao lado traz a informação. */}
              <span className="barra" aria-hidden="true"><span style={{ width: total ? `${(v / total) * 100}%` : 0 }} /></span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function Painel() {
  usePageTitle('Resumo');
  const [dados, setDados] = useState<Indicadores | null>(null);
  const [erro, setErro] = useState('');

  const carregar = () => { setErro(''); api.indicadores().then(setDados).catch(e => setErro(e.message)); };
  useEffect(carregar, []);

  return (
    <>
      <h1>Resumo</h1>
      {erro && (
        <p role="alert" className="erro-geral">{erro} <button type="button" onClick={carregar}>Tentar de novo</button></p>
      )}
      {!dados && !erro && <p role="status">Carregando resumo…</p>}
      {dados && (
        <>
          <div className="grade">
            <Bloco titulo="Chamados" dados={dados.chamadosPorStatus} />
            <Bloco titulo="Contratos" dados={dados.contratosPorStatus} />
          </div>
          <p className="destaque">
            Contratos ativos que terminam nos próximos 30 dias: <strong>{dados.contratosAtivosVencendoEm30Dias}</strong>
          </p>
          <p><Link to="/contratos">Ver contratos</Link> · <Link to="/chamados">Ver chamados</Link></p>
        </>
      )}
    </>
  );
}
