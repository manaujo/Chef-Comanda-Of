import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("🛡️ ProtectedRoute - Estado:", {
      isLoading,
      isAuthenticated,
      hasUser: !!user
    });

    if (!isLoading && !isAuthenticated) {
      console.log("🚫 Usuário não autenticado, redirecionando para login");
      navigate("/login");
    } else if (!isLoading && isAuthenticated) {
      console.log("✅ Usuário autenticado, permitindo acesso ao dashboard");
    }
  }, [isLoading, isAuthenticated, navigate, user]);

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

  console.log("✅ ProtectedRoute - Renderizando conteúdo protegido");
  return <>{children}</>;
};

export default ProtectedRoute;
