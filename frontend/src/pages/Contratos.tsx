import { useEffect, useRef, useState, type FormEvent } from 'react';
import { api } from '../api/client';
import type { Contrato, ContratoInput, Usuario } from '../api/types';
import { useAnunciar } from '../components/Announcer';
import { Field } from '../components/Field';
import { Modal } from '../components/Modal';
import { usePageTitle } from '../components/usePageTitle';
import { SITUACAO_CONTRATO, TIPO_CONTRATO, formatarData } from '../labels';

const VAZIO: ContratoInput = { numero: '', descricao: '', tipo: 2, status: 1, dataInicio: '', dataFim: '', clienteId: 0 };
type Erros = Partial<Record<'numero' | 'dataInicio' | 'dataFim' | 'clienteId', string>>;

function Formulario({ inicial, id, clientes, onSalvo, onCancelar }: {
  inicial: ContratoInput; id: number | null; clientes: Usuario[]; onSalvo: (c: Contrato) => void; onCancelar: () => void;
}) {
  const [v, setV] = useState(inicial);
  const [erros, setErros] = useState<Erros>({});
  const [erroGeral, setErroGeral] = useState('');
  const [enviando, setEnviando] = useState(false);
  const resumo = useRef<HTMLDivElement>(null);
  const set = <K extends keyof ContratoInput>(k: K, val: ContratoInput[K]) => setV(x => ({ ...x, [k]: val }));

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setErroGeral('');
    const n: Erros = {};
    if (!v.numero.trim()) n.numero = 'Informe o número do contrato.';
    if (!v.clienteId) n.clienteId = 'Escolha o cliente.';
    if (!v.dataInicio) n.dataInicio = 'Informe a data de início.';
    if (!v.dataFim) n.dataFim = 'Informe a data de término.';
    else if (v.dataInicio && v.dataFim < v.dataInicio) n.dataFim = 'A data de término não pode ser antes da data de início.';
    setErros(n);
    if (Object.keys(n).length) { setTimeout(() => resumo.current?.focus(), 0); return; }

    setEnviando(true);
    try {
      const salvo = id ? await api.editarContrato(id, v) : await api.criarContrato(v);
      onSalvo(salvo);
    } catch (err) {
      setErroGeral((err as Error).message);
      setTimeout(() => resumo.current?.focus(), 0);
    } finally { setEnviando(false); }
  }

  const lista = Object.values(erros);
  return (
    <form onSubmit={enviar} noValidate>
      <div ref={resumo} tabIndex={-1} role="alert">
        {erroGeral && <p className="erro-geral">{erroGeral}</p>}
        {lista.length > 0 && (
          <div className="erro-geral">
            <p>Corrija {lista.length === 1 ? 'este ponto' : `estes ${lista.length} pontos`} para salvar:</p>
            <ul>{lista.map(m => <li key={m}>{m}</li>)}</ul>
          </div>
        )}
      </div>
      <Field rotulo="Número do contrato" erro={erros.numero} obrigatorio>
        {p => <input {...p} value={v.numero} maxLength={30} onChange={e => set('numero', e.target.value)} />}
      </Field>
      <Field rotulo="Descrição" ajuda="Opcional. Explique em poucas palavras do que se trata.">
        {p => <textarea {...p} value={v.descricao} maxLength={500} rows={3} onChange={e => set('descricao', e.target.value)} />}
      </Field>
      <Field rotulo="Cliente" erro={erros.clienteId} obrigatorio>
        {p => (
          <select {...p} value={v.clienteId} onChange={e => set('clienteId', Number(e.target.value))}>
            <option value={0}>Escolha um cliente</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.nome} ({c.email})</option>)}
          </select>
        )}
      </Field>
      <Field rotulo="Tipo de serviço">
        {p => (
          <select {...p} value={v.tipo} onChange={e => set('tipo', Number(e.target.value) as ContratoInput['tipo'])}>
            {Object.entries(TIPO_CONTRATO).map(([k, t]) => <option key={k} value={k}>{t}</option>)}
          </select>
        )}
      </Field>
      <Field rotulo="Situação">
        {p => (
          <select {...p} value={v.status} onChange={e => set('status', Number(e.target.value) as ContratoInput['status'])}>
            {Object.entries(SITUACAO_CONTRATO).map(([k, t]) => <option key={k} value={k}>{t}</option>)}
          </select>
        )}
      </Field>
      <Field rotulo="Data de início" erro={erros.dataInicio} obrigatorio>
        {p => <input {...p} type="date" value={v.dataInicio} onChange={e => set('dataInicio', e.target.value)} />}
      </Field>
      <Field rotulo="Data de término" erro={erros.dataFim} obrigatorio>
        {p => <input {...p} type="date" value={v.dataFim} onChange={e => set('dataFim', e.target.value)} />}
      </Field>
      <div className="acoes">
        <button type="submit" className="primario" disabled={enviando}>{enviando ? 'Salvando…' : 'Salvar contrato'}</button>
        <button type="button" onClick={onCancelar}>Cancelar</button>
      </div>
    </form>
  );
}

