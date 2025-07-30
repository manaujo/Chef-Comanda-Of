import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Home, Users, Package, ShoppingCart, Clock, ChefHat, BarChart3, Settings, TableProperties, Receipt, Asterisk as CashRegister } from 'lucide-react';

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
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const location = useLocation();

  return (
    <div className={cn("pb-12 w-64", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Menu
          </h2>
          <div className="space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                    isActive 
                      ? "bg-accent text-accent-foreground" 
                      : "text-muted-foreground"
                  )}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.title}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;