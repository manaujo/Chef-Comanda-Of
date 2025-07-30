import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import type { UserType } from "@/types/database";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserType[];
  requireAdmin?: boolean;
}

const ProtectedRoute = ({
  children,
  allowedRoles,
  requireAdmin = false
}: ProtectedRouteProps) => {
  const { user, isLoading, isAuthenticated, isAdmin, isFuncionario } =
    useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("🛡️ ProtectedRoute - Estado:", {
      isLoading,
      isAuthenticated,
      hasUser: !!user,
      tipo: user?.tipo,
      isAdmin,
      isFuncionario,
      requireAdmin,
      allowedRoles
    });

    if (!isLoading && !isAuthenticated) {
      console.log("🚫 Usuário não autenticado, redirecionando para login");
      navigate("/login");
    } else if (!isLoading && isAuthenticated) {
      // Verificar se requer administrador
      if (requireAdmin && !isAdmin) {
        console.log(
          "🚫 Acesso restrito a administradores, redirecionando para acesso negado"
        );
        navigate("/acesso-negado");
        return;
      }

      // Verificar permissões específicas para funcionários
      if (isFuncionario && allowedRoles) {
        const funcionarioData = user?.userData as any;
        if (
          !funcionarioData?.tipo ||
          !allowedRoles.includes(funcionarioData.tipo)
        ) {
          console.log(
            "🚫 Funcionário sem permissão, redirecionando para acesso negado"
          );
          navigate("/acesso-negado");
          return;
        }
      }

      console.log("✅ Usuário autenticado e com permissão, permitindo acesso");
    }
  }, [
    isLoading,
    isAuthenticated,
    navigate,
    user,
    isAdmin,
    isFuncionario,
    requireAdmin,
    allowedRoles
  ]);

  if (isLoading) {
    console.log("⏳ ProtectedRoute - Carregando...");
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log("❌ ProtectedRoute - Usuário não autenticado");
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Redirecionando...</p>
        </div>
      </div>
    );
  }

  // Verificar permissões específicas
  if (requireAdmin && !isAdmin) {
    console.log("❌ ProtectedRoute - Acesso restrito a administradores");
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Redirecionando...</p>
        </div>
      </div>
    );
  }

  if (isFuncionario && allowedRoles) {
    const funcionarioData = user?.userData as any;
    if (
      !funcionarioData?.tipo ||
      !allowedRoles.includes(funcionarioData.tipo)
    ) {
      console.log("❌ ProtectedRoute - Funcionário sem permissão");
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">Redirecionando...</p>
          </div>
        </div>
      );
    }
  }

  console.log("✅ ProtectedRoute - Renderizando conteúdo protegido");
  return <>{children}</>;
};

export default ProtectedRoute;
