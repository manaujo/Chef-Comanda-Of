import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  ChefHat,
  X,
  Coffee,
  UtensilsCrossed,
  DollarSign,
  BarChart3,
  Package,
  Settings,
  Users,
  LogOut,
  Clock,
  ShoppingCart
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar = ({ isOpen, onToggle }: SidebarProps) => {
  const { user } = useAuth();
  const location = useLocation();
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
      navigate("/login");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      toast({
        title: "Erro",
        description: "Erro ao fazer logout. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const getNavigationItems = () => {
    if (!user) return [];

    const baseItems = [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: ChefHat,
        roles: [
          "admin",
          "administrador",
          "garcom",
          "caixa",
          "estoque",
          "cozinha"
        ]
      },
      {
        title: "Mesas",
        href: "/mesas",
        icon: Coffee,
        roles: ["admin", "administrador", "garcom"]
      },
      {
        title: "Comandas",
        href: "/comandas",
        icon: UtensilsCrossed,
        roles: ["admin", "administrador", "garcom", "caixa"]
      },
      {
        title: "PDV",
        href: "/pdv",
        icon: DollarSign,
        roles: ["admin", "administrador", "caixa"]
      },
      {
        title: "Cozinha",
        href: "/cozinha",
        icon: ChefHat,
        roles: ["admin", "administrador", "cozinha"]
      },
      {
        title: "Produtos",
        href: "/produtos",
        icon: ShoppingCart,
        roles: ["admin", "administrador", "estoque"]
      },
      {
        title: "Estoque",
        href: "/estoque",
        icon: Package,
        roles: ["admin", "administrador", "estoque"]
      },
      {
        title: "Turnos",
        href: "/turnos",
        icon: Clock,
        roles: ["admin", "administrador", "caixa"]
      },
      {
        title: "Relatórios",
        href: "/relatorios",
        icon: BarChart3,
        roles: ["admin", "administrador", "caixa", "estoque"]
      }
    ];

    // Se for administrador, adicionar itens administrativos
    if (user.tipo === "admin") {
      baseItems.push(
        {
          title: "Funcionários",
          href: "/funcionarios",
          icon: Users,
          roles: ["admin"]
        },
        {
          title: "Funcionários",
          href: "/gerenciar-funcionarios",
          icon: Users,
          roles: ["admin"]
        },
        {
          title: "Configurações",
          href: "/configuracoes",
          icon: Settings,
          roles: ["admin"]
        }
      );
    } else if (user.tipo === "funcionario") {
      const funcionarioData = user.userData as any;
      if (funcionarioData?.tipo === "administrador") {
        baseItems.push(
          {
            title: "Gerenciar Funcionários",
            href: "/gerenciar-funcionarios",
            icon: Users,
            roles: ["administrador"]
          },
          {
            title: "Configurações",
            href: "/configuracoes",
            icon: Settings,
            roles: ["administrador"]
          }
        );
      }
    }

    return baseItems;
  };

  const navigationItems = getNavigationItems();

  return (
    <>
      {/* Overlay para mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 z-50 h-full w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
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
                  {user?.nome.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.nome}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {user?.tipo === "admin"
                    ? "Administrador"
                    : (user?.userData as any)?.tipo || "Usuário"}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                    onClick={() => {
                      // Fechar sidebar no mobile após clicar
                      if (window.innerWidth < 1024) {
                        onToggle();
                      }
                    }}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-foreground"
              onClick={handleLogout}
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
