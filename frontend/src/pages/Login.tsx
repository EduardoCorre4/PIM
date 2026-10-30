import { useRef, useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { paginaInicial } from '../labels';
import { Field } from '../components/Field';
import { BarraAcessibilidade } from '../components/Layout';
import { usePageTitle } from '../components/usePageTitle';

export function Login() {
  usePageTitle('Entrar');
  const { autenticado, perfil, entrar } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erros, setErros] = useState<{ email?: string; senha?: string }>({});
  const [erroGeral, setErroGeral] = useState('');
  const [enviando, setEnviando] = useState(false);
  const refEmail = useRef<HTMLInputElement>(null);
  const refSenha = useRef<HTMLInputElement>(null);

  if (autenticado) return <Navigate to={paginaInicial(perfil)} replace />;

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setErroGeral('');
    const novos: typeof erros = {};
    if (!email.trim()) novos.email = 'Digite seu e-mail.';
    else if (!/^\S+@\S+\.\S+$/.test(email)) novos.email = 'Digite um e-mail válido, como nome@empresa.com.';
    if (!senha) novos.senha = 'Digite sua senha.';
    setErros(novos);
    if (novos.email) return refEmail.current?.focus();
    if (novos.senha) return refSenha.current?.focus();

    setEnviando(true);
    try {
      await entrar(email.trim(), senha);
    } catch (err) {
      const m = err instanceof Error ? err.message : '';
      setErroGeral(m === 'Credenciais inválidas.' ? 'E-mail ou senha incorretos. Confira e tente de novo.' : m || 'Não foi possível entrar.');
      refSenha.current?.focus();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <a className="pular" href="#entrar">Ir para o formulário de entrada</a>
      <header className="topo"><p className="marca">JAKE Tecnologia</p><BarraAcessibilidade /></header>
      <main id="entrar" className="login">
        <h1>Entrar no portal</h1>
        <p>Use o e-mail e a senha que você recebeu. Clientes, funcionários e gerentes entram por aqui.</p>
        {erroGeral && <p role="alert" className="erro-geral">{erroGeral}</p>}
        <form onSubmit={enviar} noValidate>
          <Field rotulo="E-mail" erro={erros.email} obrigatorio>
            {p => <input {...p} ref={refEmail} type="email" autoComplete="username" value={email}
              onChange={e => setEmail(e.target.value)} />}
          </Field>
          <Field rotulo="Senha" erro={erros.senha} obrigatorio>
            {p => <input {...p} ref={refSenha} type="password" autoComplete="current-password" value={senha}
              onChange={e => setSenha(e.target.value)} />}
          </Field>
          <button type="submit" className="primario" disabled={enviando}>
            {enviando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </main>
    </>
  );
}
