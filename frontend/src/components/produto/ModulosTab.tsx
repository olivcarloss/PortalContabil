import { useEffect, useState } from "react";
import { licensingApi } from "../../api/licensing";
import type { Modulo, Produto } from "../../api/types";

export default function ModulosTab({ produto }: { produto: Produto }) {
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    licensingApi
      .listModulos(produto.id)
      .then((list) => {
        setModulos(list);
        setEdits(Object.fromEntries(list.map((m) => [m.id, String(m.valor_execucao)])));
      })
      .catch((e) => setError(e.message));
  }

  useEffect(refresh, [produto.id]);

  async function handleSave(moduloId: string) {
    setSavingId(moduloId);
    setError(null);
    try {
      const valor = parseFloat(edits[moduloId]) || 0;
      await licensingApi.updateModulo(moduloId, valor);
      refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div>
      <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", marginTop: 0 }}>
        Valor de execução de cada módulo/funcionalidade de {produto.nome}. Módulos habilitados na
        licença de um CNPJ ficam liberados para o usuário dentro do Portal Contábil.
      </p>

      {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}

      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Módulo</th>
              <th>Descrição</th>
              <th>Valor de execução</th>
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
                    type="number"
                    min="0"
                    step="0.01"
                    value={edits[m.id] ?? "0"}
                    onChange={(e) => setEdits((prev) => ({ ...prev, [m.id]: e.target.value }))}
                    style={{ width: 120 }}
                  />
                </td>
                <td>
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleSave(m.id)}
                    disabled={savingId === m.id}
                  >
                    {savingId === m.id ? "Salvando..." : "Salvar"}
                  </button>
                </td>
              </tr>
            ))}
            {modulos.length === 0 && (
              <tr>
                <td colSpan={4} className="empty-state">
                  Nenhum módulo cadastrado para este produto.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
