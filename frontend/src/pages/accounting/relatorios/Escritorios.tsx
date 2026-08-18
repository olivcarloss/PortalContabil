import { useEffect, useState } from "react";
import { licensingApi } from "../../../api/licensing";
import type { Cliente } from "../../../api/types";
import ExportBar from "../../../components/ui/ExportBar";
import type { ExportColumn } from "../../../utils/export";

const COLUMNS: ExportColumn<Cliente>[] = [
  { header: "Escritório", value: (c) => c.nome },
  { header: "E-mail de contato", value: (c) => c.email_contato ?? "" },
  { header: "Status", value: (c) => (c.ativo ? "Ativo" : "Inativo") },
];

export default function RelatorioEscritorios() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    licensingApi
      .listClientes()
      .then(setClientes)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="content-head">
        <div>
          <h1>Relatório de Escritórios</h1>
          <div className="desc">Escritórios que você alcança.</div>
        </div>
      </div>

      {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}
      {loading && <p>Carregando...</p>}

      {!loading && !error && (
        <>
          <ExportBar
            filename="relatorio-escritorios"
            title="Relatório de Escritórios"
            columns={COLUMNS}
            rows={clientes}
          />
          <div className="card" style={{ padding: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Escritório</th>
                  <th>E-mail de contato</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.nome}</td>
                    <td>{c.email_contato ?? "—"}</td>
                    <td>
                      <span className={`badge badge-${c.ativo ? "ativa" : "cancelada"}`}>
                        {c.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                  </tr>
                ))}
                {clientes.length === 0 && (
                  <tr>
                    <td colSpan={3} className="empty-state">
                      Nenhum escritório disponível.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
