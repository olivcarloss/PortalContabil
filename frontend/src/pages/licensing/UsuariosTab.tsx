import { Fragment, useEffect, useState } from "react";
import Modal, { Field, FieldRow } from "../../components/ui/Modal";
import StatCard from "../../components/ui/StatCard";
import { useAlert } from "../../components/ui/AlertProvider";
import { licensingApi } from "../../api/licensing";
import type { Cliente, Licenca, Papel, PerfilAcesso, UsuarioPortal } from "../../api/types";
import { useAuth } from "../../auth/AuthProvider";
import { formatDateTime } from "../../utils/format";

const PAPEL_LABELS: Record<Papel, string> = {
  master: "Master",
  administrador: "Administrador",
  usuario: "Usuário",
};

export default function UsuariosTab() {
  const { profile } = useAuth();
  const souMaster = profile?.papel === "master";
  const showAlert = useAlert();

  const [usuarios, setUsuarios] = useState<UsuarioPortal[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [perfis, setPerfis] = useState<PerfilAcesso[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<UsuarioPortal | null>(null);
  const [modulosUsuario, setModulosUsuario] = useState<UsuarioPortal | null>(null);
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
        `Excluir definitivamente o usuário "${usuario.nome}"? Só é possível se ele nunca teve licenças concedidas nem administrou escritórios — caso contrário, use Editar > Inativo.`
      )
    )
      return;
    try {
      await licensingApi.deleteUsuario(usuario.id);
      refresh();
    } catch (e) {
      showAlert((e as Error).message, "Não foi possível excluir");
    }
  }

  async function handleReativar(usuario: UsuarioPortal) {
    if (!confirm(`Reativar o acesso de "${usuario.nome}" ao portal?`)) return;
    try {
      await licensingApi.updateUsuario(usuario.id, { ativo: true });
      refresh();
    } catch (e) {
      showAlert((e as Error).message, "Não foi possível reativar");
    }
  }

  async function handleDesativar(usuario: UsuarioPortal) {
    if (!confirm(`Desativar o acesso de "${usuario.nome}" ao portal? O cadastro e o histórico são mantidos, e o acesso pode ser reativado depois.`)) return;
    try {
      await licensingApi.updateUsuario(usuario.id, { ativo: false });
      refresh();
    } catch (e) {
      showAlert((e as Error).message, "Não foi possível desativar");
    }
  }

  async function handleSolicitarSenha(usuario: UsuarioPortal) {
    if (!confirm(`Enviar e-mail de redefinição de senha para "${usuario.nome}"?`)) return;
    setSendingSenhaId(usuario.id);
    try {
      await licensingApi.solicitarSenhaUsuario(usuario.id);
      showAlert("E-mail de redefinição de senha enviado.", "Sucesso");
    } catch (e) {
      showAlert((e as Error).message, "Não foi possível enviar");
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
            acesso e a um papel (Master, Administrador ou Usuário).
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + Novo usuário
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
              <th>Papel</th>
              <th>Convite</th>
              <th>E-mail</th>
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
                      <span className={`badge badge-${u.papel === "usuario" ? "cancelada" : "ativa"}`}>
                        {PAPEL_LABELS[u.papel]}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${u.convite_status === "ativo" ? "ativa" : "cancelada"}`}>
                        {u.convite_status === "ativo" ? "Ativo" : "Convite pendente"}
                      </span>
                    </td>
                    <td>{u.email ?? "—"}</td>
                    <td>
                      <span className={`badge badge-${u.ativo ? "ativa" : "cancelada"}`}>
                        {u.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                        {u.papel === "usuario" && (
                          <button
                            className="icon-btn"
                            title="Conceder módulos"
                            onClick={() => setModulosUsuario(u)}
                          >
                            🧩
                          </button>
                        )}
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
                        {u.ativo ? (
                          <button className="icon-btn" title="Desativar" onClick={() => handleDesativar(u)}>
                            🚫
                          </button>
                        ) : (
                          <button className="icon-btn" title="Reativar" onClick={() => handleReativar(u)}>
                            ♻️
                          </button>
                        )}
                        <button className="icon-btn" title="Excluir cadastro" onClick={() => handleDelete(u)}>
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={7} style={{ padding: 0, background: "var(--color-surface-alt)" }}>
                        <div
                          style={{
                            padding: "0.9rem 1.25rem",
                            display: "grid",
                            gridTemplateColumns: "repeat(3, 1fr)",
                            gap: "0.8rem",
                            fontSize: "0.85rem",
                          }}
                        >
                          <div>
                            <div style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>Perfil de acesso</div>
                            {perfis.find((p) => p.id === u.perfil_acesso_id)?.nome ?? "—"}
                          </div>
                          <div>
                            <div style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>Escritório</div>
                            {clientes.find((c) => c.id === u.cliente_id)?.nome ?? "—"}
                          </div>
                          <div>
                            <div style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>Cargo</div>
                            {u.cargo ?? "—"}
                          </div>
                          <div>
                            <div style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>E-mail</div>
                            {u.email ?? "—"}
                          </div>
                          <div>
                            <div style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>Status do convite</div>
                            {u.convite_status === "ativo" ? "Aceito" : "Pendente de aceite"}
                          </div>
                          <div>
                            <div style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>Usuário desde</div>
                            {formatDateTime(u.criado_em)}
                          </div>
                          {u.papel === "administrador" && (
                            <div style={{ gridColumn: "1 / -1" }}>
                              <div style={{ color: "var(--color-text-muted)", fontSize: "0.75rem", marginBottom: "0.3rem" }}>
                                Escritórios administrados
                              </div>
                              {u.escritorios_administrados.length === 0 ? (
                                <span style={{ color: "var(--color-text-muted)" }}>
                                  Nenhum escritório atribuído ainda.
                                </span>
                              ) : (
                                u.escritorios_administrados.map((cid) => (
                                  <span key={cid} className="chip">
                                    {clientes.find((c) => c.id === cid)?.nome ?? cid}
                                  </span>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {usuarios.length === 0 && (
              <tr>
                <td colSpan={7} className="empty-state">
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
          souMaster={souMaster}
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
          perfis={perfis}
          clientes={clientes}
          souMaster={souMaster}
          onClose={() => setEditingUsuario(null)}
          onSaved={() => {
            setEditingUsuario(null);
            refresh();
          }}
        />
      )}

      {modulosUsuario && (
        <ModulosUsuarioModal
          usuario={modulosUsuario}
          onClose={() => setModulosUsuario(null)}
        />
      )}
    </div>
  );
}

function EditarUsuarioModal({
  usuario,
  perfis,
  clientes,
  souMaster,
  onClose,
  onSaved,
}: {
  usuario: UsuarioPortal;
  perfis: PerfilAcesso[];
  clientes: Cliente[];
  souMaster: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nome, setNome] = useState(usuario.nome);
  const [email, setEmail] = useState(usuario.email ?? "");
  const [cargo, setCargo] = useState(usuario.cargo ?? "");
  const [ativo, setAtivo] = useState(usuario.ativo);
  const [perfilId, setPerfilId] = useState(usuario.perfil_acesso_id ?? perfis[0]?.id ?? "");
  const [papel, setPapel] = useState<Papel>(usuario.papel);
  const [escritorios, setEscritorios] = useState<Set<string>>(
    new Set(usuario.escritorios_administrados)
  );
  const [novaSenha, setNovaSenha] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function toggleEscritorio(id: string) {
    setEscritorios((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    if (!nome.trim()) {
      setError("Informe o nome do usuário.");
      return;
    }
    if (!email.trim()) {
      setError("Informe o e-mail do usuário.");
      return;
    }
    if (novaSenha && novaSenha.length < 8) {
      setError("A nova senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await licensingApi.updateUsuario(usuario.id, {
        nome: nome.trim(),
        cargo: cargo.trim() || null,
        ativo,
        ...(email.trim() !== (usuario.email ?? "") ? { email: email.trim() } : {}),
        ...(perfilId && perfilId !== usuario.perfil_acesso_id ? { perfil_acesso_id: perfilId } : {}),
        ...(papel !== usuario.papel ? { papel } : {}),
        ...(novaSenha ? { senha: novaSenha } : {}),
      });
      if (papel === "administrador") {
        const atual = new Set(usuario.escritorios_administrados);
        const mudou =
          atual.size !== escritorios.size || [...escritorios].some((id) => !atual.has(id));
        if (mudou) {
          await licensingApi.setEscritoriosAdministrados(usuario.id, [...escritorios]);
        }
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
      <Field label="E-mail" hint="Usado para login. Alterar aqui muda o e-mail de acesso do usuário.">
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
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
      <Field
        label="Perfil de acesso"
        hint="Troca o perfil em todas as licenças ativas do escritório vinculadas a este usuário."
      >
        <select value={perfilId} onChange={(e) => setPerfilId(e.target.value)}>
          {perfis.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
      </Field>
      <Field
        label="Papel"
        hint="Master acessa tudo. Administrador gerencia escritórios designados. Usuário acessa só o que o Administrador conceder."
      >
        <select value={papel} onChange={(e) => setPapel(e.target.value as Papel)}>
          <option value="usuario">Usuário</option>
          <option value="administrador">Administrador</option>
          {souMaster && <option value="master">Master</option>}
        </select>
      </Field>
      {papel === "administrador" && (
        <Field label="Escritórios administrados">
          <div className="checklist">
            {clientes.map((c) => (
              <label key={c.id}>
                <input
                  type="checkbox"
                  checked={escritorios.has(c.id)}
                  onChange={() => toggleEscritorio(c.id)}
                />
                {c.nome}
              </label>
            ))}
          </div>
        </Field>
      )}
      <Field label="Nova senha" hint="Deixe em branco para manter a senha atual.">
        <input
          type="password"
          value={novaSenha}
          onChange={(e) => setNovaSenha(e.target.value)}
          minLength={8}
          placeholder="••••••••"
        />
      </Field>
      {error && <p style={{ color: "var(--color-danger)", fontSize: "0.85rem" }}>{error}</p>}
    </Modal>
  );
}

function NovoUsuarioModal({
  clientes,
  perfis,
  souMaster,
  onClose,
  onCreated,
}: {
  clientes: Cliente[];
  perfis: PerfilAcesso[];
  souMaster: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [clienteId, setClienteId] = useState(clientes[0]?.id ?? "");
  const [perfilId, setPerfilId] = useState(perfis[0]?.id ?? "");
  const [papel, setPapel] = useState<Papel>("usuario");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!nome.trim() || !email.trim() || !clienteId || !perfilId) {
      setError("Informe nome, e-mail, escritório e perfil de acesso.");
      return;
    }
    if (senha.length < 8) {
      setError("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const novoUsuario = await licensingApi.convidarUsuario({
        nome: nome.trim(),
        email: email.trim(),
        senha,
        cliente_id: clienteId,
        perfil_acesso_id: perfilId,
        papel,
      });
      if (papel === "administrador") {
        // Ponto de partida razoável: o escritório escolhido no convite já
        // entra como o primeiro que a pessoa administra; outros escritórios
        // podem ser adicionados depois em Editar.
        await licensingApi.setEscritoriosAdministrados(novoUsuario.id, [clienteId]);
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
            {saving ? "Criando..." : "Criar usuário"}
          </button>
        </>
      }
    >
      <Field label="Nome completo">
        <input value={nome} onChange={(e) => setNome(e.target.value)} />
      </Field>
      <Field label="E-mail">
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome@escritorio.com.br" />
      </Field>
      <Field label="Senha de acesso" hint="A pessoa usa essa senha para entrar no portal. Pelo menos 8 caracteres.">
        <input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          minLength={8}
          placeholder="••••••••"
        />
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
      <Field
        label="Papel"
        hint="Master acessa tudo. Administrador gerencia escritórios designados. Usuário acessa só o que o Administrador conceder."
      >
        <select value={papel} onChange={(e) => setPapel(e.target.value as Papel)}>
          <option value="usuario">Usuário</option>
          <option value="administrador">Administrador</option>
          {souMaster && <option value="master">Master</option>}
        </select>
      </Field>
      {error && <p style={{ color: "var(--color-danger)", fontSize: "0.85rem" }}>{error}</p>}
    </Modal>
  );
}

function ModulosUsuarioModal({
  usuario,
  onClose,
}: {
  usuario: UsuarioPortal;
  onClose: () => void;
}) {
  const [licencas, setLicencas] = useState<Licenca[]>([]);
  const [produtoNomeById, setProdutoNomeById] = useState<Record<string, string>>({});
  const [licencaId, setLicencaId] = useState<string>("");
  const [modulos, setModulos] = useState<{ id: string; nome: string }[]>([]);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      licensingApi.listLicencas({ clienteId: usuario.cliente_id }),
      licensingApi.listProdutos(),
    ])
      .then(([lics, produtos]) => {
        const ativas = lics.filter((l) => l.status === "ativa");
        setLicencas(ativas);
        setProdutoNomeById(Object.fromEntries(produtos.map((p) => [p.id, p.nome])));
        if (ativas[0]) setLicencaId(ativas[0].id);
        else setLoading(false);
      })
      .catch((e) => {
        setError((e as Error).message);
        setLoading(false);
      });
  }, [usuario.cliente_id]);

  useEffect(() => {
    if (!licencaId) return;
    const licenca = licencas.find((l) => l.id === licencaId);
    if (!licenca) return;
    setLoading(true);
    Promise.all([
      licensingApi.listModulos(licenca.produto_id),
      licensingApi.getModulosUsuario(usuario.id, licencaId),
    ])
      .then(([mods, concedidos]) => {
        setModulos(mods.map((m) => ({ id: m.id, nome: m.nome })));
        setSelecionados(new Set(concedidos));
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [licencaId, licencas, usuario.id]);

  function toggleModulo(id: string) {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await licensingApi.setModulosUsuario(usuario.id, licencaId, [...selecionados]);
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={`Módulos liberados — ${usuario.nome}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving || !licencaId}
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </>
      }
    >
      {licencas.length === 0 && !loading ? (
        <p style={{ color: "var(--color-text-muted)" }}>
          Este escritório não tem nenhuma licença ativa para conceder módulos.
        </p>
      ) : (
        <>
          <Field label="Produto / licença">
            <select value={licencaId} onChange={(e) => setLicencaId(e.target.value)}>
              {licencas.map((l) => (
                <option key={l.id} value={l.id}>
                  {produtoNomeById[l.produto_id] ?? l.produto_id}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Módulos liberados para este usuário"
            hint="Só os módulos marcados aqui aparecem para esta pessoa no Portal Contábil."
          >
            {loading ? (
              <p style={{ color: "var(--color-text-muted)" }}>Carregando...</p>
            ) : (
              <div className="checklist">
                {modulos.map((m) => (
                  <label key={m.id}>
                    <input
                      type="checkbox"
                      checked={selecionados.has(m.id)}
                      onChange={() => toggleModulo(m.id)}
                    />
                    {m.nome}
                  </label>
                ))}
              </div>
            )}
          </Field>
        </>
      )}
      {error && <p style={{ color: "var(--color-danger)", fontSize: "0.85rem" }}>{error}</p>}
    </Modal>
  );
}
