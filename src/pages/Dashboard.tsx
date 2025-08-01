import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase, Empresa } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChefHat, Users, Coffee, BarChart3, Package, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Add delay to prevent navigation throttling
    if (!user) {
      const timer = setTimeout(() => {
        navigate('/login');
      }, 100);
      return () => clearTimeout(timer);
    }

    const fetchEmpresa = async () => {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setEmpresa(data);
      }
    };

    fetchEmpresa();
  }, [user, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (!empresa) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const menuItems = [
    {
      title: "Mesas",
      description: "Controle de mesas e comandas",
      icon: Coffee,
      href: "/mesas",
      color: "bg-gradient-to-br from-primary/10 to-primary/5"
    },
    {
      title: "Cozinha",
      description: "Painel da cozinha",
      icon: ChefHat,
      href: "/cozinha",
      color: "bg-gradient-to-br from-accent/10 to-accent/5"
    },
    {
      title: "PDV",
      description: "Ponto de venda",
      icon: BarChart3,
      href: "/pdv",
      color: "bg-gradient-to-br from-success/10 to-success/5"
    },
    {
      title: "Funcionários",
      description: "Gerenciar equipe",
      icon: Users,
      href: "/funcionarios",
      color: "bg-gradient-to-br from-secondary/10 to-secondary/5"
    },
    {
      title: "Estoque",
      description: "Controle de insumos",
      icon: Package,
      href: "/estoque",
      color: "bg-gradient-to-br from-warning/10 to-warning/5"
    },
    {
      title: "Relatórios",
      description: "Análises e relatórios",
      icon: BarChart3,
      href: "/relatorios",
      color: "bg-gradient-to-br from-primary/10 to-accent/5"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/5">
      <header className="bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <ChefHat className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                {empresa.nome}
              </h1>
              <p className="text-sm text-muted-foreground">Sistema ChefComanda</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Painel de Controle</h2>
          <p className="text-muted-foreground">Gerencie seu restaurante de forma completa</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`${item.color} border-border/50 hover:shadow-warm transition-all duration-300 hover:scale-105 cursor-pointer`}>
                <Link to={item.href}>
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="p-3 rounded-lg bg-white/50">
                        <item.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{item.title}</CardTitle>
                        <CardDescription className="text-base">
                          {item.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Link>
              </Card>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;