import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useFuncionario } from "@/hooks/useFuncionario";
import { signOut } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import {
  ChefHat,
  Home,
  Users,
  UtensilsCrossed,
  Package,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Coffee,
  CreditCard,
  Clock,
  ShoppingCart,
  AlertTriangle
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar = ({ isOpen, onToggle }: SidebarProps) => {
  const { user } = useAuth();
  const { funcionario } = useFuncionario();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso."
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

  const menuItems = [
    {
      title: "Dashboard",
      icon: Home,
      href: "/dashboard",
      roles: ["administrador", "garcom", "caixa", "estoque", "cozinha"]
    },
    {
      title: "Mesas",
      icon: Coffee,
      href: "/mesas",
      roles: ["administrador", "garcom"]
    },
    {
      title: "Comandas",
      icon: UtensilsCrossed,
      href: "/comandas",
      roles: ["administrador", "garcom", "caixa"]
    },
    {
      title: "Cozinha",
      icon: ChefHat,
      href: "/cozinha",
      roles: ["administrador", "cozinha"]
    },
    {
      title: "PDV",
      icon: CreditCard,
      href: "/pdv",
      roles: ["administrador", "caixa"]
    },
    {
      title: "Produtos",
      icon: ShoppingCart,
      href: "/produtos",
      roles: ["administrador"]
    },
    {
      title: "Estoque",
      icon: Package,
      href: "/estoque",
      roles: ["administrador", "estoque"]
    },
    {
      title: "Turnos",
      icon: Clock,
      href: "/turnos",
      roles: ["administrador", "caixa"]
    },
    {
      title: "Relatórios",
      icon: BarChart3,
      href: "/relatorios",
      roles: ["administrador"]
    },
    {
      title: "Funcionários",
      icon: Users,
      href: "/gerenciar-funcionarios",
      roles: ["administrador"]
    },
    {
      title: "Configurações",
      icon: Settings,
      href: "/configuracoes",
      roles: ["administrador"]
    }
  ];

  const filteredMenuItems = menuItems.filter(
    (item) => 
      (user && item.roles.includes(user.tipo)) ||
      (funcionario && item.roles.includes(funcionario.tipo))
  );

  const isActive = (href: string) => location.pathname === href;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed top-0 left-0 h-full w-64 bg-card border-r border-border z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:static lg:translate-x-0 lg:z-auto lg:flex-shrink-0 lg:w-64
      `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center space-x-2">
              <ChefHat className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                ChefComanda
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="lg:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* User info */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-primary font-semibold">
                  {(user?.nome_completo || funcionario?.nome || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.nome_completo || funcionario?.nome || 'Usuário'}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {funcionario?.tipo || 'Usuário'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-1">
              {filteredMenuItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      onToggle();
                    }
                  }}
                  className={`
                    flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${
                      isActive(item.href)
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    }
                  `}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              ))}
            </nav>
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4 mr-3" />
              Sair
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
