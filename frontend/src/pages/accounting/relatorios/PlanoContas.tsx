import { useEffect, useState } from "react";
import { licensingApi } from "../../../api/licensing";
import type { PlanoContasRelatorioLinha } from "../../../api/types";
import ExportBar from "../../../components/ui/ExportBar";
import type { ExportColumn } from "../../../utils/export";

const TIPO_LABEL: Record<string, string> = {
  ativo: "Ativo",
  passivo: "Passivo",
  receita: "Receita",
  custo: "Custo",
  despesa: "Despesa",
  patrimonio_liquido: "Patrimônio Líquido",
};

const COLUMNS: ExportColumn<PlanoContasRelatorioLinha>[] = [
  { header: "Escritório", value: (l) => l.cliente_nome },
  { header: "Código", value: (l) => l.codigo },
  { header: "Descrição", value: (l) => l.descricao },
  { header: "Tipo", value: (l) => TIPO_LABEL[l.tipo] ?? l.tipo },
];

export default function RelatorioPlanoContas() {
  const [linhas, setLinhas] = useState<PlanoContasRelatorioLinha[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    licensingApi
      .relatorioPlanoContas()
      .then(setLinhas)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const escritorios = Array.from(new Set(linhas.map((l) => l.cliente_nome)));

  return (
    <div>
      <div className="content-head">
        <div>
          <h1>Plano de Contas</h1>
          <div className="desc">
            Contas de cada escritório que carregou o próprio plano de contas. Escritórios usando apenas o
            plano padrão não aparecem aqui.
          </div>
        </div>
      </div>

      {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}
      {loading && <p>Carregando...</p>}

      {!loading && !error && (
        <>
          <ExportBar filename="relatorio-plano-de-contas" title="Plano de Contas" columns={COLUMNS} rows={linhas} />
          <div className="card" style={{ padding: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Escritório</th>
                  <th>Código</th>
                  <th>Descrição</th>
                  <th>Tipo</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((l) => (
                  <tr key={`${l.cliente_id}-${l.codigo}`}>
                    <td>{l.cliente_nome}</td>
                    <td className="mono">{l.codigo}</td>
                    <td>{l.descricao}</td>
                    <td>{TIPO_LABEL[l.tipo] ?? l.tipo}</td>
                  </tr>
                ))}
                {linhas.length === 0 && (
                  <tr>
                    <td colSpan={4} className="empty-state">
                      Nenhum escritório carregou um plano de contas próprio ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {escritorios.length > 0 && (
            <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", marginTop: "0.6rem" }}>
              {escritorios.length} escritório(s) com plano próprio: {escritorios.join(", ")}
            </p>
          )}
        </>
      )}
    </div>
  );
}
