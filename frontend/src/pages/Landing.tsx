import { Link } from 'react-router-dom';
import { BarraAcessibilidade } from '../components/Layout';
import { usePageTitle } from '../components/usePageTitle';

// Credenciais de demonstração. O Gerente vem do .env (SEED_GERENTE_*), repassado no build do Docker;
// o cliente é o usuário de teste do banco local.
// O Funcionário vem de SEED_FUNCIONARIO_* (padrão func@jake.local).
const GERENTE_EMAIL = import.meta.env.VITE_DEMO_GERENTE_EMAIL || 'definido em SEED_GERENTE_EMAIL (.env)';
const FUNCIONARIO_EMAIL = import.meta.env.VITE_DEMO_FUNCIONARIO_EMAIL || 'func@jake.local';
const FUNCIONARIO_SENHA = import.meta.env.VITE_DEMO_FUNCIONARIO_SENHA || 'Func@12345';
const GERENTES_EQUIPE = ['eduardo', 'jheniffer', 'karolaine', 'arthur', 'emy'].map(n => `${n}@jake.local`);
const GERENTE_SENHA = import.meta.env.VITE_DEMO_GERENTE_SENHA || 'definida em SEED_GERENTE_SENHA (.env)';

export function Landing() {
  usePageTitle('Início');
  return (
    <>
      <a className="pular" href="#inicio">Ir para o conteúdo principal</a>
      <header className="topo"><p className="marca">JAKE Tecnologia</p><BarraAcessibilidade /></header>
      <main id="inicio" tabIndex={-1} className="landing">
        <section className="heroi" aria-labelledby="titulo-inicio">
          <h1 id="titulo-inicio">Central de chamados e contratos da JAKE Tecnologia</h1>
          <p>Sistemas, suporte e segurança na nuvem em um só lugar. Escolha como deseja acessar.</p>
        </section>

        <div className="grade">
          <section className="cartao acesso" aria-labelledby="t-portal">
            <h2 id="t-portal">Acessar pelo navegador (Web)</h2>
            <p className="publico">Para Cliente, Funcionário e Gerente</p>
            <ul>
              <li><strong>Cliente:</strong> abre chamados e acompanha o andamento.</li>
              <li><strong>Funcionário:</strong> vê a fila de chamados e altera a situação.</li>
              <li><strong>Gerente:</strong> tudo isso, mais contratos, indicadores e relatórios.</li>
            </ul>
            <Link to="/entrar" className="botao-link primario">Entrar pelo Web</Link>
          </section>

          <section className="cartao acesso" aria-labelledby="t-cliente">
            <h2 id="t-cliente">Acessar pelo aplicativo (Mobile)</h2>
            <p className="publico">Para Cliente, Funcionário e Gerente</p>
            <ol>
              <li>Entre com o e-mail e a senha do seu perfil.</li>
              <li>Cliente: escolha o contrato vigente e abra o chamado. Funcionário e Gerente: abra a fila e altere a situação.</li>
              <li>Acompanhe tudo na lista de chamados.</li>
            </ol>
            <p className="nota">Sem internet, o app mostra os dados guardados; o chamado do cliente é enviado quando a conexão voltar.</p>
            <p>O app roda no <strong>Expo Go</strong>: na pasta <code>mobile</code>, execute <code>npx expo start</code> e abra o aplicativo pelo código QR ou pelo emulador Android.</p>
          </section>
        </div>

        <section className="cartao demo" aria-labelledby="t-demo">
          <h2 id="t-demo">Credenciais de demonstração</h2>
          <p className="nota">Somente para testes locais da apresentação. Qualquer perfil funciona tanto no Web quanto no Mobile.</p>
          <div className="tabela-wrap">
            <table>
              <caption className="so-leitor">Credenciais de demonstração por perfil</caption>
              <thead><tr><th scope="col">Perfil</th><th scope="col">Onde usar</th><th scope="col">E-mail</th><th scope="col">Senha</th></tr></thead>
              <tbody>
                <tr><th scope="row">Cliente</th><td>Web e Mobile</td><td><code>c1@t.com</code></td><td><code>12345678</code></td></tr>
                <tr><th scope="row">Funcionário</th><td>Web e Mobile</td><td><code>{FUNCIONARIO_EMAIL}</code></td><td><code>{FUNCIONARIO_SENHA}</code></td></tr>
                {GERENTES_EQUIPE.map(email => (
                  <tr key={email}><th scope="row">Gerente</th><td>Web e Mobile</td><td><code>{email}</code></td><td><code>Gerente@123</code></td></tr>
                ))}
                <tr><th scope="row">Gerente</th><td>Web e Mobile</td><td><code>{GERENTE_EMAIL}</code></td><td><code>{GERENTE_SENHA}</code></td></tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  );
}
