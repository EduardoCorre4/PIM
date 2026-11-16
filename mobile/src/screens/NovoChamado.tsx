import { useNavigation } from '@react-navigation/native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { BarraConexao } from '../components/BarraConexao';
import { Aviso, Botao, Campo, Cartao, TIPO_CONTRATO as TIPO, TipoContrato, Titulo, cor, tx } from '../components/ui';
import { fonte, paleta, raio } from '../theme';
import { contratoElegivel, formatarData } from '../core/regras';
import { useApp } from '../state/AppContext';

/** Abertura de chamado em 3 passos: 1) contrato  2) descrição  3) revisar e enviar. */
export function NovoChamado() {
  const nav = useNavigation<any>();
  const { contratos, abrirChamado, online } = useApp();
  const [passo, setPasso] = useState<1 | 2 | 3>(1);
  const [contratoId, setContratoId] = useState<number | null>(null);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [erroTitulo, setErroTitulo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const concluido = useRef(false);

  const elegiveis = useMemo(() => contratos.filter(c => contratoElegivel(c)), [contratos]);
  const escolhido = elegiveis.find(c => c.id === contratoId);

  // Se há um só contrato válido, já vem escolhido (o cliente só confere e segue).
  useEffect(() => { if (contratoId === null && elegiveis.length === 1) setContratoId(elegiveis[0].id); }, [elegiveis, contratoId]);

  // Evita perder o que foi digitado por um toque sem querer em "voltar".
  useEffect(() => nav.addListener('beforeRemove', (e: any) => {
    if (concluido.current || (!titulo && !descricao)) return;
    e.preventDefault();
    Alert.alert('Sair sem enviar?', 'O que você escreveu será perdido.', [
      { text: 'Continuar escrevendo', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => nav.dispatch(e.data.action) },
    ]);
  }), [nav, titulo, descricao]);

  function proximo() {
    if (passo === 2) {
      if (titulo.trim().length < 5) { setErroTitulo('Escreva um assunto com pelo menos 5 letras.'); return; }
      setErroTitulo('');
    }
    setPasso(p => (p + 1) as 2 | 3);
  }

  async function enviar() {
    if (!escolhido) return;
    setEnviando(true);
    try {
      const r = await abrirChamado({ contratoId: escolhido.id, contratoNumero: escolhido.numero, titulo: titulo.trim(), descricao: descricao.trim() });
      if (r.tipo === 'falhou') { Alert.alert('Não foi possível abrir o chamado', r.erro); return; }
      concluido.current = true;
      Alert.alert(
        r.tipo === 'enviado' ? 'Chamado aberto!' : 'Chamado guardado',
        r.tipo === 'enviado' ? 'Recebemos o seu chamado. Você pode acompanhar por aqui.'
          : 'Você está sem internet. Guardamos o chamado e vamos enviá-lo assim que a conexão voltar.',
        [{ text: 'Ver meus chamados', onPress: () => nav.replace('Abas', { screen: 'Chamados' }) }]);
    } finally { setEnviando(false); }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: cor.fundo }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <BarraConexao />
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <View accessible accessibilityRole="progressbar" accessibilityLabel={`Passo ${passo} de 3`} accessibilityValue={{ min: 1, max: 3, now: passo }}
          style={{ flexDirection: 'row', gap: 6, marginBottom: 10 }}>
          {[1, 2, 3].map(n => <View key={n} style={{ flex: 1, height: 4, borderRadius: 4, backgroundColor: n <= passo ? paleta.azul : paleta.neutro200 }} />)}
        </View>
        <Text allowFontScaling accessibilityLiveRegion="polite" style={{ fontFamily: fonte.textoSemi, fontSize: 14, color: cor.primaria, marginBottom: 4 }}>Passo {passo} de 3</Text>

        {passo === 1 && (
          <>
            <Titulo>Qual contrato?</Titulo>
            {elegiveis.length === 0 ? (
              <Aviso tom="erro">
                {contratos.length === 0
                  ? (online ? 'Você ainda não tem contratos.' : 'Não encontramos seus contratos neste aparelho. Conecte-se à internet uma vez para carregá-los.')
                  : 'Nenhum dos seus contratos está ativo no momento. Fale com a JAKE para renovar.'}
              </Aviso>
            ) : (
              <View accessibilityRole="radiogroup">
                {elegiveis.map(c => {
                  const sel = c.id === contratoId;
                  return (
                    <Pressable key={c.id} accessibilityRole="radio" accessibilityState={{ selected: sel }}
                      accessibilityLabel={`Contrato ${c.numero}, ${TIPO[c.tipo]}, vale até ${formatarData(c.dataFim)}`}
                      onPress={() => setContratoId(c.id)}
                      style={{ borderWidth: sel ? 2 : 1.5, borderColor: sel ? paleta.azul : paleta.neutro200, borderRadius: raio.lg, padding: 14, marginBottom: 10, minHeight: 64, gap: 6,
                        backgroundColor: sel ? paleta.azul50 : paleta.branco }}>
                      <TipoContrato tipo={c.tipo} />
                      <Text allowFontScaling style={[tx.mono, { fontSize: 16 }]}>{sel ? '✔ ' : ''}{c.numero}</Text>
                      <Text allowFontScaling style={tx.suave}>Vale até {formatarData(c.dataFim)}</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
            <Botao rotulo="Continuar" desabilitado={!escolhido} onPress={proximo} />
          </>
        )}

        {passo === 2 && (
          <>
            <Titulo>O que aconteceu?</Titulo>
            {escolhido && <Aviso tom="ok">Contrato {escolhido.numero} ({TIPO[escolhido.tipo]}) ativo até {formatarData(escolhido.dataFim)}.</Aviso>}
            <Campo rotulo="Assunto" ajuda="Resuma o problema em poucas palavras." value={titulo} onChangeText={setTitulo} maxLength={200} erro={erroTitulo} />
            <Campo rotulo="Descrição (opcional)" ajuda="Conte mais detalhes, se quiser." value={descricao} onChangeText={setDescricao} maxLength={2000} multiline />
            <Botao rotulo="Continuar" onPress={proximo} />
            <Botao variante="secundario" rotulo="Voltar" onPress={() => setPasso(1)} />
          </>
        )}

        {passo === 3 && (
          <>
            <Titulo>Confira e envie</Titulo>
            <Cartao>
              <Text allowFontScaling style={[tx.suave, { fontFamily: fonte.textoSemi }]}>Contrato</Text>
              <Text allowFontScaling style={[tx.mono, { fontSize: 16, marginBottom: 4 }]}>{escolhido?.numero}</Text>
              {escolhido && <View style={{ marginBottom: 10 }}><TipoContrato tipo={escolhido.tipo} /></View>}
              <Text allowFontScaling style={[tx.suave, { fontFamily: fonte.textoSemi }]}>Assunto</Text>
              <Text allowFontScaling style={[tx.corpo, { marginBottom: 10 }]}>{titulo.trim()}</Text>
              <Text allowFontScaling style={[tx.suave, { fontFamily: fonte.textoSemi }]}>Descrição</Text>
              <Text allowFontScaling style={tx.corpo}>{descricao.trim() || 'Sem descrição.'}</Text>
            </Cartao>
            {!online && <Aviso>Sem internet: o chamado será guardado e enviado quando a conexão voltar.</Aviso>}
            <Botao rotulo={online ? 'Enviar chamado' : 'Guardar chamado'} onPress={enviar} carregando={enviando} />
            <Botao variante="secundario" rotulo="Voltar" desabilitado={enviando} onPress={() => setPasso(2)} />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
