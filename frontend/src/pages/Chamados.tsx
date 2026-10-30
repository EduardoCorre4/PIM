import { useEffect, useId, useState } from 'react';
import { api } from '../api/client';
import type { Chamado } from '../api/types';
import { useAnunciar } from '../components/Announcer';
import { usePageTitle } from '../components/usePageTitle';
import { SITUACAO_CHAMADO, formatarDataHora } from '../labels';

export function Chamados() {
  usePageTitle('Chamados');
  const anunciar = useAnunciar();
  const filtroId = useId();
  const [filtro, setFiltro] = useState(0);
  const [lista, setLista] = useState<Chamado[] | null>(null);
  const [erro, setErro] = useState('');

  const carregar = () => {
    setErro('');
    api.chamados(filtro || undefined).then(l => {
      setLista(l);
      anunciar(`${l.length} ${l.length === 1 ? 'chamado encontrado' : 'chamados encontrados'}.`);
    }).catch(e => setErro(e.message));
  };
  useEffect(carregar, [filtro]); // eslint-disable-line react-hooks/exhaustive-deps

  async function mudar(c: Chamado, status: number) {
    try {
      const novo = await api.alterarStatusChamado(c.id, status);
      setLista(l => l?.map(x => (x.id === c.id ? { ...x, status: novo.status } : x)) ?? null);
      anunciar(`Chamado ${c.id} agora está ${SITUACAO_CHAMADO[status].toLowerCase()}.`);
    } catch (e) {
      setErro((e as Error).message);
      carregar(); // volta o seletor ao valor real
    }
  }

  return (
    <>
      <h1>Chamados</h1>
      <div className="filtro">
        <label htmlFor={filtroId}>Mostrar chamados com situação</label>
        <select id={filtroId} value={filtro} onChange={e => setFiltro(Number(e.target.value))}>
          <option value={0}>Todas</option>
          {Object.entries(SITUACAO_CHAMADO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {erro && <p role="alert" className="erro-geral">{erro}</p>}
      {!lista && !erro && <p role="status">Carregando chamados…</p>}
      {lista && lista.length === 0 && <p>Nenhum chamado encontrado.</p>}
      {lista && lista.length > 0 && (
        <div className="tabela-wrap" tabIndex={0} role="region" aria-label="Tabela de chamados (role para ver mais)">
          <table>
            <caption className="so-leitor">Lista de chamados</caption>
            <thead>
              <tr>
                <th scope="col">Nº</th><th scope="col">Assunto</th><th scope="col">Cliente</th>
                <th scope="col">Contrato</th><th scope="col">Aberto em</th><th scope="col">Situação</th>
              </tr>
            </thead>
            <tbody>
              {lista.map(c => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td>{c.titulo}</td>
                  <td>{c.clienteNome}</td>
                  <td>{c.contratoNumero}</td>
                  <td>{formatarDataHora(c.dataAbertura)}</td>
                  <td>
                    <label className="so-leitor" htmlFor={`st-${c.id}`}>Situação do chamado {c.id}</label>
                    <select id={`st-${c.id}`} value={c.status} disabled={c.status === 4}
                      onChange={e => mudar(c, Number(e.target.value))}>
                      {Object.entries(SITUACAO_CHAMADO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    {c.status === 4 && <span className="nota"> Chamado fechado não pode mudar.</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
