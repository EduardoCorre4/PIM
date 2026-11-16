import { useRef, useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, LogIn } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { paginaInicial } from '../labels';
import { Field } from '../components/Field';
import { BarraAcessibilidade, RodapeApp } from '../components/Layout';
import { Logo } from '../components/Logo';
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
    <div className="pagina-publica">
      <a className="jk-pular" href="#entrar">Pular para o formulário de entrada</a>
      <div className="jk-cabecalho-ctn">
        <header className="jk-cabecalho">
          <a className="jk-cabecalho__logo" href="/" aria-label="JAKE Tecnologia — início"><Logo tipo="horizontal" /></a>
          <div className="cab-acess"><BarraAcessibilidade /></div>
        </header>
      </div>
      <main id="entrar" tabIndex={-1} className="login">
        <div className="jk-card login__cartao">
          <Logo tipo="vertical" alt="JAKE Tecnologia" className="login__logo" />
          <h1>Entrar no portal</h1>
          <p className="sub">Use o e-mail e a senha que você recebeu. Clientes, funcionários e gerentes entram por aqui.</p>
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
            <button type="submit" className="primario jk-btn--bloco" disabled={enviando}>
              <LogIn className="jk-icone" aria-hidden="true" />{enviando ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
          <p className="login__voltar"><Link to="/"><ArrowLeft className="jk-icone" aria-hidden="true" />Voltar para o início</Link></p>
        </div>
      </main>
      <RodapeApp />
    </div>
  );
}
