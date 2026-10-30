import { useRef, useState, type ComponentRef } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput } from 'react-native';
import { Aviso, Botao, Campo, Titulo, cor } from '../components/ui';
import { ApiError } from '../core/http';
import { useApp } from '../state/AppContext';

export function Login() {
  const { entrar } = useApp();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erros, setErros] = useState<{ email?: string; senha?: string }>({});
  const [erroGeral, setErroGeral] = useState('');
  const [enviando, setEnviando] = useState(false);
  const refSenha = useRef<ComponentRef<typeof TextInput>>(null);

  async function enviar() {
    setErroGeral('');
    const n: typeof erros = {};
    if (!email.trim()) n.email = 'Digite seu e-mail.';
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) n.email = 'Digite um e-mail válido, como nome@empresa.com.';
    if (!senha) n.senha = 'Digite sua senha.';
    setErros(n);
    if (n.email || n.senha) return;

    setEnviando(true);
    try {
      await entrar(email, senha);
    } catch (e) {
      const m = (e as Error).message;
      const base = m === 'Credenciais inválidas.' ? 'E-mail ou senha incorretos. Confira e tente de novo.'
        : m === 'Sem conexão com o servidor.' ? 'Sem internet. Conecte-se para entrar pela primeira vez.' : m;
      // Em desenvolvimento mostra o motivo técnico (URL e erro) para achar problemas de endereço/rede.
      const detalhe = __DEV__ && e instanceof ApiError && e.detalhe ? ` [${e.detalhe}]` : '';
      setErroGeral(base + detalhe);
    } finally { setEnviando(false); }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: cor.fundo }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 56 }} keyboardShouldPersistTaps="handled">
        <Text style={{ fontSize: 18, fontWeight: '700', color: cor.primaria, marginBottom: 8 }}>JAKE Tecnologia</Text>
        <Titulo>Entrar</Titulo>
        <Text style={{ fontSize: 16, color: cor.suave, marginBottom: 20 }}>Use o e-mail e a senha que você recebeu (Cliente, Funcionário ou Gerente).</Text>
        {erroGeral ? <Aviso tom="erro">{erroGeral}</Aviso> : null}
        <Campo rotulo="E-mail" erro={erros.email} value={email} onChangeText={setEmail} keyboardType="email-address"
          autoCapitalize="none" autoComplete="email" autoCorrect={false} textContentType="username"
          returnKeyType="next" onSubmitEditing={() => refSenha.current?.focus()} />
        <Campo rotulo="Senha" erro={erros.senha} value={senha} onChangeText={setSenha} secureTextEntry
          autoComplete="password" textContentType="password" inputRef={refSenha} returnKeyType="go" onSubmitEditing={enviar} />
        <Botao rotulo={enviando ? 'Entrando…' : 'Entrar'} onPress={enviar} carregando={enviando} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
