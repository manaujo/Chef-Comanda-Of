import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { ChefHat, LogOut, User, Building } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { signOut } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
        variant: "default"
      });
      navigate("/");
    } catch (error) {
      console.error("Erro no logout:", error);
      toast({
        title: "Erro",
        description: "Erro ao fazer logout.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <ChefHat className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              ChefComanda
            </h1>
          </div>

          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>

        {/* Welcome Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Bem-vindo, {user.nome_completo}!</span>
            </CardTitle>
            <CardDescription>
              Gerencie seu restaurante com facilidade
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Restaurant Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="h-5 w-5" />
              <span>Informações do Restaurante</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Nome do Restaurante
                </label>
                <p className="text-lg font-semibold">{user.nome_restaurante}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Responsável
                </label>
                <p className="text-lg font-semibold">{user.nome_completo}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Email
                </label>
                <p className="text-lg font-semibold">{user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  CPF
                </label>
                <p className="text-lg font-semibold">{user.cpf}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Mesas</CardTitle>
              <CardDescription>
                Gerencie as mesas do seu restaurante
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Gerenciar Mesas
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Comandas</CardTitle>
              <CardDescription>Controle de pedidos e comandas</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Ver Comandas
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Produtos</CardTitle>
              <CardDescription>
                Cadastre e gerencie seus produtos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Gerenciar Produtos
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Relatórios</CardTitle>
              <CardDescription>Visualize relatórios de vendas</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Ver Relatórios
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estoque</CardTitle>
              <CardDescription>Controle de estoque e insumos</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Gerenciar Estoque
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configurações</CardTitle>
              <CardDescription>Configure seu restaurante</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Configurações
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
