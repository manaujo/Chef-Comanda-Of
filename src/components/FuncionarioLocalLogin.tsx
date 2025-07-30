import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { User, LogIn, LogOut, Eye, EyeOff } from "lucide-react";
import { useFuncionarioLocalHook } from "@/hooks/useFuncionarioLocal";
import type { UserType } from "@/types/database";

interface FuncionarioLocalLoginProps {
  allowedTypes: UserType[];
  title: string;
  description: string;
  children: React.ReactNode;
}

const FuncionarioLocalLogin = ({ 
  allowedTypes, 
  title, 
  description, 
  children 
}: FuncionarioLocalLoginProps) => {
  const { funcionario, login, logout, isLoggedIn, isLoading } = useFuncionarioLocalHook();
  const [cpf, setCpf] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  // Máscara de CPF
  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setCpf(formatted);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);

    try {
      const cpfLimpo = cpf.replace(/\D/g, "");
      if (cpfLimpo.length !== 11) {
        throw new Error("CPF deve ter 11 dígitos");
      }

      await login(cpfLimpo, senha);
    } catch (error) {
      // Erro já tratado no hook
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setCpf("");
    setSenha("");
  };

  const getTipoLabel = (tipo: UserType) => {
    switch (tipo) {
      case "administrador":
        return "Administrador";
      case "garcom":
        return "Garçom";
      case "caixa":
        return "Caixa";
      case "estoque":
        return "Estoque";
      case "cozinha":
        return "Cozinha";
      default:
        return tipo;
    }
  };

  const getTipoColor = (tipo: UserType) => {
    switch (tipo) {
      case "administrador":
        return "destructive";
      case "garcom":
        return "default";
      case "caixa":
        return "secondary";
      case "estoque":
        return "outline";
      case "cozinha":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Se funcionário está logado, verificar permissões
  if (isLoggedIn && funcionario) {
    if (!allowedTypes.includes(funcionario.tipo)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-primary/5 p-4">
          <Card className="w-full max-w-md shadow-warm border-border/50">
            <CardHeader className="text-center">
              <CardTitle className="text-destructive">Acesso Negado</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                Você não tem permissão para acessar esta área.
              </p>
              <p className="text-sm text-muted-foreground">
                Área restrita para: {allowedTypes.map(getTipoLabel).join(", ")}
              </p>
              <p className="text-sm text-muted-foreground">
                Seu tipo: {getTipoLabel(funcionario.tipo)}
              </p>
              <Button onClick={handleLogout} variant="outline" className="w-full">
                <LogOut className="h-4 w-4 mr-2" />
                Fazer Logout
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Funcionário logado com permissão - mostrar conteúdo
    return (
      <div className="min-h-screen bg-background">
        {/* Header com info do funcionário */}
        <div className="bg-card border-b border-border p-4">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">
                  Funcionário logado: {funcionario.nome}
                </p>
                <Badge variant={getTipoColor(funcionario.tipo)} className="text-xs">
                  {getTipoLabel(funcionario.tipo)}
                </Badge>
              </div>
            </div>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>

        {/* Conteúdo da página */}
        <div className="container mx-auto p-4">
          {children}
        </div>
      </div>
    );
  }

  // Mostrar tela de login
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-primary/5 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-warm border-border/50">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <User className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">{title}</CardTitle>
            <p className="text-muted-foreground">{description}</p>
            
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-2">Acesso permitido para:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {allowedTypes.map((tipo) => (
                  <Badge key={tipo} variant={getTipoColor(tipo)} className="text-xs">
                    {getTipoLabel(tipo)}
                  </Badge>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  type="text"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={handleCpfChange}
                  maxLength={14}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="senha">Senha</Label>
                <div className="relative">
                  <Input
                    id="senha"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loginLoading}
              >
                {loginLoading ? (
                  "Entrando..."
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Entrar
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-muted-foreground">
                Apenas funcionários autorizados podem acessar esta área.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FuncionarioLocalLogin;