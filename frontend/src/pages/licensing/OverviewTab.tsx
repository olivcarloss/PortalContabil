import { useEffect, useState } from "react";
import { licensingApi } from "../../api/licensing";
import type { Cliente, Licenca, Produto, UsuarioPortal } from "../../api/types";

export default function OverviewTab() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [licencas, setLicencas] = useState<Licenca[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioPortal[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      licensingApi.listClientes(),
      licensingApi.listProdutos(),
      licensingApi.listLicencas(),
      licensingApi.listTodosUsuarios(),
    ])
      .then(([c, p, l, u]) => {
        setClientes(c);
        setProdutos(p);
        setLicencas(l);
        setUsuarios(u);
      })
      .catch((e) => setError(e.message));
  }, []);

  const clientesAtivos = clientes.filter((c) => c.ativo).length;
  const licencasAtivas = licencas.filter((l) => l.status === "ativa").length;
  const mrr = licencas
    .filter((l) => l.status === "ativa" && l.periodicidade === "mensal")
    .reduce((sum, l) => sum + l.valor_total, 0);
  const usuariosAtivos = usuarios.filter((u) => u.ativo).length;

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
            <div className="sub">Produtos padrão de mercado disponíveis para licenciamento</div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Produto</th>
              <th>Categoria</th>
              <th>Escopo</th>
              <th>Escritórios licenciados</th>
            </tr>
          </thead>
          <tbody>
            {produtos.map((p) => (
              <tr key={p.id}>
                <td style={{ fontWeight: 600 }}>{p.nome}</td>
                <td>{p.categoria}</td>
                <td>{p.escopo_licenca === "por_cnpj" ? "Por CNPJ" : "Por escritório"}</td>
                <td>{new Set(licencas.filter((l) => l.produto_id === p.id).map((l) => l.cliente_id)).size}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
