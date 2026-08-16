import { useEffect, useMemo, useState } from "react";
import { accountingApi } from "../../api/accounting";
import type { ConciliacaoSintetico, LancamentoAnalitico } from "../../api/types";
import StatCard from "../../components/ui/StatCard";
import StatusChart from "../../components/charts/StatusChart";

const MESES = [
  "", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

export default function AccountingHome() {
  const [conciliacoes, setConciliacoes] = useState<ConciliacaoSintetico[]>([]);
  const [selected, setSelected] = useState<ConciliacaoSintetico | null>(null);
  const [lancamentos, setLancamentos] = useState<LancamentoAnalitico[]>([]);
  const [modulos, setModulos] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const temSintetico = modulos.includes("RELATORIO_SINTETICO");
  const temAnalitico = modulos.includes("RELATORIO_ANALITICO");

  useEffect(() => {
    Promise.all([accountingApi.listConciliacoes(), accountingApi.listMeusModulos()])
      .then(([c, m]) => {
        setConciliacoes(c);
        setModulos(m);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  function openConciliacao(c: ConciliacaoSintetico) {
    setSelected(c);
    accountingApi
      .listLancamentos(c.conciliacao_id)
      .then(setLancamentos)
      .catch((e) => setError(e.message));
  }

  const conciliacaoHabilitada = modulos.length > 0;

  const statusBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of conciliacoes) counts.set(c.status, (counts.get(c.status) ?? 0) + 1);
    return [...counts.entries()].map(([status, total]) => ({ status, total }));
  }, [conciliacoes]);

  return (
    <div>
      <h1>Portal Contábil</h1>
      <p style={{ color: "var(--color-text-muted)" }}>
        Produtos licenciados para os CNPJs do seu escritório.
      </p>

      {!loading && temSintetico && conciliacoes.length > 0 && (
        <div className="stat-grid" style={{ gridTemplateColumns: "1fr 2fr", marginTop: "1.2rem" }}>
          <StatCard eyebrow="Conciliações disponíveis" value={String(conciliacoes.length)} />
          <div className="card">
            <div className="checklist-group-label" style={{ margin: "0 0 0.6rem" }}>
              Status das conciliações
            </div>
            <StatusChart items={statusBreakdown} />
          </div>
        </div>
      )}

      <div className="tabs" style={{ marginTop: "1.2rem" }}>
        <button className="tab-btn active">
          Conciliação
          {!loading && (
            <span
              className={`badge badge-${conciliacaoHabilitada ? "ativa" : "cancelada"}`}
              style={{ marginLeft: "0.5rem" }}
            >
              {conciliacaoHabilitada ? "Ativo" : "Sem CNPJ ativo"}
            </span>
          )}
        </button>
      </div>

      {error && (
        <p className="card" style={{ color: "var(--color-danger)", marginTop: "1rem" }}>
          {error}
        </p>
      )}

      {loading && <p>Carregando...</p>}

      {!loading && !error && modulos.length === 0 && (
        <div className="card" style={{ marginTop: "1.5rem" }}>
          <div className="empty-state">
            Nenhum módulo de Conciliação Contábil liberado para o seu usuário. Fale com o
            administrador do seu escritório para habilitar o acesso.
          </div>
        </div>
      )}

      {!loading && !error && temSintetico && (
        <section className="card" style={{ marginTop: "1.5rem" }}>
          <h2>Conciliações</h2>
          <table>
            <thead>
              <tr>
                <th>CNPJ</th>
                <th>Razão Social</th>
                <th>Período</th>
                <th>Status</th>
                <th>Saldo final</th>
                {temAnalitico && <th></th>}
              </tr>
            </thead>
            <tbody>
              {conciliacoes.map((c) => (
                <tr key={c.conciliacao_id}>
                  <td>{c.cnpj}</td>
                  <td>{c.razao_social}</td>
                  <td>
                    {MESES[c.mes]}/{c.ano}
                  </td>
                  <td>{c.status}</td>
                  <td>
                    {(c.saldo_final ?? 0).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </td>
                  {temAnalitico && (
                    <td>
                      <button className="btn btn-secondary" onClick={() => openConciliacao(c)}>
                        Ver lançamentos
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {conciliacoes.length === 0 && (
                <tr>
                  <td colSpan={temAnalitico ? 6 : 5} style={{ color: "var(--color-text-muted)" }}>
                    Nenhuma conciliação disponível para os CNPJs licenciados ao seu usuário.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      )}

      {!loading && !error && !temSintetico && modulos.length > 0 && (
        <div className="card" style={{ marginTop: "1.5rem" }}>
          <div className="empty-state">
            O módulo de Relatório Sintético não está liberado para o seu usuário.
          </div>
        </div>
      )}

      {temAnalitico && selected && (
        <section className="card" style={{ marginTop: "1.5rem" }}>
          <h2>
            Lançamentos — {selected.razao_social} ({MESES[selected.mes]}/{selected.ano})
          </h2>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Conta contábil</th>
                <th>Histórico</th>
                <th>Débito</th>
                <th>Crédito</th>
                <th>Conciliado</th>
              </tr>
            </thead>
            <tbody>
              {lancamentos.map((l) => (
                <tr key={l.lancamento_id}>
                  <td>{l.data_lancamento}</td>
                  <td>{l.conta_contabil}</td>
                  <td>{l.historico}</td>
                  <td>{l.valor_debito?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                  <td>{l.valor_credito?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                  <td>{l.conciliado ? "Sim" : "Não"}</td>
                </tr>
              ))}
              {lancamentos.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ color: "var(--color-text-muted)" }}>
                    Sem lançamentos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
