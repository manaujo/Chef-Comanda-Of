import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("Supabase URL:", supabaseUrl ? "Configurada" : "Não configurada");
console.log(
  "Supabase Key:",
  supabaseAnonKey ? "Configurada" : "Não configurada"
);

// Configuração temporária para desenvolvimento
const defaultUrl = "https://placeholder.supabase.co";
const defaultKey = "placeholder-key";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Supabase não configurado. Usando configuração temporária.");
  console.warn(
    "Para usar o sistema completo, configure as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY"
  );
}

export const supabase = createClient(
  supabaseUrl || defaultUrl,
  supabaseAnonKey || defaultKey
);
