import { useRoute } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { Aviso, Botao, Campo, Cartao, Selo, SeloFila, Titulo, codigoChamado, cor, tx } from '../components/ui';
import { PERFIL_CLIENTE, PERFIL_GERENTE } from '../core/api';
import { formatarDataHora } from '../core/regras';
import type { ChamadoDetalhe } from '../core/types';
import { useApp } from '../state/AppContext';
import { fonte, paleta, raio } from '../theme';

const FECHADO = 4;
const NOME_PERFIL: Record<number, string> = { 1: 'Cliente', 2: 'Funcionário', 3: 'Gerente' };

const Linha = ({ rotulo, valor, mono }: { rotulo: string; valor: string; mono?: boolean }) => (
  <>
    <Text allowFontScaling style={[tx.suave, { fontFamily: fonte.textoSemi, marginTop: 10 }]}>{rotulo}</Text>
    <Text allowFontScaling style={mono ? [tx.mono, { fontSize: 16 }] : [tx.corpo, { fontSize: 16 }]}>{valor}</Text>
  </>
);

/** Balão do histórico: cliente à esquerda (branco), equipe JAKE à direita (azul claro). */
function Balao({ m }: { m: ChamadoDetalhe['mensagens'][number] }) {
  const doCliente = m.autorPerfil === PERFIL_CLIENTE;
  return (
    <View
      accessible
      accessibilityLabel={`${m.autorNome}, ${doCliente ? 'cliente' : `equipe JAKE, ${NOME_PERFIL[m.autorPerfil]}`}, ${formatarDataHora(m.dataEnvio)}. ${m.conteudo}`}
      style={{
        alignSelf: doCliente ? 'flex-start' : 'flex-end', maxWidth: '90%', marginBottom: 10, padding: 12,
        backgroundColor: doCliente ? cor.superficie : paleta.azul50, borderRadius: raio.lg,
        borderWidth: 1, borderColor: doCliente ? cor.borda : paleta.azul,
        ...(doCliente ? { borderBottomLeftRadius: raio.sm } : { borderBottomRightRadius: raio.sm }),
      }}>
      <Text allowFontScaling style={[tx.semi, { fontFamily: fonte.tituloSemi, fontSize: 15 }]}>{m.autorNome}</Text>
      <Text allowFontScaling style={[tx.suave, { fontSize: 12 }]}>{doCliente ? 'Cliente' : `Equipe JAKE · ${NOME_PERFIL[m.autorPerfil]}`}</Text>
      <Text allowFontScaling style={[tx.corpo, { marginTop: 6 }]}>{m.conteudo}</Text>
      <Text allowFontScaling style={[tx.mono, { fontSize: 12, color: cor.suave, marginTop: 6 }]}>{formatarDataHora(m.dataEnvio)}</Text>
    </View>
  );
}

