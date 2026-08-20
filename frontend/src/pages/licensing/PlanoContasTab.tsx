import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PlanoContasPanel from "../../components/ui/PlanoContasPanel";
import { licensingApi } from "../../api/licensing";
import type { Cliente, PlanoContas } from "../../api/types";
import { useAuth } from "../../auth/AuthProvider";
import { MENU_RELATORIO_PLANO_CONTAS } from "../../auth/menus";

const ORIGEM_LABEL: Record<string, string> = {
  proprio: "Plano próprio",
  padrao: "Usando o padrão",
  nenhum: "Nenhum plano",
};

const ORIGEM_BADGE: Record<string, string> = {
  proprio: "ativa",
  padrao: "suspensa",
  nenhum: "cancelada",
};

export default function PlanoContasTab() {
  const { isAdmin, hasMenu } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [statusByCliente, setStatusByCliente] = useState<Record<string, PlanoContas>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  function refresh() {
    licensingApi
      .listClientes()
      .then(async (cs) => {
        setClientes(cs);
        const entries = await Promise.all(
          cs.map(async (c) => [c.id, await licensingApi.getPlanoContas(c.id)] as const)
        );
        setStatusByCliente(Object.fromEntries(entries));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  const selected = clientes.find((c) => c.id === selectedId);

  return (
    <div>
      <div className="content-head">
        <div>
          <h1>Plano de Contas</h1>
          <div className="desc">
            Plano de contas padrão da plataforma e o plano próprio de cada escritório. Um escritório sem
            plano próprio usa automaticamente o padrão nas contabilizações.
          </div>
        </div>
        {hasMenu(MENU_RELATORIO_PLANO_CONTAS) && (
          <Link to="/contabil/relatorios/plano-contas" className="btn btn-secondary">
            Ver relatório / exportar
          </Link>
        )}
      </div>

      {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}

      {isAdmin && (
        <div className="card">
          <PlanoContasPanel titulo="Plano de Contas Padrão (usado por escritórios sem plano próprio)" />
        </div>
      )}

      {loading && <p>Carregando...</p>}

      {!loading && (
        <div className="card" style={{ padding: 0, marginTop: "1.5rem" }}>
          <table>
            <thead>
              <tr>
                <th>Escritório</th>
                <th>Plano de contas</th>
                <th>Contas</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => {
                const status = statusByCliente[c.id];
                return (
                  <tr key={c.id} className="row-clickable" onClick={() => setSelectedId(c.id)}>
                    <td style={{ fontWeight: 600 }}>{c.nome}</td>
                    <td>
                      {status && (
                        <span className={`badge badge-${ORIGEM_BADGE[status.origem]}`}>
                          {ORIGEM_LABEL[status.origem]}
                        </span>
                      )}
                    </td>
                    <td>{status?.total_contas ?? "…"}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <button className="btn btn-secondary" onClick={() => setSelectedId(c.id)}>
                        Gerenciar
                      </button>
                    </td>
                  </tr>
                );
              })}
              {clientes.length === 0 && (
                <tr>
                  <td colSpan={4} className="empty-state">
                    Nenhum escritório cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="card" style={{ marginTop: "1.5rem" }}>
          <div className="panel-head">
            <h3>{selected.nome}</h3>
            <button className="icon-btn" onClick={() => setSelectedId(null)}>
              ×
            </button>
          </div>
          <PlanoContasPanel
            clienteId={selected.id}
            titulo="Plano de contas deste escritório"
            onChange={refresh}
          />
        </div>
      )}
    </div>
  );
}