export function Contratos() {
  usePageTitle('Contratos');
  const anunciar = useAnunciar();
  const [lista, setLista] = useState<Contrato[] | null>(null);
  const [clientes, setClientes] = useState<Usuario[]>([]);
  const [erro, setErro] = useState('');
  const [edicao, setEdicao] = useState<{ id: number | null; valores: ContratoInput } | null>(null);
  const [exclusao, setExclusao] = useState<Contrato | null>(null);
  const [erroExclusao, setErroExclusao] = useState('');

  const carregar = () => {
    setErro('');
    Promise.all([api.contratos(), api.clientes()])
      .then(([c, u]) => { setLista(c); setClientes(u); })
      .catch(e => setErro(e.message));
  };
  useEffect(carregar, []);

  const editar = (c: Contrato) => setEdicao({
    id: c.id,
    valores: { numero: c.numero, descricao: c.descricao, tipo: c.tipo, status: c.status,
      dataInicio: c.dataInicio.slice(0, 10), dataFim: c.dataFim.slice(0, 10), clienteId: c.clienteId },
  });

  function salvo(c: Contrato) {
    const novo = edicao?.id === null;
    setEdicao(null);
    anunciar(`Contrato ${c.numero} ${novo ? 'criado' : 'atualizado'} com sucesso.`);
    carregar();
  }

  async function excluir() {
    if (!exclusao) return;
    try {
      await api.excluirContrato(exclusao.id);
      anunciar(`Contrato ${exclusao.numero} excluído.`);
      setExclusao(null);
      carregar();
    } catch (e) { setErroExclusao((e as Error).message); }
  }

  return (
    <>
      <h1>Contratos</h1>
      <p><button type="button" className="primario" onClick={() => setEdicao({ id: null, valores: VAZIO })}>Novo contrato</button></p>

      {erro && <p role="alert" className="erro-geral">{erro} <button type="button" onClick={carregar}>Tentar de novo</button></p>}
      {!lista && !erro && <p role="status">Carregando contratos…</p>}
      {lista && lista.length === 0 && <p>Nenhum contrato cadastrado ainda.</p>}
      {lista && lista.length > 0 && (
        <div className="tabela-wrap" tabIndex={0} role="region" aria-label="Tabela de contratos (role para ver mais)">
          <table>
            <caption className="so-leitor">Lista de contratos</caption>
            <thead>
              <tr>
                <th scope="col">Número</th><th scope="col">Cliente</th><th scope="col">Serviço</th>
                <th scope="col">Situação</th><th scope="col">Início</th><th scope="col">Término</th><th scope="col">Ações</th>
              </tr>
            </thead>
            <tbody>
              {lista.map(c => (
                <tr key={c.id}>
                  <td>{c.numero}</td>
                  <td>{c.clienteNome}</td>
                  <td>{TIPO_CONTRATO[c.tipo]}</td>
                  <td>{SITUACAO_CONTRATO[c.status]}</td>
                  <td>{formatarData(c.dataInicio)}</td>
                  <td>{formatarData(c.dataFim)}</td>
                  <td className="acoes">
                    <button type="button" onClick={() => editar(c)}>Editar<span className="so-leitor"> contrato {c.numero}</span></button>
                    <button type="button" onClick={() => { setErroExclusao(''); setExclusao(c); }}>Excluir<span className="so-leitor"> contrato {c.numero}</span></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal aberto={!!edicao} titulo={edicao?.id ? 'Editar contrato' : 'Novo contrato'} onFechar={() => setEdicao(null)}>
        {edicao && <Formulario inicial={edicao.valores} id={edicao.id} clientes={clientes} onSalvo={salvo} onCancelar={() => setEdicao(null)} />}
      </Modal>

      <Modal aberto={!!exclusao} titulo="Excluir contrato?" onFechar={() => setExclusao(null)}>
        <p>Você vai excluir o contrato <strong>{exclusao?.numero}</strong>. Isso não pode ser desfeito.</p>
        {erroExclusao && <p role="alert" className="erro-geral">{erroExclusao}</p>}
        <div className="acoes">
          <button type="button" className="perigo" onClick={excluir}>Sim, excluir</button>
          <button type="button" onClick={() => setExclusao(null)}>Não, manter</button>
        </div>
      </Modal>
    </>
  );
}
