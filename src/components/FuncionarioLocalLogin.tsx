import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldX } from "lucide-react";

// Este componente não é mais necessário pois os funcionários não fazem login
// Mantido apenas para compatibilidade, mas sempre retorna acesso negado

interface FuncionarioLocalLoginProps {
  allowedTypes: string[];
  title: string;
  description: string;
  children: React.ReactNode;
}

const FuncionarioLocalLogin = ({ 
  title, 
  children 
}: FuncionarioLocalLoginProps) => {
  // Como os funcionários não fazem mais login, sempre renderizar o conteúdo
  // O controle de acesso agora é feito apenas pelo administrador
  return <>{children}</>;
};

export default FuncionarioLocalLogin;