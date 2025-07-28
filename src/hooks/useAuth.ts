import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { getCurrentUser, User } from "../lib/auth";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar usuário inicial
    const initAuth = async () => {
      try {
        console.log("🔍 Iniciando verificação de autenticação...");

        // Verificar se o Supabase está configurado
        const {
          data: { session }
        } = await supabase.auth.getSession();
        console.log("📋 Sessão atual:", session ? "Existe" : "Não existe");

        if (session) {
          console.log("👤 Usuário na sessão:", session.user.email);
          const userData = await getCurrentUser();
          console.log("📊 Dados do usuário:", userData);
          setUser(userData);
        } else {
          console.log("❌ Nenhuma sessão encontrada");
          setUser(null);
        }
      } catch (error) {
        console.error("💥 Erro na autenticação:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Escutar mudanças na autenticação
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 Evento de autenticação:", event);
      console.log("📧 Email do usuário:", session?.user?.email);

      if (event === "SIGNED_IN" && session?.user) {
        try {
          console.log("✅ Usuário logado, buscando dados...");
          const userData = await getCurrentUser();
          console.log("📊 Dados do usuário após login:", userData);
          setUser(userData);
        } catch (error) {
          console.error("💥 Erro ao buscar dados do usuário:", error);
          setUser(null);
        }
      } else if (event === "SIGNED_OUT") {
        console.log("🚪 Usuário desconectado");
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  console.log("🎯 Estado atual do useAuth:", {
    user: !!user,
    isLoading,
    isAuthenticated: !!user
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user
  };
};
