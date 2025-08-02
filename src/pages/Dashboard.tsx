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
  ChefHat,
  Calendar,
  ShoppingCart
} from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import {
  mesasService,
  comandasService,
  vendasService,
  turnosService
} from "@/lib/database";
import { insumosEstoqueService } from "@/lib/estoque";
import type { Mesa, Comanda, Venda, Turno } from "@/types/database";

const Dashboard = () => {
  const { user } = useAuth();
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [comandas, setComandasAbertas] = useState<Comanda[]>([]);
  const [vendasHoje, setVendasHoje] = useState<Venda[]>([]);
  const [vendasMes, setVendasMes] = useState<Venda[]>([]);
  const [turnoAtivo, setTurnoAtivo] = useState<Turno | null>(null);
  const [insumosEstoqueBaixo, setInsumosEstoqueBaixo] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    
    // Atualizar dados a cada 30 segundos
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const hoje = new Date();
      const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).toISOString();
      const fimHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59).toISOString();
      
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString();
      const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59).toISOString();

      const [
        mesasData, 
        comandasData, 
        vendasHojeData, 
        vendasMesData,
        turnoAtivoData,
        insumosData
      ] = await Promise.all([
        mesasService.getAll(),
        comandasService.getAbertas(),
        vendasService.getByPeriodo(inicioHoje, fimHoje),
        vendasService.getByPeriodo(inicioMes, fimMes),
        turnosService.getTurnoAtivo(),
        insumosEstoqueService.getEstoqueBaixo()
      ]);

      setMesas(mesasData);
      setComandasAbertas(comandasData);
      setVendasHoje(vendasHojeData);
      setVendasMes(vendasMesData);
      setTurnoAtivo(turnoAtivoData);
      setInsumosEstoqueBaixo(insumosData);
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const mesasOcupadas = mesas.filter(mesa => mesa.status === "ocupada").length;
  const mesasLivres = mesas.filter(mesa => mesa.status === "livre").length;
  const mesasProntas = mesas.filter(mesa => mesa.status === "fechada" || mesa.status === "aguardando_pagamento").length;
  
  const totalVendasHoje = vendasHoje.reduce((total, venda) => total + venda.valor_final, 0);
  const totalVendasMes = vendasMes.reduce((total, venda) => total + venda.valor_final, 0);
  const ticketMedioHoje = vendasHoje.length > 0 ? totalVendasHoje / vendasHoje.length : 0;
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
              Bem-vindo, {user?.nome}!
            </p>
            <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
              {user?.tipo === "admin"
                ? (user?.userData as any)?.nome_restaurante
                : "Restaurante"}{" "}
              •{" "}
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
              {turnoAtivo ? (
                <Badge variant="secondary">Turno Ativo</Badge>
              ) : (
                <Badge variant="destructive">Sem Turno</Badge>
              )}
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

        {/* Summary Cards - Vendas e Operações */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3 lg:gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-3 sm:p-4 lg:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-green-700">
                    Vendas Hoje
                  </p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-800">
                    R$ {totalVendasHoje.toFixed(2)}
                  </p>
                  <p className="text-xs text-green-600">
                    {vendasHoje.length} vendas
                  </p>
                </div>
                <div className="p-2 bg-green-200 rounded-full">
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-3 sm:p-4 lg:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-blue-700">
                    Vendas do Mês
                  </p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-800">
                    R$ {totalVendasMes.toFixed(2)}
                  </p>
                  <p className="text-xs text-blue-600">
                    {vendasMes.length} vendas
                  </p>
                </div>
                <div className="p-2 bg-blue-200 rounded-full">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-3 sm:p-4 lg:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-purple-700">
                    Ticket Médio Hoje
                  </p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-800">
                    R$ {ticketMedioHoje.toFixed(2)}
                  </p>
                  <p className="text-xs text-purple-600">
                    Por venda
                  </p>
                </div>
                <div className="p-2 bg-purple-200 rounded-full">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-3 sm:p-4 lg:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-orange-700">
                    Comandas Abertas
                  </p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-800">
                    {comandasAbertas}
                  </p>
                  <p className="text-xs text-orange-600">
                    Em andamento
                  </p>
                </div>
                <div className="p-2 bg-orange-200 rounded-full">
                  <UtensilsCrossed className="h-4 w-4 sm:h-5 sm:w-5 text-orange-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200">
            <CardContent className="p-3 sm:p-4 lg:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-cyan-700">
                    Mesas Ocupadas
                  </p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-cyan-800">
                    {mesasOcupadas}/{mesas.length}
                  </p>
                  <p className="text-xs text-cyan-600">
                    {mesasLivres} livres, {mesasProntas} prontas
                  </p>
                </div>
                <div className="p-2 bg-cyan-200 rounded-full">
                  <Coffee className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-br ${insumosEstoqueBaixo.length > 0 ? 'from-red-50 to-red-100 border-red-200' : 'from-gray-50 to-gray-100 border-gray-200'}`}>
            <CardContent className="p-3 sm:p-4 lg:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs sm:text-sm font-medium ${insumosEstoqueBaixo.length > 0 ? 'text-red-700' : 'text-gray-700'}`}>
                    Estoque Baixo
                  </p>
                  <p className={`text-lg sm:text-xl lg:text-2xl font-bold ${insumosEstoqueBaixo.length > 0 ? 'text-red-800' : 'text-gray-800'}`}>
                    {insumosEstoqueBaixo.length}
                  </p>
                  <p className={`text-xs ${insumosEstoqueBaixo.length > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                    Insumos abaixo do mínimo
                  </p>
                </div>
                <div className={`p-2 rounded-full ${insumosEstoqueBaixo.length > 0 ? 'bg-red-200' : 'bg-gray-200'}`}>
                  <AlertTriangle className={`h-4 w-4 sm:h-5 sm:w-5 ${insumosEstoqueBaixo.length > 0 ? 'text-red-700' : 'text-gray-700'}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 lg:gap-6">
          {/* Status das Mesas */}
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
                          className={`w-3 h-3 rounded-full ${
                            mesa.status === "livre"
                              ? "bg-green-500"
                              : mesa.status === "ocupada"
                              ? "bg-red-500"
                              : mesa.status === "fechada" || mesa.status === "aguardando_pagamento"
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
                            : mesa.status === "fechada" || mesa.status === "aguardando_pagamento"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {mesa.status === "livre" && <CheckCircle className="h-3 w-3 mr-1" />}
                        {mesa.status === "ocupada" && <Clock className="h-3 w-3 mr-1" />}
                        {(mesa.status === "fechada" || mesa.status === "aguardando_pagamento") && <UtensilsCrossed className="h-3 w-3 mr-1" />}
                        {mesa.status === "livre" && "Livre"}
                        {mesa.status === "ocupada" && "Ocupada"}
                        {(mesa.status === "fechada" || mesa.status === "aguardando_pagamento") && "Pronta"}
                        {mesa.status === "reservada" && "Reservada"}
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

          {/* Comandas Abertas */}
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
                          <span className="text-sm text-muted-foreground ml-4">
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

          {/* Vendas do Dia */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Vendas Hoje</span>
                </CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/relatorios">
                    Ver relatórios
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
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-xl font-bold text-green-600">
                        {vendasHoje.length}
                      </div>
                      <div className="text-sm text-green-700">Vendas</div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-xl font-bold text-blue-600">
                        R$ {ticketMedioHoje.toFixed(2)}
                      </div>
                      <div className="text-sm text-blue-700">Ticket Médio</div>
                    </div>
                  </div>
                  
                  {vendasHoje.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Últimas vendas:</h4>
                      {vendasHoje.slice(0, 3).map((venda) => (
                        <div key={venda.id} className="flex justify-between text-sm">
                          <span>Comanda #{venda.comanda?.numero}</span>
                          <span className="font-medium">R$ {venda.valor_final.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ações Rápidas Adicionais */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ShoppingCart className="h-5 w-5" />
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

        {/* Alertas de Estoque */}
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
                        {insumo.saldo_atual} {insumo.unidade}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Mín: {insumo.quantidade_minima} {insumo.unidade}
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

        {/* Status do Turno */}
        {turnoAtivo && (
          <Card className="bg-green-50 border-green-200 hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2 text-green-800">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Turno Ativo</span>
                </CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/turnos">
                    Gerenciar
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Operador:</span>
                  <p className="font-medium">
                    {turnoAtivo.operador_funcionario?.nome || turnoAtivo.operador?.nome_completo}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Valor Inicial:</span>
                  <p className="font-medium">R$ {turnoAtivo.valor_inicial.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Início:</span>
                  <p className="font-medium">
                    {new Date(turnoAtivo.data_abertura).toLocaleTimeString("pt-BR")}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Vendas Hoje:</span>
                  <p className="font-medium">R$ {totalVendasHoje.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;