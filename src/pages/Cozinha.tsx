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
  Pause
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { comandasService, comandaItensService } from "@/lib/database";
import type { Comanda, ComandaItem } from "@/types/database";

const Cozinha = () => {
  const [comandas, setComandasAbertas] = useState<Comanda[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadComandasAbertas();

    // Atualizar a cada 30 segundos
    const interval = setInterval(loadComandasAbertas, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadComandasAbertas = async () => {
    try {
      setLoading(true);
      const data = await comandasService.getAbertas();
      setComandasAbertas(data);
    } catch (error) {
      console.error("Erro ao carregar comandas:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar comandas.",
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
      loadComandasAbertas();
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
      case "pendente":
        return "destructive";
      case "recebido":
        return "secondary";
      case "em_preparo":
        return "default";
      case "pronto":
        return "outline";
      case "entregue":
        return "secondary";
      case "cancelado":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pendente":
        return <AlertCircle className="h-4 w-4" />;
      case "recebido":
        return <CheckCircle className="h-4 w-4" />;
      case "em_preparo":
        return <Play className="h-4 w-4" />;
      case "pronto":
        return <CheckCircle className="h-4 w-4" />;
      case "entregue":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelado":
        return <Pause className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case "pendente":
        return "recebido";
      case "recebido":
        return "em_preparo";
      case "em_preparo":
        return "pronto";
      default:
        return currentStatus;
    }
  };

  const getNextStatusLabel = (currentStatus: string) => {
    switch (currentStatus) {
      case "pendente":
        return "Receber";
      case "recebido":
        return "Iniciar Preparo";
      case "em_preparo":
        return "Marcar Pronto";
      default:
        return "Atualizar";
    }
  };

  const canUpdateStatus = (status: string) => {
    return ["pendente", "recebido", "em_preparo"].includes(status);
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

  const itensPendentes = comandas
    .flatMap((c) => c.itens || [])
    .filter((item) =>
      ["pendente", "recebido", "em_preparo"].includes(item.status)
    );

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
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium">Pendentes</span>
              </div>
              <div className="text-2xl font-bold">
                {itensPendentes.filter((i) => i.status === "pendente").length}
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
                {itensPendentes.filter((i) => i.status === "em_preparo").length}
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

        {/* Comandas com Itens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {comandas
            .filter(
              (comanda) =>
                comanda.itens &&
                comanda.itens.some((item) =>
                  ["pendente", "recebido", "em_preparo", "pronto"].includes(
                    item.status
                  )
                )
            )
            .map((comanda) => (
              <Card
                key={comanda.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      Comanda #{comanda.numero}
                    </CardTitle>
                    <div className="text-sm text-muted-foreground">
                      {comanda.mesa ? `Mesa ${comanda.mesa.numero}` : "Balcão"}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(comanda.data_abertura).toLocaleTimeString(
                      "pt-BR",
                      {
                        hour: "2-digit",
                        minute: "2-digit"
                      }
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {comanda.itens
                    ?.filter((item) =>
                      ["pendente", "recebido", "em_preparo", "pronto"].includes(
                        item.status
                      )
                    )
                    .map((item) => (
                      <div
                        key={item.id}
                        className="border rounded-lg p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium">
                              {item.quantidade}x {item.produto?.nome}
                            </div>
                            {item.observacoes && (
                              <div className="text-sm text-muted-foreground">
                                Obs: {item.observacoes}
                              </div>
                            )}
                          </div>
                          <Badge variant={getStatusColor(item.status)}>
                            {getStatusIcon(item.status)}
                            <span className="ml-1 capitalize">
                              {item.status.replace("_", " ")}
                            </span>
                          </Badge>
                        </div>

                        {canUpdateStatus(item.status) && (
                          <Button
                            size="sm"
                            onClick={() =>
                              handleUpdateItemStatus(
                                item.id,
                                getNextStatus(item.status)
                              )
                            }
                            className="w-full"
                            variant={
                              item.status === "pendente"
                                ? "destructive"
                                : "default"
                            }
                          >
                            {getNextStatusLabel(item.status)}
                          </Button>
                        )}
                      </div>
                    ))}
                </CardContent>
              </Card>
            ))}
        </div>

        {comandas.filter(
          (comanda) =>
            comanda.itens &&
            comanda.itens.some((item) =>
              ["pendente", "recebido", "em_preparo", "pronto"].includes(
                item.status
              )
            )
        ).length === 0 && (
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
