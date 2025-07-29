import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldX, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useFuncionario } from "@/hooks/useFuncionario";

const AcessoNegado = () => {
  const { funcionario } = useFuncionario();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-primary/5 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-warm border-border/50">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-destructive/10 rounded-full">
                <ShieldX className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-2xl text-destructive">
              Acesso Negado
            </CardTitle>
          </CardHeader>

          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Você não tem permissão para acessar esta página.
            </p>
            
            {funcionario && (
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm">
                  <strong>Usuário:</strong> {funcionario.nome}
                </p>
                <p className="text-sm">
                  <strong>Tipo:</strong> {funcionario.tipo}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link to="/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar ao Dashboard
                </Link>
              </Button>
              
              <Button variant="outline" asChild className="w-full">
                <Link to="/login-funcionario">
                  Fazer Login Novamente
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AcessoNegado;