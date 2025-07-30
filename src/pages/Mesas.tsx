import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Coffee,
  User,
  CheckCircle,
  Clock,
  UtensilsCrossed
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { funcionariosSimplesService, type FuncionarioSimples } from "@/lib/funcionarios-simples";
import { 
  mesasService, 
  comandasService,
  subscribeToTable 
} from "@/lib/database";
import type { Mesa, Comanda } from "@/types/database";

const Mesas = () => {
  const navigate = useNavigate();
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [funcionariosGarcom, setFuncionariosGarcom] = useState<FuncionarioSimples[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogGarcomOpen, setDialogGarcomOpen] = useState(false);
  const [mesaSelecionada, setMesaSelecionada] = useState<Mesa | null>(null);
  const [garcomSelecionado, setGarcomSelecionado] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Subscrever a mudanças nas mesas e comandas
    const unsubscribeMesas = subscribeToTable("mesas", () => {
      loadMesas();
    });

    const unsubscribeComandasItens = subscribeToTable("comanda_itens", () => {
      loadMesas();
    });

    return () => {
      unsubscribeMesas();
      unsubscribeComandasItens();
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [mesasData, funcionariosData] = await Promise.all([
        mesasService.getAll(),
        funcionariosSimplesService.getByTipo('garcom')
      ]);
      setMesas(mesasData);
      setFuncionariosGarcom(funcionariosData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados das mesas.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMesas = async () => {
    try {
      const mesasData = await mesasService.getAll();
      setMesas(mesasData);
    } catch (error) {
      console.error("Erro ao carregar mesas:", error);
    }
  };

  const handleClickMesa = async (mesa: Mesa) => {
    setMesaSelecionada(mesa);
    
    if (mesa.status === "livre") {
      // Mesa livre - selecionar garçom para criar comanda
      setDialogGarcomOpen(true);
    } else if (mesa.status === "ocupada" || mesa.status === "fechada") {
      // Mesa ocupada - redirecionar para comanda
      try {
        const comanda = await comandasService.getByMesa(mesa.id);
        if (comanda) {
          navigate(`/comanda/${comanda.id}`);
        } else {
          // Se não há comanda ativa, liberar a mesa
          await mesasService.updateStatus(mesa.id, "livre");
          loadMesas();
        }
      } catch (error) {
        console.error("Erro ao carregar comanda da mesa:", error);
        toast({
          title: "Erro",
          description: "Erro ao carregar dados da mesa.",
          variant: "destructive"
        });
      }
    }
  };

  const handleSelecionarGarcom = async () => {
    if (!mesaSelecionada || !garcomSelecionado) return;

    try {
      // Criar nova comanda
      const comanda = await comandasService.create({
        mesa_id: mesaSelecionada.id,
        garcom_funcionario_id: garcomSelecionado,
        status: "aberta",
        data_abertura: new Date().toISOString()
      });

      // Atualizar status da mesa
      await mesasService.updateStatus(mesaSelecionada.id, "ocupada");

      toast({
        title: "Mesa ocupada",
        description: "Mesa atribuída ao garçom com sucesso."
      });

      setDialogGarcomOpen(false);
      setGarcomSelecionado("");
      
      // Redirecionar para a comanda
      navigate(`/comanda/${comanda.id}`);
      
      loadMesas();
    } catch (error: any) {
      console.error("Erro ao atribuir garçom:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atribuir garçom à mesa.",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "livre":
        return "bg-green-100 border-green-300 text-green-800";
      case "ocupada":
        return "bg-red-100 border-red-300 text-red-800";
      case "fechada":
        return "bg-blue-100 border-blue-300 text-blue-800";
      case "aguardando_pagamento":
        return "bg-yellow-100 border-yellow-300 text-yellow-800";
      default:
        return "bg-gray-100 border-gray-300 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "livre":
        return <CheckCircle className="h-4 w-4" />;
      case "ocupada":
        return <Clock className="h-4 w-4" />;
      case "fechada":
        return <UtensilsCrossed className="h-4 w-4" />;
      case "aguardando_pagamento":
        return <UtensilsCrossed className="h-4 w-4" />;
      default:
        return <Coffee className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "livre":
        return "Livre";
      case "ocupada":
        return "Ocupada";
      case "fechada":
        return "Pronta";
      case "aguardando_pagamento":
        return "Aguardando";
      default:
        return status;
    }
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

  return (
    <DashboardLayout>
      <div className="space-y-4 lg:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 lg:gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold flex items-center space-x-2">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10" />
              <span>Controle de Mesas</span>
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mt-1">
              Clique em uma mesa livre para atribuir garçom ou em uma ocupada para ver a comanda
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Mesas Livres</span>
              </div>
              <div className="text-2xl font-bold">
                {mesas.filter(m => m.status === "livre").length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium">Mesas Ocupadas</span>
              </div>
              <div className="text-2xl font-bold">
                {mesas.filter(m => m.status === "ocupada").length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <UtensilsCrossed className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Prontas</span>
              </div>
              <div className="text-2xl font-bold">
                {mesas.filter(m => m.status === "fechada").length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Total Mesas</span>
              </div>
              <div className="text-2xl font-bold">{mesas.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Grid de Mesas */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {mesas.map((mesa) => (
            <Card
              key={mesa.id}
              className={`cursor-pointer hover:shadow-lg transition-all duration-300 ${getStatusColor(mesa.status)}`}
              onClick={() => handleClickMesa(mesa)}
            >
              <CardContent className="p-4 text-center">
                <div className="flex flex-col items-center space-y-2">
                  {getStatusIcon(mesa.status)}
                  <div className="font-bold text-lg">Mesa {mesa.numero}</div>
                  <Badge variant="outline" className="text-xs">
                    {getStatusLabel(mesa.status)}
                  </Badge>
                  <div className="text-xs text-muted-foreground">
                    {mesa.capacidade} pessoas
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Dialog Selecionar Garçom */}
        <Dialog open={dialogGarcomOpen} onOpenChange={setDialogGarcomOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Selecione o Garçom para Mesa {mesaSelecionada?.numero}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Selecione o garçom responsável por esta mesa:
              </p>
              
              <div>
                <Select value={garcomSelecionado} onValueChange={setGarcomSelecionado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um garçom" />
                  </SelectTrigger>
                  <SelectContent>
                    {funcionariosGarcom.map((garcom) => (
                      <SelectItem key={garcom.id} value={garcom.id}>
                        {garcom.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {funcionariosGarcom.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Nenhum garçom ativo encontrado. Cadastre garçons na tela de Gerenciar Funcionários.
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setDialogGarcomOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSelecionarGarcom}
                  disabled={!garcomSelecionado}
                >
                  <User className="h-4 w-4 mr-2" />
                  Confirmar Garçom
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Mesas;