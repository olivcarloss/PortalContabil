import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    "VITE_SUPABASE_ANON_KEY nao configurada em frontend/.env — login desabilitado ate a chave ser preenchida."
  );
}

// Com a anon key vazia o createClient real lanca excecao sincrona e derruba o app inteiro.
// Enquanto a config estiver incompleta usamos URL+chave placeholder JUNTOS (nunca a URL real
// com uma chave falsa, que faria o Supabase responder "Invalid API Key" em toda chamada).
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient("https://placeholder.supabase.co", "placeholder-anon-key");
