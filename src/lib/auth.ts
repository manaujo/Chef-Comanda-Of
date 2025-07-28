import { supabase } from "./supabase";

export interface User {
  id: string;
  email: string;
  nome_completo: string;
  nome_restaurante: string;
  cpf: string;
  telefone: string;
  created_at: string;
}

export const signUp = async (userData: {
  email: string;
  password: string;
  nome_completo: string;
  nome_restaurante: string;
  cpf: string;
  telefone: string;
}) => {
  const { data, error } = await supabase.auth.signUp({
    email: userData.email,
    password: userData.password,
    options: {
      data: {
        nome_completo: userData.nome_completo,
        nome_restaurante: userData.nome_restaurante,
        cpf: userData.cpf,
        telefone: userData.telefone
      }
    }
  });

  if (error) throw error;

  // Criar perfil do usuário na tabela profiles
  if (data.user) {
    const { error: profileError } = await supabase.from("profiles").insert([
      {
        id: data.user.id,
        email: userData.email,
        nome_completo: userData.nome_completo,
        nome_restaurante: userData.nome_restaurante,
        cpf: userData.cpf,
        telefone: userData.telefone
      }
    ]);

    if (profileError) throw profileError;
  }

  return data;
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) return null;

    // Tentar buscar dados da tabela profiles
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.warn("Erro ao buscar perfil:", error);
        // Se não conseguir buscar o perfil, retornar dados básicos do usuário
        return {
          id: user.id,
          email: user.email || "",
          nome_completo: user.user_metadata?.nome_completo || "Usuário",
          nome_restaurante:
            user.user_metadata?.nome_restaurante || "Restaurante",
          cpf: user.user_metadata?.cpf || "",
          telefone: user.user_metadata?.telefone || "",
          created_at: user.created_at || new Date().toISOString()
        };
      }

      return profile;
    } catch (profileError) {
      console.warn(
        "Erro ao buscar perfil, usando dados básicos:",
        profileError
      );
      // Retornar dados básicos do usuário autenticado
      return {
        id: user.id,
        email: user.email || "",
        nome_completo: user.user_metadata?.nome_completo || "Usuário",
        nome_restaurante: user.user_metadata?.nome_restaurante || "Restaurante",
        cpf: user.user_metadata?.cpf || "",
        telefone: user.user_metadata?.telefone || "",
        created_at: user.created_at || new Date().toISOString()
      };
    }
  } catch (error) {
    console.error("Erro na autenticação:", error);
    return null;
  }
};

export const getSession = async () => {
  const {
    data: { session },
    error
  } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
};
