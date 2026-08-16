import { useEffect, useState } from "react";
import Modal, { Field, FieldRow } from "../../components/Modal";
import { licensingApi } from "../../api/licensing";
import type { Cliente, PerfilAcesso, UsuarioPortal } from "../../api/types";

export default function UsuariosTab() {
  const [usuarios, setUsuarios] = useState<UsuarioPortal[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [perfis, setPerfis] = useState<PerfilAcesso[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

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
          + Novo usuário
        </button>
      </div>

      {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}

      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Usuário</th>
              <th>Escritório</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{u.nome}</div>
                  {u.cargo && (
                    <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>{u.cargo}</div>
                  )}
                </td>
                <td>{clientes.find((c) => c.id === u.cliente_id)?.nome ?? "—"}</td>
                <td>
                  <span className={`badge badge-${u.ativo ? "ativa" : "cancelada"}`}>
                    {u.ativo ? "Ativo" : "Inativo"}
                  </span>
                </td>
              </tr>
            ))}
            {usuarios.length === 0 && (
              <tr>
                <td colSpan={3} className="empty-state">
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
    </div>
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
  const [authUserId, setAuthUserId] = useState("");
  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("");
  const [clienteId, setClienteId] = useState(clientes[0]?.id ?? "");
  const [perfilId, setPerfilId] = useState(perfis[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!authUserId.trim() || !nome.trim() || !clienteId) {
      setError("Informe ao menos o ID do usuário, nome e escritório.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await licensingApi.createUsuario({
        id: authUserId.trim(),
        cliente_id: clienteId,
        nome: nome.trim(),
        cargo: cargo.trim() || null,
        ativo: true,
      });

      if (perfilId) {
        const licencasDoCliente = await licensingApi.listLicencas({ clienteId });
        const ativas = licencasDoCliente.filter((l) => l.status === "ativa");
        await Promise.all(
          ativas.map((l) =>
            licensingApi.createUsuarioLicenca({
              usuario_id: authUserId.trim(),
              licenca_id: l.id,
              perfil_acesso_id: perfilId,
            })
          )
        );
      }

      onCreated();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title="Novo usuário"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar usuário"}
          </button>
        </>
      }
    >
      <Field
        label="ID do usuário (Supabase Auth)"
        hint="A pessoa precisa já ter uma conta em Authentication → Users no Supabase. Copie o UUID dela ali."
      >
        <input value={authUserId} onChange={(e) => setAuthUserId(e.target.value)} placeholder="00000000-0000-0000-0000-000000000000" />
      </Field>
      <Field label="Nome completo">
        <input value={nome} onChange={(e) => setNome(e.target.value)} />
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
        <Field label="Cargo">
          <input value={cargo} onChange={(e) => setCargo(e.target.value)} placeholder="Ex.: Contador" />
        </Field>
      </FieldRow>
      <Field
        label="Perfil de acesso"
        hint="Concede esse perfil em todas as licenças ativas do escritório selecionado."
      >
        <select value={perfilId} onChange={(e) => setPerfilId(e.target.value)}>
          <option value="">Nenhum (cadastrar sem acesso a licenças)</option>
          {perfis.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
      </Field>
      {error && <p style={{ color: "var(--color-danger)", fontSize: "0.85rem" }}>{error}</p>}
    </Modal>
  );
}
