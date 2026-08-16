import { useEffect, useState } from "react";
import Modal, { Field, FieldRow } from "../../components/ui/Modal";
import StatCard from "../../components/ui/StatCard";
import { licensingApi } from "../../api/licensing";
import type { Cliente, Cnpj, Licenca, Produto } from "../../api/types";
import { formatCnpj, formatTelefone, normalizeTelefoneDigits, onlyDigits } from "../../utils/masks";

export default function ClientesTab() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [cnpjCountByCliente, setCnpjCountByCliente] = useState<Record<string, number>>({});
  const [licCountByCliente, setLicCountByCliente] = useState<Record<string, number>>({});
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null);
  const [cnpjs, setCnpjs] = useState<Cnpj[]>([]);
  const [licencas, setLicencas] = useState<Licenca[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [showCnpjForm, setShowCnpjForm] = useState(false);
  const [editingCnpj, setEditingCnpj] = useState<Cnpj | null>(null);

  function refresh() {
    Promise.all([licensingApi.listClientes(), licensingApi.listProdutos()])
      .then(async ([cs, ps]) => {
        setClientes(cs);
        setProdutos(ps);
        const cnpjEntries = await Promise.all(
          cs.map(async (c) => [c.id, (await licensingApi.listCnpjs(c.id)).length] as const)
        );
        setCnpjCountByCliente(Object.fromEntries(cnpjEntries));
        const licEntries = await Promise.all(
          cs.map(async (c) => [c.id, (await licensingApi.listLicencas({ clienteId: c.id })).length] as const)
        );
        setLicCountByCliente(Object.fromEntries(licEntries));
      })
      .catch((e) => setError(e.message));
  }

  useEffect(refresh, []);

  function openDetail(clienteId: string) {
    setSelectedClienteId(clienteId);
    licensingApi.listCnpjs(clienteId).then(setCnpjs).catch((e) => setError(e.message));
    licensingApi.listLicencas({ clienteId }).then(setLicencas).catch((e) => setError(e.message));
  }

  async function handleDeleteCliente(cliente: Cliente) {
    if (!confirm(`Inativar o escritório "${cliente.nome}"? Ele deixa de aparecer como ativo, mas os dados são preservados.`)) return;
    try {
      await licensingApi.deleteCliente(cliente.id);
      refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function handleDeleteCnpj(cnpj: Cnpj) {
    if (!confirm(`Inativar o cliente "${cnpj.razao_social}"? As conciliações já registradas são preservadas.`)) return;
    try {
      await licensingApi.deleteCnpj(cnpj.id);
      if (selectedClienteId) openDetail(selectedClienteId);
      refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const selectedCliente = clientes.find((c) => c.id === selectedClienteId);

  return (
    <div>
      <div className="content-head">
        <div>
          <h1>Escritórios (clientes)</h1>
          <div className="desc">Escritórios de contabilidade licenciados na plataforma.</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + Novo escritório
        </button>
      </div>

      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
        <StatCard
          eyebrow="Escritórios ativos"
          value={String(clientes.filter((c) => c.ativo).length)}
          delta={`de ${clientes.length} cadastrados`}
        />
        <StatCard
          eyebrow="CNPJs cadastrados"
          value={String(Object.values(cnpjCountByCliente).reduce((sum, n) => sum + n, 0))}
          delta="clientes atendidos, todos os escritórios"
        />
      </div>

      {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}

      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Escritório</th>
              <th>E-mail</th>
              <th>CNPJs</th>
              <th>Licenças</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((c) => (
              <tr key={c.id}>
                <td style={{ fontWeight: 600 }}>{c.nome}</td>
                <td>{c.email_contato ?? "—"}</td>
                <td>{cnpjCountByCliente[c.id] ?? "…"}</td>
                <td>{licCountByCliente[c.id] ?? "…"}</td>
                <td>
                  <span className={`badge badge-${c.ativo ? "ativa" : "cancelada"}`}>
                    {c.ativo ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td>
                  <div className="row-actions">
                    <button className="btn btn-secondary" onClick={() => openDetail(c.id)}>
                      Ver detalhes
                    </button>
                    <button className="icon-btn" title="Editar" onClick={() => setEditingCliente(c)}>
                      ✎
                    </button>
                    <button className="icon-btn" title="Inativar" onClick={() => handleDeleteCliente(c)}>
                      🗑
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {clientes.length === 0 && (
              <tr>
                <td colSpan={6} className="empty-state">
                  Nenhum escritório cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedCliente && (
        <div className="card" style={{ marginTop: "1.5rem" }}>
          <div className="panel-head">
            <div>
              <h3>Clientes (CNPJs) e licenças — {selectedCliente.nome}</h3>
            </div>
            <button className="icon-btn" onClick={() => setSelectedClienteId(null)}>
              ×
            </button>
          </div>

          <div className="panel-head" style={{ marginTop: "0.5rem" }}>
            <div className="checklist-group-label" style={{ margin: 0 }}>
              Clientes
            </div>
            <button className="btn btn-secondary" onClick={() => setShowCnpjForm(true)}>
              + Novo cliente
            </button>
          </div>
          <table>
            <thead>
              <tr>
                <th>CNPJ</th>
                <th>Razão Social</th>
                <th>Nome Fantasia</th>
                <th>E-mail</th>
                <th>Telefone</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cnpjs.map((c) => (
                <tr key={c.id}>
                  <td className="mono">{formatCnpj(c.cnpj)}</td>
                  <td>{c.razao_social}</td>
                  <td>{c.nome_fantasia ?? "—"}</td>
                  <td>{c.email_contato ?? "—"}</td>
                  <td>{c.telefone ? formatTelefone(normalizeTelefoneDigits(c.telefone)) : "—"}</td>
                  <td>
                    <span className={`badge badge-${c.ativo ? "ativa" : "cancelada"}`}>
                      {c.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="icon-btn" title="Editar" onClick={() => setEditingCnpj(c)}>
                        ✎
                      </button>
                      <button className="icon-btn" title="Inativar" onClick={() => handleDeleteCnpj(c)}>
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {cnpjs.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty-state">
                    Nenhum cliente (CNPJ) cadastrado para este escritório.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="checklist-group-label" style={{ marginTop: "1.2rem" }}>
            Licenças
          </div>
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>CNPJ</th>
                <th>Qtd</th>
                <th>Valor total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {licencas.map((l) => (
                <tr key={l.id}>
                  <td>{produtos.find((p) => p.id === l.produto_id)?.nome ?? l.produto_id}</td>
                  <td>{cnpjs.find((c) => c.id === l.cnpj_id)?.cnpj ?? "—"}</td>
                  <td>{l.qtd_licencas}</td>
                  <td>{l.valor_total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                  <td>
                    <span className={`badge badge-${l.status}`}>{l.status}</span>
                  </td>
                </tr>
              ))}
              {licencas.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty-state">
                    Nenhuma licença cadastrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <EscritorioModal
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            refresh();
          }}
        />
      )}

      {editingCliente && (
        <EscritorioModal
          cliente={editingCliente}
          onClose={() => setEditingCliente(null)}
          onSaved={() => {
            setEditingCliente(null);
            refresh();
          }}
        />
      )}

      {showCnpjForm && selectedClienteId && (
        <ClienteCnpjModal
          clienteId={selectedClienteId}
          onClose={() => setShowCnpjForm(false)}
          onSaved={() => {
            setShowCnpjForm(false);
            openDetail(selectedClienteId);
            refresh();
          }}
        />
      )}

      {editingCnpj && selectedClienteId && (
        <ClienteCnpjModal
          clienteId={selectedClienteId}
          cnpj={editingCnpj}
          onClose={() => setEditingCnpj(null)}
          onSaved={() => {
            setEditingCnpj(null);
            openDetail(selectedClienteId);
          }}
        />
      )}
    </div>
  );
}

function EscritorioModal({
  cliente,
  onClose,
  onSaved,
}: {
  cliente?: Cliente;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nome, setNome] = useState(cliente?.nome ?? "");
  const [email, setEmail] = useState(cliente?.email_contato ?? "");
  const [ativo, setAtivo] = useState(cliente?.ativo ?? true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!nome.trim()) {
      setError("Informe a razão social / nome do escritório.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (cliente) {
        await licensingApi.updateCliente(cliente.id, {
          nome: nome.trim(),
          email_contato: email.trim() || null,
          ativo,
        });
      } else {
        await licensingApi.createCliente({ nome: nome.trim(), email_contato: email.trim() || null, ativo: true });
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
      title={cliente ? "Editar escritório" : "Novo escritório"}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar escritório"}
          </button>
        </>
      }
    >
      <Field label="Nome / Razão social">
        <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: WB Assessoria Contábil Ltda" />
      </Field>
      <Field label="E-mail de contato">
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contato@escritorio.com.br" />
      </Field>
      {cliente && (
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

function ClienteCnpjModal({
  clienteId,
  cnpj,
  onClose,
  onSaved,
}: {
  clienteId: string;
  cnpj?: Cnpj;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [numeroCnpj, setNumeroCnpj] = useState(onlyDigits(cnpj?.cnpj ?? ""));
  const [razaoSocial, setRazaoSocial] = useState(cnpj?.razao_social ?? "");
  const [nomeFantasia, setNomeFantasia] = useState(cnpj?.nome_fantasia ?? "");
  const [email, setEmail] = useState(cnpj?.email_contato ?? "");
  const [telefone, setTelefone] = useState(
    cnpj?.telefone ? normalizeTelefoneDigits(cnpj.telefone) : "55"
  );
  const [ativo, setAtivo] = useState(cnpj?.ativo ?? true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!numeroCnpj || !razaoSocial.trim()) {
      setError("Informe ao menos CNPJ e razão social.");
      return;
    }
    setSaving(true);
    setError(null);
    const telefoneParaSalvar = telefone.length > 2 ? telefone : null;
    try {
      if (cnpj) {
        await licensingApi.updateCnpj(cnpj.id, {
          cnpj: numeroCnpj,
          razao_social: razaoSocial.trim(),
          nome_fantasia: nomeFantasia.trim() || null,
          email_contato: email.trim() || null,
          telefone: telefoneParaSalvar,
          ativo,
        });
      } else {
        await licensingApi.createCnpj({
          cliente_id: clienteId,
          cnpj: numeroCnpj,
          razao_social: razaoSocial.trim(),
          nome_fantasia: nomeFantasia.trim() || null,
          email_contato: email.trim() || null,
          telefone: telefoneParaSalvar,
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
      title={cnpj ? "Editar cliente" : "Novo cliente"}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar cliente"}
          </button>
        </>
      }
    >
      <FieldRow>
        <Field label="CNPJ">
          <input
            value={formatCnpj(numeroCnpj)}
            onChange={(e) => setNumeroCnpj(onlyDigits(e.target.value))}
            placeholder="00.000.000/0000-00"
          />
        </Field>
        <Field label="Nome fantasia">
          <input value={nomeFantasia} onChange={(e) => setNomeFantasia(e.target.value)} />
        </Field>
      </FieldRow>
      <Field label="Razão social">
        <input value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} />
      </Field>
      <FieldRow>
        <Field label="E-mail">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Telefone (DDI + DDD)">
          <input
            value={formatTelefone(telefone)}
            onChange={(e) => setTelefone(onlyDigits(e.target.value))}
            placeholder="+55 (11) 91234-5678"
          />
        </Field>
      </FieldRow>
      {cnpj && (
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
