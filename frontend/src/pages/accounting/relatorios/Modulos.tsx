import { useEffect, useState } from "react";
import { accountingApi } from "../../../api/accounting";
import ExportBar from "../../../components/ui/ExportBar";
import type { ExportColumn } from "../../../utils/export";

const COLUMNS: ExportColumn<string>[] = [{ header: "Módulo", value: (m) => m }];

export default function RelatorioModulos() {
  const [modulos, setModulos] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    accountingApi
      .listMeusModulos()
      .then(setModulos)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="content-head">
        <div>
          <h1>Relatório de Módulos</h1>
          <div className="desc">Módulos liberados para o seu usuário.</div>
        </div>
      </div>

      {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}
      {loading && <p>Carregando...</p>}

      {!loading && !error && (
        <>
          <ExportBar filename="relatorio-modulos" title="Relatório de Módulos" columns={COLUMNS} rows={modulos} />
          <div className="card">
            {modulos.length === 0 ? (
              <div className="empty-state">
                Nenhum módulo liberado para o seu usuário. Fale com o administrador do seu
                escritório para habilitar o acesso.
              </div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {modulos.map((m) => (
                  <span key={m} className="chip">
                    {m}
                  </span>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
