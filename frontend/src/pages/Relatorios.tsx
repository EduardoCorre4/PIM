import { useEffect, useId, useState, type FormEvent } from 'react';
import { api } from '../api/client';
import type { Chamado, RelatorioResumo } from '../api/types';
import { useAnunciar } from '../components/Announcer';
import { Distribuicao } from '../components/Distribuicao';
import { Field } from '../components/Field';
import { usePageTitle } from '../components/usePageTitle';
import { SITUACAO_CHAMADO, formatarData, formatarDataHora } from '../labels';

const hoje = () => new Date().toISOString().slice(0, 10);
const diasAtras = (n: number) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);

function Numero({ valor, rotulo, alerta }: { valor: number; rotulo: string; alerta?: boolean }) {
  return (
    <div className="cartao numero">
      <p className="numero-valor">{valor}</p>
      <p>{rotulo}{alerta && valor > 0 ? ' — atenção' : ''}</p>
    </div>
  );
}

export function Relatorios() {
  usePageTitle('Relatórios');
  const anunciar = useAnunciar();
  const [de, setDe] = useState(diasAtras(90));
  const [ate, setAte] = useState(hoje());
  const [status, setStatus] = useState(0);
  const [venceEm, setVenceEm] = useState(0);
  const [resumo, setResumo] = useState<RelatorioResumo | null>(null);
  const [lista, setLista] = useState<Chamado[] | null>(null);
  const [erro, setErro] = useState('');
  const [erroData, setErroData] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [baixando, setBaixando] = useState('');
  const idStatus = useId();

  async function gerar(e?: FormEvent) {
    e?.preventDefault();
    setErro('');
    if (de && ate && de > ate) { setErroData('A data inicial não pode ser depois da data final.'); return; }
    setErroData('');
    setCarregando(true);
    try {
      const f = { de, ate, status: status || undefined };
      const [r, l] = await Promise.all([api.relatorioResumo(de, ate), api.relatorioChamados(f)]);
      setResumo(r); setLista(l);
      anunciar(`Relatório atualizado: ${r.totalChamados} ${r.totalChamados === 1 ? 'chamado' : 'chamados'} no período.`);
    } catch (e) { setErro((e as Error).message); }
    finally { setCarregando(false); }
  }
  useEffect(() => { void gerar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function baixar(qual: 'chamados' | 'contratos') {
    setBaixando(qual); setErro('');
    try {
      if (qual === 'chamados') await api.baixarChamadosCsv({ de, ate, status: status || undefined });
      else await api.baixarContratosCsv({ venceEmDias: venceEm || undefined });
      anunciar('Arquivo baixado. Ele abre no Excel.');
    } catch (e) { setErro((e as Error).message); }
    finally { setBaixando(''); }
  }

  return (
    <>
      <h1>Relatórios</h1>

      <form onSubmit={gerar} noValidate aria-label="Filtros do relatório" className="filtros-rel">
        <Field rotulo="De" erro={erroData}>{p => <input {...p} type="date" value={de} max={ate || undefined} onChange={e => setDe(e.target.value)} />}</Field>
        <Field rotulo="Até">{p => <input {...p} type="date" value={ate} min={de || undefined} onChange={e => setAte(e.target.value)} />}</Field>
        <div className="campo">
          <label htmlFor={idStatus}>Situação do chamado</label>
          <select id={idStatus} value={status} onChange={e => setStatus(Number(e.target.value))}>
            <option value={0}>Todas</option>
            {Object.entries(SITUACAO_CHAMADO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="campo acoes"><button type="submit" className="primario" disabled={carregando}>{carregando ? 'Gerando…' : 'Gerar relatório'}</button></div>
      </form>

      {erro && <p role="alert" className="erro-geral">{erro}</p>}
      {!resumo && !erro && <p role="status">Gerando relatório…</p>}

      {resumo && (
        <>
          <p className="destaque">Período: <strong>{formatarData(resumo.de)}</strong> a <strong>{formatarData(resumo.ate)}</strong></p>

          <h2>Resumo</h2>
          <div className="grade grade-numeros">
            <Numero valor={resumo.totalChamados} rotulo="Chamados abertos no período" />
            <Numero valor={resumo.chamadosSemSolucaoHaMaisDe7Dias} rotulo="Chamados sem solução há mais de 7 dias" alerta />
            <Numero valor={resumo.contratosAtivosJaVencidos} rotulo="Contratos ativos com prazo já vencido" alerta />
          </div>

          <div className="grade">
            <Distribuicao titulo="Chamados por situação" itens={resumo.chamadosPorSituacao} />
            <Distribuicao titulo="Chamados por mês" itens={resumo.chamadosPorMes} />
            <Distribuicao titulo="Chamados por tipo de serviço" itens={resumo.chamadosPorTipoContrato} />
            <Distribuicao titulo="Clientes com mais chamados" itens={resumo.clientesComMaisChamados} />
            <Distribuicao titulo="Contratos ativos que vencem em breve" itens={[
              { rotulo: 'Em até 30 dias', total: resumo.contratosAtivosVencendoEm30Dias },
              { rotulo: 'Em até 60 dias', total: resumo.contratosAtivosVencendoEm60Dias },
              { rotulo: 'Em até 90 dias', total: resumo.contratosAtivosVencendoEm90Dias },
            ]} vazio="Nenhum contrato vence nos próximos 90 dias." />
          </div>

          <h2>Chamados do período</h2>
          <p><button type="button" onClick={() => baixar('chamados')} disabled={baixando !== ''}>
            {baixando === 'chamados' ? 'Preparando arquivo…' : 'Baixar chamados (arquivo para Excel)'}</button></p>
          {lista && lista.length === 0 && <p>Nenhum chamado encontrado com esses filtros.</p>}
          {lista && lista.length > 0 && (
            <div className="tabela-wrap" tabIndex={0} role="region" aria-label="Tabela de chamados do período (role para ver mais)">
              <table>
                <caption className="so-leitor">Chamados do período selecionado</caption>
                <thead><tr><th scope="col">Nº</th><th scope="col">Assunto</th><th scope="col">Cliente</th><th scope="col">Contrato</th><th scope="col">Aberto em</th><th scope="col">Situação</th></tr></thead>
                <tbody>
                  {lista.map(c => (
                    <tr key={c.id}><td>{c.id}</td><td>{c.titulo}</td><td>{c.clienteNome}</td><td>{c.contratoNumero}</td>
                      <td>{formatarDataHora(c.dataAbertura)}</td><td>{SITUACAO_CHAMADO[c.status]}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <h2>Contratos</h2>
          <div className="filtro">
            <label htmlFor="venceem">Quais contratos incluir</label>
            <select id="venceem" value={venceEm} onChange={e => setVenceEm(Number(e.target.value))}>
              <option value={0}>Todos</option>
              <option value={30}>Que vencem em até 30 dias</option>
              <option value={60}>Que vencem em até 60 dias</option>
              <option value={90}>Que vencem em até 90 dias</option>
            </select>
            <button type="button" onClick={() => baixar('contratos')} disabled={baixando !== ''}>
              {baixando === 'contratos' ? 'Preparando arquivo…' : 'Baixar contratos (arquivo para Excel)'}</button>
          </div>
        </>
      )}
    </>
  );
}
