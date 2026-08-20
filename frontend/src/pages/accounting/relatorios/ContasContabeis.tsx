import { useEffect, useState } from "react";
import { accountingApi } from "../../../api/accounting";
import type { ContaContabilResumo } from "../../../api/types";
import ExportBar from "../../../components/ui/ExportBar";
import type { ExportColumn } from "../../../utils/export";
import { formatCurrency } from "../../../utils/format";

const TIPO_LABEL: Record<string, string> = {
  ativo: "Ativo",
  passivo: "Passivo",
  receita: "Receita",
  custo: "Custo",
  despesa: "Despesa",
  patrimonio_liquido: "Patrimônio Líquido",
};

const COLUMNS: ExportColumn<ContaContabilResumo>[] = [
  { header: "Escritório", value: (c) => c.cliente_nome },
  { header: "CNPJ", value: (c) => c.cnpj },
  { header: "Razão social", value: (c) => c.razao_social },
  { header: "Conta contábil", value: (c) => c.codigo },
  { header: "Descrição", value: (c) => c.descricao ?? "" },
  { header: "Tipo", value: (c) => (c.tipo ? TIPO_LABEL[c.tipo] ?? c.tipo : "") },
  { header: "Total débito", value: (c) => formatCurrency(c.total_debito) },
  { header: "Total crédito", value: (c) => formatCurrency(c.total_credito) },
  { header: "Saldo", value: (c) => formatCurrency(c.saldo) },
  { header: "Qtd. lançamentos", value: (c) => String(c.qtd_lancamentos) },
];

export default function RelatorioContasContabeis() {
  const [linhas, setLinhas] = useState<ContaContabilResumo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtroConta, setFiltroConta] = useState("");

  useEffect(() => {
    accountingApi
      .listContasContabeis()
      .then(setLinhas)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const contasDisponiveis = Array.from(new Set(linhas.map((l) => l.codigo))).sort();
  const linhasFiltradas = filtroConta ? linhas.filter((l) => l.codigo === filtroConta) : linhas;

  return (
    <div>
      <div className="content-head">
        <div>
          <h1>Contas Contábeis</h1>
          <div className="desc">
            Total de débito, crédito e saldo por conta contábil, somado a partir dos lançamentos reais de
            cada CNPJ — com a descrição e o tipo vindos do plano de contas, quando disponíveis.
          </div>
        </div>
      </div>

      {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}
      {loading && <p>Carregando...</p>}

      {!loading && !error && (
        <>
          <ExportBar
            filename="relatorio-contas-contabeis"
            title="Contas Contábeis"
            columns={COLUMNS}
            rows={linhasFiltradas}
          />

          {contasDisponiveis.length > 0 && (
            <div style={{ margin: "0.6rem 0" }}>
              <label style={{ fontSize: "0.85rem", marginRight: "0.5rem" }}>Filtrar por conta contábil:</label>
              <select value={filtroConta} onChange={(e) => setFiltroConta(e.target.value)}>
                <option value="">Todas as contas</option>
                {contasDisponiveis.map((codigo) => (
                  <option key={codigo} value={codigo}>
                    {codigo}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="card" style={{ padding: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Escritório</th>
                  <th>CNPJ</th>
                  <th>Conta contábil</th>
                  <th>Descrição</th>
                  <th>Tipo</th>
                  <th>Débito</th>
                  <th>Crédito</th>
                  <th>Saldo</th>
                  <th>Qtd.</th>
                </tr>
              </thead>
              <tbody>
                {linhasFiltradas.map((c) => (
                  <tr key={`${c.cnpj_id}-${c.codigo}`}>
                    <td>{c.cliente_nome}</td>
                    <td className="mono">{c.cnpj}</td>
                    <td className="mono">{c.codigo}</td>
                    <td>{c.descricao ?? "—"}</td>
                    <td>{c.tipo ? TIPO_LABEL[c.tipo] ?? c.tipo : "—"}</td>
                    <td>{formatCurrency(c.total_debito)}</td>
                    <td>{formatCurrency(c.total_credito)}</td>
                    <td>{formatCurrency(c.saldo)}</td>
                    <td>{c.qtd_lancamentos}</td>
                  </tr>
                ))}
                {linhasFiltradas.length === 0 && (
                  <tr>
                    <td colSpan={9} className="empty-state">
                      Nenhum lançamento com conta contábil preenchida ainda.
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
