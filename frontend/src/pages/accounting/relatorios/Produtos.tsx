import { useEffect, useState } from "react";
import { licensingApi } from "../../../api/licensing";
import type { Cliente, Licenca, Produto } from "../../../api/types";
import ExportBar from "../../../components/ui/ExportBar";
import type { ExportColumn } from "../../../utils/export";
import { formatCurrency, formatDate } from "../../../utils/format";

export default function RelatorioProdutos() {
  const [licencas, setLicencas] = useState<Licenca[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([licensingApi.listLicencas(), licensingApi.listProdutos(), licensingApi.listClientes()])
      .then(([l, p, c]) => {
        setLicencas(l);
        setProdutos(p);
        setClientes(c);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const columns: ExportColumn<Licenca>[] = [
    { header: "Produto", value: (l) => produtos.find((p) => p.id === l.produto_id)?.nome ?? "" },
    { header: "Escritório", value: (l) => clientes.find((c) => c.id === l.cliente_id)?.nome ?? "" },
    { header: "Periodicidade", value: (l) => l.periodicidade },
    { header: "Início", value: (l) => formatDate(l.data_inicio) },
    { header: "Fim", value: (l) => formatDate(l.data_fim) },
    { header: "Valor", value: (l) => formatCurrency(l.valor_total) },
    { header: "Status", value: (l) => l.status },
  ];

  return (
    <div>
      <div className="content-head">
        <div>
          <h1>Relatório de Produtos</h1>
          <div className="desc">Licenças contratadas pelos escritórios que você alcança.</div>
        </div>
      </div>

      {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}
      {loading && <p>Carregando...</p>}

      {!loading && !error && (
        <>
        <ExportBar filename="relatorio-produtos" title="Relatório de Produtos" columns={columns} rows={licencas} />
        <div className="card" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Escritório</th>
                <th>Periodicidade</th>
                <th>Vigência</th>
                <th>Valor</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {licencas.map((l) => (
                <tr key={l.id}>
                  <td style={{ fontWeight: 600 }}>
                    {produtos.find((p) => p.id === l.produto_id)?.nome ?? "—"}
                  </td>
                  <td>{clientes.find((c) => c.id === l.cliente_id)?.nome ?? "—"}</td>
                  <td>{l.periodicidade}</td>
                  <td>
                    {formatDate(l.data_inicio)}
                    {l.data_fim ? ` – ${formatDate(l.data_fim)}` : ""}
                  </td>
                  <td>{formatCurrency(l.valor_total)}</td>
                  <td>
                    <span
                      className={`badge badge-${l.status === "ativa" ? "ativa" : l.status === "suspensa" ? "suspensa" : "cancelada"}`}
                    >
                      {l.status}
                    </span>
                  </td>
                </tr>
              ))}
              {licencas.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-state">
                    Nenhuma licença disponível.
                  </td>
                </tr>
              )}
            </tbody>
            {licencas.length > 0 && (
              <tfoot>
                <tr style={{ fontWeight: 600 }}>
                  <td colSpan={3}>Total</td>
                  <td></td>
                  <td>{formatCurrency(licencas.reduce((sum, l) => sum + l.valor_total, 0))}</td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        </>
      )}
    </div>
  );
}
