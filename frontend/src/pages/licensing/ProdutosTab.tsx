import { useEffect, useState } from "react";
import Modal, { Field, FieldRow } from "../../components/Modal";
import { licensingApi } from "../../api/licensing";
import type { Modulo, Produto } from "../../api/types";
import AtivacoesTab from "../../components/produto/AtivacoesTab";
import ModulosTab from "../../components/produto/ModulosTab";

export default function ProdutosTab() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [modulosByProduto, setModulosByProduto] = useState<Record<string, Modulo[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedView, setExpandedView] = useState<"ativacoes" | "modulos">("ativacoes");

  function refresh() {
    licensingApi
      .listProdutos()
      .then(async (list) => {
        setProdutos(list);
        const entries = await Promise.all(
          list.map(async (p) => [p.id, await licensingApi.listModulos(p.id)] as const)
        );
        setModulosByProduto(Object.fromEntries(entries));
      })
      .catch((e) => setError(e.message));
  }

  useEffect(refresh, []);

  async function handleDelete(produto: Produto) {
    if (!confirm(`Excluir o produto "${produto.nome}"? Se já tiver licenças associadas, ele será inativado em vez de apagado.`)) return;
    try {
      const result = await licensingApi.deleteProduto(produto.id);
      if (result.inativado) {
        alert("Este produto já teve licenças criadas, então foi inativado (mantendo o histórico) em vez de excluído.");
      }
      refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function toggleExpand(produto: Produto, view: "ativacoes" | "modulos") {
    if (expandedId === produto.id && expandedView === view) {
      setExpandedId(null);
    } else {
      setExpandedId(produto.id);
      setExpandedView(view);
    }
  }

  return (
    <div>
      <div className="content-head">
        <div>
          <h1>Produtos</h1>
          <div className="desc">
            Catálogo padrão de produtos licenciáveis para escritórios de contabilidade. Ative por
            cliente/CNPJ e gerencie o valor de execução de cada módulo.
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + Novo produto
        </button>
      </div>

      {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}

      <div style={{ display: "grid", gap: "1rem" }}>
        {produtos.map((p) => (
          <div key={p.id} className="card" style={{ padding: 0 }}>
            <div className="panel-head" style={{ padding: "1rem 1.25rem 0", marginBottom: "0.6rem" }}>
              <div>
                <h3>{p.nome}</h3>
                <div className="sub">
                  {p.categoria} · {p.escopo_licenca === "por_cnpj" ? "Licenciado por CNPJ" : "Licenciado por escritório"}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span className={`badge badge-${p.ativo ? "ativa" : "cancelada"}`}>
                  {p.ativo ? "Ativo" : "Inativo"}
                </span>
                <button className="icon-btn" title="Editar" onClick={() => setEditingProduto(p)}>
                  ✎
                </button>
                <button className="icon-btn" title="Excluir" onClick={() => handleDelete(p)}>
                  🗑
                </button>
              </div>
            </div>
            <div style={{ padding: "0 1.25rem 1.25rem" }}>
              <p style={{ margin: "0 0 0.8rem", color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
                {p.descricao}
              </p>
              <div className="checklist-group-label" style={{ margin: "0 0 0.4rem" }}>
                Módulos / funcionalidades
              </div>
              {(modulosByProduto[p.id] ?? []).map((m) => (
                <span key={m.id} className="chip">
                  {m.nome}
                </span>
              ))}
              <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
                <button
                  className={`btn ${expandedId === p.id && expandedView === "ativacoes" ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => toggleExpand(p, "ativacoes")}
                >
                  Ativações por cliente
                </button>
                <button
                  className={`btn ${expandedId === p.id && expandedView === "modulos" ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => toggleExpand(p, "modulos")}
                >
                  Valor dos módulos
                </button>
              </div>
            </div>
            {expandedId === p.id && (
              <div style={{ borderTop: "1px solid var(--color-border)", padding: "1.25rem" }}>
                {expandedView === "ativacoes" ? <AtivacoesTab produto={p} /> : <ModulosTab produto={p} />}
              </div>
            )}
          </div>
        ))}
        {produtos.length === 0 && !error && <div className="empty-state">Carregando produtos...</div>}
      </div>

      {showForm && (
        <ProdutoModal
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            refresh();
          }}
        />
      )}

      {editingProduto && (
        <ProdutoModal
          produto={editingProduto}
          onClose={() => setEditingProduto(null)}
          onSaved={() => {
            setEditingProduto(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}

function ProdutoModal({
  produto,
  onClose,
  onSaved,
}: {
  produto?: Produto;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [codigo, setCodigo] = useState(produto?.codigo ?? "");
  const [nome, setNome] = useState(produto?.nome ?? "");
  const [categoria, setCategoria] = useState(produto?.categoria ?? "");
  const [escopo, setEscopo] = useState<"por_cnpj" | "por_cliente">(produto?.escopo_licenca ?? "por_cnpj");
  const [descricao, setDescricao] = useState(produto?.descricao ?? "");
  const [ativo, setAtivo] = useState(produto?.ativo ?? true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if ((!produto && !codigo.trim()) || !nome.trim()) {
      setError("Informe ao menos código e nome.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (produto) {
        await licensingApi.updateProduto(produto.id, {
          nome: nome.trim(),
          categoria: categoria.trim() || null,
          descricao: descricao.trim() || null,
          ativo,
        });
      } else {
        await licensingApi.createProduto({
          codigo: codigo.trim().toUpperCase().replace(/\s+/g, "_"),
          nome: nome.trim(),
          categoria: categoria.trim() || null,
          escopo_licenca: escopo,
          descricao: descricao.trim() || null,
          ativo: true,
        });
      }
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={produto ? "Editar produto" : "Novo produto"}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar produto"}
          </button>
        </>
      }
    >
      {!produto && (
        <Field label="Código">
          <input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Ex.: CONSULTORIA_TRIBUTARIA" />
        </Field>
      )}
      <Field label="Nome do produto">
        <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Consultoria Tributária" />
      </Field>
      <FieldRow>
        <Field label="Categoria">
          <input value={categoria ?? ""} onChange={(e) => setCategoria(e.target.value)} placeholder="Ex.: Consultoria" />
        </Field>
        <Field label="Escopo do licenciamento" hint={produto ? "Não pode ser alterado após criado." : undefined}>
          <select
            value={escopo}
            onChange={(e) => setEscopo(e.target.value as "por_cnpj" | "por_cliente")}
            disabled={Boolean(produto)}
          >
            <option value="por_cnpj">Por CNPJ</option>
            <option value="por_cliente">Por escritório</option>
          </select>
        </Field>
      </FieldRow>
      <Field label="Descrição">
        <textarea
          value={descricao ?? ""}
          onChange={(e) => setDescricao(e.target.value)}
          rows={3}
          placeholder="Descreva o produto..."
        />
      </Field>
      {produto && (
        <Field label="Status">
          <select value={ativo ? "1" : "0"} onChange={(e) => setAtivo(e.target.value === "1")}>
            <option value="1">Ativo</option>
            <option value="0">Inativo</option>
          </select>
        </Field>
      )}
      {error && <p style={{ color: "var(--color-danger)", fontSize: "0.85rem" }}>{error}</p>}
    </Modal>
  );
}
