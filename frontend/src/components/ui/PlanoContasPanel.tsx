import { useEffect, useRef, useState } from "react";
import { licensingApi } from "../../api/licensing";
import type { PlanoContas } from "../../api/types";

const TIPO_LABEL: Record<string, string> = {
  ativo: "Ativo",
  passivo: "Passivo",
  receita: "Receita",
  custo: "Custo",
  despesa: "Despesa",
  patrimonio_liquido: "Patrimônio Líquido",
};

const ORIGEM_LABEL: Record<string, string> = {
  proprio: "Plano próprio carregado",
  padrao: "Usando o plano padrão (nenhum próprio carregado)",
  nenhum: "Nenhum plano de contas disponível",
};

export default function PlanoContasPanel({
  clienteId,
  titulo,
  onChange,
}: {
  clienteId?: string;
  titulo: string;
  onChange?: () => void;
}) {
  const [plano, setPlano] = useState<PlanoContas | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [expandido, setExpandido] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function refresh() {
    licensingApi
      .getPlanoContas(clienteId)
      .then(setPlano)
      .catch((e) => setError((e as Error).message));
  }

  useEffect(refresh, [clienteId]);

  async function handleFile(file: File) {
    setEnviando(true);
    setError(null);
    try {
      await licensingApi.uploadPlanoContas(file, clienteId);
      refresh();
      onChange?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setEnviando(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleRemover() {
    if (!clienteId) return;
    if (!confirm("Remover o plano de contas próprio deste escritório? Ele volta a usar o plano padrão.")) return;
    try {
      await licensingApi.deletePlanoContas(clienteId);
      refresh();
      onChange?.();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div style={{ marginTop: "1.2rem" }}>
      <div className="panel-head">
        <div className="checklist-group-label" style={{ margin: 0 }}>
          {titulo}
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <button
            className="btn btn-secondary"
            disabled={enviando}
            onClick={() => fileRef.current?.click()}
          >
            {enviando ? "Enviando…" : plano?.origem === "proprio" ? "Substituir XLS" : "Carregar XLS"}
          </button>
          {clienteId && plano?.origem === "proprio" && (
            <button className="btn btn-secondary" onClick={handleRemover}>
              Remover
            </button>
          )}
        </div>
      </div>

      {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}

      {plano && (
        <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", margin: "0.4rem 0" }}>
          {ORIGEM_LABEL[plano.origem]}
          {plano.total_contas > 0 && ` · ${plano.total_contas} contas`}
          {plano.total_contas > 0 && (
            <>
              {" · "}
              <span
                style={{ cursor: "pointer", textDecoration: "underline" }}
                onClick={() => setExpandido((v) => !v)}
              >
                {expandido ? "ocultar contas" : "ver contas"}
              </span>
            </>
          )}
        </p>
      )}

      {expandido && plano && plano.total_contas > 0 && (
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Descrição</th>
              <th>Tipo</th>
            </tr>
          </thead>
          <tbody>
            {plano.contas.map((c) => (
              <tr key={c.codigo}>
                <td className="mono">{c.codigo}</td>
                <td>{c.descricao}</td>
                <td>{TIPO_LABEL[c.tipo] ?? c.tipo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
        XLS com colunas Código, Descrição e Tipo (Ativo/Passivo/Receita/Custo/Despesa/Patrimônio Líquido).
      </p>
    </div>
  );
}
