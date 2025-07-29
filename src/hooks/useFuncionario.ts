import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { authFuncionarios, type Funcionario } from "../lib/funcionarios";

export const useFuncionario = () => {
  const [funcionario, setFuncionario] = useState<Funcionario | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar funcionário inicial
    const initAuth = async () => {
      try {
        console.log("🔍 Iniciando verificação de funcionário...");

        const {
          data: { session }
        } = await supabase.auth.getSession();

        if (session) {
          console.log("👤 Sessão encontrada, buscando funcionário...");
          const funcionarioData = await authFuncionarios.getCurrentFuncionario();
          console.log("📊 Dados do funcionário:", funcionarioData);
          setFuncionario(funcionarioData);
        } else {
          console.log("❌ Nenhuma sessão encontrada");
          setFuncionario(null);
        }
      } catch (error) {
        console.error("💥 Erro na autenticação:", error);
        setFuncionario(null);
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

      if (event === "SIGNED_IN" && session?.user) {
        try {
          console.log("✅ Funcionário logado, buscando dados...");
          const funcionarioData = await authFuncionarios.getCurrentFuncionario();
          console.log("📊 Dados do funcionário após login:", funcionarioData);
          setFuncionario(funcionarioData);
        } catch (error) {
          console.error("💥 Erro ao buscar dados do funcionário:", error);
          setFuncionario(null);
        }
      } else if (event === "SIGNED_OUT") {
        console.log("🚪 Funcionário desconectado");
        setFuncionario(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const isAuthenticated = !!funcionario;
  const isAdmin = funcionario?.tipo === 'administrador';

  console.log("🎯 Estado atual do useFuncionario:", {
    funcionario: !!funcionario,
    isLoading,
    isAuthenticated,
    isAdmin,
    tipo: funcionario?.tipo
  });

  return {
    funcionario,
    isLoading,
    isAuthenticated,
    isAdmin
  };
};