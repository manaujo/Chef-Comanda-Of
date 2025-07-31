import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  ChefHat,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  Coffee,
  UtensilsCrossed,
  Timer
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { comandaItensService, subscribeToTable } from "@/lib/database";
import type { ComandaItem, CategoriaProduto } from "@/types/database";

const Cozinha = () => {
  const [itens, setItens] = useState<ComandaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadItensCozinha();

    // Atualizar a cada 15 segundos para KDS
    const interval = setInterval(loadItensCozinha, 15000);
    
    // Subscrever a mudanças em tempo real
    const unsubscribe = subscribeToTable(
      'comanda_itens',
      () => {
        loadItensCozinha();
      }
    );
    
    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  const loadItensCozinha = async () => {
    try {
      setLoading(true);
      const data = await comandaItensService.getByCozinha();
      
      // Ordenar por prioridade: aguardando primeiro, depois por data de criação
      const itensSorted = data.sort((a, b) => {
        // Prioridade por status
        const statusPriority = { 'aguardando': 1, 'preparando': 2, 'pronto': 3 };
        const priorityA = statusPriority[a.status as keyof typeof statusPriority] || 4;
        const priorityB = statusPriority[b.status as keyof typeof statusPriority] || 4;
        
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        
        // Se mesmo status, ordenar por data (mais antigo primeiro)
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
      
      setItens(itensSorted);
    } catch (error) {
      console.error("Erro ao carregar itens da cozinha:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar itens da cozinha.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateItemStatus = async (itemId: string, newStatus: string) => {
    try {
      await comandaItensService.updateStatus(itemId, newStatus as any);
      toast({
        title: "Status atualizado",
        description: "Status do item atualizado com sucesso."
      });
      loadItensCozinha();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do item.",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aguardando":
        return "destructive";
      case "preparando":
        return "default";
      case "pronto":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "aguardando":
        return <AlertCircle className="h-5 w-5" />;
      case "preparando":
        return <Play className="h-5 w-5" />;
      case "pronto":
        return <CheckCircle className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case "aguardando":
        return "preparando";
      case "preparando":
        return "pronto";
      default:
        return currentStatus;
    }
  };

  const getNextStatusLabel = (currentStatus: string) => {
    switch (currentStatus) {
      case "aguardando":
        return "Iniciar Preparo";
      case "preparando":
        return "Marcar Pronto";
      default:
        return "Atualizar";
    }
  };

  const canUpdateStatus = (status: string) => {
    return ["aguardando", "preparando"].includes(status);
  };

  const calcularTempoEspera = (dataCreated: string) => {
    const agora = new Date();
    const criacao = new Date(dataCreated);
    const diffMs = agora.getTime() - criacao.getTime();
    const diffMinutos = Math.floor(diffMs / (1000 * 60));
    
    return diffMinutos;
  };

  const getTempoCorClass = (minutos: number) => {
    if (minutos <= 15) return "text-green-600";
    if (minutos <= 30) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  const itensPendentes = itens.filter((item) =>
    ["aguardando", "preparando", "pronto"].includes(item.status)
  );

  const categorias: { key: CategoriaProduto; label: string; icon: any; color: string }[] = [
    { key: "entrada", label: "Entradas", icon: Coffee, color: "bg-blue-100 border-blue-300" },
    { key: "prato", label: "Pratos Principais", icon: ChefHat, color: "bg-red-100 border-red-300" },
    { key: "bebida", label: "Bebidas", icon: Coffee, color: "bg-green-100 border-green-300" },
    { key: "sobremesa", label: "Sobremesas", icon: UtensilsCrossed, color: "bg-purple-100 border-purple-300" }
  ];

  // Agrupar itens por mesa e categoria para melhor visualização KDS
  const itensPorMesa = itens.reduce((acc, item) => {
    const mesaId = item.comanda?.mesa?.id || 'sem-mesa';
    const mesaNumero = item.comanda?.mesa?.numero || 'Balcão';
    
    if (!acc[mesaId]) {
      acc[mesaId] = {
        mesa: item.comanda?.mesa || null,
        mesaNumero,
        comanda: item.comanda,
        categorias: {}
      };
    }
    
    const categoria = item.produto?.categoria_produto || 'prato';
    if (!acc[mesaId].categorias[categoria]) {
      acc[mesaId].categorias[categoria] = [];
    }
    
    acc[mesaId].categorias[categoria].push(item);
    return acc;
  }, {} as Record<string, {
    mesa: any;
    mesaNumero: string | number;
    comanda: any;
    categorias: Record<string, ComandaItem[]>;
  }>);

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="space-y-6 p-4 lg:p-6">
          {/* Header KDS */}
          <div className="bg-gray-800 rounded-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl lg:text-5xl font-bold flex items-center space-x-3">
                  <ChefHat className="h-12 w-12 text-orange-500" />
                  <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                    COZINHA KDS
                  </span>
                </h1>
                <p className="text-xl text-gray-300 mt-2">
                  Sistema de Display da Cozinha - {new Date().toLocaleTimeString('pt-BR')}
                </p>
              </div>
              
              <div className="text-right">
                <div className="text-3xl font-bold text-orange-400">
                  {itensPendentes.length}
                </div>
                <div className="text-gray-400">Pedidos Ativos</div>
              </div>
            </div>
          </div>

          {/* Stats KDS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-red-900 border-red-700">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-2">
                  <AlertCircle className="h-8 w-8 text-red-400" />
                </div>
                <div className="text-3xl font-bold text-red-400">
                  {itensPendentes.filter((i) => i.status === "aguardando").length}
                </div>
                <div className="text-red-200 font-medium">AGUARDANDO</div>
              </CardContent>
            </Card>

            <Card className="bg-blue-900 border-blue-700">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Play className="h-8 w-8 text-blue-400" />
                </div>
                <div className="text-3xl font-bold text-blue-400">
                  {itensPendentes.filter((i) => i.status === "preparando").length}
                </div>
                <div className="text-blue-200 font-medium">EM PREPARO</div>
              </CardContent>
            </Card>

            <Card className="bg-green-900 border-green-700">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-2">
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
                <div className="text-3xl font-bold text-green-400">
                  {itensPendentes.filter((i) => i.status === "pronto").length}
                </div>
                <div className="text-green-200 font-medium">PRONTOS</div>
              </CardContent>
            </Card>

            <Card className="bg-orange-900 border-orange-700">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Timer className="h-8 w-8 text-orange-400" />
                </div>
                <div className="text-3xl font-bold text-orange-400">
                  {Math.round(itensPendentes.reduce((acc, item) => acc + calcularTempoEspera(item.created_at), 0) / Math.max(1, itensPendentes.length))}
                </div>
                <div className="text-orange-200 font-medium">TEMPO MÉDIO (min)</div>
              </CardContent>
            </Card>
          </div>

          {/* Itens por Mesa - Layout KDS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {Object.values(itensPorMesa).map((mesaData) => (
              <Card key={mesaData.mesa?.id || 'sem-mesa'} className="bg-gray-800 border-gray-700 hover:shadow-2xl transition-all duration-300">
                <CardHeader className="pb-4 bg-gray-700 rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl font-bold text-white">
                      MESA {mesaData.mesaNumero}
                    </CardTitle>
                    <div className="text-right">
                      <div className="text-lg font-bold text-orange-400">
                        COMANDA #{mesaData.comanda?.numero}
                      </div>
                      {mesaData.comanda?.garcom_funcionario && (
                        <div className="text-sm text-gray-300">
                          {mesaData.comanda.garcom_funcionario.nome}
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  {categorias.map((categoria) => {
                    const itensCategoria = mesaData.categorias[categoria.key] || [];
                    if (itensCategoria.length === 0) return null;

                    return (
                      <div key={categoria.key} className={`border-2 rounded-lg p-4 ${categoria.color}`}>
                        <h4 className="font-bold mb-3 flex items-center space-x-2 text-gray-800">
                          <categoria.icon className="h-5 w-5" />
                          <span className="text-lg">{categoria.label}</span>
                        </h4>
                        <div className="space-y-3">
                          {itensCategoria.map((item) => {
                            const tempoEspera = calcularTempoEspera(item.created_at);
                            return (
                              <div
                                key={item.id}
                                className="bg-white rounded-lg p-4 shadow-lg border-l-4 border-l-orange-500"
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex-1">
                                    <div className="text-xl font-bold text-gray-900">
                                      {item.quantidade}x {item.produto?.nome}
                                    </div>
                                    {item.observacoes && (
                                      <div className="text-sm text-red-600 font-medium mt-1 bg-red-50 p-2 rounded">
                                        ⚠️ OBS: {item.observacoes}
                                      </div>
                                    )}
                                    <div className="flex items-center space-x-4 mt-2">
                                      <div className={`text-sm font-bold ${getTempoCorClass(tempoEspera)}`}>
                                        <Timer className="h-4 w-4 inline mr-1" />
                                        {tempoEspera} min
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {new Date(item.created_at).toLocaleTimeString("pt-BR", {
                                          hour: "2-digit",
                                          minute: "2-digit"
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end space-y-2">
                                    <Badge 
                                      variant={getStatusColor(item.status)}
                                      className="text-lg px-4 py-2"
                                    >
                                      {getStatusIcon(item.status)}
                                      <span className="ml-2 font-bold">
                                        {item.status === "aguardando" && "AGUARDANDO"}
                                        {item.status === "preparando" && "PREPARANDO"}
                                        {item.status === "pronto" && "PRONTO"}
                                      </span>
                                    </Badge>
                                    {canUpdateStatus(item.status) && (
                                      <Button
                                        size="lg"
                                        onClick={() =>
                                          handleUpdateItemStatus(
                                            item.id,
                                            getNextStatus(item.status)
                                          )
                                        }
                                        variant={item.status === "aguardando" ? "destructive" : "default"}
                                        className="font-bold text-lg px-6 py-3"
                                      >
                                        {getNextStatusLabel(item.status)}
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </div>

          {Object.keys(itensPorMesa).length === 0 && (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="text-center py-20">
                <ChefHat className="h-20 w-20 text-gray-500 mx-auto mb-6" />
                <h3 className="text-3xl font-bold mb-4 text-gray-300">
                  Nenhum pedido na cozinha
                </h3>
                <p className="text-xl text-gray-400">
                  Todos os pedidos foram preparados e entregues.
                </p>
                <div className="mt-6 text-6xl">🎉</div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Cozinha;