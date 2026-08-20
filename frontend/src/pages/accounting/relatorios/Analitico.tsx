import { useEffect, useMemo, useState } from "react";
import { accountingApi } from "../../../api/accounting";
import { licensingApi } from "../../../api/licensing";
import type { ConciliacaoSintetico, ContaPlano, LancamentoAnalitico } from "../../../api/types";
import ExportBar from "../../../components/ui/ExportBar";
import type { ExportColumn } from "../../../utils/export";
import { formatCurrency, formatDate } from "../../../utils/format";

const MESES = ["", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const CONCILIACAO_COLUMNS: ExportColumn<ConciliacaoSintetico>[] = [
  { header: "CNPJ", value: (c) => c.cnpj },
  { header: "Razão social", value: (c) => c.razao_social },
  { header: "Período", value: (c) => `${MESES[c.mes]}/${c.ano}` },
  { header: "Status", value: (c) => c.status },
];

function descricaoConta(planoPorCodigo: Record<string, ContaPlano>, codigo: string | null): string {
  if (!codigo) return "";
  return planoPorCodigo[codigo]?.descricao ?? "";
}

export default function RelatorioAnalitico() {
  const [conciliacoes, setConciliacoes] = useState<ConciliacaoSintetico[]>([]);
  const [selected, setSelected] = useState<ConciliacaoSintetico | null>(null);
  const [lancamentos, setLancamentos] = useState<LancamentoAnalitico[]>([]);
  const [planoPorCodigo, setPlanoPorCodigo] = useState<Record<string, ContaPlano>>({});
  const [filtroConta, setFiltroConta] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    accountingApi
      .listConciliacoes()
      .then(setConciliacoes)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  function abrir(c: ConciliacaoSintetico) {
    setSelected(c);
    setLancamentos([]);
    setFiltroConta("");
    setPlanoPorCodigo({});
    accountingApi.listLancamentos(c.conciliacao_id).then(setLancamentos).catch((e) => setError(e.message));
    licensingApi
      .getPlanoContas(c.cliente_id)
      .then((plano) => setPlanoPorCodigo(Object.fromEntries(plano.contas.map((conta) => [conta.codigo, conta]))))
      .catch(() => setPlanoPorCodigo({}));
  }

  const contasDisponiveis = useMemo(
    () => Array.from(new Set(lancamentos.map((l) => l.conta_contabil).filter((c): c is string => !!c))).sort(),
    [lancamentos]
  );

  const lancamentosFiltrados = filtroConta
    ? lancamentos.filter((l) => l.conta_contabil === filtroConta)
    : lancamentos;

  const LANCAMENTO_COLUMNS: ExportColumn<LancamentoAnalitico>[] = [
    { header: "Data", value: (l) => formatDate(l.data_lancamento) },
    { header: "Conta contábil", value: (l) => l.conta_contabil ?? "" },
    { header: "Descrição da conta", value: (l) => descricaoConta(planoPorCodigo, l.conta_contabil) },
    { header: "Histórico", value: (l) => l.historico ?? "" },
    { header: "Débito", value: (l) => formatCurrency(l.valor_debito) },
    { header: "Crédito", value: (l) => formatCurrency(l.valor_credito) },
    { header: "Conciliado", value: (l) => (l.conciliado ? "Sim" : "Não") },
  ];

  return (
    <div>
      <div className="content-head">
        <div>
          <h1>Relatório Analítico</h1>
          <div className="desc">Escolha uma conciliação para ver os lançamentos detalhados.</div>
        </div>
      </div>

      {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}
      {loading && <p>Carregando...</p>}

      {!loading && !error && (
        <>
          <ExportBar
            filename="relatorio-analitico-conciliacoes"
            title="Relatório Analítico — Conciliações"
            columns={CONCILIACAO_COLUMNS}
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
                <th></th>
              </tr>
            </thead>
            <tbody>
              {conciliacoes.map((c) => (
                <tr
                  key={c.conciliacao_id}
                  className="row-clickable"
                  onClick={() => abrir(c)}
                >
                  <td className="mono">{c.cnpj}</td>
                  <td>{c.razao_social}</td>
                  <td>
                    {MESES[c.mes]}/{c.ano}
                  </td>
                  <td>{c.status}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <button className="btn btn-secondary" onClick={() => abrir(c)}>
                      Ver lançamentos
                    </button>
                  </td>
                </tr>
              ))}
              {conciliacoes.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty-state">
                    Nenhuma conciliação disponível.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </>
      )}

      {selected && (
        <section className="card" style={{ marginTop: "1.5rem" }}>
          <h2>
            Lançamentos — {selected.razao_social} ({MESES[selected.mes]}/{selected.ano})
          </h2>
          <ExportBar
            filename={`relatorio-analitico-lancamentos-${selected.cnpj}-${selected.mes}-${selected.ano}`}
            title={`Lançamentos — ${selected.razao_social} (${MESES[selected.mes]}/${selected.ano})`}
            columns={LANCAMENTO_COLUMNS}
            rows={lancamentosFiltrados}
          />

          {contasDisponiveis.length > 0 && (
            <div style={{ margin: "0.6rem 0" }}>
              <label style={{ fontSize: "0.85rem", marginRight: "0.5rem" }}>Filtrar por conta contábil:</label>
              <select value={filtroConta} onChange={(e) => setFiltroConta(e.target.value)}>
                <option value="">Todas as contas</option>
                {contasDisponiveis.map((codigo) => (
                  <option key={codigo} value={codigo}>
                    {codigo}
                    {descricaoConta(planoPorCodigo, codigo) ? ` — ${descricaoConta(planoPorCodigo, codigo)}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Conta contábil</th>
                <th>Descrição da conta</th>
                <th>Histórico</th>
                <th>Débito</th>
                <th>Crédito</th>
                <th>Conciliado</th>
              </tr>
            </thead>
            <tbody>
              {lancamentosFiltrados.map((l) => (
                <tr key={l.lancamento_id}>
                  <td>{formatDate(l.data_lancamento)}</td>
                  <td>{l.conta_contabil}</td>
                  <td>{descricaoConta(planoPorCodigo, l.conta_contabil)}</td>
                  <td>{l.historico}</td>
                  <td>{formatCurrency(l.valor_debito)}</td>
                  <td>{formatCurrency(l.valor_credito)}</td>
                  <td>{l.conciliado ? "Sim" : "Não"}</td>
                </tr>
              ))}
              {lancamentosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty-state">
                    Sem lançamentos.
                  </td>
                </tr>
              )}
            </tbody>
            {lancamentosFiltrados.length > 0 && (
              <tfoot>
                <tr style={{ fontWeight: 600 }}>
                  <td colSpan={4}>Total</td>
                  <td>{formatCurrency(lancamentosFiltrados.reduce((sum, l) => sum + (l.valor_debito ?? 0), 0))}</td>
                  <td>{formatCurrency(lancamentosFiltrados.reduce((sum, l) => sum + (l.valor_credito ?? 0), 0))}</td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </section>
      )}
    </div>
  );
}
