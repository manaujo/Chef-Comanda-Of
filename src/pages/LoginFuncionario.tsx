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
import { ChefHat, LogIn, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { authFuncionarios } from "@/lib/funcionarios";

const LoginFuncionario = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

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
    console.log("🚀 Iniciando processo de login do funcionário...");
    setIsLoading(true);

    try {
      // Remover formatação do CPF
      const cpfLimpo = cpf.replace(/\D/g, "");
      
      if (cpfLimpo.length !== 11) {
        throw new Error("CPF deve ter 11 dígitos");
      }

      console.log("📧 Tentando fazer login com CPF:", cpfLimpo);
      const result = await authFuncionarios.signInWithCpf(cpfLimpo, password);
      console.log("✅ Login bem-sucedido:", result);

      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao ChefComanda.",
        variant: "default"
      });

      console.log("⏳ Aguardando 1 segundo antes do redirecionamento...");
      setTimeout(() => {
        console.log("🔄 Redirecionando para /dashboard...");
        navigate("/dashboard");
      }, 1000);
    } catch (error: any) {
      console.error("💥 Erro no login:", error);

      let errorMessage = "CPF ou senha incorretos.";

      if (error.message?.includes("Invalid login credentials")) {
        errorMessage = "CPF ou senha incorretos.";
      } else if (error.message?.includes("CPF deve ter 11 dígitos")) {
        errorMessage = "CPF deve ter 11 dígitos.";
      } else if (error.message?.includes("Too many requests")) {
        errorMessage = "Muitas tentativas. Tente novamente em alguns minutos.";
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
              Entre com seu CPF e senha para acessar o sistema
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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

export default LoginFuncionario;