import type { ComponentRef, ReactNode, Ref } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { SITUACAO_CHAMADO } from '../core/regras';

/** Cores com contraste mínimo de 7:1 sobre o fundo (texto) — mesmo padrão do painel web. */
export const cor = {
  primaria: '#0a3a82', sobrePrimaria: '#ffffff', texto: '#14181f', suave: '#3d4654', fundo: '#ffffff',
  superficie: '#f2f5fa', borda: '#4a5362', erro: '#8a0000', erroFundo: '#fdecec',
  avisoFundo: '#fff4cc', avisoTexto: '#4d3b00', ok: '#0b5a2a', okFundo: '#e3f4e8',
};

export const Titulo = ({ children }: { children: ReactNode }) => (
  <Text accessibilityRole="header" style={s.titulo}>{children}</Text>
);

interface BotaoProps { rotulo: string; onPress: () => void; variante?: 'primario' | 'secundario' | 'perigo'; desabilitado?: boolean; carregando?: boolean; dica?: string }
/** Alvo de toque de no mínimo 48 dp. */
export function Botao({ rotulo, onPress, variante = 'primario', desabilitado, carregando, dica }: BotaoProps) {
  const off = desabilitado || carregando;
  return (
    <Pressable
      accessibilityRole="button" accessibilityLabel={rotulo} accessibilityHint={dica}
      accessibilityState={{ disabled: !!off, busy: !!carregando }}
      disabled={off} onPress={onPress}
      style={({ pressed }) => [s.botao, s[variante], off && s.off, pressed && { opacity: 0.8 }]}
    >
      {carregando ? <ActivityIndicator color={variante === 'primario' || variante === 'perigo' ? '#fff' : cor.primaria} />
        : <Text style={[s.botaoTxt, variante === 'secundario' && { color: cor.primaria }]}>{rotulo}</Text>}
    </Pressable>
  );
}

interface CampoProps extends TextInputProps { rotulo: string; erro?: string; ajuda?: string; inputRef?: Ref<ComponentRef<typeof TextInput>> }
export function Campo({ rotulo, erro, ajuda, inputRef, ...p }: CampoProps) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={s.rotulo}>{rotulo}</Text>
      {ajuda ? <Text style={s.ajuda}>{ajuda}</Text> : null}
      <TextInput
        ref={inputRef}
        accessibilityLabel={rotulo} accessibilityHint={erro ?? ajuda}
        placeholderTextColor="#5b6472"
        style={[s.input, !!erro && { borderColor: cor.erro, borderWidth: 3 }, p.multiline && { minHeight: 120, textAlignVertical: 'top' }]}
        {...p}
      />
      {erro ? <Text accessibilityLiveRegion="polite" style={s.erro}>Erro: {erro}</Text> : null}
    </View>
  );
}

export const Cartao = ({ children }: { children: ReactNode }) => <View style={s.cartao}>{children}</View>;

type Tom = 'aviso' | 'erro' | 'ok';
export function Aviso({ tom = 'aviso', children }: { tom?: Tom; children: ReactNode }) {
  const t = { aviso: [cor.avisoFundo, cor.avisoTexto], erro: [cor.erroFundo, cor.erro], ok: [cor.okFundo, cor.ok] }[tom];
  return (
    <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={[s.aviso, { backgroundColor: t[0], borderColor: t[1] }]}>
      <Text style={{ color: t[1], fontWeight: '600', fontSize: 15 }}>{children}</Text>
    </View>
  );
}

const CORES_SITUACAO: Record<number, [string, string]> = {
  1: ['#e8effc', '#0a3a82'], 2: ['#fff4cc', '#4d3b00'], 3: ['#e3f4e8', '#0b5a2a'], 4: ['#e6e8ec', '#2a2f38'],
};
/** A situação sempre aparece em texto, nunca só por cor. */
export function Selo({ situacao }: { situacao: number }) {
  const [bg, fg] = CORES_SITUACAO[situacao] ?? CORES_SITUACAO[4];
  return <Text style={[s.selo, { backgroundColor: bg, color: fg, borderColor: fg }]}>{SITUACAO_CHAMADO[situacao]}</Text>;
}
export const SeloFila = ({ falhou }: { falhou?: boolean }) => (
  <Text style={[s.selo, falhou
    ? { backgroundColor: cor.erroFundo, color: cor.erro, borderColor: cor.erro }
    : { backgroundColor: cor.avisoFundo, color: cor.avisoTexto, borderColor: cor.avisoTexto }]}>
    {falhou ? 'Não enviado' : 'Aguardando envio'}
  </Text>
);

const s = StyleSheet.create({
  titulo: { fontSize: 26, fontWeight: '700', color: cor.texto, marginBottom: 12 },
  botao: { minHeight: 52, paddingHorizontal: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2, marginBottom: 10 },
  primario: { backgroundColor: cor.primaria, borderColor: cor.primaria },
  secundario: { backgroundColor: cor.fundo, borderColor: cor.primaria },
  perigo: { backgroundColor: cor.erro, borderColor: cor.erro },
  off: { opacity: 0.5 },
  botaoTxt: { color: '#fff', fontSize: 17, fontWeight: '700' },
  rotulo: { fontSize: 16, fontWeight: '700', color: cor.texto, marginBottom: 4 },
  ajuda: { fontSize: 14, color: cor.suave, marginBottom: 6 },
  input: { minHeight: 52, borderWidth: 2, borderColor: cor.borda, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 17, color: cor.texto, backgroundColor: cor.fundo },
  erro: { color: cor.erro, fontWeight: '700', marginTop: 4, fontSize: 15 },
  cartao: { backgroundColor: cor.superficie, borderWidth: 2, borderColor: cor.borda, borderRadius: 12, padding: 16, marginBottom: 12 },
  aviso: { borderWidth: 2, borderRadius: 10, padding: 12, marginBottom: 12 },
  selo: { alignSelf: 'flex-start', borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, fontSize: 14, fontWeight: '700', overflow: 'hidden' },
});
