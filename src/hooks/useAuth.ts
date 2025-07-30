import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { getCurrentUser, User } from "../lib/auth";
import { authFuncionarios, type Funcionario } from "../lib/funcionarios";

export type UserType = "admin" | "funcionario";

export interface AuthUser {
  id: string;
  email?: string;
  nome: string;
  tipo: UserType;
  userData: User | Funcionario;
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
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

          // Tentar detectar se é administrador ou funcionário
          const email = session.user.email;

          if (email && !email.includes("@chefcomanda.com")) {
            // É um administrador (email real)
            console.log("👑 Detectado como administrador");
            const userData = await getCurrentUser();
            if (userData) {
              setUser({
                id: userData.id,
                email: userData.email,
                nome: userData.nome_completo,
                tipo: "admin",
                userData
              });
            }
          } else {
            // É um funcionário (email com @chefcomanda.com)
            console.log("👷 Detectado como funcionário");
            const funcionarioData =
              await authFuncionarios.getCurrentFuncionario();
            if (funcionarioData) {
              setUser({
                id: funcionarioData.id,
                nome: funcionarioData.nome,
                tipo: "funcionario",
                userData: funcionarioData
              });
            }
          }
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
          console.log("✅ Usuário logado, detectando tipo...");
          const email = session.user.email;

          if (email && !email.includes("@chefcomanda.com")) {
            // É um administrador
            console.log("👑 Detectado como administrador");
            const userData = await getCurrentUser();
            if (userData) {
              setUser({
                id: userData.id,
                email: userData.email,
                nome: userData.nome_completo,
                tipo: "admin",
                userData
              });
            }
          } else {
            // É um funcionário
            console.log("👷 Detectado como funcionário");
            const funcionarioData =
              await authFuncionarios.getCurrentFuncionario();
            if (funcionarioData) {
              setUser({
                id: funcionarioData.id,
                nome: funcionarioData.nome,
                tipo: "funcionario",
                userData: funcionarioData
              });
            }
          }
        } catch (error) {
          console.error("💥 Erro ao buscar dados do usuário:", error);
          setUser(null);
        }
      } else if (event === "SIGNED_OUT") {
        console.log("🚪 Usuário desconectado");
        setUser(null);
      } else if (event === "INITIAL_SESSION" && session?.user) {
        try {
          console.log("🔄 Sessão inicial encontrada, detectando tipo...");
          const email = session.user.email;

          if (email && !email.includes("@chefcomanda.com")) {
            // É um administrador
            console.log("👑 Detectado como administrador");
            const userData = await getCurrentUser();
            if (userData) {
              setUser({
                id: userData.id,
                email: userData.email,
                nome: userData.nome_completo,
                tipo: "admin",
                userData
              });
            }
          } else {
            // É um funcionário
            console.log("👷 Detectado como funcionário");
            const funcionarioData =
              await authFuncionarios.getCurrentFuncionario();
            if (funcionarioData) {
              setUser({
                id: funcionarioData.id,
                nome: funcionarioData.nome,
                tipo: "funcionario",
                userData: funcionarioData
              });
            }
          }
        } catch (error) {
          console.error("💥 Erro ao buscar dados da sessão inicial:", error);
          setUser(null);
        }
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const isAuthenticated = !!user;
  const isAdmin = user?.tipo === "admin";
  const isFuncionario = user?.tipo === "funcionario";

  console.log("🎯 Estado atual do useAuth:", {
    user: !!user,
    isLoading,
    isAuthenticated,
    tipo: user?.tipo,
    isAdmin,
    isFuncionario
  });

  return {
    user,
    isLoading,
    isAuthenticated,
    isAdmin,
    isFuncionario
  };
};
