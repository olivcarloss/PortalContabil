import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export default function Shell() {
  const { session, signOut, isAdmin } = useAuth();

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
        <nav style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {isAdmin && <SidebarLink to="/visao-geral" label="One Page de Produtos" />}
          {isAdmin && <SidebarLink to="/conciliacao" label="Conciliação" />}
          <SidebarLink to="/licenciamento" label="Portal de Licenciamento" />
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

function SidebarLink({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        padding: "0.6rem 0.8rem",
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
