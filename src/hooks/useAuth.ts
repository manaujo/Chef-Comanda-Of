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
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error("Erro na autenticação:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Escutar mudanças na autenticação
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        try {
          const userData = await getCurrentUser();
          setUser(userData);
        } catch (error) {
          console.error("Erro ao buscar dados do usuário:", error);
          setUser(null);
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user
  };
};
