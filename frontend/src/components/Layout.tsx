import { useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { BarChart3, FileText, LayoutDashboard, LifeBuoy, LogOut, Moon, Sun, Contrast } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { PERFIL_CLIENTE, PERFIL_GERENTE, NOME_PERFIL } from '../labels';
import { TAMANHOS, useAccessibility } from '../a11y/AccessibilityContext';

export function BarraAcessibilidade() {
  const a = useAccessibility();
  return (
    <div className="barra-acess" role="group" aria-label="Ajustes de leitura">
      <button type="button" onClick={a.diminuir} disabled={a.tamanho === TAMANHOS[0]} aria-label="Diminuir letra">A−</button>
      <button type="button" onClick={a.restaurar} aria-label="Tamanho normal da letra">A</button>
      <button type="button" onClick={a.aumentar} disabled={a.tamanho === TAMANHOS[TAMANHOS.length - 1]} aria-label="Aumentar letra">A+</button>
      <button type="button" onClick={a.alternarTema} aria-pressed={a.escuro} disabled={a.altoContraste}>
        {a.escuro ? <Moon className="jk-icone" aria-hidden="true" /> : <Sun className="jk-icone" aria-hidden="true" />}
        Tema escuro: {a.escuro ? 'ligado' : 'desligado'}
      </button>
      <button type="button" onClick={a.alternarContraste} aria-pressed={a.altoContraste}>
        <Contrast className="jk-icone" aria-hidden="true" />
        Alto contraste: {a.altoContraste ? 'ligado' : 'desligado'}
      </button>
    </div>
  );
}

/** Rodapé compacto das telas internas. */
export function RodapeApp() {
  return (
    <footer className="jk-rodape-app">
      <span>© 2026 JAKE Tecnologia · v1.0.0</span>
      <span>Seu chamado, resolvido.</span>
    </footer>
  );
}

const iniciais = (nome: string | null) =>
  (nome ?? '?').trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('') || '?';

export function Layout() {
  const { nome, perfil, sair } = useAuth();
  const gerente = perfil === PERFIL_GERENTE;
  const { pathname } = useLocation();
  const main = useRef<HTMLElement>(null);

  // Ao trocar de página, leva o foco ao conteúdo para que o leitor de tela comece a ler dali.
  // No primeiro carregamento o foco fica no início da página (link "pular" e ajustes de leitura).
  const primeira = useRef(true);
  useEffect(() => {
    if (primeira.current) { primeira.current = false; return; }
    main.current?.focus();
  }, [pathname]);

  return (
    <div className="app">
      <a className="jk-pular" href="#conteudo" onClick={e => { e.preventDefault(); main.current?.focus(); }}>
        Pular para o conteúdo
      </a>
      <aside className="jk-menu">
        <img src="/logo-horizontal-negativo.svg" alt="JAKE Tecnologia" className="jk-menu__logo" />
        <nav aria-label="Menu principal">
          <ul>
            {gerente && <li><NavLink to="/painel" end><LayoutDashboard className="jk-icone" aria-hidden="true" />Resumo</NavLink></li>}
            <li><NavLink to="/chamados"><LifeBuoy className="jk-icone" aria-hidden="true" />{perfil === PERFIL_CLIENTE ? 'Meus chamados' : 'Chamados'}</NavLink></li>
            {gerente && <li><NavLink to="/contratos"><FileText className="jk-icone" aria-hidden="true" />Contratos</NavLink></li>}
            {gerente && <li><NavLink to="/relatorios"><BarChart3 className="jk-icone" aria-hidden="true" />Relatórios</NavLink></li>}
          </ul>
        </nav>
        <div className="jk-menu__perfil">
          <span className="jk-avatar" aria-hidden="true">{iniciais(nome)}</span>
          <span className="usuario"><strong>{nome}</strong>{NOME_PERFIL[perfil ?? 0]}</span>
        </div>
      </aside>
      <div className="app-col">
        <header className="app-topo">
          <BarraAcessibilidade />
          <button type="button" onClick={sair}><LogOut className="jk-icone" aria-hidden="true" />Sair</button>
        </header>
        <main id="conteudo" ref={main} tabIndex={-1}>
          <Outlet />
        </main>
        <RodapeApp />
      </div>
    </div>
  );
}
