import type { ComponentRef, ReactNode, Ref } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { Check, Info } from 'lucide-react-native';
import { SITUACAO_CHAMADO } from '../core/regras';
import { ALVO, fonte, paleta, raio } from '../theme';

/** Cores semânticas do app, a partir da paleta oficial. Texto sobre fundo com contraste AA ou melhor. */
export const cor = {
  primaria: paleta.azul, sobrePrimaria: paleta.branco, texto: paleta.noite, suave: paleta.neutro600,
  fundo: paleta.nevoa, superficie: paleta.branco, borda: paleta.neutro200, bordaCampo: paleta.neutro400,
  erro: paleta.erroTexto, erroFundo: paleta.erroFundo,
  avisoFundo: paleta.alertaFundo, avisoTexto: paleta.alertaTexto, ok: paleta.sucessoTexto, okFundo: paleta.sucessoFundo,
};

/** Estilos de texto prontos (a família define o peso). */
export const tx = StyleSheet.create({
  corpo: { fontFamily: fonte.texto, color: cor.texto, fontSize: 16 },
  semi: { fontFamily: fonte.textoSemi, color: cor.texto, fontSize: 16 },
  suave: { fontFamily: fonte.texto, color: cor.suave, fontSize: 14 },
  mono: { fontFamily: fonte.mono, color: cor.texto, fontSize: 14 },
  h2: { fontFamily: fonte.tituloSemi, color: cor.texto, fontSize: 20, marginVertical: 8 },
});

export const Titulo = ({ children }: { children: ReactNode }) => (
  <Text accessibilityRole="header" allowFontScaling style={s.titulo}>{children}</Text>
);

interface BotaoProps {
  rotulo: string; onPress: () => void; variante?: 'primario' | 'secundario' | 'perigo' | 'destaque';
  desabilitado?: boolean; carregando?: boolean; dica?: string; icone?: ReactNode;
}
/** Alvo de toque de no mínimo 48 dp. "destaque" = Amarelo Ipê com texto Noite. */
export function Botao({ rotulo, onPress, variante = 'primario', desabilitado, carregando, dica, icone }: BotaoProps) {
  const off = desabilitado || carregando;
  const txt = variante === 'secundario' ? cor.primaria : variante === 'destaque' ? paleta.noite : '#fff';
  return (
    <Pressable
      accessibilityRole="button" accessibilityLabel={rotulo} accessibilityHint={dica}
      accessibilityState={{ disabled: !!off, busy: !!carregando }}
      disabled={off} onPress={onPress}
      style={({ pressed }) => [s.botao, s[variante], off && s.off, pressed && { opacity: 0.85 }]}
    >
      {carregando ? <ActivityIndicator color={txt} /> : (
        <>
          {icone}
          <Text allowFontScaling style={[s.botaoTxt, { color: txt }]}>{rotulo}</Text>
        </>
      )}
    </Pressable>
  );
}

interface CampoProps extends TextInputProps { rotulo: string; erro?: string; ajuda?: string; inputRef?: Ref<ComponentRef<typeof TextInput>> }
export function Campo({ rotulo, erro, ajuda, inputRef, ...p }: CampoProps) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text allowFontScaling style={s.rotulo}>{rotulo}</Text>
      {ajuda ? <Text allowFontScaling style={s.ajuda}>{ajuda}</Text> : null}
      <TextInput
        ref={inputRef} allowFontScaling
        accessibilityLabel={rotulo} accessibilityHint={erro ?? ajuda}
        placeholderTextColor={paleta.neutro500}
        style={[s.input, !!erro && { borderColor: paleta.erro, borderWidth: 2 }, p.multiline && { minHeight: 120, textAlignVertical: 'top' }]}
        {...p}
      />
      {erro ? <Text allowFontScaling accessibilityLiveRegion="polite" style={s.erro}>Erro: {erro}</Text> : null}
    </View>
  );
}

export const Cartao = ({ children }: { children: ReactNode }) => <View style={s.cartao}>{children}</View>;

type Tom = 'aviso' | 'erro' | 'ok' | 'info';
const TONS: Record<Tom, [string, string, string]> = {
  aviso: [paleta.alertaFundo, paleta.alertaTexto, paleta.alerta],
  erro: [paleta.erroFundo, paleta.erroTexto, paleta.erro],
  ok: [paleta.sucessoFundo, paleta.sucessoTexto, paleta.sucesso],
  info: [paleta.azul100, paleta.azul800, paleta.azul],
};
/** Aviso com faixa lateral colorida (verde = contrato ativo, vermelho = erro). */
export function Aviso({ tom = 'aviso', children }: { tom?: Tom; children: ReactNode }) {
  const [bg, fg, faixa] = TONS[tom];
  return (
    <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={[s.aviso, { backgroundColor: bg, borderLeftColor: faixa }]}>
      {tom === 'ok' ? <Check size={20} color={fg} strokeWidth={2} /> : <Info size={20} color={fg} strokeWidth={2} />}
      <Text allowFontScaling style={{ color: fg, fontFamily: fonte.textoMedio, fontSize: 14, flex: 1 }}>{children}</Text>
    </View>
  );
}

