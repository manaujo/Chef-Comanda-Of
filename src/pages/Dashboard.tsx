import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  UtensilsCrossed,
  DollarSign,
  TrendingUp,
  Coffee,
  Clock,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  BarChart3,
  Package,
  CreditCard,
  ChefHat
} from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import {
  mesasService,
  comandasService,
  vendasService,
  insumosService
} from "@/lib/database";
import type { Mesa, Comanda, Venda, Insumo } from "@/types/database";

const Dashboard = () => {
  const { user } = useAuth();
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [comandas, setComandasAbertas] = useState<Comanda[]>([]);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [insumosEstoqueBaixo, setInsumosEstoqueBaixo] = useState<Insumo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [mesasData, comandasData, vendasData, insumosData] =
        await Promise.all([
          mesasService.getAll(),
          comandasService.getAbertas(),
          vendasService.getByPeriodo(
            new Date().toISOString().split("T")[0] + "T00:00:00.000Z",
            new Date().toISOString().split("T")[0] + "T23:59:59.999Z"
          ),
          Promise.resolve([])
        ]);

      setMesas(mesasData);
      setComandasAbertas(comandasData);
      setVendas(vendasData);
      setInsumosEstoqueBaixo(insumosData);
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const mesasOcupadas = mesas.filter(
    (mesa) => mesa.status === "ocupada"
  ).length;
  const mesasLivres = mesas.filter((mesa) => mesa.status === "livre").length;
  const vendasHoje = vendas.reduce(
    (total, venda) => total + venda.valor_final,
    0
  );
  const comandasAbertas = comandas.length;

  const quickActions = [
    {
      title: "Nova Comanda",
      description: "Criar uma nova comanda",
      icon: UtensilsCrossed,
      href: "/comandas",
      color: "bg-blue-500"
    },
    {
      title: "Gerenciar Mesas",
      description: "Ver status das mesas",
      icon: Coffee,
      href: "/mesas",
      color: "bg-green-500"
    },
    {
      title: "PDV",
      description: "Finalizar vendas",
      icon: CreditCard,
      href: "/pdv",
      color: "bg-purple-500"
    },
    {
      title: "Cozinha",
      description: "Acompanhar pedidos",
      icon: ChefHat,
      href: "/cozinha",
      color: "bg-orange-500"
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-4 lg:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 lg:gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mt-1">
              Bem-vindo, {user?.nome_completo}!
            </p>
            <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
              {user?.nome_restaurante} •{" "}
              {new Date().toLocaleDateString("pt-BR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
              })}
            </p>
          </div>
          <div className="text-center sm:text-right flex-shrink-0">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold">
              {new Date().toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit"
              })}
            </div>
            <div className="text-xs sm:text-sm lg:text-base text-muted-foreground">
              Horário atual
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-6 gap-3 lg:gap-4">
          {quickActions.map((action, index) => (
            <Card
              key={index}
              className="hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer group"
            >
              <Link to={action.href}>
                <CardContent className="p-3 sm:p-4 lg:p-5">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div
                      className={`p-2 sm:p-3 rounded-full ${action.color} text-white group-hover:scale-110 transition-transform`}
                    >
                      <action.icon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base group-hover:text-primary transition-colors truncate">
                        {action.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-6 gap-3 lg:gap-4">
          <Card>
            <CardContent className="p-3 sm:p-4 lg:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Vendas Hoje
                  </p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold">
                    R$ {vendasHoje.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {vendas.length} vendas realizadas
                  </p>
                </div>
                <div className="p-2 bg-green-100 rounded-full">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4 lg:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Comandas Abertas
                  </p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold">
                    {comandasAbertas}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Comandas em andamento
                  </p>
                </div>
                <div className="p-2 bg-blue-100 rounded-full">
                  <UtensilsCrossed className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4 lg:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Mesas Ocupadas
                  </p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold">
                    {mesasOcupadas}/{mesas.length}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {mesasLivres} mesas livres
                  </p>
                </div>
                <div className="p-2 bg-orange-100 rounded-full">
                  <Coffee className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4 lg:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Estoque Baixo
                  </p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold">
                    {insumosEstoqueBaixo.length}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Insumos abaixo do mínimo
                  </p>
                </div>
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 lg:gap-6">
          {/* Mesas Status */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Coffee className="h-5 w-5" />
                  <span>Status das Mesas</span>
                </CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/mesas">
                    Ver todas
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-4 bg-muted rounded animate-pulse" />
                </div>
              ) : (
                <div className="space-y-3">
                  {mesas.slice(0, 5).map((mesa) => (
                    <div
                      key={mesa.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            mesa.status === "livre"
                              ? "bg-green-500"
                              : mesa.status === "ocupada"
                              ? "bg-red-500"
                              : mesa.status === "reservada"
                              ? "bg-blue-500"
                              : "bg-gray-500"
                          }`}
                        />
                        <span className="font-medium">Mesa {mesa.numero}</span>
                      </div>
                      <Badge
                        variant={
                          mesa.status === "livre"
                            ? "default"
                            : mesa.status === "ocupada"
                            ? "destructive"
                            : mesa.status === "reservada"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {mesa.status === "livre" && (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        )}
                        {mesa.status === "ocupada" && (
                          <Clock className="h-3 w-3 mr-1" />
                        )}
                        {mesa.status.charAt(0).toUpperCase() +
                          mesa.status.slice(1)}
                      </Badge>
                    </div>
                  ))}
                  {mesas.length > 5 && (
                    <p className="text-sm text-muted-foreground text-center">
                      E mais {mesas.length - 5} mesas...
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comandas Recentes */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <UtensilsCrossed className="h-5 w-5" />
                  <span>Comandas Abertas</span>
                </CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/comandas">
                    Ver todas
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-4 bg-muted rounded animate-pulse" />
                </div>
              ) : comandas.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Nenhuma comanda aberta no momento
                </p>
              ) : (
                <div className="space-y-3">
                  {comandas.slice(0, 5).map((comanda) => (
                    <div
                      key={comanda.id}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          <span className="font-medium">
                            Comanda #{comanda.numero}
                          </span>
                        </div>
                        {comanda.mesa && (
                          <span className="text-sm text-muted-foreground ml-2">
                            Mesa {comanda.mesa.numero}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-medium">
                        R$ {comanda.valor_total.toFixed(2)}
                      </span>
                    </div>
                  ))}
                  {comandas.length > 5 && (
                    <p className="text-sm text-muted-foreground text-center">
                      E mais {comandas.length - 5} comandas...
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ações Rápidas Adicionais */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Ações Rápidas</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <Link to="/produtos">
                  <Package className="h-4 w-4 mr-2" />
                  Gerenciar Produtos
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <Link to="/estoque">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Controlar Estoque
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <Link to="/turnos">
                  <Clock className="h-4 w-4 mr-2" />
                  Gerenciar Turnos
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <Link to="/relatorios">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Ver Relatórios
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <Link to="/funcionarios">
                  <Users className="h-4 w-4 mr-2" />
                  Funcionários
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Alertas de Estoque (apenas para admin e estoque) */}
        {insumosEstoqueBaixo.length > 0 && !loading && (
          <Card className="border-yellow-200 bg-yellow-50 hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2 text-yellow-800">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Alertas de Estoque</span>
                </CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/estoque">
                    Ver estoque
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {insumosEstoqueBaixo.slice(0, 5).map((insumo) => (
                  <div
                    key={insumo.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="font-medium">{insumo.nome}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-yellow-800">
                        {insumo.quantidade_estoque} {insumo.unidade}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Mín: {insumo.estoque_minimo} {insumo.unidade}
                      </div>
                    </div>
                  </div>
                ))}
                {insumosEstoqueBaixo.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center">
                    E mais {insumosEstoqueBaixo.length - 5} insumos...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
