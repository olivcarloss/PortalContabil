import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import {
  MENU_ADMIN_VISAO_GERAL,
  MENU_LICENCIAMENTO_ESCRITORIOS,
  MENU_LICENCIAMENTO_PERFIS,
  MENU_LICENCIAMENTO_PRODUTOS,
  MENU_LICENCIAMENTO_USUARIOS,
  MENU_LICENCIAMENTO_VISAO_GERAL,
  MENU_PORTAL_CONTABIL,
  MENU_RELATORIO_ANALITICO,
  MENU_RELATORIO_CLIENTES,
  MENU_RELATORIO_ESCRITORIOS,
  MENU_RELATORIO_MODULOS,
  MENU_RELATORIO_PRODUTOS,
  MENU_RELATORIO_SINTETICO,
  MENU_RELATORIO_TABELA_PRECOS,
} from "../auth/menus";

const LICENSING_LINKS = [
  { to: "/licenciamento", label: "Visão geral", end: true, menu: MENU_LICENCIAMENTO_VISAO_GERAL },
  { to: "/licenciamento/produtos", label: "Produtos", menu: MENU_LICENCIAMENTO_PRODUTOS },
  { to: "/licenciamento/clientes", label: "Escritórios (clientes)", menu: MENU_LICENCIAMENTO_ESCRITORIOS },
  { to: "/licenciamento/usuarios", label: "Usuários", menu: MENU_LICENCIAMENTO_USUARIOS },
  { to: "/licenciamento/perfis", label: "Perfis de acesso", menu: MENU_LICENCIAMENTO_PERFIS },
];

const REPORT_LINKS = [
  { to: "/contabil/relatorios/sintetico", label: "Sintético", menu: MENU_RELATORIO_SINTETICO },
  { to: "/contabil/relatorios/analitico", label: "Analítico", menu: MENU_RELATORIO_ANALITICO },
  { to: "/contabil/relatorios/escritorios", label: "Escritórios", menu: MENU_RELATORIO_ESCRITORIOS },
  { to: "/contabil/relatorios/clientes", label: "Clientes", menu: MENU_RELATORIO_CLIENTES },
  { to: "/contabil/relatorios/produtos", label: "Produtos", menu: MENU_RELATORIO_PRODUTOS },
  { to: "/contabil/relatorios/modulos", label: "Módulos", menu: MENU_RELATORIO_MODULOS },
  { to: "/contabil/relatorios/tabela-precos", label: "Tabela de Preços", menu: MENU_RELATORIO_TABELA_PRECOS },
];

export default function Shell() {
  const { session, signOut, hasMenu } = useAuth();
  const location = useLocation();
  const [licensingOpen, setLicensingOpen] = useState(location.pathname.startsWith("/licenciamento"));
  const [reportsOpen, setReportsOpen] = useState(location.pathname.startsWith("/contabil/relatorios"));
  const [mobileOpen, setMobileOpen] = useState(false);

  // Fecha o menu retrátil ao trocar de tela (celular).
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const visibleLicensingLinks = LICENSING_LINKS.filter((l) => hasMenu(l.menu));
  const visibleReportLinks = REPORT_LINKS.filter((l) => hasMenu(l.menu));

  return (
    <div className="app-shell">
      {mobileOpen && <div className="app-sidebar-backdrop" onClick={() => setMobileOpen(false)} />}
      <aside className={`app-sidebar${mobileOpen ? " open" : ""}`}>
        <Link
          to="/"
          style={{
            background: "white",
            borderRadius: "var(--radius-md)",
            padding: "0.35rem 0.4rem",
            marginBottom: "2rem",
            display: "flex",
            alignItems: "center",
          }}
        >
          <img
            src="/portal-contabil-logo.svg"
            alt="PortalContabil.cloud"
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </Link>
        <nav style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          {hasMenu(MENU_ADMIN_VISAO_GERAL) && (
            <SidebarLink to="/visao-geral" label="One Page de Produtos" />
          )}

          {visibleLicensingLinks.length > 0 && (
            <>
              <button
                onClick={() => setLicensingOpen((v) => !v)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.6rem 0.8rem",
                  borderRadius: "var(--radius-sm)",
                  color: "white",
                  background: "transparent",
                  border: "none",
                  font: "inherit",
                  fontSize: "0.95rem",
                  textAlign: "left",
                }}
              >
                Portal de Licenciamento
                <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>{licensingOpen ? "▾" : "▸"}</span>
              </button>
              {licensingOpen && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.15rem",
                    marginLeft: "0.75rem",
                    paddingLeft: "0.75rem",
                    borderLeft: "1px solid rgba(255,255,255,0.15)",
                  }}
                >
                  {visibleLicensingLinks.map((l) => (
                    <SidebarLink key={l.to} to={l.to} label={l.label} end={l.end} compact />
                  ))}
                </div>
              )}
            </>
          )}

          {hasMenu(MENU_PORTAL_CONTABIL) && <SidebarLink to="/contabil" label="Portal Contábil" />}

          {visibleReportLinks.length > 0 && (
            <>
              <button
                onClick={() => setReportsOpen((v) => !v)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.6rem 0.8rem",
                  borderRadius: "var(--radius-sm)",
                  color: "white",
                  background: "transparent",
                  border: "none",
                  font: "inherit",
                  fontSize: "0.95rem",
                  textAlign: "left",
                }}
              >
                Relatórios
                <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>{reportsOpen ? "▾" : "▸"}</span>
              </button>
              {reportsOpen && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.15rem",
                    marginLeft: "0.75rem",
                    paddingLeft: "0.75rem",
                    borderLeft: "1px solid rgba(255,255,255,0.15)",
                  }}
                >
                  {visibleReportLinks.map((l) => (
                    <SidebarLink key={l.to} to={l.to} label={l.label} compact />
                  ))}
                </div>
              )}
            </>
          )}
        </nav>
        <div style={{ marginTop: "auto", fontSize: "0.85rem", opacity: 0.85 }}>
          <div style={{ marginBottom: "0.5rem", wordBreak: "break-word" }}>{session?.user.email}</div>
          <button
            onClick={() => signOut()}
            className="btn btn-secondary btn-sidebar"
            style={{ width: "100%" }}
          >
            Sair
          </button>
        </div>
      </aside>
      <main className="app-main">
        <div className="app-main-inner">
          <button
            className="app-sidebar-toggle"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Abrir menu"
          >
            ☰
          </button>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function SidebarLink({
  to,
  label,
  end,
  compact,
}: {
  to: string;
  label: string;
  end?: boolean;
  compact?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      style={({ isActive }) => ({
        padding: compact ? "0.45rem 0.7rem" : "0.6rem 0.8rem",
        fontSize: compact ? "0.85rem" : "0.95rem",
        borderRadius: "var(--radius-sm)",
        color: "white",
        textDecoration: "none",
        background: isActive ? "rgba(255,255,255,0.12)" : "transparent",
        fontWeight: isActive ? 600 : 400,
      })}
    >
      {label}
    </NavLink>
  );
}
