/**
 * Traduz mensagens de erro do Supabase Auth (sempre em inglês, às vezes
 * citando "Supabase" ou termos técnicos) para um texto em português que faz
 * sentido para o cliente do escritório contábil — sem nunca mencionar o
 * provedor por trás do login.
 */
export function translateAuthError(message: string): string {
  const m = message.toLowerCase();

  if (m.includes("rate limit")) {
    return "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.";
  }
  if (m.includes("invalid login credentials")) {
    return "E-mail ou senha inválidos.";
  }
  if (m.includes("email not confirmed")) {
    return "Conta ainda não confirmada. Verifique seu e-mail de ativação.";
  }
  if (m.includes("user not found") || m.includes("user not exist")) {
    return "Não encontramos uma conta com esse e-mail.";
  }
  if (m.includes("already registered") || m.includes("already exists")) {
    return "Já existe uma conta cadastrada com esse e-mail.";
  }
  if (m.includes("password") && (m.includes("least") || m.includes("weak") || m.includes("short"))) {
    return "A senha não atende aos requisitos mínimos (pelo menos 8 caracteres).";
  }
  if (m.includes("token") && (m.includes("expired") || m.includes("invalid"))) {
    return "Link expirado ou inválido. Solicite um novo.";
  }
  if (m.includes("network") || m.includes("fetch")) {
    return "Não foi possível conectar. Verifique sua conexão e tente novamente.";
  }

  return "Não foi possível concluir a operação. Tente novamente em instantes.";
}
