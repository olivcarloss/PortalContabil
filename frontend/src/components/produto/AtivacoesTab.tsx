import { useEffect, useState } from "react";
import Modal, { Field, FieldRow } from "../Modal";
import { licensingApi } from "../../api/licensing";
import type { Cliente, Cnpj, Licenca, Modulo, Produto } from "../../api/types";

const currency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

export default function AtivacoesTab({ produto }: { produto: Produto }) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cnpjsByCliente, setCnpjsByCliente] = useState<Record<string, Cnpj[]>>({});
  const [licencas, setLicencas] = useState<Licenca[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ativarFor, setAtivarFor] = useState<{ cliente: Cliente; cnpj: Cnpj | null } | null>(null);

  function refresh() {
    Promise.all([licensingApi.listClientes(), licensingApi.listLicencas({ produtoId: produto.id })])
      .then(async ([cs, lics]) => {
        setClientes(cs);
        setLicencas(lics);
        const entries = await Promise.all(
          cs.map(async (c) => [c.id, await licensingApi.listCnpjs(c.id)] as const)
        );
        setCnpjsByCliente(Object.fromEntries(entries));
      })
      .catch((e) => setError(e.message));
  }

  useEffect(refresh, [produto.id]);

  async function handleStatusChange(licenca: Licenca, status: string) {
    try {
      await licensingApi.updateLicenca(licenca.id, { status: status as Licenca["status"] });
      refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const rows: { cliente: Cliente; cnpj: Cnpj | null; licenca: Licenca | null }[] = [];
  if (produto.escopo_licenca === "por_cnpj") {
    for (const cliente of clientes) {
      const cnpjs = cnpjsByCliente[cliente.id] ?? [];
      for (const cnpj of cnpjs) {
        const licenca = licencas.find((l) => l.cnpj_id === cnpj.id) ?? null;
        rows.push({ cliente, cnpj, licenca });
      }
    }
  } else {
    for (const cliente of clientes) {
      const licenca = licencas.find((l) => l.cliente_id === cliente.id) ?? null;
      rows.push({ cliente, cnpj: null, licenca });
    }
  }

  return (
    <div>
      {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}
      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Escritório</th>
              {produto.escopo_licenca === "por_cnpj" && <th>CNPJ</th>}
              <th>Valor</th>
              <th>Vigência</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.cliente.id}-${row.cnpj?.id ?? "cliente"}`}>
                <td style={{ fontWeight: 600 }}>{row.cliente.nome}</td>
                {produto.escopo_licenca === "por_cnpj" && <td className="mono">{row.cnpj?.cnpj}</td>}
                <td>{row.licenca ? currency(row.licenca.valor_total) : "—"}</td>
                <td>
                  {row.licenca
                    ? `${row.licenca.data_inicio} ${row.licenca.data_fim ? `– ${row.licenca.data_fim}` : "(sem fim)"}`
                    : "—"}
                  {row.licenca?.ultima_renovacao_em && (
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                      Renovada automaticamente em {formatDateTime(row.licenca.ultima_renovacao_em)}
                    </div>
                  )}
                </td>
                <td>
                  {row.licenca ? (
                    <select
                      value={row.licenca.status}
                      onChange={(e) => handleStatusChange(row.licenca as Licenca, e.target.value)}
                      style={{ width: "auto" }}
                    >
                      <option value="ativa">Ativa</option>
                      <option value="suspensa">Suspensa</option>
                      <option value="cancelada">Cancelada</option>
                    </select>
                  ) : (
                    <span className="badge badge-neutral">Não ativado</span>
                  )}
                </td>
                <td>
                  {!row.licenca && (
                    <button
                      className="btn btn-primary"
                      onClick={() => setAtivarFor({ cliente: row.cliente, cnpj: row.cnpj })}
                    >
                      Ativar
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="empty-state">
                  Nenhum escritório/CNPJ cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {ativarFor && (
        <AtivarModal
          produto={produto}
          cliente={ativarFor.cliente}
          cnpj={ativarFor.cnpj}
          onClose={() => setAtivarFor(null)}
          onCreated={() => {
            setAtivarFor(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}

function AtivarModal({
  produto,
  cliente,
  cnpj,
  onClose,
  onCreated,
}: {
  produto: Produto;
  cliente: Cliente;
  cnpj: Cnpj | null;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [periodicidade, setPeriodicidade] = useState<"mensal" | "anual">("mensal");
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().slice(0, 10));
  const [dataFim, setDataFim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    licensingApi.listModulos(produto.id).then(setModulos).catch((e) => setError(e.message));
  }, [produto.id]);

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
      await licensingApi.createLicenca({
        cliente_id: cliente.id,
        produto_id: produto.id,
        cnpj_id: cnpj?.id ?? null,
        qtd_licencas: 1,
        valor_unitario: valorCalculado,
        valor_total: valorCalculado,
        periodicidade,
        data_inicio: dataInicio,
        data_fim: dataFim || null,
        status: "ativa",
        modulo_ids: selecionados,
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
      title={`Ativar ${produto.nome}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Ativando..." : "Ativar"}
          </button>
        </>
      }
    >
      <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginTop: 0 }}>
        {cliente.nome}
        {cnpj ? ` · CNPJ ${cnpj.cnpj}` : ""}
      </p>
      {modulos.length > 0 && (
        <Field label="Módulos habilitados" hint="O valor é calculado automaticamente pela soma dos módulos marcados.">
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.8rem" }}>
            {modulos.map((m) => (
              <label key={m.id} style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.85rem" }}>
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
        </Field>
      )}
      <FieldRow>
        <Field label="Valor calculado">
          <input
            value={valorCalculado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            disabled
          />
        </Field>
        <Field label="Periodicidade">
          <select value={periodicidade} onChange={(e) => setPeriodicidade(e.target.value as "mensal" | "anual")}>
            <option value="mensal">Mensal</option>
            <option value="anual">Anual</option>
          </select>
        </Field>
      </FieldRow>
      <FieldRow>
        <Field label="Início da vigência">
          <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
        </Field>
        <Field label="Fim da vigência" hint="Deixe em branco para vigência indeterminada.">
          <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
        </Field>
      </FieldRow>
      {error && <p style={{ color: "var(--color-danger)", fontSize: "0.85rem" }}>{error}</p>}
    </Modal>
  );
}
