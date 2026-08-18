import { useEffect, useState } from "react";
import { licensingApi } from "../../../api/licensing";
import type { Modulo, Produto } from "../../../api/types";
import ExportBar from "../../../components/ui/ExportBar";
import type { ExportColumn } from "../../../utils/export";
import { formatCurrency } from "../../../utils/format";

interface LinhaPreco {
  produtoNome: string;
  moduloNome: string;
  valor: number;
}

const COLUMNS: ExportColumn<LinhaPreco>[] = [
  { header: "Produto", value: (l) => l.produtoNome },
  { header: "Módulo", value: (l) => l.moduloNome },
  { header: "Valor de execução", value: (l) => formatCurrency(l.valor) },
];

export default function RelatorioTabelaPrecos() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [modulosByProduto, setModulosByProduto] = useState<Record<string, Modulo[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    licensingApi
      .listProdutos()
      .then(async (prods) => {
        setProdutos(prods);
        const entries = await Promise.all(
          prods.map(async (p) => [p.id, await licensingApi.listModulos(p.id)] as const)
        );
        setModulosByProduto(Object.fromEntries(entries));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const linhas: LinhaPreco[] = produtos.flatMap((p) =>
    (modulosByProduto[p.id] ?? []).map((m) => ({
      produtoNome: p.nome,
      moduloNome: m.nome,
      valor: m.valor_execucao,
    }))
  );

  return (
    <div>
      <div className="content-head">
        <div>
          <h1>Tabela de Preços</h1>
          <div className="desc">Catálogo completo de produtos e módulos, com valores de referência.</div>
        </div>
      </div>

      {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}
      {loading && <p>Carregando...</p>}

      {!loading && !error && (
        <>
        <ExportBar filename="tabela-de-precos" title="Tabela de Preços" columns={COLUMNS} rows={linhas} />
        <div className="card" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Módulo</th>
                <th>Valor de execução</th>
              </tr>
            </thead>
            <tbody>
              {produtos.flatMap((p) => {
                const modulos = modulosByProduto[p.id] ?? [];
                if (modulos.length === 0) {
                  return (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.nome}</td>
                      <td colSpan={2} style={{ color: "var(--color-text-muted)" }}>
                        Sem módulos cadastrados.
                      </td>
                    </tr>
                  );
                }
                return modulos.map((m, i) => (
                  <tr key={m.id}>
                    {i === 0 && (
                      <td style={{ fontWeight: 600 }} rowSpan={modulos.length}>
                        {p.nome}
                      </td>
                    )}
                    <td>{m.nome}</td>
                    <td>{formatCurrency(m.valor_execucao)}</td>
                  </tr>
                ));
              })}
              {produtos.length === 0 && (
                <tr>
                  <td colSpan={3} className="empty-state">
                    Nenhum produto cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
            {linhas.length > 0 && (
              <tfoot>
                <tr style={{ fontWeight: 600 }}>
                  <td colSpan={2}>Total</td>
                  <td>{formatCurrency(linhas.reduce((sum, l) => sum + l.valor, 0))}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        </>
      )}
    </div>
  );
}
