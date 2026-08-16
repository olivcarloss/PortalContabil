import { Fragment, useEffect, useState } from "react";
import { licensingApi } from "../../api/licensing";
import type { Cliente, Cnpj, Licenca, Produto, UsuarioPortal } from "../../api/types";

const currency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const STATUS_LABEL: Record<string, string> = {
  ativa: "Ativa",
  suspensa: "Suspensa",
  cancelada: "Cancelada",
};

// Alinha a primeira coluna da tabela com o título "Produtos no catálogo" acima
// dela — o padding padrão de th/td (0.75rem) fica 0.5rem mais à esquerda que
// o padding do cabeçalho do card (1.25rem).
const FIRST_COL_STYLE = { paddingLeft: "1.25rem" };

export default function OverviewTab() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [licencas, setLicencas] = useState<Licenca[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioPortal[]>([]);
  const [cnpjsByCliente, setCnpjsByCliente] = useState<Record<string, Cnpj[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [expandedProdutoId, setExpandedProdutoId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      licensingApi.listClientes(),
      licensingApi.listProdutos(),
      licensingApi.listLicencas(),
      licensingApi.listTodosUsuarios(),
    ])
      .then(async ([c, p, l, u]) => {
        setClientes(c);
        setProdutos(p);
        setLicencas(l);
        setUsuarios(u);
        const entries = await Promise.all(
          c.map(async (cli) => [cli.id, await licensingApi.listCnpjs(cli.id)] as const)
        );
        setCnpjsByCliente(Object.fromEntries(entries));
      })
      .catch((e) => setError(e.message));
  }, []);

  const clientesAtivos = clientes.filter((c) => c.ativo).length;
  const licencasAtivas = licencas.filter((l) => l.status === "ativa").length;
  const mrr = licencas
    .filter((l) => l.status === "ativa" && l.periodicidade === "mensal")
    .reduce((sum, l) => sum + l.valor_total, 0);
  const usuariosAtivos = usuarios.filter((u) => u.ativo).length;

  function clienteNome(clienteId: string) {
    return clientes.find((c) => c.id === clienteId)?.nome ?? "—";
  }

  function cnpjInfo(licenca: Licenca) {
    if (!licenca.cnpj_id) return "Todos os CNPJs do escritório";
    const cnpj = (cnpjsByCliente[licenca.cliente_id] ?? []).find((c) => c.id === licenca.cnpj_id);
    return cnpj ? `${cnpj.cnpj} · ${cnpj.razao_social}` : "—";
  }

  return (
    <div>
      <div className="content-head">
        <div>
          <h1>Visão geral</h1>
          <div className="desc">
            Panorama do licenciamento por produto entre todos os escritórios de contabilidade
            atendidos.
          </div>
        </div>
      </div>

      {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}

      <div className="stat-grid">
        <div className="stat-card">
          <div className="eyebrow">Escritórios ativos</div>
          <div className="val">{clientesAtivos}</div>
          <div className="delta">de {clientes.length} cadastrados</div>
        </div>
        <div className="stat-card">
          <div className="eyebrow">Licenças ativas</div>
          <div className="val">{licencasAtivas}</div>
          <div className="delta">de {licencas.length} no total</div>
        </div>
        <div className="stat-card">
          <div className="eyebrow">Receita recorrente mensal</div>
          <div className="val">{mrr.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
          <div className="delta">estimativa (licenças mensais ativas)</div>
        </div>
        <div className="stat-card">
          <div className="eyebrow">Usuários ativos</div>
          <div className="val">{usuariosAtivos}</div>
          <div className="delta">no portal contábil</div>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="panel-head" style={{ padding: "1.1rem 1.25rem 0" }}>
          <div>
            <h3>Produtos no catálogo</h3>
            <div className="sub">
              Produtos padrão de mercado disponíveis para licenciamento · clique numa linha para ver
              CNPJs, licenças e valores
            </div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th style={FIRST_COL_STYLE}>Produto</th>
              <th>Categoria</th>
              <th>Escopo</th>
              <th>Escritórios licenciados</th>
            </tr>
          </thead>
          <tbody>
            {produtos.map((p) => {
              const isExpanded = expandedProdutoId === p.id;
              const licencasDoProduto = licencas.filter((l) => l.produto_id === p.id);
              const licencasAtivasDoProduto = licencasDoProduto.filter((l) => l.status === "ativa");

              const cnpjsCobertos = new Set<string>();
              for (const l of licencasAtivasDoProduto) {
                if (l.cnpj_id) {
                  cnpjsCobertos.add(l.cnpj_id);
                } else {
                  for (const cnpj of cnpjsByCliente[l.cliente_id] ?? []) {
                    if (cnpj.ativo) cnpjsCobertos.add(cnpj.id);
                  }
                }
              }

              const mrrDoProduto = licencasAtivasDoProduto
                .filter((l) => l.periodicidade === "mensal")
                .reduce((sum, l) => sum + l.valor_total, 0);

              return (
                <Fragment key={p.id}>
                  <tr className="row-clickable" onClick={() => setExpandedProdutoId(isExpanded ? null : p.id)}>
                    <td style={{ fontWeight: 600, ...FIRST_COL_STYLE }}>
                      <span style={{ display: "inline-block", width: 14, color: "var(--color-text-muted)" }}>
                        {isExpanded ? "▾" : "▸"}
                      </span>
                      {p.nome}
                    </td>
                    <td>{p.categoria}</td>
                    <td>{p.escopo_licenca === "por_cnpj" ? "Por CNPJ" : "Por escritório"}</td>
                    <td>{new Set(licencasDoProduto.map((l) => l.cliente_id)).size}</td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={4} style={{ padding: 0, background: "var(--color-surface-alt)" }}>
                        <div style={{ padding: "0.9rem 1.25rem", fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
                          {licencasAtivasDoProduto.length} licenças ativas · {cnpjsCobertos.size} CNPJs ativos
                          cobertos · MRR {currency(mrrDoProduto)}
                        </div>
                        <table style={{ margin: "0 0.5rem 0.5rem 2rem", width: "calc(100% - 2.5rem)" }}>
                          <thead>
                            <tr>
                              <th>Escritório</th>
                              <th>CNPJ</th>
                              <th>Qtd. licenças</th>
                              <th>Valor total</th>
                              <th>Vigência</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {licencasDoProduto.map((l) => (
                              <tr key={l.id}>
                                <td>{clienteNome(l.cliente_id)}</td>
                                <td>{cnpjInfo(l)}</td>
                                <td>{l.qtd_licencas}</td>
                                <td>{currency(l.valor_total)}</td>
                                <td>
                                  {l.data_inicio}
                                  {l.data_fim ? ` – ${l.data_fim}` : ""}
                                </td>
                                <td>
                                  <span
                                    className={`badge badge-${l.status === "ativa" ? "ativa" : l.status === "suspensa" ? "suspensa" : "cancelada"}`}
                                  >
                                    {STATUS_LABEL[l.status] ?? l.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                            {licencasDoProduto.length === 0 && (
                              <tr>
                                <td colSpan={6} className="empty-state">
                                  Nenhuma licença ativada para este produto ainda.
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
          </tbody>
        </table>
      </div>
    </div>
  );
}
