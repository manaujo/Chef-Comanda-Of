import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Coffee,
  Plus,
  Edit,
  QrCode,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  Settings
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { mesasService } from "@/lib/database";
import type { Mesa, MesaStatus } from "@/types/database";
import FuncionarioLocalLogin from "@/components/FuncionarioLocalLogin";

const Mesas = () => {
  return (
    <FuncionarioLocalLogin
      allowedTypes={["garcom"]}
      title="Área dos Garçons"
      description="Acesse o sistema de mesas e comandas"
    >
      <MesasContent />
    </FuncionarioLocalLogin>
  );
};

const MesasContent = () => {
  const navigate = useNavigate();
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMesa, setEditingMesa] = useState<Mesa | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    numero: "",
    nome: "",
    capacidade: "4",
    status: "livre" as MesaStatus,
    observacoes: ""
  });

  useEffect(() => {
    loadMesas();
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
        status: formData.status,
        observacoes: formData.observacoes || undefined,
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
      status: mesa.status,
      observacoes: mesa.observacoes || ""
    });
    setDialogOpen(true);
  };

  const handleStatusChange = async (mesa: Mesa, newStatus: MesaStatus) => {
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
      status: "livre",
      observacoes: ""
    });
    setEditingMesa(null);
  };

  const getStatusIcon = (status: MesaStatus) => {
    switch (status) {
      case "livre":
        return <CheckCircle className="h-4 w-4" />;
      case "ocupada":
        return <Clock className="h-4 w-4" />;
      case "reservada":
        return <Users className="h-4 w-4" />;
      case "manutencao":
        return <Settings className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: MesaStatus) => {
    switch (status) {
      case "livre":
        return "default";
      case "ocupada":
        return "destructive";
      case "reservada":
        return "secondary";
      case "manutencao":
        return "outline";
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 lg:gap-4">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold flex items-center space-x-2">
            <Coffee className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10" />
            <span>Mesas</span>
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mt-1">
            Gerencie as mesas do seu restaurante
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
                    value={formData.capacidade}
                    onChange={(e) =>
                      setFormData({ ...formData, capacidade: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData({ ...formData, nome: e.target.value })
                  }
                  placeholder="Ex: Mesa VIP, Mesa da Janela..."
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: MesaStatus) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="livre">Livre</SelectItem>
                    <SelectItem value="ocupada">Ocupada</SelectItem>
                    <SelectItem value="reservada">Reservada</SelectItem>
                    <SelectItem value="manutencao">Manutenção</SelectItem>
                  </SelectContent>
                </Select>
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
              {mesas.filter((m) => m.status === "livre").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-red-600" />
              <span className="text-xs sm:text-sm font-medium">Ocupadas</span>
            </div>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold">
              {mesas.filter((m) => m.status === "ocupada").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-xs sm:text-sm font-medium">
                Reservadas
              </span>
            </div>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold">
              {mesas.filter((m) => m.status === "reservada").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-2">
              <Settings className="h-4 w-4 text-gray-600" />
              <span className="text-xs sm:text-sm font-medium">
                Manutenção
              </span>
            </div>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold">
              {mesas.filter((m) => m.status === "manutencao").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mesas Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-3 lg:gap-4">
        {mesas.map((mesa) => (
          <Card key={mesa.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Mesa {mesa.numero}</CardTitle>
                <Badge variant={getStatusColor(mesa.status)}>
                  {getStatusIcon(mesa.status)}
                  <span className="ml-1 capitalize">{mesa.status}</span>
                </Badge>
              </div>
              {mesa.nome && (
                <p className="text-sm text-muted-foreground">{mesa.nome}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Capacidade:</span>
                <span className="font-medium">{mesa.capacidade} pessoas</span>
              </div>

              {mesa.observacoes && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Obs:</span>
                  <p className="text-xs mt-1">{mesa.observacoes}</p>
                </div>
              )}

              <div className="flex space-x-2">
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
                  onClick={() => navigate(`/mesa/${mesa.id}`)}
                  className="flex-1"
                >
                  <Coffee className="h-3 w-3 mr-1" />
                  Abrir
                </Button>

                {mesa.qr_code && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(mesa.qr_code, "_blank")}
                  >
                    <QrCode className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* Status Actions */}
              <div className="flex flex-wrap gap-1">
                {mesa.status !== "livre" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange(mesa, "livre")}
                    className="text-xs"
                  >
                    Liberar
                  </Button>
                )}
                {mesa.status !== "ocupada" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange(mesa, "ocupada")}
                    className="text-xs"
                  >
                    Ocupar
                  </Button>
                )}
                {mesa.status !== "reservada" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange(mesa, "reservada")}
                    className="text-xs"
                  >
                    Reservar
                  </Button>
                )}
              </div>
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
              Comece criando sua primeira mesa para organizar o atendimento.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar primeira mesa
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Mesas;
