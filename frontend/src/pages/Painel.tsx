import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { api } from '../api/client';
import type { Indicadores } from '../api/types';
import { usePageTitle } from '../components/usePageTitle';
import { useAuth } from '../auth/AuthContext';
import { NOME_INDICADOR } from '../labels';

function Bloco({ titulo, dados }: { titulo: string; dados: Record<string, number> }) {
  const total = Object.values(dados).reduce((a, b) => a + b, 0);
  return (
    <section className="jk-card" aria-labelledby={`t-${titulo}`}>
      <h3 id={`t-${titulo}`}>{titulo}</h3>
      <p className="total"><span className="total-num">{total}</span> <span className="total-rot">no total</span></p>
      <dl className="lista-ind">
        {Object.entries(dados).map(([k, v]) => (
          <div key={k} className={`ind ind-${k.toLowerCase()}`}>
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

const saudacao = () => { const h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; };
const dataLonga = () => {
  const t = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  return t.charAt(0).toUpperCase() + t.slice(1);
};

export function Painel() {
  usePageTitle('Resumo');
  const { nome } = useAuth();
  const [dados, setDados] = useState<Indicadores | null>(null);
  const [erro, setErro] = useState('');

  const carregar = () => { setErro(''); api.indicadores().then(setDados).catch(e => setErro(e.message)); };
  useEffect(carregar, []);

  return (
    <>
      <div className="pagina-topo">
        <div>
          <h1>{saudacao()}, {nome?.split(' ')[0]}</h1>
          <p className="sub">{dataLonga()}{dados ? ` · ${dados.chamadosPorStatus.Aberto ?? 0} chamados aguardam atendimento` : ''}</p>
        </div>
        <Link to="/contratos" className="jk-btn jk-btn--primario"><FileText className="jk-icone" aria-hidden="true" />Gerenciar contratos</Link>
      </div>
      {erro && (
        <p role="alert" className="erro-geral">{erro} <button type="button" onClick={carregar}>Tentar de novo</button></p>
      )}
      {!dados && !erro && <p role="status">Carregando resumo…</p>}
      {dados && (
        <>
          <div className="g-kpis">
            <div className="jk-card jk-kpi"><span className="jk-kpi__rotulo">Chamados abertos</span><span className="jk-kpi__valor">{dados.chamadosPorStatus.Aberto ?? 0}</span></div>
            <div className="jk-card jk-kpi"><span className="jk-kpi__rotulo">Em atendimento</span><span className="jk-kpi__valor">{dados.chamadosPorStatus.EmAndamento ?? 0}</span></div>
            <div className="jk-card jk-kpi"><span className="jk-kpi__rotulo">Contratos ativos</span><span className="jk-kpi__valor">{dados.contratosPorStatus.Ativo ?? 0}</span></div>
            <div className="jk-card jk-kpi">
              <span className="jk-kpi__rotulo">Vencem em 30 dias</span>
              <span className="jk-kpi__valor">{dados.contratosAtivosVencendoEm30Dias}</span>
              <span className="jk-kpi__nota">contratos ativos</span>
            </div>
          </div>
          <div className="grade">
            <Bloco titulo="Chamados" dados={dados.chamadosPorStatus} />
            <Bloco titulo="Contratos" dados={dados.contratosPorStatus} />
          </div>
          <p><Link to="/contratos">Ver contratos</Link> · <Link to="/chamados">Ver chamados</Link></p>
        </>
      )}
    </>
  );
}
