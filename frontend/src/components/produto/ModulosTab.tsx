import { useEffect, useState } from "react";
import Modal, { Field } from "../Modal";
import { licensingApi } from "../../api/licensing";
import type { Cliente, Cnpj, Licenca, Modulo, Produto } from "../../api/types";
import { centavosToReais, formatCurrency, reaisToCentavos } from "../../utils/masks";

export default function ModulosTab({ produto }: { produto: Produto }) {
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingModulo, setEditingModulo] = useState<Modulo | null>(null);

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cnpjsByCliente, setCnpjsByCliente] = useState<Record<string, Cnpj[]>>({});
  const [licencas, setLicencas] = useState<Licenca[]>([]);

  function refresh() {
    licensingApi
      .listModulos(produto.id)
      .then((list) => {
        setModulos(list);
        setEdits(Object.fromEntries(list.map((m) => [m.id, reaisToCentavos(m.valor_execucao)])));
      })
      .catch((e) => setError(e.message));

    Promise.all([licensingApi.listClientes(), licensingApi.listLicencas({ produtoId: produto.id })])
      .then(async ([cs, lics]) => {
        setClientes(cs);
        setLicencas(lics.filter((l) => l.status === "ativa"));
        const entries = await Promise.all(
          cs.map(async (c) => [c.id, await licensingApi.listCnpjs(c.id)] as const)
        );
        setCnpjsByCliente(Object.fromEntries(entries));
      })
      .catch((e) => setError(e.message));
  }

  useEffect(refresh, [produto.id]);

  async function handleSave(moduloId: string) {
    setSavingId(moduloId);
    setError(null);
    try {
      await licensingApi.updateModulo(moduloId, {
        valor_execucao: centavosToReais(edits[moduloId] ?? "0"),
      });
      refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(modulo: Modulo) {
    if (!confirm(`Excluir o módulo "${modulo.nome}"? Se já tiver sido usado em alguma licença, ele será inativado em vez de apagado.`))
      return;
    try {
      const result = await licensingApi.deleteModulo(modulo.id);
      if (result.inativado) {
        alert("Este módulo já foi usado em licenças, então foi inativado (mantendo o histórico) em vez de excluído.");
      }
      refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function labelFor(licenca: Licenca): string {
    const cliente = clientes.find((c) => c.id === licenca.cliente_id);
    if (!licenca.cnpj_id) return cliente?.nome ?? "—";
    const cnpj = (cnpjsByCliente[licenca.cliente_id] ?? []).find((c) => c.id === licenca.cnpj_id);
    return `${cliente?.nome ?? "—"} · ${cnpj?.cnpj ?? "—"}`;
  }

  return (
    <div>
      <div className="panel-head" style={{ margin: "0 0 0.8rem" }}>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", margin: 0 }}>
          Valor de execução de cada módulo/funcionalidade de {produto.nome}. Módulos habilitados na
          licença de um CNPJ ficam liberados para o usuário dentro do Portal Contábil.
        </p>
        <button className="btn btn-secondary" onClick={() => setShowForm(true)}>
          + Novo módulo
        </button>
      </div>

      {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}

      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Módulo</th>
              <th>Descrição</th>
              <th>Valor de execução</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {modulos.map((m) => (
              <tr key={m.id}>
                <td style={{ fontWeight: 600 }}>{m.nome}</td>
                <td style={{ color: "var(--color-text-muted)", fontSize: "0.82rem" }}>{m.descricao}</td>
                <td>
                  <input
                    value={formatCurrency(edits[m.id] ?? "0")}
                    onChange={(e) =>
                      setEdits((prev) => ({ ...prev, [m.id]: e.target.value.replace(/\D/g, "") }))
                    }
                    style={{ width: 120 }}
                  />
                </td>
                <td>
                  <span className={`badge badge-${m.ativo ? "ativa" : "cancelada"}`}>
                    {m.ativo ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td>
                  <div className="row-actions">
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleSave(m.id)}
                      disabled={savingId === m.id}
                    >
                      {savingId === m.id ? "Salvando..." : "Salvar valor"}
                    </button>
                    <button className="icon-btn" title="Editar" onClick={() => setEditingModulo(m)}>
                      ✎
                    </button>
                    <button className="icon-btn" title="Excluir" onClick={() => handleDelete(m)}>
                      🗑
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {modulos.length === 0 && (
              <tr>
                <td colSpan={5} className="empty-state">
                  Nenhum módulo cadastrado para este produto.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <ModuloFormModal
          produtoId={produto.id}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            refresh();
          }}
        />
      )}

      {editingModulo && (
        <ModuloFormModal
          produtoId={produto.id}
          modulo={editingModulo}
          onClose={() => setEditingModulo(null)}
          onSaved={() => {
            setEditingModulo(null);
            refresh();
          }}
        />
      )}

      {modulos.length > 0 && (
        <div style={{ marginTop: "1.5rem" }}>
          <div className="checklist-group-label" style={{ margin: "0 0 0.6rem" }}>
            Licenças ativas — módulos habilitados e vigência
          </div>
          <div className="card" style={{ padding: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Cliente / CNPJ</th>
                  <th>Módulos habilitados</th>
                  <th>Início</th>
                  <th>Término</th>
                  <th>Valor</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {licencas.map((licenca) => (
                  <LicencaModulosRow
                    key={licenca.id}
                    licenca={licenca}
                    modulos={modulos}
                    label={labelFor(licenca)}
                    onSaved={refresh}
                  />
                ))}
                {licencas.length === 0 && (
                  <tr>
                    <td colSpan={6} className="empty-state">
                      Nenhuma licença ativa para este produto ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function LicencaModulosRow({
  licenca,
  modulos,
  label,
  onSaved,
}: {
  licenca: Licenca;
  modulos: Modulo[];
  label: string;
  onSaved: () => void;
}) {
  const [selecionados, setSelecionados] = useState<string[]>(licenca.modulo_ids);
  const [dataInicio, setDataInicio] = useState(licenca.data_inicio);
  const [dataFim, setDataFim] = useState(licenca.data_fim ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valorCalculado = modulos
    .filter((m) => selecionados.includes(m.id))
    .reduce((sum, m) => sum + m.valor_execucao, 0);

  function toggleModulo(moduloId: string) {
    setSelecionados((prev) =>
      prev.includes(moduloId) ? prev.filter((id) => id !== moduloId) : [...prev, moduloId]
    );
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await licensingApi.updateLicenca(licenca.id, {
        modulo_ids: selecionados,
        data_inicio: dataInicio,
        data_fim: dataFim || null,
      });
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr>
      <td style={{ fontWeight: 600 }}>{label}</td>
      <td>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
          {modulos.map((m) => (
            <label key={m.id} style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.82rem" }}>
              <input
                type="checkbox"
                style={{ width: "auto" }}
                checked={selecionados.includes(m.id)}
                onChange={() => toggleModulo(m.id)}
              />
              {m.nome}
            </label>
          ))}
        </div>
      </td>
      <td>
        <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} style={{ width: 140 }} />
      </td>
      <td>
        <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} style={{ width: 140 }} />
      </td>
      <td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>
        {valorCalculado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
      </td>
      <td>
        <button className="btn btn-secondary" onClick={handleSave} disabled={saving}>
          {saving ? "Salvando..." : "Salvar"}
        </button>
        {error && <div style={{ color: "var(--color-danger)", fontSize: "0.75rem", marginTop: "0.3rem" }}>{error}</div>}
      </td>
    </tr>
  );
}

function ModuloFormModal({
  produtoId,
  modulo,
  onClose,
  onSaved,
}: {
  produtoId: string;
  modulo?: Modulo;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [codigo, setCodigo] = useState(modulo?.codigo ?? "");
  const [nome, setNome] = useState(modulo?.nome ?? "");
  const [descricao, setDescricao] = useState(modulo?.descricao ?? "");
  const [valor, setValor] = useState(reaisToCentavos(modulo?.valor_execucao ?? 0));
  const [ativo, setAtivo] = useState(modulo?.ativo ?? true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if ((!modulo && !codigo.trim()) || !nome.trim()) {
      setError("Informe ao menos código e nome.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (modulo) {
        await licensingApi.updateModulo(modulo.id, {
          nome: nome.trim(),
          descricao: descricao.trim() || null,
          ativo,
        });
      } else {
        await licensingApi.createModulo(produtoId, {
          codigo: codigo.trim().toUpperCase().replace(/\s+/g, "_"),
          nome: nome.trim(),
          descricao: descricao.trim() || null,
          valor_execucao: centavosToReais(valor),
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
      title={modulo ? "Editar módulo" : "Novo módulo"}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar módulo"}
          </button>
        </>
      }
    >
      {!modulo && (
        <Field label="Código">
          <input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Ex.: RELATORIO_GERENCIAL" />
        </Field>
      )}
      <Field label="Nome do módulo">
        <input value={nome} onChange={(e) => setNome(e.target.value)} />
      </Field>
      <Field label="Descrição">
        <textarea value={descricao ?? ""} onChange={(e) => setDescricao(e.target.value)} rows={3} />
      </Field>
      {!modulo && (
        <Field label="Valor de execução">
          <input
            value={formatCurrency(valor)}
            onChange={(e) => setValor(e.target.value.replace(/\D/g, ""))}
            style={{ width: 140 }}
          />
        </Field>
      )}
      {modulo && (
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
