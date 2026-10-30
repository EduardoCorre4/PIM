import { useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
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
      <button type="button" onClick={a.alternarContraste} aria-pressed={a.altoContraste}>
        Alto contraste: {a.altoContraste ? 'ligado' : 'desligado'}
      </button>
    </div>
  );
}

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
    <>
      <a className="pular" href="#conteudo" onClick={e => { e.preventDefault(); main.current?.focus(); }}>
        Ir para o conteúdo principal
      </a>
      <header className="topo">
        <p className="marca">JAKE Tecnologia</p>
        <BarraAcessibilidade />
        <p className="usuario">Olá, {nome} ({NOME_PERFIL[perfil ?? 0]})</p>
        <button type="button" onClick={sair}>Sair</button>
      </header>
      <nav aria-label="Menu principal" className="menu">
        <ul>
          {gerente && <li><NavLink to="/painel" end>Resumo</NavLink></li>}
          {gerente && <li><NavLink to="/contratos">Contratos</NavLink></li>}
          <li><NavLink to="/chamados">{perfil === PERFIL_CLIENTE ? 'Meus chamados' : 'Chamados'}</NavLink></li>
          {gerente && <li><NavLink to="/relatorios">Relatórios</NavLink></li>}
        </ul>
      </nav>
      <main id="conteudo" ref={main} tabIndex={-1}>
        <Outlet />
      </main>
    </>
  );
}
