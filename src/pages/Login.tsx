import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChefHat, LogIn, Eye, EyeOff, User, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { authFuncionarios } from "@/lib/funcionarios";
import { funcionariosService } from "@/lib/funcionarios";
import { signIn } from "@/lib/auth";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loginType, setLoginType] = useState<"admin" | "funcionario">("admin");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (loginType === "admin") {
        // Login de administrador com email e senha
        await signIn(email, password);
        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo ao sistema",
          variant: "default"
        });
        navigate("/dashboard");
      } else {
        // Login de funcionário com CPF e senha
        const cpfLimpo = cpf.replace(/\D/g, "");
        if (cpfLimpo.length !== 11) {
          throw new Error("CPF deve ter 11 dígitos");
        }

        // Login no Supabase Auth
        await authFuncionarios.signInWithCpf(cpfLimpo, password);

        // Buscar dados do funcionário
        const funcionario = await funcionariosService.getByCpf(cpfLimpo);
        if (!funcionario) throw new Error("Usuário não encontrado");
        if (!funcionario.ativo) throw new Error("Usuário inativo");

        // Redirecionamento por tipo
        switch (funcionario.tipo) {
          case "administrador":
            navigate("/dashboard");
            break;
          case "garcom":
            navigate("/mesas");
            break;
          case "caixa":
            navigate("/pdv");
            break;
          case "cozinha":
            navigate("/cozinha");
            break;
          case "estoque":
            navigate("/produtos");
            break;
          default:
            navigate("/dashboard");
        }

        toast({
          title: "Login realizado com sucesso!",
          description: `Bem-vindo, ${funcionario.nome}`,
          variant: "default"
        });
      }
    } catch (error: any) {
      let errorMessage = "Credenciais incorretas.";

      if (loginType === "admin") {
        if (error.message?.includes("Invalid login credentials")) {
          errorMessage = "Email ou senha incorretos.";
        } else if (error.message?.includes("Email not confirmed")) {
          errorMessage =
            "Email não confirmado. Verifique sua caixa de entrada.";
        }
      } else {
        if (error.message?.includes("inativo")) {
          errorMessage = "Usuário inativo";
        } else if (error.message?.includes("11 dígitos")) {
          errorMessage = "CPF deve ter 11 dígitos.";
        } else if (
          error.message?.includes("not found") ||
          error.message?.includes("não encontrado")
        ) {
          errorMessage = "Usuário não encontrado.";
        } else if (error.message?.includes("Too many requests")) {
          errorMessage =
            "Muitas tentativas. Tente novamente em alguns minutos.";
        }
      }

      toast({
        title: "Erro no login",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-primary/5 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-warm border-border/50">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <ChefHat className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl bg-gradient-primary bg-clip-text text-transparent">
              ChefComanda
            </CardTitle>
            <CardDescription>
              Acesse o sistema com suas credenciais
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Seletor de tipo de login */}
            <div className="flex rounded-lg border border-border p-1 mb-6">
              <Button
                type="button"
                variant={loginType === "admin" ? "default" : "ghost"}
                size="sm"
                className="flex-1"
                onClick={() => setLoginType("admin")}
              >
                <User className="h-4 w-4 mr-2" />
                Administrador
              </Button>
              <Button
                type="button"
                variant={loginType === "funcionario" ? "default" : "ghost"}
                size="sm"
                className="flex-1"
                onClick={() => setLoginType("funcionario")}
              >
                <Users className="h-4 w-4 mr-2" />
                Funcionário
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {loginType === "admin" ? (
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              ) : (
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
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                variant="hero"
                disabled={isLoading}
              >
                {isLoading ? (
                  "Entrando..."
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Entrar
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <Link
                to="/esqueci-senha"
                className="text-sm text-primary hover:underline"
              >
                Esqueci minha senha
              </Link>
              <div className="pt-4 border-t border-border">
                <Link
                  to="/"
                  className="text-sm text-muted-foreground hover:text-primary transition-smooth"
                >
                  ← Voltar ao site
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