export function DetalheChamado() {
  const { params } = useRoute<any>();
  const { chamados, pendentes, online, usuario, atendente, alterarStatus, carregarConversa, enviarMensagem } = useApp();
  const [det, setDet] = useState<ChamadoDetalhe | null>(null);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [texto, setTexto] = useState('');
  const [erroTexto, setErroTexto] = useState('');
  const c = chamados.find(x => x.id === params.id);
  const p = pendentes.find(x => x.localId === params.localId);

  const carregar = useCallback(async () => {
    if (!params.id) return;
    setCarregando(true);
    try { setDet(await carregarConversa(params.id)); setErro(''); }
    catch (e) { setErro((e as Error).message); }
    finally { setCarregando(false); }
  }, [params.id, carregarConversa]);
  useEffect(() => { if (online) void carregar(); }, [online, carregar]);

  // O detalhe (servidor) é mais novo que a cópia da lista: usa-o quando existir.
  const status = det?.status ?? c?.status;
  const fechado = status === FECHADO;
  const perfil = usuario?.perfil ?? PERFIL_CLIENTE;
  const podeFechar = atendente && !!c && !fechado;
  const podeReabrir = fechado && (perfil === PERFIL_CLIENTE || perfil === PERFIL_GERENTE);

  async function mudar(novo: number) {
    setErro(''); setOcupado(true);
    try { await alterarStatus(c!.id, novo); await carregar(); }
    catch (e) { setErro((e as Error).message); }
    finally { setOcupado(false); }
  }

  async function enviar() {
    if (!texto.trim()) { setErroTexto('Escreva a mensagem antes de enviar.'); return; }
    setErroTexto(''); setErro(''); setOcupado(true);
    try { await enviarMensagem(c!.id, texto.trim()); setTexto(''); await carregar(); }
    catch (e) { setErro((e as Error).message); }
    finally { setOcupado(false); }
  }

  if (!c && !p) return <ScrollView contentContainerStyle={{ padding: 16 }}><Aviso>Chamado não encontrado. Volte e atualize a lista.</Aviso></ScrollView>;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: cor.fundo }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <Titulo>{c?.titulo ?? p!.titulo}</Titulo>
        {c && status ? <Selo situacao={status} /> : <SeloFila falhou={p!.estado === 'falhou'} />}
        {!online && <Text allowFontScaling style={[tx.suave, { marginVertical: 8 }]}>Sem internet: você está vendo os dados guardados no aparelho.</Text>}
        <Cartao>
          {atendente && c?.clienteNome ? <Linha rotulo="Cliente" valor={c.clienteNome} /> : null}
          <Linha rotulo="Contrato" valor={c?.contratoNumero ?? p!.contratoNumero} mono />
          <Linha rotulo={c ? 'Aberto em' : 'Criado em'} valor={formatarDataHora(c?.dataAbertura ?? p!.criadoEm)} />
          {c && <Linha rotulo="Chamado" valor={codigoChamado(c.id)} mono />}
          {!c && <Linha rotulo="Descrição" valor={p!.descricao || 'Sem descrição.'} />}
          {p?.erro && <Linha rotulo="Motivo de não ter sido enviado" valor={p.erro} />}
        </Cartao>

        {erro ? <Aviso tom="erro">{erro}</Aviso> : null}

        {c && (
          <>
            {(podeFechar || podeReabrir) && (
              <View style={{ marginBottom: 8 }}>
                {podeFechar && <Botao variante="secundario" rotulo="Fechar chamado" desabilitado={ocupado || !online} onPress={() => void mudar(FECHADO)} />}
                {podeReabrir && <Botao rotulo="Reabrir chamado" desabilitado={ocupado || !online} onPress={() => void mudar(1)} />}
                {!online && <Text allowFontScaling style={tx.suave}>Conecte-se à internet para alterar a situação.</Text>}
              </View>
            )}

            <Text accessibilityRole="header" allowFontScaling style={tx.h2}>Conversa</Text>
            {carregando && !det && <Text allowFontScaling accessibilityLiveRegion="polite" style={tx.suave}>Carregando conversa…</Text>}
            {!det && !carregando && !online && <Text allowFontScaling style={tx.suave}>O histórico precisa de internet. Descrição: {c.descricao || 'sem descrição.'}</Text>}
            {det?.mensagens.length === 0 && <Text allowFontScaling style={tx.suave}>Nenhuma mensagem ainda.</Text>}
            {det?.mensagens.map((m, i) => <Balao key={m.id || `d${i}`} m={m} />)}

            <Text accessibilityRole="header" allowFontScaling style={tx.h2}>Responder</Text>
            {fechado && (
              <Aviso>
                Este chamado está fechado e não aceita novas mensagens.{podeReabrir ? ' Toque em “Reabrir chamado” para continuar.' : ' Peça ao cliente ou a um gerente para reabri-lo.'}
              </Aviso>
            )}
            <Campo rotulo="Sua mensagem" multiline maxLength={2000} value={texto} onChangeText={setTexto}
              editable={!fechado && !ocupado} erro={erroTexto || undefined} />
            <Botao rotulo="Enviar resposta" carregando={ocupado}
              desabilitado={fechado || ocupado || !online} onPress={() => void enviar()} />
            {!online && !fechado && <Text allowFontScaling style={tx.suave}>Conecte-se à internet para enviar a resposta.</Text>}
          </>
        )}
        {p && !c && <Text allowFontScaling style={tx.suave}>A conversa fica disponível depois que o chamado for enviado.</Text>}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
