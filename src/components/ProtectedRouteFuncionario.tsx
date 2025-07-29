import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useFuncionario } from "@/hooks/useFuncionario";
import type { UserType } from "@/types/database";

interface ProtectedRouteFuncionarioProps {
  children: React.ReactNode;
  allowedRoles?: UserType[];
}

const ProtectedRouteFuncionario = ({ 
  children, 
  allowedRoles 
}: ProtectedRouteFuncionarioProps) => {
  const { funcionario, isLoading, isAuthenticated } = useFuncionario();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("🛡️ ProtectedRouteFuncionario - Estado:", {
      isLoading,
      isAuthenticated,
      hasFuncionario: !!funcionario,
      tipo: funcionario?.tipo,
      allowedRoles
    });

    if (!isLoading && !isAuthenticated) {
      console.log("🚫 Funcionário não autenticado, redirecionando para login");
      navigate("/login-funcionario");
    } else if (!isLoading && isAuthenticated && allowedRoles) {
      // Verificar se o funcionário tem permissão para acessar esta rota
      if (!funcionario?.tipo || !allowedRoles.includes(funcionario.tipo)) {
        console.log("🚫 Funcionário sem permissão, redirecionando para acesso negado");
        navigate("/acesso-negado");
      }
    }
  }, [isLoading, isAuthenticated, navigate, funcionario, allowedRoles]);

  if (isLoading) {
    console.log("⏳ ProtectedRouteFuncionario - Carregando...");
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
    console.log("❌ ProtectedRouteFuncionario - Funcionário não autenticado");
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Redirecionando...</p>
        </div>
      </div>
    );
  }

  if (allowedRoles && funcionario?.tipo && !allowedRoles.includes(funcionario.tipo)) {
    console.log("❌ ProtectedRouteFuncionario - Funcionário sem permissão");
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Redirecionando...</p>
        </div>
      </div>
    );
  }

  console.log("✅ ProtectedRouteFuncionario - Renderizando conteúdo protegido");
  return <>{children}</>;
};

export default ProtectedRouteFuncionario;