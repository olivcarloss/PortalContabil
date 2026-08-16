export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Representa o valor em centavos como string de digitos (ex.: "R$ 12,34" -> "1234"). */
export function reaisToCentavos(value: number): string {
  return Math.round(value * 100).toString();
}

export function centavosToReais(digits: string): number {
  const cents = parseInt(onlyDigits(digits) || "0", 10);
  return cents / 100;
}

/** Mascara progressiva de moeda: cada digito digitado entra como centavo (padrao de caixa). */
export function formatCurrency(digits: string): string {
  return centavosToReais(digits).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatCnpj(value: string): string {
  const d = onlyDigits(value).slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

/** Numeros legados foram salvos so com DDD+numero (10-11 digitos), sem DDI.
 * Assume Brasil (+55) para esses casos, sem exigir migracao de dados. */
export function normalizeTelefoneDigits(value: string): string {
  const d = onlyDigits(value);
  return d.length > 0 && d.length <= 11 ? `55${d}` : d;
}

/** Formata como +DD (DD) NNNNN-NNNN (DDI de 2 digitos + DDD + numero de 8 ou 9 digitos). */
export function formatTelefone(value: string): string {
  const d = onlyDigits(value).slice(0, 13);
  if (d.length === 0) return "";
  let out = `+${d.slice(0, 2)}`;
  if (d.length > 2) out += ` (${d.slice(2, 4)}`;
  if (d.length >= 4) out += ")";
  if (d.length > 4) {
    const resto = d.slice(4);
    out += resto.length > 4 ? ` ${resto.slice(0, -4)}-${resto.slice(-4)}` : ` ${resto}`;
  }
  return out;
}
