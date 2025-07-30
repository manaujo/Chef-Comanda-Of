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
  Pause,
  Coffee,
  UtensilsCrossed
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

    // Atualizar a cada 30 segundos
    const interval = setInterval(loadItensCozinha, 30000);
    
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
      setItens(data);
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
        return <AlertCircle className="h-4 w-4" />;
      case "preparando":
        return <Play className="h-4 w-4" />;
      case "pronto":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
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
    ["enviado", "preparando", "pronto"].includes(item.status)
  );

  const categorias: { key: CategoriaProduto; label: string; icon: any }[] = [
    { key: "entrada", label: "Entradas", icon: Coffee },
    { key: "prato", label: "Pratos Principais", icon: ChefHat },
    { key: "bebida", label: "Bebidas", icon: Coffee },
    { key: "sobremesa", label: "Sobremesas", icon: UtensilsCrossed }
  ];

  // Agrupar itens por mesa e categoria
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
      <div className="space-y-4 lg:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 lg:gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold flex items-center space-x-2">
              <ChefHat className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10" />
              <span>Cozinha</span>
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mt-1">
              Acompanhe e gerencie os pedidos da cozinha
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium">Aguardando</span>
              </div>
              <div className="text-2xl font-bold">
                {itensPendentes.filter((i) => i.status === "aguardando").length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Play className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Em Preparo</span>
              </div>
              <div className="text-2xl font-bold">
                {itensPendentes.filter((i) => i.status === "preparando").length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Prontos</span>
              </div>
              <div className="text-2xl font-bold">
                {itensPendentes.filter((i) => i.status === "pronto").length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">Total Itens</span>
              </div>
              <div className="text-2xl font-bold">{itensPendentes.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Itens por Mesa e Categoria */}
        <div className="space-y-6">
          {Object.values(itensPorMesa).map((mesaData) => (
            <Card key={mesaData.mesa?.id || 'sem-mesa'} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Mesa {mesaData.mesaNumero}
                  </CardTitle>
                  <div className="text-sm text-muted-foreground">
                    Comanda #{mesaData.comanda?.numero}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Garçom: {mesaData.comanda?.garcom?.nome_completo}
                </div>
                {mesaData.comanda?.garcom_funcionario && (
                  <div className="text-sm text-muted-foreground">
                    Garçom: {mesaData.comanda.garcom_funcionario.nome}
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {categorias.map((categoria) => {
                  const itensCategoria = mesaData.categorias[categoria.key] || [];
                  if (itensCategoria.length === 0) return null;

                  return (
                    <div key={categoria.key} className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-3 flex items-center space-x-2">
                        <categoria.icon className="h-4 w-4" />
                        <span>{categoria.label}</span>
                      </h4>
                      <div className="space-y-2">
                        {itensCategoria.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 bg-muted rounded-lg"
                          >
                            <div className="flex-1">
                              <div className="font-medium">
                                {item.quantidade}x {item.produto?.nome}
                              </div>
                              {item.observacoes && (
                                <div className="text-sm text-muted-foreground">
                                  Obs: {item.observacoes}
                                </div>
                              )}
                              <div className="text-xs text-muted-foreground">
                                {new Date(item.created_at).toLocaleTimeString("pt-BR", {
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant={getStatusColor(item.status)}>
                                {getStatusIcon(item.status)}
                                <span className="ml-1 capitalize">
                                  {item.status === "enviado" && "Enviado"}
                                {item.status === "aguardando" && "Aguardando"}
                                  {item.status === "pronto" && "Pronto"}
                                </span>
                              </Badge>
                              {canUpdateStatus(item.status) && (
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleUpdateItemStatus(
                                      item.id,
                                      getNextStatus(item.status)
                                    )
                                  }
                                  variant={
                                    item.status === "enviado"
                                  item.status === "aguardando"
                                      : "default"
                                  }
                                >
                                  {getNextStatusLabel(item.status)}
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>

        {Object.keys(itensPorMesa).length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <ChefHat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Nenhum pedido na cozinha
              </h3>
              <p className="text-muted-foreground">
                Todos os pedidos foram preparados e entregues.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Cozinha;
