import { useEffect, useMemo, useState, type ReactNode } from "react";
import { accountingApi } from "../../api/accounting";
import type { ConciliacaoSintetico, LancamentoAnalitico, MeuProdutoLicenciado } from "../../api/types";
import StatCard from "../../components/ui/StatCard";
import StatusChart from "../../components/charts/StatusChart";

const MESES = [
  "", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

const STATUS_LABEL: Record<string, string> = {
  ativa: "Ativa",
  suspensa: "Suspensa",
  cancelada: "Cancelada",
};

export default function AccountingHome() {
  const [meusProdutos, setMeusProdutos] = useState<MeuProdutoLicenciado[]>([]);
  const [conciliacoes, setConciliacoes] = useState<ConciliacaoSintetico[]>([]);
  const [selected, setSelected] = useState<ConciliacaoSintetico | null>(null);
  const [lancamentos, setLancamentos] = useState<LancamentoAnalitico[]>([]);
  const [modulos, setModulos] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [filtroProduto, setFiltroProduto] = useState("");
  const [filtroCnpj, setFiltroCnpj] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroPeriodo, setFiltroPeriodo] = useState("");

  const temSintetico = modulos.includes("RELATORIO_SINTETICO");
  const temAnalitico = modulos.includes("RELATORIO_ANALITICO");

  useEffect(() => {
    Promise.all([
      accountingApi.listConciliacoes().catch(() => [] as ConciliacaoSintetico[]),
      accountingApi.listMeusModulos(),
      accountingApi.listMeusProdutos(),
    ])
      .then(([c, m, p]) => {
        setConciliacoes(c);
        setModulos(m);
        setMeusProdutos(p);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  function openConciliacao(c: ConciliacaoSintetico) {
    setSelected(c);
    accountingApi
      .listLancamentos(c.conciliacao_id)
      .then(setLancamentos)
      .catch((e) => setError(e.message));
  }

  const conciliacaoHabilitada = modulos.length > 0;

  const produtosOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of meusProdutos) map.set(p.produto_id, p.produto_nome);
    return [...map.entries()];
  }, [meusProdutos]);

  const cnpjOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of meusProdutos) if (p.cnpj_id && p.cnpj) map.set(p.cnpj_id, p.razao_social ?? p.cnpj);
    return [...map.entries()];
  }, [meusProdutos]);

  const periodoOptions = useMemo(() => {
    const set = new Set<string>();
    for (const c of conciliacoes) set.add(`${c.ano}-${String(c.mes).padStart(2, "0")}`);
    return [...set].sort().reverse();
  }, [conciliacoes]);

  const conciliacaoProdutoId = useMemo(
    () => meusProdutos.find((p) => p.produto_codigo === "CONCILIACAO_CONTABIL")?.produto_id ?? null,
    [meusProdutos]
  );

  const produtosFiltrados = useMemo(
    () =>
      meusProdutos.filter(
        (p) =>
          (!filtroProduto || p.produto_id === filtroProduto) &&
          (!filtroCnpj || p.cnpj_id === filtroCnpj) &&
          (!filtroStatus || p.status === filtroStatus)
      ),
    [meusProdutos, filtroProduto, filtroCnpj, filtroStatus]
  );

  const conciliacoesFiltradas = useMemo(
    () =>
      conciliacoes.filter(
        (c) =>
          (!filtroProduto || filtroProduto === conciliacaoProdutoId) &&
          (!filtroCnpj || c.cnpj_id === filtroCnpj) &&
          (!filtroPeriodo || `${c.ano}-${String(c.mes).padStart(2, "0")}` === filtroPeriodo)
      ),
    [conciliacoes, filtroProduto, filtroCnpj, filtroPeriodo, conciliacaoProdutoId]
  );

  const statusBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of conciliacoesFiltradas) counts.set(c.status, (counts.get(c.status) ?? 0) + 1);
    return [...counts.entries()].map(([status, total]) => ({ status, total }));
  }, [conciliacoesFiltradas]);

  const totalProdutos = new Set(produtosFiltrados.map((p) => p.produto_id)).size;
  const totalCnpjs = new Set(produtosFiltrados.map((p) => p.cnpj_id).filter(Boolean)).size;
  const totalLicencasAtivas = produtosFiltrados.filter((p) => p.status === "ativa").length;
  const totalConciliacoes = conciliacoesFiltradas.length;

  const hasFilters = filtroProduto || filtroCnpj || filtroStatus || filtroPeriodo;

  return (
    <div>
      <h1>Portal Contábil</h1>
      <p style={{ color: "var(--color-text-muted)" }}>
        Produtos licenciados para os CNPJs do seu escritório.
      </p>

      {!loading && meusProdutos.length > 0 && (
        <>
          <div
            className="card"
            style={{
              marginTop: "1.2rem",
              display: "flex",
              flexWrap: "wrap",
              gap: "0.9rem",
              alignItems: "flex-end",
            }}
          >
            <FiltroField label="Produto">
              <select value={filtroProduto} onChange={(e) => setFiltroProduto(e.target.value)}>
                <option value="">Todos</option>
                {produtosOptions.map(([id, nome]) => (
                  <option key={id} value={id}>
                    {nome}
                  </option>
                ))}
              </select>
            </FiltroField>
            <FiltroField label="CNPJ">
              <select value={filtroCnpj} onChange={(e) => setFiltroCnpj(e.target.value)}>
                <option value="">Todos</option>
                {cnpjOptions.map(([id, nome]) => (
                  <option key={id} value={id}>
                    {nome}
                  </option>
                ))}
              </select>
            </FiltroField>
            <FiltroField label="Status">
              <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
                <option value="">Todos</option>
                {Object.entries(STATUS_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </FiltroField>
            <FiltroField label="Período de processamento">
              <select value={filtroPeriodo} onChange={(e) => setFiltroPeriodo(e.target.value)}>
                <option value="">Todos</option>
                {periodoOptions.map((p) => {
                  const [ano, mes] = p.split("-");
                  return (
                    <option key={p} value={p}>
                      {MESES[Number(mes)]}/{ano}
                    </option>
                  );
                })}
              </select>
            </FiltroField>
            {hasFilters && (
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setFiltroProduto("");
                  setFiltroCnpj("");
                  setFiltroStatus("");
                  setFiltroPeriodo("");
                }}
              >
                Limpar filtros
              </button>
            )}
          </div>

          <div className="stat-grid" style={{ marginTop: "1.2rem" }}>
            <StatCard eyebrow="Produtos" value={String(totalProdutos)} delta="no filtro atual" />
            <StatCard eyebrow="CNPJs" value={String(totalCnpjs)} delta="no filtro atual" />
            <StatCard eyebrow="Licenças ativas" value={String(totalLicencasAtivas)} delta="no filtro atual" />
            <StatCard eyebrow="Conciliações no período" value={String(totalConciliacoes)} delta="no filtro atual" />
          </div>
        </>
      )}

      {!loading && meusProdutos.length > 0 && (
        <section className="card" style={{ marginTop: "1.5rem", padding: 0 }}>
          <div style={{ padding: "1.25rem 1.25rem 0" }}>
            <h2 style={{ margin: 0 }}>Produtos ativos</h2>
          </div>
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>CNPJ</th>
                <th>Razão social</th>
                <th>Vigência</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {produtosFiltrados.map((p) => (
                <tr key={`${p.licenca_id}-${p.cnpj_id ?? "sem-cnpj"}`}>
                  <td style={{ fontWeight: 600 }}>{p.produto_nome}</td>
                  <td className="mono">{p.cnpj ?? "—"}</td>
                  <td>{p.razao_social ?? "—"}</td>
                  <td>
                    {p.data_inicio}
                    {p.data_fim ? ` – ${p.data_fim}` : ""}
                  </td>
                  <td>
                    <span className={`badge badge-${p.status === "ativa" ? "ativa" : p.status === "suspensa" ? "suspensa" : "cancelada"}`}>
                      {STATUS_LABEL[p.status] ?? p.status}
                    </span>
                  </td>
                </tr>
              ))}
              {produtosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty-state">
                    Nenhum produto encontrado para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      )}

      {!loading && temSintetico && conciliacoesFiltradas.length > 0 && (
        <div className="stat-grid" style={{ gridTemplateColumns: "1fr 2fr", marginTop: "1.2rem" }}>
          <StatCard eyebrow="Conciliações disponíveis" value={String(conciliacoesFiltradas.length)} />
          <div className="card">
            <div className="checklist-group-label" style={{ margin: "0 0 0.6rem" }}>
              Status das conciliações
            </div>
            <StatusChart items={statusBreakdown} />
          </div>
        </div>
      )}

      <div className="tabs" style={{ marginTop: "1.2rem" }}>
        <button className="tab-btn active">
          Conciliação
          {!loading && (
            <span
              className={`badge badge-${conciliacaoHabilitada ? "ativa" : "cancelada"}`}
              style={{ marginLeft: "0.5rem" }}
            >
              {conciliacaoHabilitada ? "Ativo" : "Sem CNPJ ativo"}
            </span>
          )}
        </button>
      </div>

      {error && (
        <p className="card" style={{ color: "var(--color-danger)", marginTop: "1rem" }}>
          {error}
        </p>
      )}

      {loading && <p>Carregando...</p>}

      {!loading && !error && modulos.length === 0 && (
        <div className="card" style={{ marginTop: "1.5rem" }}>
          <div className="empty-state">
            Nenhum módulo de Conciliação Contábil liberado para o seu usuário. Fale com o
            administrador do seu escritório para habilitar o acesso.
          </div>
        </div>
      )}

      {!loading && !error && temSintetico && (
        <section className="card" style={{ marginTop: "1.5rem" }}>
          <h2>Conciliações</h2>
          <table>
            <thead>
              <tr>
                <th>CNPJ</th>
                <th>Razão Social</th>
                <th>Período</th>
                <th>Status</th>
                <th>Saldo final</th>
                {temAnalitico && <th></th>}
              </tr>
            </thead>
            <tbody>
              {conciliacoesFiltradas.map((c) => (
                <tr
                  key={c.conciliacao_id}
                  className={temAnalitico ? "row-clickable" : ""}
                  onClick={temAnalitico ? () => openConciliacao(c) : undefined}
                  onDoubleClick={temAnalitico ? () => setSelected(null) : undefined}
                >
                  <td>{c.cnpj}</td>
                  <td>{c.razao_social}</td>
                  <td>
                    {MESES[c.mes]}/{c.ano}
                  </td>
                  <td>{c.status}</td>
                  <td>
                    {(c.saldo_final ?? 0).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </td>
                  {temAnalitico && (
                    <td onClick={(e) => e.stopPropagation()}>
                      <button className="btn btn-secondary" onClick={() => openConciliacao(c)}>
                        Ver lançamentos
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {conciliacoesFiltradas.length === 0 && (
                <tr>
                  <td colSpan={temAnalitico ? 6 : 5} style={{ color: "var(--color-text-muted)" }}>
                    Nenhuma conciliação disponível para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      )}

      {!loading && !error && !temSintetico && modulos.length > 0 && (
        <div className="card" style={{ marginTop: "1.5rem" }}>
          <div className="empty-state">
            O módulo de Relatório Sintético não está liberado para o seu usuário.
          </div>
        </div>
      )}

      {temAnalitico && selected && (
        <section className="card" style={{ marginTop: "1.5rem" }}>
          <h2>
            Lançamentos — {selected.razao_social} ({MESES[selected.mes]}/{selected.ano})
          </h2>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Conta contábil</th>
                <th>Histórico</th>
                <th>Débito</th>
                <th>Crédito</th>
                <th>Conciliado</th>
              </tr>
            </thead>
            <tbody>
              {lancamentos.map((l) => (
                <tr key={l.lancamento_id}>
                  <td>{l.data_lancamento}</td>
                  <td>{l.conta_contabil}</td>
                  <td>{l.historico}</td>
                  <td>{l.valor_debito?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                  <td>{l.valor_credito?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                  <td>{l.conciliado ? "Sim" : "Não"}</td>
                </tr>
              ))}
              {lancamentos.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ color: "var(--color-text-muted)" }}>
                    Sem lançamentos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

function FiltroField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: "block", minWidth: 180 }}>
      <span style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, marginBottom: "0.3rem" }}>
        {label}
      </span>
      {children}
    </label>
  );
}
