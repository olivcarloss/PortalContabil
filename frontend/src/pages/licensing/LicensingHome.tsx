import { useState } from "react";
import OverviewTab from "./OverviewTab";
import ProdutosTab from "./ProdutosTab";
import ClientesTab from "./ClientesTab";
import UsuariosTab from "./UsuariosTab";
import PerfisTab from "./PerfisTab";

const TABS = [
  { id: "overview", label: "Visão geral" },
  { id: "produtos", label: "Produtos" },
  { id: "clientes", label: "Escritórios (clientes)" },
  { id: "usuarios", label: "Usuários" },
  { id: "perfis", label: "Perfis de acesso" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function LicensingHome() {
  const [tab, setTab] = useState<TabId>("overview");

  return (
    <div>
      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab-btn ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab />}
      {tab === "produtos" && <ProdutosTab />}
      {tab === "clientes" && <ClientesTab />}
      {tab === "usuarios" && <UsuariosTab />}
      {tab === "perfis" && <PerfisTab />}
    </div>
  );
}
