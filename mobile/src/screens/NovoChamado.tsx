import { useNavigation } from '@react-navigation/native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { BarraConexao } from '../components/BarraConexao';
import { Aviso, Botao, Campo, Cartao, Titulo, cor } from '../components/ui';
import { contratoElegivel, formatarData } from '../core/regras';
import { useApp } from '../state/AppContext';

const TIPO: Record<number, string> = { 1: 'Sistemas', 2: 'Suporte', 3: 'Segurança na nuvem' };

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
        <Text accessibilityLiveRegion="polite" style={{ fontSize: 15, fontWeight: '700', color: cor.primaria, marginBottom: 4 }}>Passo {passo} de 3</Text>

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
                      style={{ borderWidth: sel ? 4 : 2, borderColor: sel ? cor.primaria : cor.borda, borderRadius: 12, padding: 16, marginBottom: 10, minHeight: 64, backgroundColor: sel ? '#e8effc' : cor.fundo }}>
                      <Text style={{ fontSize: 18, fontWeight: '700', color: cor.texto }}>{sel ? '✔ ' : ''}Contrato {c.numero}</Text>
                      <Text style={{ fontSize: 15, color: cor.suave }}>{TIPO[c.tipo]} · vale até {formatarData(c.dataFim)}</Text>
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
              <Text style={{ color: cor.suave, fontWeight: '700' }}>Contrato</Text>
              <Text style={{ fontSize: 17, color: cor.texto, marginBottom: 8 }}>{escolhido?.numero} · {escolhido ? TIPO[escolhido.tipo] : ''}</Text>
              <Text style={{ color: cor.suave, fontWeight: '700' }}>Assunto</Text>
              <Text style={{ fontSize: 17, color: cor.texto, marginBottom: 8 }}>{titulo.trim()}</Text>
              <Text style={{ color: cor.suave, fontWeight: '700' }}>Descrição</Text>
              <Text style={{ fontSize: 17, color: cor.texto }}>{descricao.trim() || 'Sem descrição.'}</Text>
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
