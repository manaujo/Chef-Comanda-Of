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
  Plus,
  Edit,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  UtensilsCrossed
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { comandasService, mesasService, produtosService } from "@/lib/database";
import type { Comanda, Mesa, Produto } from "@/types/database";

const Comandas = () => {
  const [comandas, setComandasAbertas] = useState<Comanda[]>([]);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingComanda, setEditingComanda] = useState<Comanda | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    mesa_id: "",
    observacoes: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [comandasData, mesasData, produtosData] = await Promise.all([
        comandasService.getAbertas(),
        mesasService.getAll(),
        produtosService.getAll()
      ]);
      setComandasAbertas(comandasData);
      setMesas(mesasData);
      setProdutos(produtosData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const comandaData = {
        mesa_id: formData.mesa_id === "none" ? undefined : formData.mesa_id,
        observacoes: formData.observacoes || undefined,
        status: "aberta" as const,
        data_abertura: new Date().toISOString()
      };

      if (editingComanda) {
        await comandasService.update(editingComanda.id, comandaData);
        toast({
          title: "Comanda atualizada",
          description: "Comanda atualizada com sucesso."
        });
      } else {
        await comandasService.create(comandaData);
        toast({
          title: "Comanda criada",
          description: "Comanda criada com sucesso."
        });
      }

      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (error: any) {
      console.error("Erro ao salvar comanda:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar comanda.",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (comanda: Comanda) => {
    setEditingComanda(comanda);
    setFormData({
      mesa_id: comanda.mesa_id || "none",
      observacoes: comanda.observacoes || ""
    });
    setDialogOpen(true);
  };

  const handleFecharComanda = async (comanda: Comanda) => {
    try {
      await comandasService.fechar(comanda.id);
      toast({
        title: "Comanda fechada",
        description: `Comanda #${comanda.numero} fechada com sucesso.`
      });
      loadData();
    } catch (error) {
      console.error("Erro ao fechar comanda:", error);
      toast({
        title: "Erro",
        description: "Erro ao fechar comanda.",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      mesa_id: "none",
      observacoes: ""
    });
    setEditingComanda(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aberta":
        return "default";
      case "fechada":
        return "secondary";
      case "cancelada":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "aberta":
        return <Clock className="h-4 w-4" />;
      case "fechada":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelada":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
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
              <UtensilsCrossed className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10" />
              <span>Comandas</span>
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mt-1">
              Gerencie as comandas do restaurante
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="flex-shrink-0">
                <Plus className="h-4 w-4 mr-2" />
                Nova Comanda
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingComanda ? "Editar Comanda" : "Nova Comanda"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="mesa_id">Mesa</Label>
                  <Select
                    value={formData.mesa_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, mesa_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma mesa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem mesa</SelectItem>
                      {mesas
                        .filter((m) => m.status === "livre")
                        .map((mesa) => (
                          <SelectItem key={mesa.id} value={mesa.id}>
                            Mesa {mesa.numero} - {mesa.capacidade} pessoas
                          </SelectItem>
                        ))}
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
                    placeholder="Observações sobre a comanda..."
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
                    {editingComanda ? "Atualizar" : "Criar"}
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
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-xs sm:text-sm font-medium">Abertas</span>
              </div>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold">
                {comandas.filter((c) => c.status === "aberta").length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-xs sm:text-sm font-medium">
                  Valor Total
                </span>
              </div>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold">
                R${" "}
                {comandas
                  .reduce((total, c) => total + c.valor_total, 0)
                  .toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <UtensilsCrossed className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">Itens</span>
              </div>
              <div className="text-2xl font-bold">
                {comandas.reduce(
                  (total, c) => total + (c.itens?.length || 0),
                  0
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Ticket Médio</span>
              </div>
              <div className="text-2xl font-bold">
                R${" "}
                {comandas.length > 0
                  ? (
                      comandas.reduce((total, c) => total + c.valor_total, 0) /
                      comandas.length
                    ).toFixed(2)
                  : "0.00"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comandas Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {comandas.map((comanda) => (
            <Card
              key={comanda.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Comanda #{comanda.numero}
                  </CardTitle>
                  <Badge variant={getStatusColor(comanda.status)}>
                    {getStatusIcon(comanda.status)}
                    <span className="ml-1 capitalize">{comanda.status}</span>
                  </Badge>
                </div>
                {comanda.mesa && (
                  <p className="text-sm text-muted-foreground">
                    Mesa {comanda.mesa.numero}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Valor Total:</span>
                  <span className="font-medium">
                    R$ {comanda.valor_total.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Itens:</span>
                  <span className="font-medium">
                    {comanda.itens?.length || 0}
                  </span>
                </div>

                {comanda.garcom && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Garçom:</span>
                    <span className="font-medium">
                      {comanda.garcom.nome_completo}
                    </span>
                  </div>
                )}

                {comanda.observacoes && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Obs:</span>
                    <p className="text-xs mt-1">{comanda.observacoes}</p>
                  </div>
                )}

                <div className="flex space-x-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(comanda)}
                    className="flex-1"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Editar
                  </Button>

                  {comanda.status === "aberta" && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleFecharComanda(comanda)}
                      className="flex-1"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Fechar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {comandas.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <UtensilsCrossed className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Nenhuma comanda aberta
              </h3>
              <p className="text-muted-foreground mb-4">
                Comece criando uma nova comanda para atender os clientes.
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar primeira comanda
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Comandas;
