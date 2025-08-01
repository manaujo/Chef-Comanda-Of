import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'

export const useAuth = () => {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar sessão atual
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Buscar dados completos do usuário
          const userData = await getCurrentUser();
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    checkSession();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          try {
            const userData = await getCurrentUser();
            setUser(userData);
          } catch (error) {
            console.error('Error getting user data:', error);
            setUser(null);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        return { data: null, error };
      }
      
      // Buscar dados completos do usuário após login
      if (data.user) {
        const userData = await getCurrentUser();
        setUser(userData);
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Error in signIn:', error);
      return { data: null, error };
    }
  }

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome_completo: userData.nomeCompleto,
            nome_restaurante: userData.nomeRestaurante,
            cpf: userData.cpf,
            telefone: userData.telefone
          }
        }
      });
      
      if (error) {
        return { data: null, error };
      }
      
      // Criar perfil do usuário
      if (data.user) {
        const { error: profileError } = await supabase.from("profiles").insert([
          {
            id: data.user.id,
            email: email,
            nome_completo: userData.nomeCompleto,
            nome_restaurante: userData.nomeRestaurante,
            cpf: userData.cpf,
            telefone: userData.telefone,
            tipo: 'administrador'
          }
        ]);
        
        if (profileError) {
          console.error('Erro ao criar perfil:', profileError);
        }
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in signUp:', error);
      return { data: null, error };
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      setUser(null);
      return { error };
    } catch (error) {
      console.error('Error in signOut:', error);
      return { error };
    }
  }

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  }
}