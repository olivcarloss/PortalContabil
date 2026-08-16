import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

const LICENSING_LINKS = [
  { to: "/licenciamento", label: "Visão geral", end: true },
  { to: "/licenciamento/produtos", label: "Produtos" },
  { to: "/licenciamento/clientes", label: "Escritórios (clientes)" },
  { to: "/licenciamento/usuarios", label: "Usuários" },
  { to: "/licenciamento/perfis", label: "Perfis de acesso" },
];

export default function Shell() {
  const { session, signOut, isAdmin } = useAuth();
  const location = useLocation();
  const [licensingOpen, setLicensingOpen] = useState(location.pathname.startsWith("/licenciamento"));

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside
        style={{
          width: 240,
          background: "var(--color-primary)",
          color: "white",
          padding: "1.5rem 1.25rem",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: "var(--radius-md)",
            padding: "0.6rem 0.8rem",
            marginBottom: "2rem",
            display: "flex",
            alignItems: "center",
          }}
        >
          <img src="/ia-cloude-logo.png" alt="IA-Cloude" style={{ width: "100%", height: "auto", display: "block" }} />
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          {isAdmin && <SidebarLink to="/visao-geral" label="One Page de Produtos" />}

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
              {LICENSING_LINKS.map((l) => (
                <SidebarLink key={l.to} to={l.to} label={l.label} end={l.end} compact />
              ))}
            </div>
          )}

          <SidebarLink to="/contabil" label="Portal Contábil" />
        </nav>
        <div style={{ marginTop: "auto", fontSize: "0.85rem", opacity: 0.85 }}>
          <div style={{ marginBottom: "0.5rem" }}>{session?.user.email}</div>
          <button
            onClick={() => signOut()}
            className="btn btn-secondary"
            style={{ color: "white", borderColor: "rgba(255,255,255,0.3)", width: "100%" }}
          >
            Sair
          </button>
        </div>
      </aside>
      <main style={{ flex: 1, padding: "2rem", background: "var(--color-bg)" }}>
        <Outlet />
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
