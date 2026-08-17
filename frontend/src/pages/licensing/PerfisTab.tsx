import { useEffect, useState } from "react";
import Modal, { Field } from "../../components/ui/Modal";
import { licensingApi } from "../../api/licensing";
import type { Modulo, PerfilAcesso, Produto } from "../../api/types";
import { gerarCodigoInterno } from "../../utils/codigo";
import { ALL_MENU_CODES, MENU_LABELS } from "../../auth/menus";

export default function PerfisTab() {
  const [perfis, setPerfis] = useState<PerfilAcesso[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [modulosByProduto, setModulosByProduto] = useState<Record<string, Modulo[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPerfil, setEditingPerfil] = useState<PerfilAcesso | null>(null);
  const [expandedPerfilId, setExpandedPerfilId] = useState<string | null>(null);

  function refresh() {
    Promise.all([licensingApi.listPerfisAcesso(), licensingApi.listProdutos()])
      .then(async ([perfisList, produtosList]) => {
        setPerfis(perfisList);
        setProdutos(produtosList);
        const entries = await Promise.all(
          produtosList.map(async (p) => [p.id, await licensingApi.listModulos(p.id)] as const)
        );
        setModulosByProduto(Object.fromEntries(entries));
      })
      .catch((e) => setError(e.message));
  }

  useEffect(refresh, []);

  async function handleDelete(perfil: PerfilAcesso) {
    if (!confirm(`Excluir o perfil "${perfil.nome}"? Se já tiver sido concedido a algum usuário, ele será inativado em vez de apagado.`))
      return;
    try {
      const result = await licensingApi.deletePerfilAcesso(perfil.id);
      if (result.inativado) {
        alert("Este perfil já foi concedido a usuários, então foi inativado (mantendo o histórico de acesso) em vez de excluído.");
      }
      refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div>
      <div className="content-head">
        <div>
          <h1>Perfis de acesso</h1>
          <div className="desc">
            Definem quais módulos/funcionalidades cada usuário pode acessar dentro dos produtos
            licenciados.
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + Novo perfil
        </button>
      </div>

      {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}

      <div style={{ display: "grid", gap: "1rem" }}>
        {perfis.map((p) => {
          const isExpanded = expandedPerfilId === p.id;
          return (
            <div
              key={p.id}
              className="card row-clickable"
              onClick={() => setExpandedPerfilId(p.id)}
              onDoubleClick={() => setExpandedPerfilId(null)}
            >
              <div className="panel-head">
                <div>
                  <h3>
                    <span style={{ display: "inline-block", width: 14, color: "var(--color-text-muted)" }}>
                      {isExpanded ? "▾" : "▸"}
                    </span>
                    {p.nome}
                  </h3>
                  <div className="sub" style={{ marginLeft: 14 }}>
                    {p.descricao}
                  </div>
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="badge badge-neutral">{p.escopo}</span>
                  <span className={`badge badge-${p.ativo ? "ativa" : "cancelada"}`}>
                    {p.ativo ? "Ativo" : "Inativo"}
                  </span>
                  <button className="icon-btn" title="Editar" onClick={() => setEditingPerfil(p)}>
                    ✎
                  </button>
                  <button className="icon-btn" title="Excluir" onClick={() => handleDelete(p)}>
                    🗑
                  </button>
                </div>
              </div>
              {isExpanded && (
                <div
                  style={{
                    marginTop: "0.8rem",
                    paddingTop: "0.8rem",
                    borderTop: "1px solid var(--color-border)",
                    marginLeft: 14,
                  }}
                >
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.5rem" }}>
                    Menus liberados
                  </div>
                  <div style={{ marginBottom: "0.8rem" }}>
                    {p.menu_ids.length === 0 ? (
                      <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                        Nenhum menu liberado — este perfil não acessa nenhuma tela do portal.
                      </span>
                    ) : (
                      p.menu_ids.map((menuId) => (
                        <span key={menuId} className="chip">
                          {MENU_LABELS[menuId] ?? menuId}
                        </span>
                      ))
                    )}
                  </div>

                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.5rem" }}>
                    Módulos liberados
                  </div>
                  {produtos.map((produto) => {
                    const modulosLiberados = (modulosByProduto[produto.id] ?? []).filter((m) =>
                      p.modulo_ids.includes(m.id)
                    );
                    if (modulosLiberados.length === 0) return null;
                    return (
                      <div key={produto.id} style={{ marginBottom: "0.5rem" }}>
                        <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>{produto.nome}: </span>
                        {modulosLiberados.map((m) => (
                          <span key={m.id} className="chip">
                            {m.nome}
                          </span>
                        ))}
                      </div>
                    );
                  })}
                  {p.modulo_ids.length === 0 && (
                    <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                      Nenhum módulo liberado para este perfil.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {perfis.length === 0 && !error && <div className="empty-state">Carregando perfis...</div>}
      </div>

      {showForm && (
        <PerfilFormModal
          produtos={produtos}
          modulosByProduto={modulosByProduto}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            refresh();
          }}
        />
      )}

      {editingPerfil && (
        <PerfilFormModal
          perfil={editingPerfil}
          produtos={produtos}
          modulosByProduto={modulosByProduto}
          onClose={() => setEditingPerfil(null)}
          onSaved={() => {
            setEditingPerfil(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}

function PerfilFormModal({
  perfil,
  produtos,
  modulosByProduto,
  onClose,
  onSaved,
}: {
  perfil?: PerfilAcesso;
  produtos: Produto[];
  modulosByProduto: Record<string, Modulo[]>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nome, setNome] = useState(perfil?.nome ?? "");
  const [descricao, setDescricao] = useState(perfil?.descricao ?? "");
  const [escopo, setEscopo] = useState(perfil?.escopo ?? "ambos");
  const [ativo, setAtivo] = useState(perfil?.ativo ?? true);
  const [selectedModulos, setSelectedModulos] = useState<Set<string>>(new Set(perfil?.modulo_ids ?? []));
  const [selectedMenus, setSelectedMenus] = useState<Set<string>>(new Set(perfil?.menu_ids ?? []));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const codigo = perfil?.codigo ?? gerarCodigoInterno(nome);

  const todosModuloIds = produtos.flatMap((p) => (modulosByProduto[p.id] ?? []).map((m) => m.id));
  const todosSelecionados = todosModuloIds.length > 0 && todosModuloIds.every((id) => selectedModulos.has(id));

  function toggleModulo(id: string) {
    setSelectedModulos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleTodos() {
    setSelectedModulos(todosSelecionados ? new Set() : new Set(todosModuloIds));
  }

  function toggleMenu(id: string) {
    setSelectedMenus((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    if (!nome.trim()) {
      setError("Informe o nome do perfil.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (perfil) {
        await licensingApi.updatePerfilAcesso(perfil.id, {
          nome: nome.trim(),
          descricao: descricao.trim() || null,
          escopo,
          ativo,
          modulo_ids: [...selectedModulos],
          menu_ids: [...selectedMenus],
        });
      } else {
        await licensingApi.createPerfilAcesso({
          codigo,
          nome: nome.trim(),
          descricao: descricao.trim() || null,
          escopo,
          modulo_ids: [...selectedModulos],
          menu_ids: [...selectedMenus],
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
      title={perfil ? "Editar perfil de acesso" : "Novo perfil de acesso"}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar perfil"}
          </button>
        </>
      }
    >
      <Field label="Nome do perfil">
        <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Supervisor" />
      </Field>
      <Field label="Descrição">
        <input value={descricao ?? ""} onChange={(e) => setDescricao(e.target.value)} />
      </Field>
      <Field label="Escopo">
        <select value={escopo} onChange={(e) => setEscopo(e.target.value)}>
          <option value="ambos">Licenciamento + Contábil</option>
          <option value="licenciamento">Somente Licenciamento</option>
          <option value="contabil">Somente Contábil</option>
        </select>
      </Field>
      {perfil && (
        <Field label="Status">
          <select value={ativo ? "1" : "0"} onChange={(e) => setAtivo(e.target.value === "1")}>
            <option value="1">Ativo</option>
            <option value="0">Inativo</option>
          </select>
        </Field>
      )}
      <Field
        label="Menus liberados"
        hint="Define quais telas do portal este perfil consegue abrir. Sem nenhum menu marcado, o usuário fica sem acesso a nada."
      >
        <div className="checklist">
          {ALL_MENU_CODES.map((menuId) => (
            <label key={menuId}>
              <input
                type="checkbox"
                checked={selectedMenus.has(menuId)}
                onChange={() => toggleMenu(menuId)}
              />
              {MENU_LABELS[menuId]}
            </label>
          ))}
        </div>
      </Field>
      <Field label="Módulos liberados" hint="Selecione as funcionalidades que este perfil pode acessar.">
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.4rem" }}>
          <button type="button" className="btn btn-secondary" onClick={toggleTodos} disabled={todosModuloIds.length === 0}>
            {todosSelecionados ? "Desmarcar todos" : "Selecionar todos"}
          </button>
        </div>
        <div className="checklist">
          {produtos.map((p) => (
            <div key={p.id}>
              <div className="checklist-group-label">{p.nome}</div>
              {(modulosByProduto[p.id] ?? []).map((m) => (
                <label key={m.id}>
                  <input
                    type="checkbox"
                    checked={selectedModulos.has(m.id)}
                    onChange={() => toggleModulo(m.id)}
                  />
                  {m.nome}
                </label>
              ))}
            </div>
          ))}
        </div>
      </Field>
      {error && <p style={{ color: "var(--color-danger)", fontSize: "0.85rem" }}>{error}</p>}
    </Modal>
  );
}
