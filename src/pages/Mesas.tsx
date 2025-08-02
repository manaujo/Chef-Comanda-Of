import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Coffee,
  Plus,
  Edit,
  Eye,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  QrCode
} from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { mesasService, comandasService, subscribeToTable } from "@/lib/database";
import type { Mesa, MesaStatus } from "@/types/database";

const Mesas = () => {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMesa, setEditingMesa] = useState<Mesa | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    numero: "",
    nome: "",
    capacidade: "4",
    observacoes: ""
  });

  useEffect(() => {
    loadMesas();

    // Subscrever a mudanças em tempo real
    const unsubscribe = subscribeToTable("mesas", () => {
      loadMesas();
    });

    return unsubscribe;
  }, []);

  const loadMesas = async () => {
    try {
      setLoading(true);
      const data = await mesasService.getAll();
      setMesas(data);
    } catch (error) {
      console.error("Erro ao carregar mesas:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar mesas.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const mesaData = {
        numero: parseInt(formData.numero),
        nome: formData.nome || undefined,
        capacidade: parseInt(formData.capacidade),
        observacoes: formData.observacoes || undefined,
        status: "livre" as MesaStatus,
        ativo: true
      };

      if (editingMesa) {
        await mesasService.update(editingMesa.id, mesaData);
        toast({
          title: "Mesa atualizada",
          description: "Mesa atualizada com sucesso."
        });
      } else {
        await mesasService.create(mesaData);
        toast({
          title: "Mesa criada",
          description: "Mesa criada com sucesso."
        });
      }

      setDialogOpen(false);
      resetForm();
      loadMesas();
    } catch (error: any) {
      console.error("Erro ao salvar mesa:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar mesa.",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (mesa: Mesa) => {
    setEditingMesa(mesa);
    setFormData({
      numero: mesa.numero.toString(),
      nome: mesa.nome || "",
      capacidade: mesa.capacidade.toString(),
      observacoes: mesa.observacoes || ""
    });
    setDialogOpen(true);
  };

  const handleUpdateStatus = async (mesa: Mesa, newStatus: MesaStatus) => {
    try {
      await mesasService.updateStatus(mesa.id, newStatus);
      toast({
        title: "Status atualizado",
        description: `Mesa ${mesa.numero} marcada como ${newStatus}.`
      });
      loadMesas();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status da mesa.",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      numero: "",
      nome: "",
      capacidade: "4",
      observacoes: ""
    });
    setEditingMesa(null);
  };

  const getStatusColor = (status: MesaStatus) => {
    switch (status) {
      case "livre":
        return "default";
      case "ocupada":
        return "destructive";
      case "reservada":
        return "secondary";
      case "aguardando_pagamento":
        return "outline";
      case "fechada":
        return "secondary";
      case "manutencao":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusIcon = (status: MesaStatus) => {
    switch (status) {
      case "livre":
        return <CheckCircle className="h-4 w-4" />;
      case "ocupada":
        return <Users className="h-4 w-4" />;
      case "reservada":
        return <Clock className="h-4 w-4" />;
      case "aguardando_pagamento":
        return <AlertCircle className="h-4 w-4" />;
      case "fechada":
        return <CheckCircle className="h-4 w-4" />;
      case "manutencao":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: MesaStatus) => {
    switch (status) {
      case "livre":
        return "Livre";
      case "ocupada":
        return "Ocupada";
      case "reservada":
        return "Reservada";
      case "aguardando_pagamento":
        return "Aguardando Pagamento";
      case "fechada":
        return "Fechada";
      case "manutencao":
        return "Manutenção";
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

  const mesasLivres = mesas.filter((m) => m.status === "livre").length;
  const mesasOcupadas = mesas.filter((m) => m.status === "ocupada").length;
  const mesasReservadas = mesas.filter((m) => m.status === "reservada").length;
  const mesasProntas = mesas.filter((m) => m.status === "aguardando_pagamento" || m.status === "fechada").length;

  return (
    <DashboardLayout>
      <div className="space-y-4 lg:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 lg:gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold flex items-center space-x-2">
              <Coffee className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10" />
              <span>Mesas</span>
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mt-1">
              Gerencie as mesas do restaurante
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="flex-shrink-0">
                <Plus className="h-4 w-4 mr-2" />
                Nova Mesa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingMesa ? "Editar Mesa" : "Nova Mesa"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="numero">Número *</Label>
                    <Input
                      id="numero"
                      type="number"
                      min="1"
                      value={formData.numero}
                      onChange={(e) =>
                        setFormData({ ...formData, numero: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="capacidade">Capacidade *</Label>
                    <Input
                      id="capacidade"
                      type="number"
                      min="1"
                      value={formData.capacidade}
                      onChange={(e) =>
                        setFormData({ ...formData, capacidade: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="nome">Nome da Mesa</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) =>
                      setFormData({ ...formData, nome: e.target.value })
                    }
                    placeholder="Ex: Mesa da Janela"
                  />
                </div>

                <div>
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) =>
                      setFormData({ ...formData, observacoes: e.target.value })
                    }
                    placeholder="Observações sobre a mesa..."
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingMesa ? "Atualizar" : "Criar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-6 gap-3 lg:gap-4">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-xs sm:text-sm font-medium">Livres</span>
              </div>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold">
                {mesasLivres}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-red-600" />
                <span className="text-xs sm:text-sm font-medium">Ocupadas</span>
              </div>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold">
                {mesasOcupadas}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-xs sm:text-sm font-medium">
                  Reservadas
                </span>
              </div>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold">
                {mesasReservadas}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <span className="text-xs sm:text-sm font-medium">Prontas</span>
              </div>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold">
                {mesasProntas}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mesas Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-3 lg:gap-4">
          {mesas.map((mesa) => (
            <Card
              key={mesa.id}
              className={`hover:shadow-md transition-all duration-300 cursor-pointer ${
                mesa.status === "livre"
                  ? "hover:scale-105 hover:shadow-green-200"
                  : mesa.status === "ocupada"
                  ? "hover:shadow-red-200"
                  : "hover:shadow-blue-200"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Mesa {mesa.numero}</CardTitle>
                  <Badge variant={getStatusColor(mesa.status)}>
                    {getStatusIcon(mesa.status)}
                    <span className="ml-1">{getStatusLabel(mesa.status)}</span>
                  </Badge>
                </div>
                {mesa.nome && (
                  <p className="text-sm text-muted-foreground">{mesa.nome}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Capacidade:</span>
                  <span className="font-medium flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {mesa.capacidade} pessoas
                  </span>
                </div>

                {mesa.observacoes && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Obs:</span>
                    <p className="text-xs mt-1">{mesa.observacoes}</p>
                  </div>
                )}

                <div className="flex space-x-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(mesa)}
                    className="flex-1"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Editar
                  </Button>

                  <Button
                    variant="default"
                    size="sm"
                    asChild
                    className="flex-1"
                  >
                    <Link to={`/mesa/${mesa.id}`}>
                      <Eye className="h-3 w-3 mr-1" />
                      Abrir
                    </Link>
                  </Button>
                </div>

                {/* Quick Status Actions */}
                {mesa.status === "livre" && (
                  <div className="flex space-x-1 pt-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleUpdateStatus(mesa, "ocupada")}
                      className="flex-1 text-xs"
                    >
                      Ocupar
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleUpdateStatus(mesa, "reservada")}
                      className="flex-1 text-xs"
                    >
                      Reservar
                    </Button>
                  </div>
                )}

                {mesa.status === "ocupada" && (
                  <div className="flex space-x-1 pt-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() =>
                        handleUpdateStatus(mesa, "aguardando_pagamento")
                      }
                      className="flex-1 text-xs"
                    >
                      Finalizar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateStatus(mesa, "livre")}
                      className="flex-1 text-xs"
                    >
                      Liberar
                    </Button>
                  </div>
                )}

                {(mesa.status === "aguardando_pagamento" ||
                  mesa.status === "fechada") && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleUpdateStatus(mesa, "livre")}
                    className="w-full text-xs"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Liberar Mesa
                  </Button>
                )}

                {mesa.status === "reservada" && (
                  <div className="flex space-x-1 pt-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleUpdateStatus(mesa, "ocupada")}
                      className="flex-1 text-xs"
                    >
                      Ocupar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateStatus(mesa, "livre")}
                      className="flex-1 text-xs"
                    >
                      Cancelar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {mesas.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Coffee className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Nenhuma mesa cadastrada
              </h3>
              <p className="text-muted-foreground mb-4">
                Comece criando as mesas do seu restaurante.
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar primeira mesa
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Mesas;