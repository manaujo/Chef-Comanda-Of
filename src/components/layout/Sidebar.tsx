import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Home, Users, Package, ShoppingCart, Clock, ChefHat, BarChart3, Settings, TableProperties, Receipt, Asterisk as CashRegister, Menu, X, LogOut, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { insumosEstoqueService } from '@/lib/estoque';

const sidebarItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: Home
  },
  {
    title: 'PDV',
    href: '/pdv',
    icon: CashRegister
  },
  {
    title: 'Mesas',
    href: '/mesas',
    icon: TableProperties
  },
  {
    title: 'Comandas',
    href: '/comandas',
    icon: Receipt
  },
  {
    title: 'Produtos',
    href: '/produtos',
    icon: Package
  },
  {
    title: 'Estoque',
    href: '/estoque',
    icon: ShoppingCart
  },
  {
    title: 'Cozinha',
    href: '/cozinha',
    icon: ChefHat
  },
  {
    title: 'Turnos',
    href: '/turnos',
    icon: Clock
  },
  {
    title: 'Funcionários',
    href: '/funcionarios',
    icon: Users
  },
  {
    title: 'Relatórios',
    href: '/relatorios',
    icon: BarChart3
  },
  {
    title: 'Configurações',
    href: '/configuracoes',
    icon: Settings
  }
];

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

export function Sidebar({ isOpen, onToggle, className }: SidebarProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const [insumosEstoqueBaixo, setInsumosEstoqueBaixo] = useState<any[]>([]);

  useEffect(() => {
    loadEstoqueBaixo();
    
    // Verificar estoque baixo a cada 5 minutos
    const interval = setInterval(loadEstoqueBaixo, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadEstoqueBaixo = async () => {
    try {
      const data = await insumosEstoqueService.getEstoqueBaixo();
      setInsumosEstoqueBaixo(data);
    } catch (error) {
      console.error("Erro ao carregar estoque baixo:", error);
      // Não mostrar erro se for problema de autenticação
      if (!error?.message?.includes('Usuário não autenticado')) {
        // Silenciar erro para não poluir o console
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso."
      });
    } catch (error) {
      console.error("Erro no logout:", error);
      toast({
        title: "Erro",
        description: "Erro ao fazer logout.",
        variant: "destructive"
      });
    }
  };

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
      <div className={cn(
        "fixed left-0 top-0 z-50 h-full w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto",
        isOpen ? "translate-x-0" : "-translate-x-full",
        className
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center space-x-2">
              <ChefHat className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">ChefComanda</span>
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

          {/* User Info */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.nome}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.tipo === "admin" ? "Administrador" : 
                   user?.tipo === "funcionario" ? (user?.userData as any)?.tipo : user?.tipo}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-4">
            <div className="px-3">
              <h2 className="mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Menu Principal
              </h2>
              <div className="space-y-1">
                {sidebarItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  const isEstoque = item.href === '/estoque';
                  
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => {
                        // Fechar sidebar no mobile após clicar
                        if (window.innerWidth < 1024) {
                          onToggle();
                        }
                      }}
                      className={cn(
                        "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                        isActive 
                          ? "bg-accent text-accent-foreground" 
                          : "text-muted-foreground"
                      )}
                    >
                      <div className="flex items-center">
                        <Icon className="mr-3 h-4 w-4" />
                        {item.title}
                      </div>
                      {isEstoque && insumosEstoqueBaixo.length > 0 && (
                        <Badge variant="destructive" className="ml-2">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {insumosEstoqueBaixo.length}
                        </Badge>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export default Sidebar;