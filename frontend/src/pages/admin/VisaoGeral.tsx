import { Fragment, useEffect, useMemo, useState } from "react";
import { adminApi } from "../../api/admin";
import type { Overview } from "../../api/types";
import BarChart from "../../components/charts/BarChart";
import StatusChart from "../../components/charts/StatusChart";

const currency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function VisaoGeral() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [somenteAtivos, setSomenteAtivos] = useState(false);
  const [expandedClienteId, setExpandedClienteId] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .overview()
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  const clientesFiltrados = useMemo(() => {
    if (!data) return [];
    return data.por_cliente.filter((c) => {
      if (somenteAtivos && !c.ativo) return false;
      if (search && !c.cliente_nome.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [data, search, somenteAtivos]);

  if (error) {
    return <p style={{ color: "var(--color-danger)" }}>{error}</p>;
  }
  if (!data) {
    return <div className="empty-state">Carregando visão geral...</div>;
  }

  const produtosComMrr = data.por_produto
    .filter((p) => p.mrr > 0 || p.licencas_ativas > 0)
    .map((p) => ({ label: p.produto_nome, value: p.mrr }));

  return (
    <div>
      <div className="content-head">
        <div>
          <h1>One Page de Produtos</h1>
          <div className="desc">
            Panorama de todos os clientes e produtos ativados na plataforma, com indicadores e
            filtros.
          </div>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="eyebrow">Escritórios ativos</div>
          <div className="val">{data.clientes_ativos}</div>
          <div className="delta">de {data.total_clientes} cadastrados</div>
        </div>
        <div className="stat-card">
          <div className="eyebrow">CNPJs cadastrados</div>
          <div className="val">{data.total_cnpjs}</div>
        </div>
        <div className="stat-card">
          <div className="eyebrow">Licenças ativas</div>
          <div className="val">{data.total_licencas_ativas}</div>
        </div>
        <div className="stat-card">
          <div className="eyebrow">Receita recorrente mensal</div>
          <div className="val">{currency(data.mrr_total)}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: "1rem", marginBottom: "1.6rem" }}>
        <div className="card">
          <div className="panel-head">
            <div>
              <h3>Receita recorrente por produto</h3>
              <div className="sub">MRR de licenças ativas, por produto</div>
            </div>
          </div>
          <BarChart items={produtosComMrr} formatValue={currency} />
        </div>
        <div className="card">
          <div className="panel-head">
            <div>
              <h3>Status das conciliações</h3>
              <div className="sub">CNPJs com o produto ativado, todos os clientes</div>
            </div>
          </div>
          <StatusChart items={data.status_conciliacoes} />
        </div>
      </div>

      {data.status_por_produto.length > 0 && (
        <div className="card" style={{ marginBottom: "1.6rem" }}>
          <div className="panel-head">
            <div>
              <h3>Conciliações finalizadas por produto</h3>
              <div className="sub">Quantidade de conciliações finalizadas vs. em andamento, por produto ativado</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {data.status_por_produto.map((p) => {
              const total = p.finalizados + p.nao_finalizados;
              const pctFinalizados = total > 0 ? (p.finalizados / total) * 100 : 0;
              return (
                <div key={p.produto_id}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.35rem" }}>
                    <span style={{ fontWeight: 600 }}>{p.produto_nome}</span>
                    <span style={{ color: "var(--color-text-muted)" }}>
                      {p.finalizados} finalizadas · {p.nao_finalizados} em andamento
                    </span>
                  </div>
                  <div style={{ display: "flex", height: 10, borderRadius: 999, overflow: "hidden", gap: 2 }}>
                    <div
                      title={`Finalizadas: ${p.finalizados}`}
                      style={{ width: `${pctFinalizados}%`, background: "#16a34a", minWidth: p.finalizados > 0 ? 4 : 0 }}
                    />
                    <div
                      title={`Em andamento: ${p.nao_finalizados}`}
                      style={{ width: `${100 - pctFinalizados}%`, background: "#f59e0b", minWidth: p.nao_finalizados > 0 ? 4 : 0 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        <div
          className="panel-head"
          style={{ padding: "1.1rem 1.25rem 0.6rem", flexWrap: "wrap" }}
        >
          <div>
            <h3>Escritórios, clientes e produtos ativados</h3>
            <div className="sub">
              {clientesFiltrados.length} de {data.por_cliente.length} escritórios · clique numa linha para ver os
              clientes (CNPJs)
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
            <input
              placeholder="Buscar escritório..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 200 }}
            />
            <label style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8rem" }}>
              <input
                type="checkbox"
                checked={somenteAtivos}
                onChange={(e) => setSomenteAtivos(e.target.checked)}
                style={{ width: "auto" }}
              />
              Somente ativos
            </label>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Escritório</th>
              <th>CNPJs</th>
              <th>Produtos ativos</th>
              <th>Licenças ativas</th>
              <th>MRR</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {clientesFiltrados.map((c) => {
              const isExpanded = expandedClienteId === c.cliente_id;
              const cnpjsDoCliente = data.por_cnpj.filter((cn) => cn.cliente_id === c.cliente_id);
              return (
                <Fragment key={c.cliente_id}>
                  <tr
                    onClick={() => setExpandedClienteId(isExpanded ? null : c.cliente_id)}
                    style={{ cursor: "pointer" }}
                  >
                    <td style={{ fontWeight: 600 }}>
                      <span style={{ display: "inline-block", width: 14, color: "var(--color-text-muted)" }}>
                        {isExpanded ? "▾" : "▸"}
                      </span>
                      {c.cliente_nome}
                    </td>
                    <td>{c.total_cnpjs}</td>
                    <td>
                      {c.produtos_ativos.length === 0 ? (
                        <span style={{ color: "var(--color-text-muted)" }}>—</span>
                      ) : (
                        c.produtos_ativos.map((p) => (
                          <span key={p} className="chip">
                            {p}
                          </span>
                        ))
                      )}
                    </td>
                    <td>{c.licencas_ativas}</td>
                    <td>{currency(c.mrr)}</td>
                    <td>
                      <span className={`badge badge-${c.ativo ? "ativa" : "cancelada"}`}>
                        {c.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={6} style={{ padding: 0, background: "var(--color-surface-alt)" }}>
                        <table style={{ margin: "0.5rem 0.5rem 0.5rem 2rem", width: "calc(100% - 2.5rem)" }}>
                          <thead>
                            <tr>
                              <th>Cliente (CNPJ)</th>
                              <th>Razão social</th>
                              <th>Produtos ativos</th>
                              <th>MRR</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cnpjsDoCliente.map((cn) => (
                              <tr key={cn.cnpj_id}>
                                <td className="mono">{cn.cnpj}</td>
                                <td>{cn.razao_social}</td>
                                <td>
                                  {cn.produtos_ativos.length === 0 ? (
                                    <span style={{ color: "var(--color-text-muted)" }}>—</span>
                                  ) : (
                                    cn.produtos_ativos.map((p) => (
                                      <span key={p} className="chip">
                                        {p}
                                      </span>
                                    ))
                                  )}
                                </td>
                                <td>{currency(cn.mrr)}</td>
                                <td>
                                  <span className={`badge badge-${cn.ativo ? "ativa" : "cancelada"}`}>
                                    {cn.ativo ? "Ativo" : "Inativo"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                            {cnpjsDoCliente.length === 0 && (
                              <tr>
                                <td colSpan={5} className="empty-state">
                                  Nenhum cliente (CNPJ) cadastrado para este escritório.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {clientesFiltrados.length === 0 && (
              <tr>
                <td colSpan={6} className="empty-state">
                  Nenhum escritório encontrado com esses filtros.
                </td>
              </tr>
            )}
          </tbody>
          {clientesFiltrados.length > 0 && (
            <tfoot>
              <tr style={{ fontWeight: 600 }}>
                <td>Total ({clientesFiltrados.length} escritórios)</td>
                <td>{clientesFiltrados.reduce((s, c) => s + c.total_cnpjs, 0)}</td>
                <td></td>
                <td>{clientesFiltrados.reduce((s, c) => s + c.licencas_ativas, 0)}</td>
                <td>{currency(clientesFiltrados.reduce((s, c) => s + c.mrr, 0))}</td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
