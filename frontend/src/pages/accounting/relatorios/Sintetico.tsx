import { useEffect, useState } from "react";
import { accountingApi } from "../../../api/accounting";
import type { ConciliacaoSintetico } from "../../../api/types";
import ExportBar from "../../../components/ui/ExportBar";
import type { ExportColumn } from "../../../utils/export";
import { formatCurrency } from "../../../utils/format";

const MESES = ["", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const COLUMNS: ExportColumn<ConciliacaoSintetico>[] = [
  { header: "CNPJ", value: (c) => c.cnpj },
  { header: "Razão social", value: (c) => c.razao_social },
  { header: "Período", value: (c) => `${MESES[c.mes]}/${c.ano}` },
  { header: "Status", value: (c) => c.status },
  { header: "Saldo final", value: (c) => formatCurrency(c.saldo_final) },
  { header: "Lançamentos", value: (c) => c.qtd_lancamentos ?? 0 },
];

export default function RelatorioSintetico() {
  const [conciliacoes, setConciliacoes] = useState<ConciliacaoSintetico[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    accountingApi
      .listConciliacoes()
      .then(setConciliacoes)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="content-head">
        <div>
          <h1>Relatório Sintético</h1>
          <div className="desc">Resumo das conciliações dos CNPJs liberados para o seu usuário.</div>
        </div>
      </div>

      {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}
      {loading && <p>Carregando...</p>}

      {!loading && !error && (
        <>
          <ExportBar
            filename="relatorio-sintetico"
            title="Relatório Sintético"
            columns={COLUMNS}
            rows={conciliacoes}
          />
          <div className="card" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>CNPJ</th>
                <th>Razão social</th>
                <th>Período</th>
                <th>Status</th>
                <th>Saldo final</th>
                <th>Lançamentos</th>
              </tr>
            </thead>
            <tbody>
              {conciliacoes.map((c) => (
                <tr key={c.conciliacao_id}>
                  <td className="mono">{c.cnpj}</td>
                  <td>{c.razao_social}</td>
                  <td>
                    {MESES[c.mes]}/{c.ano}
                  </td>
                  <td>
                    <span className={`badge badge-${c.status === "ativa" ? "ativa" : "cancelada"}`}>{c.status}</span>
                  </td>
                  <td>{formatCurrency(c.saldo_final)}</td>
                  <td>{c.qtd_lancamentos ?? "—"}</td>
                </tr>
              ))}
              {conciliacoes.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-state">
                    Nenhuma conciliação disponível.
                  </td>
                </tr>
              )}
            </tbody>
            {conciliacoes.length > 0 && (
              <tfoot>
                <tr style={{ fontWeight: 600 }}>
                  <td colSpan={4}>Total</td>
                  <td>{formatCurrency(conciliacoes.reduce((sum, c) => sum + (c.saldo_final ?? 0), 0))}</td>
                  <td>{conciliacoes.reduce((sum, c) => sum + (c.qtd_lancamentos ?? 0), 0)}</td>
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
