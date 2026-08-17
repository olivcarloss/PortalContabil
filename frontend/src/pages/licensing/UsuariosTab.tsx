import { Fragment, useEffect, useState } from "react";
import Modal, { Field, FieldRow } from "../../components/ui/Modal";
import StatCard from "../../components/ui/StatCard";
import { licensingApi } from "../../api/licensing";
import type { Cliente, PerfilAcesso, UsuarioPortal } from "../../api/types";

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

export default function UsuariosTab() {
  const [usuarios, setUsuarios] = useState<UsuarioPortal[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [perfis, setPerfis] = useState<PerfilAcesso[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<UsuarioPortal | null>(null);
  const [expandedUsuarioId, setExpandedUsuarioId] = useState<string | null>(null);
  const [sendingSenhaId, setSendingSenhaId] = useState<string | null>(null);

  function refresh() {
    Promise.all([
      licensingApi.listTodosUsuarios(),
      licensingApi.listClientes(),
      licensingApi.listPerfisAcesso(),
    ])
      .then(([u, c, p]) => {
        setUsuarios(u);
        setClientes(c);
        setPerfis(p);
      })
      .catch((e) => setError(e.message));
  }

  useEffect(refresh, []);

  async function handleDelete(usuario: UsuarioPortal) {
    if (
      !confirm(
        `Desativar o acesso de "${usuario.nome}" ao portal? A conta e o histórico de licenças são mantidos e o acesso pode ser reativado depois.`
      )
    )
      return;
    try {
      await licensingApi.deleteUsuario(usuario.id);
      refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function handleSolicitarSenha(usuario: UsuarioPortal) {
    if (!confirm(`Enviar e-mail de redefinição de senha para "${usuario.nome}"?`)) return;
    setSendingSenhaId(usuario.id);
    setError(null);
    try {
      await licensingApi.solicitarSenhaUsuario(usuario.id);
      alert("E-mail de redefinição de senha enviado.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSendingSenhaId(null);
    }
  }

  return (
    <div>
      <div className="content-head">
        <div>
          <h1>Usuários</h1>
          <div className="desc">
            Pessoas de cada escritório com acesso ao Portal Contábil, vinculadas a um perfil de
            acesso.
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + Convidar usuário
        </button>
      </div>

      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
        <StatCard
          eyebrow="Usuários ativos"
          value={String(usuarios.filter((u) => u.convite_status === "ativo").length)}
          delta={`de ${usuarios.length} cadastrados`}
        />
        <StatCard
          eyebrow="Convites pendentes"
          value={String(usuarios.filter((u) => u.convite_status === "pendente").length)}
          delta="aguardando aceite"
        />
      </div>

      {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}

      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Usuário</th>
              <th>Escritório</th>
              <th>Convite</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => {
              const isExpanded = expandedUsuarioId === u.id;
              return (
                <Fragment key={u.id}>
                  <tr
                    className="row-clickable"
                    onClick={() => setExpandedUsuarioId(u.id)}
                    onDoubleClick={() => setExpandedUsuarioId(null)}
                  >
                    <td>
                      <div style={{ fontWeight: 600 }}>
                        <span style={{ display: "inline-block", width: 14, color: "var(--color-text-muted)" }}>
                          {isExpanded ? "▾" : "▸"}
                        </span>
                        {u.nome}
                      </div>
                      {u.cargo && (
                        <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginLeft: 14 }}>
                          {u.cargo}
                        </div>
                      )}
                    </td>
                    <td>{clientes.find((c) => c.id === u.cliente_id)?.nome ?? "—"}</td>
                    <td>
                      <span className={`badge badge-${u.convite_status === "ativo" ? "ativa" : "cancelada"}`}>
                        {u.convite_status === "ativo" ? "Ativo" : "Convite pendente"}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${u.ativo ? "ativa" : "cancelada"}`}>
                        {u.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                        <button
                          className="icon-btn"
                          title="Solicitar nova senha"
                          onClick={() => handleSolicitarSenha(u)}
                          disabled={sendingSenhaId === u.id}
                        >
                          🔑
                        </button>
                        <button className="icon-btn" title="Editar" onClick={() => setEditingUsuario(u)}>
                          ✎
                        </button>
                        <button className="icon-btn" title="Desativar" onClick={() => handleDelete(u)}>
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={5} style={{ padding: 0, background: "var(--color-surface-alt)" }}>
                        <div
                          style={{
                            padding: "0.9rem 1.25rem",
                            display: "grid",
                            gridTemplateColumns: "repeat(4, 1fr)",
                            gap: "0.8rem",
                            fontSize: "0.85rem",
                          }}
                        >
                          <div>
                            <div style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>Escritório</div>
                            {clientes.find((c) => c.id === u.cliente_id)?.nome ?? "—"}
                          </div>
                          <div>
                            <div style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>Cargo</div>
                            {u.cargo ?? "—"}
                          </div>
                          <div>
                            <div style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>Status do convite</div>
                            {u.convite_status === "ativo" ? "Aceito" : "Pendente de aceite"}
                          </div>
                          <div>
                            <div style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>Usuário desde</div>
                            {formatDateTime(u.criado_em)}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {usuarios.length === 0 && (
              <tr>
                <td colSpan={5} className="empty-state">
                  Nenhum usuário cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <NovoUsuarioModal
          clientes={clientes}
          perfis={perfis}
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            refresh();
          }}
        />
      )}

      {editingUsuario && (
        <EditarUsuarioModal
          usuario={editingUsuario}
          onClose={() => setEditingUsuario(null)}
          onSaved={() => {
            setEditingUsuario(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}

function EditarUsuarioModal({
  usuario,
  onClose,
  onSaved,
}: {
  usuario: UsuarioPortal;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nome, setNome] = useState(usuario.nome);
  const [cargo, setCargo] = useState(usuario.cargo ?? "");
  const [ativo, setAtivo] = useState(usuario.ativo);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!nome.trim()) {
      setError("Informe o nome do usuário.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await licensingApi.updateUsuario(usuario.id, {
        nome: nome.trim(),
        cargo: cargo.trim() || null,
        ativo,
      });
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title="Editar usuário"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </>
      }
    >
      <Field label="Nome completo">
        <input value={nome} onChange={(e) => setNome(e.target.value)} />
      </Field>
      <Field label="Cargo">
        <input value={cargo} onChange={(e) => setCargo(e.target.value)} />
      </Field>
      <Field label="Status">
        <select value={ativo ? "1" : "0"} onChange={(e) => setAtivo(e.target.value === "1")}>
          <option value="1">Ativo</option>
          <option value="0">Inativo</option>
        </select>
      </Field>
      {error && <p style={{ color: "var(--color-danger)", fontSize: "0.85rem" }}>{error}</p>}
    </Modal>
  );
}

function NovoUsuarioModal({
  clientes,
  perfis,
  onClose,
  onCreated,
}: {
  clientes: Cliente[];
  perfis: PerfilAcesso[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [clienteId, setClienteId] = useState(clientes[0]?.id ?? "");
  const [perfilId, setPerfilId] = useState(perfis[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!nome.trim() || !email.trim() || !clienteId || !perfilId) {
      setError("Informe nome, e-mail, escritório e perfil de acesso.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await licensingApi.convidarUsuario({
        nome: nome.trim(),
        email: email.trim(),
        cliente_id: clienteId,
        perfil_acesso_id: perfilId,
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
      title="Convidar usuário"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Enviando..." : "Enviar convite"}
          </button>
        </>
      }
    >
      <Field label="Nome completo">
        <input value={nome} onChange={(e) => setNome(e.target.value)} />
      </Field>
      <Field
        label="E-mail"
        hint="A pessoa recebe um e-mail de convite para definir a própria senha."
      >
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome@escritorio.com.br" />
      </Field>
      <FieldRow>
        <Field label="Escritório">
          <select value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="Perfil de acesso"
          hint="Concede esse perfil em todas as licenças ativas do escritório."
        >
          <select value={perfilId} onChange={(e) => setPerfilId(e.target.value)}>
            {perfis.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </Field>
      </FieldRow>
      {error && <p style={{ color: "var(--color-danger)", fontSize: "0.85rem" }}>{error}</p>}
    </Modal>
  );
}
