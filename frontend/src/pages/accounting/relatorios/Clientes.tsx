import { useEffect, useState } from "react";
import { licensingApi } from "../../../api/licensing";
import type { Cliente, Cnpj } from "../../../api/types";
import ExportBar from "../../../components/ui/ExportBar";
import type { ExportColumn } from "../../../utils/export";

export default function RelatorioClientes() {
  const [cnpjs, setCnpjs] = useState<Cnpj[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([licensingApi.listCnpjsTodos(), licensingApi.listClientes()])
      .then(([c, cl]) => {
        setCnpjs(c);
        setClientes(cl);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const columns: ExportColumn<Cnpj>[] = [
    { header: "CNPJ", value: (c) => c.cnpj },
    { header: "Razão social", value: (c) => c.razao_social },
    { header: "Escritório", value: (c) => clientes.find((cl) => cl.id === c.cliente_id)?.nome ?? "" },
    { header: "Status", value: (c) => (c.ativo ? "Ativo" : "Inativo") },
  ];

  return (
    <div>
      <div className="content-head">
        <div>
          <h1>Relatório de Clientes</h1>
          <div className="desc">CNPJs (empresas) atendidas pelos escritórios que você alcança.</div>
        </div>
      </div>

      {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}
      {loading && <p>Carregando...</p>}

      {!loading && !error && (
        <>
          <ExportBar filename="relatorio-clientes" title="Relatório de Clientes" columns={columns} rows={cnpjs} />
          <div className="card" style={{ padding: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>CNPJ</th>
                  <th>Razão social</th>
                  <th>Escritório</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {cnpjs.map((c) => (
                  <tr key={c.id}>
                    <td className="mono">{c.cnpj}</td>
                    <td>{c.razao_social}</td>
                    <td>{clientes.find((cl) => cl.id === c.cliente_id)?.nome ?? "—"}</td>
                    <td>
                      <span className={`badge badge-${c.ativo ? "ativa" : "cancelada"}`}>
                        {c.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                  </tr>
                ))}
                {cnpjs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="empty-state">
                      Nenhum CNPJ disponível.
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
