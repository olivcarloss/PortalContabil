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
          <div
            style={{ marginTop: "0.6rem", fontSize: "0.7rem", opacity: 0.55, textAlign: "center" }}
            title={__APP_BUILD_DATE__ ? `Build de ${__APP_BUILD_DATE__}` : undefined}
          >
            © {new Date().getFullYear()} PortalContabil.cloud · v{__APP_VERSION__}
          </div>
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
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="app-whatsapp-fab"
        aria-label="Falar no WhatsApp"
      >
        <WhatsAppIcon />
      </a>
    </div>
  );
}

const WHATSAPP_URL = "https://wa.me/5511988402174?text=" + encodeURIComponent("Olá! Preciso de ajuda com o PortalContabil.cloud.");

function WhatsAppIcon() {
  return (
    <svg width={26} height={26} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.2.2-.3.2-.5.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.1.2-.3.3-.4.1-.2 0-.3 0-.5C11 9 10.5 7.7 10.3 7.2c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.4s1 2.8 1.1 3c.1.2 2 3 4.8 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.7-.7 1.9-1.3.2-.7.2-1.2.2-1.3-.1-.1-.3-.2-.5-.3z" />
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Z" />
    </svg>
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
