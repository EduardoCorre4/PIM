import { Link } from 'react-router-dom';
import { Cloud, Headset, LogIn, MonitorSmartphone, ShieldCheck, Smartphone } from 'lucide-react';
import { BarraAcessibilidade } from '../components/Layout';
import { Logo } from '../components/Logo';
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
    <div className="pagina-publica">
      <a className="jk-pular" href="#inicio">Pular para o conteúdo</a>
      <div className="jk-cabecalho-ctn">
        <header className="jk-cabecalho">
          <a className="jk-cabecalho__logo" href="/" aria-label="JAKE Tecnologia — início"><Logo tipo="horizontal" /></a>
          <div className="cab-acess"><BarraAcessibilidade /></div>
          <Link to="/entrar" className="jk-btn jk-btn--primario"><LogIn className="jk-icone" aria-hidden="true" />Entrar</Link>
        </header>
      </div>

      <main id="inicio" tabIndex={-1} className="landing">
        <section className="heroi" aria-labelledby="titulo-inicio">
          <p className="heroi__sel">Goiânia · Grande Goiânia</p>
          <h1 id="titulo-inicio">Central de chamados e contratos da JAKE Tecnologia</h1>
          <p>Sistemas, suporte e segurança em nuvem em um só lugar. Escolha como deseja acessar.</p>
          <div className="heroi__tipos">
            <span className="jk-tipo"><Headset className="jk-icone" aria-hidden="true" />Suporte</span>
            <span className="jk-tipo jk-tipo--sistema"><MonitorSmartphone className="jk-icone" aria-hidden="true" />Sistema</span>
            <span className="jk-tipo jk-tipo--cloud"><Cloud className="jk-icone" aria-hidden="true" />Cloud Security</span>
          </div>
        </section>

        <div className="grade">
          <section className="jk-card acesso" aria-labelledby="t-portal">
            <ShieldCheck className="jk-icone acesso__icone" aria-hidden="true" />
            <h2 id="t-portal">Acessar pelo navegador (Web)</h2>
            <p className="publico">Para Cliente, Funcionário e Gerente</p>
            <ul>
              <li><strong>Cliente:</strong> abre chamados e acompanha o andamento.</li>
              <li><strong>Funcionário:</strong> vê a fila de chamados e altera a situação.</li>
              <li><strong>Gerente:</strong> tudo isso, mais contratos, indicadores e relatórios.</li>
            </ul>
            <Link to="/entrar" className="jk-btn jk-btn--primario acesso__acao">Entrar pelo Web</Link>
          </section>

          <section className="jk-card acesso" aria-labelledby="t-cliente">
            <Smartphone className="jk-icone acesso__icone" aria-hidden="true" />
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

        <section className="jk-card demo" aria-labelledby="t-demo">
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

      <div className="jk-rodape-ctn">
        <footer className="jk-rodape">
          <div className="jk-rodape__topo">
            <div className="jk-rodape__marca">
              <img src="/logo-horizontal-negativo.svg" alt="JAKE Tecnologia" />
              <p>Suporte, sistemas e segurança em nuvem para pequenas e médias empresas da Grande Goiânia.</p>
            </div>
            <div>
              <h2>Serviços</h2>
              <ul><li>Suporte técnico</li><li>Sistemas sob demanda</li><li>Cloud Security</li><li>Infraestrutura de redes</li></ul>
            </div>
            <div>
              <h2>Plataforma</h2>
              <ul>
                <li><Link to="/entrar">Abrir chamado</Link></li>
                <li><Link to="/entrar">Acompanhar chamados</Link></li>
                <li><Link to="/entrar">Meus contratos</Link></li>
                <li>Baixar o aplicativo</li>
              </ul>
            </div>
            <div>
              <h2>Atendimento</h2>
              <ul><li>Goiânia · GO</li><li>Seg. a sex., 8h às 18h</li><li>(62) 0000-0000</li><li>contato@jaketecnologia.com.br</li></ul>
            </div>
          </div>
          <div className="jk-rodape__base">
            <span>© 2026 JAKE Tecnologia. Todos os direitos reservados.</span>
            <ul><li>Privacidade</li><li>Termos de uso</li><li>Acessibilidade</li></ul>
          </div>
        </footer>
      </div>
    </div>
  );
}
