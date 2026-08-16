/** Gera um código interno (controle do produto) a partir do nome digitado
 * pelo usuário — nunca digitado manualmente, só visualizado em tela. */
export function gerarCodigoInterno(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
}
