import { useEffect, useMemo, useState } from "react";
import { adminApi } from "../../api/admin";
import { licensingApi } from "../../api/licensing";
import type { Cliente, Cnpj, ConciliacaoSintetico, LancamentoAnalitico, Produto } from "../../api/types";
import AtivacoesTab from "../../components/produto/AtivacoesTab";
import ModulosTab from "../../components/produto/ModulosTab";
import { formatCurrency as currency, formatDate } from "../../utils/format";

const MESES = [
  "", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

type View = "ativacoes" | "modulos" | "sintetico" | "analitico";

export default function Conciliacao() {
  const [produto, setProduto] = useState<Produto | null>(null);
  const [view, setView] = useState<View>("ativacoes");
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cnpjsByCliente, setCnpjsByCliente] = useState<Record<string, Cnpj[]>>({});

  const [clienteId, setClienteId] = useState("");
  const [cnpjId, setCnpjId] = useState("");
  const [ano, setAno] = useState("");
  const [mes, setMes] = useState("");
  const [status, setStatus] = useState("");

  const [conciliacoes, setConciliacoes] = useState<ConciliacaoSintetico[]>([]);
  const [selected, setSelected] = useState<ConciliacaoSintetico | null>(null);
  const [lancamentos, setLancamentos] = useState<LancamentoAnalitico[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    licensingApi
      .listProdutos()
      .then((produtos) => {
        const p = produtos.find((x) => x.codigo === "CONCILIACAO_CONTABIL");
        setProduto(p ?? null);
      })
      .catch((e) => setError(e.message));

    licensingApi
      .listClientes()
      .then(async (cs) => {
        setClientes(cs);
        const entries = await Promise.all(
          cs.map(async (c) => [c.id, await licensingApi.listCnpjs(c.id)] as const)
        );
        setCnpjsByCliente(Object.fromEntries(entries));
      })
      .catch((e) => setError(e.message));
  }, []);

  function refresh() {
    adminApi
      .listConciliacoes({
        cliente_id: clienteId || undefined,
        cnpj_id: cnpjId || undefined,
        ano: ano ? Number(ano) : undefined,
        mes: mes ? Number(mes) : undefined,
        status: status || undefined,
      })
      .then(setConciliacoes)
      .catch((e) => setError(e.message));
  }

  useEffect(refresh, [clienteId, cnpjId, ano, mes, status]);

  const cnpjOptions = useMemo(
    () => (clienteId ? cnpjsByCliente[clienteId] ?? [] : Object.values(cnpjsByCliente).flat()),
    [clienteId, cnpjsByCliente]
  );

  const statusOptions = useMemo(
    () => [...new Set(conciliacoes.map((c) => c.status))],
    [conciliacoes]
  );

  function openAnalitico(c: ConciliacaoSintetico) {
    setSelected(c);
    setView("analitico");
    adminApi
      .listLancamentos(c.conciliacao_id)
      .then(setLancamentos)
      .catch((e) => setError(e.message));
  }

  return (
    <div>
      <div className="content-head">
        <div>
          <h1>Conciliação</h1>
          <div className="desc">
            Produto <b>{produto?.nome ?? "Conciliação Contábil"}</b> — ativação por escritório/CNPJ,
            módulos e visão sintética/analítica de todas as conciliações.
          </div>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab-btn ${view === "ativacoes" ? "active" : ""}`} onClick={() => setView("ativacoes")}>
          Ativações
        </button>
        <button className={`tab-btn ${view === "modulos" ? "active" : ""}`} onClick={() => setView("modulos")}>
          Módulos
        </button>
        <button className={`tab-btn ${view === "sintetico" ? "active" : ""}`} onClick={() => setView("sintetico")}>
          Sintético
        </button>
        <button
          className={`tab-btn ${view === "analitico" ? "active" : ""}`}
          onClick={() => setView("analitico")}
          disabled={!selected}
        >
          Analítico {selected ? `— ${selected.razao_social}` : ""}
        </button>
      </div>

      {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}

      {view === "ativacoes" && produto && <AtivacoesTab produto={produto} />}
      {view === "modulos" && produto && <ModulosTab produto={produto} />}

      {(view === "sintetico" || view === "analitico") && (
        <div className="card" style={{ marginBottom: "1.2rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.8rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", marginBottom: "0.3rem" }}>Escritório</label>
              <select
                value={clienteId}
                onChange={(e) => {
                  setClienteId(e.target.value);
                  setCnpjId("");
                }}
              >
                <option value="">Todos</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", marginBottom: "0.3rem" }}>CNPJ</label>
              <select value={cnpjId} onChange={(e) => setCnpjId(e.target.value)}>
                <option value="">Todos</option>
                {cnpjOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.cnpj}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", marginBottom: "0.3rem" }}>Ano</label>
              <input value={ano} onChange={(e) => setAno(e.target.value)} placeholder="2026" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", marginBottom: "0.3rem" }}>Mês</label>
              <select value={mes} onChange={(e) => setMes(e.target.value)}>
                <option value="">Todos</option>
                {MESES.slice(1).map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", marginBottom: "0.3rem" }}>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">Todos</option>
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {view === "sintetico" && (
        <div className="card" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Escritório</th>
                <th>CNPJ</th>
                <th>Período</th>
                <th>Status</th>
                <th>Débitos</th>
                <th>Créditos</th>
                <th>Saldo final</th>
                <th>Lançamentos</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {conciliacoes.map((c) => (
                <tr key={c.conciliacao_id} className="row-clickable" onClick={() => openAnalitico(c)}>
                  <td>{c.cliente_nome}</td>
                  <td className="mono">{c.cnpj}</td>
                  <td>{MESES[c.mes]}/{c.ano}</td>
                  <td>
                    <span className="badge badge-neutral">{c.status}</span>
                  </td>
                  <td>{currency(c.total_debitos)}</td>
                  <td>{currency(c.total_creditos)}</td>
                  <td style={{ fontWeight: 600 }}>{currency(c.saldo_final)}</td>
                  <td>{c.qtd_lancamentos}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <button className="btn btn-secondary" onClick={() => openAnalitico(c)}>
                      Ver analítico
                    </button>
                  </td>
                </tr>
              ))}
              {conciliacoes.length === 0 && (
                <tr>
                  <td colSpan={9} className="empty-state">
                    Nenhuma conciliação encontrada com esses filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {view === "analitico" && selected && (
        <div className="card" style={{ padding: 0 }}>
          <div className="panel-head" style={{ padding: "1.1rem 1.25rem 0" }}>
            <div>
              <h3>{selected.razao_social}</h3>
              <div className="sub">
                CNPJ {selected.cnpj} · {MESES[selected.mes]}/{selected.ano}
              </div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Conta contábil</th>
                <th>Histórico</th>
                <th>Documento</th>
                <th>Débito</th>
                <th>Crédito</th>
                <th>Conciliado</th>
              </tr>
            </thead>
            <tbody>
              {lancamentos.map((l) => (
                <tr key={l.lancamento_id}>
                  <td>{formatDate(l.data_lancamento)}</td>
                  <td>{l.conta_contabil}</td>
                  <td>{l.historico}</td>
                  <td>{l.documento}</td>
                  <td>{currency(l.valor_debito)}</td>
                  <td>{currency(l.valor_credito)}</td>
                  <td>
                    <span className={`badge badge-${l.conciliado ? "ativa" : "suspensa"}`}>
                      {l.conciliado ? "Sim" : "Não"}
                    </span>
                  </td>
                </tr>
              ))}
              {lancamentos.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty-state">
                    Sem lançamentos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
