import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import type { ChamadoDetalhe } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { useAnunciar } from '../components/Announcer';
import { BadgeChamado } from '../components/Badge';
import { usePageTitle } from '../components/usePageTitle';
import { NOME_PERFIL, PERFIL_CLIENTE, PERFIL_GERENTE, codigoChamado, formatarDataHora } from '../labels';

const FECHADO = 4;
const ABERTO = 1;

/** Conversa assíncrona do chamado: histórico de mensagens, resposta e ações de situação. */
export function DetalheChamado() {
  const { id } = useParams();
  const chamadoId = Number(id);
  const { perfil } = useAuth();
  const anunciar = useAnunciar();
  const [c, setC] = useState<ChamadoDetalhe | null>(null);
  const [erro, setErro] = useState('');
  const [texto, setTexto] = useState('');
  const [erroTexto, setErroTexto] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const fimRef = useRef<HTMLDivElement>(null);
  const campoRef = useRef<HTMLTextAreaElement>(null);
  usePageTitle(c ? `${codigoChamado(c.id)} · ${c.titulo}` : 'Chamado');

  const carregar = useCallback(() => {
    setErro('');
    api.chamado(chamadoId).then(setC).catch(e => setErro(e.message));
  }, [chamadoId]);
  useEffect(carregar, [carregar]);
  useEffect(() => { fimRef.current?.scrollIntoView?.({ block: 'nearest' }); }, [c?.mensagens.length]);

  const ehCliente = perfil === PERFIL_CLIENTE;
  const ehEquipe = !ehCliente;
  const fechado = c?.status === FECHADO;
  const podeFechar = ehEquipe && !!c && !fechado;
  const podeReabrir = !!fechado && (ehCliente || perfil === PERFIL_GERENTE);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!c) return;
    if (!texto.trim()) { setErroTexto('Escreva a mensagem antes de enviar.'); campoRef.current?.focus(); return; }
    setErroTexto(''); setErro(''); setOcupado(true);
    try {
      await api.enviarMensagem(c.id, texto.trim());
      setTexto('');
      setC(await api.chamado(c.id)); // traz também a mudança automática de situação
      anunciar('Resposta enviada.');
      campoRef.current?.focus();
    } catch (err) {
      setErro((err as Error).message);
    } finally { setOcupado(false); }
  }

  async function mudarStatus(status: number, aviso: string) {
    if (!c) return;
    setErro(''); setOcupado(true);
    try {
      await api.alterarStatusChamado(c.id, status);
      setC(await api.chamado(c.id));
      anunciar(aviso);
    } catch (err) {
      setErro((err as Error).message);
    } finally { setOcupado(false); }
  }

  const voltar = <Link to="/chamados" className="jk-detalhe__voltar">← Voltar para os chamados</Link>;

  if (!c) {
    return (
      <>
        {voltar}
        {erro ? <p role="alert" className="erro-geral">{erro} <button type="button" onClick={carregar}>Tentar de novo</button></p>
          : <p role="status">Carregando conversa…</p>}
      </>
    );
  }

  return (
    <>
      {voltar}
      <header className="jk-detalhe__topo">
        <div>
          <p className="jk-mono jk-detalhe__codigo">{codigoChamado(c.id)}</p>
          <h1>{c.titulo}</h1>
          <p className="jk-detalhe__meta">
            Contrato <span className="jk-mono">{c.contratoNumero}</span>
            {ehEquipe && <> · Cliente {c.clienteNome}</>} · Aberto em {formatarDataHora(c.dataAbertura)}
          </p>
        </div>
        <div className="jk-detalhe__acoes">
          <BadgeChamado status={c.status} />
          {podeFechar && (
            <button type="button" disabled={ocupado} onClick={() => mudarStatus(FECHADO, `Chamado ${codigoChamado(c.id)} fechado.`)}>
              Fechar chamado
            </button>
          )}
          {podeReabrir && (
            <button type="button" className="primario" disabled={ocupado} onClick={() => mudarStatus(ABERTO, `Chamado ${codigoChamado(c.id)} reaberto.`)}>
              Reabrir chamado
            </button>
          )}
        </div>
      </header>

      {erro && <p role="alert" className="erro-geral">{erro}</p>}

      <section aria-labelledby="t-conversa" className="jk-conversa">
        <h2 id="t-conversa">Conversa</h2>
        {c.mensagens.length === 0 && <p>Nenhuma mensagem ainda.</p>}
        <ol className="jk-conversa__lista" aria-label="Histórico de mensagens, da mais antiga para a mais nova">
          {c.mensagens.map((m, i) => {
            const doCliente = m.autorPerfil === PERFIL_CLIENTE;
            return (
              <li key={m.id || `d${i}`} className={`jk-msg ${doCliente ? 'jk-msg--cliente' : 'jk-msg--equipe'}`}>
                <div className="jk-msg__balao">
                  <p className="jk-msg__autor">
                    <strong>{m.autorNome}</strong>
                    <span className="jk-msg__perfil">{doCliente ? 'Cliente' : `Equipe JAKE · ${NOME_PERFIL[m.autorPerfil]}`}</span>
                  </p>
                  <p className="jk-msg__texto">{m.conteudo}</p>
                  <p className="jk-msg__data jk-mono"><time dateTime={m.dataEnvio}>{formatarDataHora(m.dataEnvio)}</time></p>
                </div>
              </li>
            );
          })}
        </ol>
        <div ref={fimRef} />
      </section>

      <form className="jk-card jk-responder" onSubmit={enviar} noValidate aria-labelledby="t-resp">
        <h2 id="t-resp">Responder</h2>
        {fechado && (
          <p className="nota jk-responder__aviso" id="aviso-fechado" role="status">
            Este chamado está fechado e não aceita novas mensagens.{podeReabrir ? ' Use “Reabrir chamado” para continuar a conversa.' : ' Peça ao cliente ou a um gerente para reabri-lo.'}
          </p>
        )}
        <div className="campo">
          <label htmlFor="resp-texto">Sua mensagem</label>
          <textarea id="resp-texto" ref={campoRef} rows={4} maxLength={2000} value={texto} disabled={fechado || ocupado}
            aria-invalid={erroTexto ? true : undefined}
            aria-describedby={[fechado ? 'aviso-fechado' : '', erroTexto ? 'resp-erro' : ''].filter(Boolean).join(' ') || undefined}
            onChange={e => setTexto(e.target.value)} />
          {erroTexto && <p id="resp-erro" className="erro-campo">{erroTexto}</p>}
        </div>
        <button type="submit" className="primario" disabled={fechado || ocupado}>{ocupado ? 'Enviando…' : 'Enviar resposta'}</button>
      </form>
    </>
  );
}
