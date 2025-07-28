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
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) throw error;
  return profile;
};

export const getSession = async () => {
  const {
    data: { session },
    error
  } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
};
