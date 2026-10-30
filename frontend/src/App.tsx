import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AccessibilityProvider } from './a11y/AccessibilityContext';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { AnnouncerProvider } from './components/Announcer';
import { Layout } from './components/Layout';
import { Landing } from './pages/Landing';
import { Chamados } from './pages/Chamados';
import { Contratos } from './pages/Contratos';
import { Login } from './pages/Login';
import { MeusChamados } from './pages/MeusChamados';
import { Painel } from './pages/Painel';
import { Relatorios } from './pages/Relatorios';
import { PERFIL_CLIENTE, PERFIL_GERENTE, paginaInicial } from './labels';

function Protegido() {
  const { autenticado } = useAuth();
  return autenticado ? <Layout /> : <Navigate to="/entrar" replace />;
}

/** Restringe rotas a um perfil; quem não tem acesso volta à sua página inicial. */
function SoGerente() {
  const { perfil } = useAuth();
  return perfil === PERFIL_GERENTE ? <Outlet /> : <Navigate to={paginaInicial(perfil)} replace />;
}

/** Cliente acompanha e abre os próprios chamados; Funcionário/Gerente atendem a fila. */
function ChamadosPorPerfil() {
  const { perfil } = useAuth();
  return perfil === PERFIL_CLIENTE ? <MeusChamados /> : <Chamados />;
}

export default function App() {
  return (
    <AccessibilityProvider>
      <AnnouncerProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/entrar" element={<Login />} />
              <Route path="/login" element={<Navigate to="/entrar" replace />} />
              <Route element={<Protegido />}>
                <Route path="chamados" element={<ChamadosPorPerfil />} />
                <Route element={<SoGerente />}>
                  <Route path="painel" element={<Painel />} />
                  <Route path="contratos" element={<Contratos />} />
                  <Route path="relatorios" element={<Relatorios />} />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </AnnouncerProvider>
    </AccessibilityProvider>
  );
}
