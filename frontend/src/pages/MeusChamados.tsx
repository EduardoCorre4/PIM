import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react';
import { api } from '../api/client';
import type { Chamado, ContratoCliente } from '../api/types';
import { useAnunciar } from '../components/Announcer';
import { Field } from '../components/Field';
import { usePageTitle } from '../components/usePageTitle';
import { SITUACAO_CHAMADO, formatarDataHora } from '../labels';

const hoje = () => new Date().toISOString().slice(0, 10);
/** Mesma regra do servidor: só se abre chamado em contrato ATIVO e dentro da vigência. */
const vigente = (c: ContratoCliente) => c.status === 1 && c.dataInicio.slice(0, 10) <= hoje() && hoje() <= c.dataFim.slice(0, 10);

/** Visão do Cliente no painel web: abrir chamado e acompanhar os próprios chamados. */
export function MeusChamados() {
  usePageTitle('Meus chamados');
  const anunciar = useAnunciar();
  const filtroId = useId();
  const [lista, setLista] = useState<Chamado[] | null>(null);
  const [contratos, setContratos] = useState<ContratoCliente[]>([]);
  const [filtro, setFiltro] = useState(0);
  const [erro, setErro] = useState('');

  const [contratoId, setContratoId] = useState(0);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [erros, setErros] = useState<{ contrato?: string; titulo?: string }>({});
  const [enviando, setEnviando] = useState(false);
  const chave = useRef(crypto.randomUUID()); // um reenvio do mesmo formulário nunca cria dois chamados

  const elegiveis = useMemo(() => contratos.filter(vigente), [contratos]);

  const carregar = () => {
    setErro('');
    Promise.all([api.meusChamados(), api.meusContratos()])
      .then(([l, c]) => { setLista(l); setContratos(c); })
      .catch(e => setErro(e.message));
  };
  useEffect(carregar, []);
  useEffect(() => { if (!contratoId && elegiveis.length === 1) setContratoId(elegiveis[0].id); }, [elegiveis, contratoId]);

  async function abrir(e: FormEvent) {
    e.preventDefault();
    setErro('');
    const n: typeof erros = {};
    if (!contratoId) n.contrato = 'Escolha o contrato.';
    if (!titulo.trim()) n.titulo = 'Descreva o assunto em poucas palavras.';
    setErros(n);
    if (n.contrato || n.titulo) return;
    setEnviando(true);
    try {
      const novo = await api.abrirChamado({ contratoId, titulo: titulo.trim(), descricao: descricao.trim(), chaveIdempotencia: chave.current });
      setLista(l => [novo, ...(l ?? []).filter(x => x.id !== novo.id)]);
      setTitulo(''); setDescricao(''); chave.current = crypto.randomUUID();
      anunciar(`Chamado ${novo.id} aberto com sucesso.`);
    } catch (err) {
      setErro((err as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  const visiveis = (lista ?? []).filter(c => !filtro || c.status === filtro);

  return (
    <>
      <h1>Meus chamados</h1>

      <section className="cartao" aria-labelledby="t-abrir">
        <h2 id="t-abrir">Abrir novo chamado</h2>
        {contratos.length > 0 && elegiveis.length === 0 && (
          <p className="nota">Você não tem contrato ativo e dentro da vigência. Fale com a JAKE Tecnologia.</p>
        )}
        <form onSubmit={abrir} noValidate>
          <Field rotulo="Contrato" erro={erros.contrato} obrigatorio>
            {p => (
              <select {...p} value={contratoId} onChange={e => setContratoId(Number(e.target.value))}>
                <option value={0}>Escolha…</option>
                {elegiveis.map(c => <option key={c.id} value={c.id}>{c.numero} — {c.descricao}</option>)}
              </select>
            )}
          </Field>
          <Field rotulo="Assunto" erro={erros.titulo} obrigatorio>
            {p => <input {...p} type="text" maxLength={200} value={titulo} onChange={e => setTitulo(e.target.value)} />}
          </Field>
          <Field rotulo="Descrição do problema" ajuda="Conte o que aconteceu, se puder.">
            {p => <textarea {...p} rows={4} maxLength={2000} value={descricao} onChange={e => setDescricao(e.target.value)} />}
          </Field>
          <button type="submit" className="primario" disabled={enviando || elegiveis.length === 0}>
            {enviando ? 'Enviando…' : 'Abrir chamado'}
          </button>
        </form>
      </section>

      <h2>Acompanhamento</h2>
      <div className="filtro">
        <label htmlFor={filtroId}>Mostrar chamados com situação</label>
        <select id={filtroId} value={filtro} onChange={e => setFiltro(Number(e.target.value))}>
          <option value={0}>Todas</option>
          {Object.entries(SITUACAO_CHAMADO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {erro && <p role="alert" className="erro-geral">{erro} <button type="button" onClick={carregar}>Tentar de novo</button></p>}
      {!lista && !erro && <p role="status">Carregando chamados…</p>}
      {lista && visiveis.length === 0 && <p>{filtro ? 'Nenhum chamado com essa situação.' : 'Você ainda não abriu nenhum chamado.'}</p>}
      {visiveis.length > 0 && (
        <div className="tabela-wrap" tabIndex={0} role="region" aria-label="Tabela dos seus chamados (role para ver mais)">
          <table>
            <caption className="so-leitor">Seus chamados</caption>
            <thead>
              <tr><th scope="col">Nº</th><th scope="col">Assunto</th><th scope="col">Contrato</th><th scope="col">Aberto em</th><th scope="col">Situação</th></tr>
            </thead>
            <tbody>
              {visiveis.map(c => (
                <tr key={c.id}>
                  <td>{c.id}</td><td>{c.titulo}</td><td>{c.contratoNumero}</td>
                  <td>{formatarDataHora(c.dataAbertura)}</td><td>{SITUACAO_CHAMADO[c.status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