// Badges: sempre ponto colorido + texto (a cor nunca é a única informação).
const CORES_SITUACAO: Record<number, [string, string]> = {
  1: [paleta.azul100, paleta.azul800],             // Aberto
  2: [paleta.alertaFundo, paleta.alertaTexto],     // Em atendimento
  3: [paleta.sucessoFundo, paleta.sucessoTexto],   // Resolvido
  4: [paleta.neutro100, paleta.neutro600],         // Fechado
};
function Badge({ bg, fg, texto }: { bg: string; fg: string; texto: string }) {
  return (
    <View style={[s.selo, { backgroundColor: bg }]}>
      <View style={[s.ponto, { backgroundColor: fg }]} />
      <Text allowFontScaling style={[s.seloTxt, { color: fg }]}>{texto}</Text>
    </View>
  );
}
export function Selo({ situacao }: { situacao: number }) {
  const [bg, fg] = CORES_SITUACAO[situacao] ?? CORES_SITUACAO[4];
  return <Badge bg={bg} fg={fg} texto={SITUACAO_CHAMADO[situacao]} />;
}
export const SeloFila = ({ falhou }: { falhou?: boolean }) => falhou
  ? <Badge bg={paleta.erroFundo} fg={paleta.erroTexto} texto="Não enviado" />
  : <Badge bg={paleta.alertaFundo} fg={paleta.alertaTexto} texto="Aguardando envio" />;

/** Etiqueta de tipo de contrato: 1 = Sistema, 2 = Suporte, 3 = Cloud Security. */
export const TIPO_CONTRATO: Record<number, string> = { 1: 'Sistema', 2: 'Suporte', 3: 'Cloud Security' };
const COR_TIPO: Record<number, string> = { 1: paleta.contratoSistema, 2: paleta.contratoSuporte, 3: paleta.contratoCloud };
export function TipoContrato({ tipo }: { tipo: number }) {
  return (
    <View style={s.tipo}>
      <View style={[s.tipoQuadro, { backgroundColor: COR_TIPO[tipo] ?? paleta.contratoSuporte }]} />
      <Text allowFontScaling style={s.tipoTxt}>{TIPO_CONTRATO[tipo]}</Text>
    </View>
  );
}

/** Código em fonte mono, como no guia: #CH-2048. */
export const codigoChamado = (id: number) => `#CH-${String(id).padStart(4, '0')}`;

export function Avatar({ nome }: { nome?: string }) {
  const ini = (nome ?? '?').trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('') || '?';
  return (
    <View accessible={false} importantForAccessibility="no-hide-descendants" style={s.avatar}>
      <Text allowFontScaling={false} style={s.avatarTxt}>{ini}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  titulo: { fontFamily: fonte.titulo, fontSize: 26, color: cor.texto, marginBottom: 12, letterSpacing: -0.5 },
  botao: { minHeight: ALVO, paddingHorizontal: 20, borderRadius: raio.md, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, marginBottom: 10 },
  primario: { backgroundColor: paleta.azul, borderColor: paleta.azul },
  secundario: { backgroundColor: paleta.branco, borderColor: paleta.neutro400 },
  destaque: { backgroundColor: paleta.ipe, borderColor: paleta.ipe },
  perigo: { backgroundColor: paleta.erro, borderColor: paleta.erro },
  off: { opacity: 0.5 },
  botaoTxt: { fontFamily: fonte.textoSemi, fontSize: 16 },
  rotulo: { fontFamily: fonte.textoSemi, fontSize: 14, color: cor.texto, marginBottom: 4 },
  ajuda: { fontFamily: fonte.texto, fontSize: 14, color: cor.suave, marginBottom: 6 },
  input: { minHeight: ALVO, borderWidth: 1.5, borderColor: paleta.neutro400, borderRadius: raio.md, paddingHorizontal: 16, paddingVertical: 12, fontFamily: fonte.texto, fontSize: 16, color: cor.texto, backgroundColor: paleta.branco },
  erro: { fontFamily: fonte.textoSemi, color: paleta.erroTexto, marginTop: 4, fontSize: 14 },
  cartao: { backgroundColor: paleta.branco, borderWidth: 1, borderColor: paleta.neutro200, borderRadius: raio.lg, padding: 16, marginBottom: 12 },
  aviso: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', borderLeftWidth: 4, borderRadius: raio.md, padding: 14, marginBottom: 12 },
  selo: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: raio.pill, paddingHorizontal: 10, paddingVertical: 4 },
  ponto: { width: 7, height: 7, borderRadius: 4 },
  seloTxt: { fontFamily: fonte.textoSemi, fontSize: 12 },
  tipo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tipoQuadro: { width: 10, height: 10, borderRadius: 3 },
  tipoTxt: { fontFamily: fonte.textoSemi, fontSize: 12, color: cor.texto },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: paleta.ipe, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontFamily: fonte.titulo, fontSize: 14, color: paleta.noite },
});
