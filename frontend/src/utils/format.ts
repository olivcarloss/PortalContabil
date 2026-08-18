/** Formatação padronizada (máscaras de mercado pt-BR) para datas e valores
 * monetários exibidos em telas e relatórios. */

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  // "YYYY-MM-DD" (date puro, sem hora) — parsear manualmente evita o bug de
  // fuso horário do `new Date("YYYY-MM-DD")`, que o navegador interpreta
  // como UTC meia-noite e pode exibir o dia anterior em fusos negativos.
  const soData = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = soData ? new Date(`${value}T00:00:00`) : new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR");
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function formatCurrency(value: number | null | undefined): string {
  return (value ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
