import { useEffect, useState } from "react";
import Modal, { Field } from "../../components/ui/Modal";
import { licensingApi } from "../../api/licensing";
import type { Modulo, PerfilAcesso, Produto } from "../../api/types";
import { gerarCodigoInterno } from "../../utils/codigo";

export default function PerfisTab() {
  const [perfis, setPerfis] = useState<PerfilAcesso[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [modulosByProduto, setModulosByProduto] = useState<Record<string, Modulo[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

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
        {perfis.map((p) => (
          <div key={p.id} className="card">
            <div className="panel-head">
              <div>
                <h3>{p.nome}</h3>
                <div className="sub">{p.descricao}</div>
              </div>
              <span className="badge badge-neutral">{p.escopo}</span>
            </div>
          </div>
        ))}
        {perfis.length === 0 && !error && <div className="empty-state">Carregando perfis...</div>}
      </div>

      {showForm && (
        <NovoPerfilModal
          produtos={produtos}
          modulosByProduto={modulosByProduto}
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            refresh();
          }}
        />
      )}
    </div>
  );
}

function NovoPerfilModal({
  produtos,
  modulosByProduto,
  onClose,
  onCreated,
}: {
  produtos: Produto[];
  modulosByProduto: Record<string, Modulo[]>;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [escopo, setEscopo] = useState("ambos");
  const [selectedModulos, setSelectedModulos] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const codigo = gerarCodigoInterno(nome);

  function toggleModulo(id: string) {
    setSelectedModulos((prev) => {
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
      await licensingApi.createPerfilAcesso({
        codigo,
        nome: nome.trim(),
        descricao: descricao.trim() || null,
        escopo,
        modulo_ids: [...selectedModulos],
      });
      onCreated();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title="Novo perfil de acesso"
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
      <Field label="Código interno" hint="Gerado automaticamente a partir do nome — controle interno do produto, não pode ser alterado.">
        <div className="mono" style={{ padding: "0.55rem 0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "var(--color-surface-alt)", color: "var(--color-text-secondary)", fontSize: "0.92rem" }}>
          {codigo || "—"}
        </div>
      </Field>
      <Field label="Descrição">
        <input value={descricao} onChange={(e) => setDescricao(e.target.value)} />
      </Field>
      <Field label="Escopo">
        <select value={escopo} onChange={(e) => setEscopo(e.target.value)}>
          <option value="ambos">Licenciamento + Contábil</option>
          <option value="licenciamento">Somente Licenciamento</option>
          <option value="contabil">Somente Contábil</option>
        </select>
      </Field>
      <Field label="Módulos liberados" hint="Selecione as funcionalidades que este perfil pode acessar.">
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
