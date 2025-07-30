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
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Edit,
  Package,
  AlertTriangle,
  TrendingDown,
  TrendingUp
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { insumosService } from "@/lib/database";
import type { Insumo, UnidadeMedida } from "@/types/database";
import FuncionarioLocalLogin from "@/components/FuncionarioLocalLogin";

const Estoque = () => {
  return (
    <FuncionarioLocalLogin
      allowedTypes={["estoque"]}
      title="Controle de Estoque"
      description="Acesse o sistema de gestão de insumos"
    >
      <EstoqueContent />
    </FuncionarioLocalLogin>
  );
};

const EstoqueContent = () => {
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInsumo, setEditingInsumo] = useState<Insumo | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nome: "",
    unidade: "un" as UnidadeMedida,
    preco_unitario: "",
    quantidade_estoque: "",
    estoque_minimo: "",
    fornecedor: ""
  });

  useEffect(() => {
    loadInsumos();
  }, []);

  const loadInsumos = async () => {
    try {
      setLoading(true);
      const data = await insumosService.getAll();
      setInsumos(data);
    } catch (error) {
      console.error("Erro ao carregar insumos:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar insumos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const insumoData = {
        nome: formData.nome,
        unidade: formData.unidade,
        preco_unitario: parseFloat(formData.preco_unitario),
        quantidade_estoque: parseFloat(formData.quantidade_estoque),
        estoque_minimo: parseFloat(formData.estoque_minimo),
        fornecedor: formData.fornecedor || undefined,
        ativo: true
      };

      if (editingInsumo) {
        await insumosService.update(editingInsumo.id, insumoData);
        toast({
          title: "Insumo atualizado",
          description: "Insumo atualizado com sucesso."
        });
      } else {
        await insumosService.create(insumoData);
        toast({
          title: "Insumo criado",
          description: "Insumo criado com sucesso."
        });
      }

      setDialogOpen(false);
      resetForm();
      loadInsumos();
    } catch (error: any) {
      console.error("Erro ao salvar insumo:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar insumo.",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (insumo: Insumo) => {
    setEditingInsumo(insumo);
    setFormData({
      nome: insumo.nome,
      unidade: insumo.unidade,
      preco_unitario: insumo.preco_unitario.toString(),
      quantidade_estoque: insumo.quantidade_estoque.toString(),
      estoque_minimo: insumo.estoque_minimo.toString(),
      fornecedor: insumo.fornecedor || ""
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      unidade: "un",
      preco_unitario: "",
      quantidade_estoque: "",
      estoque_minimo: "",
      fornecedor: ""
    });
    setEditingInsumo(null);
  };

  const getEstoqueStatus = (insumo: Insumo) => {
    if (insumo.quantidade_estoque <= 0) {
      return { status: "zerado", color: "destructive", icon: AlertTriangle };
    } else if (insumo.quantidade_estoque <= insumo.estoque_minimo) {
      return { status: "baixo", color: "secondary", icon: TrendingDown };
    } else {
      return { status: "ok", color: "default", icon: TrendingUp };
    }
  };

  const insumosEstoqueBaixo = insumos.filter(
    (i) => i.quantidade_estoque <= i.estoque_minimo
  );
  const insumosZerados = insumos.filter((i) => i.quantidade_estoque <= 0);
  const valorTotalEstoque = insumos.reduce(
    (total, i) => total + i.quantidade_estoque * i.preco_unitario,
    0
  );

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
            <Package className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10" />
            <span>Estoque</span>
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mt-1">
            Gerencie o estoque de insumos
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="flex-shrink-0">
              <Plus className="h-4 w-4 mr-2" />
              Novo Insumo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingInsumo ? "Editar Insumo" : "Novo Insumo"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData({ ...formData, nome: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="unidade">Unidade *</Label>
                  <Select
                    value={formData.unidade}
                    onValueChange={(value: UnidadeMedida) =>
                      setFormData({ ...formData, unidade: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">Quilograma (kg)</SelectItem>
                      <SelectItem value="g">Grama (g)</SelectItem>
                      <SelectItem value="l">Litro (l)</SelectItem>
                      <SelectItem value="ml">Mililitro (ml)</SelectItem>
                      <SelectItem value="un">Unidade (un)</SelectItem>
                      <SelectItem value="cx">Caixa (cx)</SelectItem>
                      <SelectItem value="pct">Pacote (pct)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="preco_unitario">
                    Preço Unitário (R$) *
                  </Label>
                  <Input
                    id="preco_unitario"
                    type="number"
                    step="0.0001"
                    min="0"
                    value={formData.preco_unitario}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        preco_unitario: e.target.value
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantidade_estoque">
                    Quantidade em Estoque *
                  </Label>
                  <Input
                    id="quantidade_estoque"
                    type="number"
                    step="0.0001"
                    min="0"
                    value={formData.quantidade_estoque}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantidade_estoque: e.target.value
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="estoque_minimo">Estoque Mínimo *</Label>
                  <Input
                    id="estoque_minimo"
                    type="number"
                    step="0.0001"
                    min="0"
                    value={formData.estoque_minimo}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        estoque_minimo: e.target.value
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="fornecedor">Fornecedor</Label>
                <Input
                  id="fornecedor"
                  value={formData.fornecedor}
                  onChange={(e) =>
                    setFormData({ ...formData, fornecedor: e.target.value })
                  }
                  placeholder="Nome do fornecedor"
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
                  {editingInsumo ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Total Insumos</span>
            </div>
            <div className="text-2xl font-bold">{insumos.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium">Estoque Baixo</span>
            </div>
            <div className="text-2xl font-bold">
              {insumosEstoqueBaixo.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">Zerados</span>
            </div>
            <div className="text-2xl font-bold">{insumosZerados.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Valor Total</span>
            </div>
            <div className="text-2xl font-bold">
              R$ {valorTotalEstoque.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      {insumosEstoqueBaixo.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800 flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Alertas de Estoque</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {insumosEstoqueBaixo.slice(0, 5).map((insumo) => (
                <div
                  key={insumo.id}
                  className="flex items-center justify-between"
                >
                  <span className="font-medium">{insumo.nome}</span>
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

      {/* Insumos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {insumos.map((insumo) => {
          const estoqueInfo = getEstoqueStatus(insumo);
          const IconComponent = estoqueInfo.icon;

          return (
            <Card
              key={insumo.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{insumo.nome}</CardTitle>
                  <Badge variant={estoqueInfo.color}>
                    <IconComponent className="h-3 w-3 mr-1" />
                    {estoqueInfo.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Estoque:</span>
                  <span className="font-medium">
                    {insumo.quantidade_estoque} {insumo.unidade}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Mínimo:</span>
                  <span className="font-medium">
                    {insumo.estoque_minimo} {insumo.unidade}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Preço Unit.:</span>
                  <span className="font-medium">
                    R$ {insumo.preco_unitario.toFixed(4)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Valor Total:</span>
                  <span className="font-medium">
                    R${" "}
                    {(
                      insumo.quantidade_estoque * insumo.preco_unitario
                    ).toFixed(2)}
                  </span>
                </div>

                {insumo.fornecedor && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Fornecedor:</span>
                    <p className="text-xs mt-1">{insumo.fornecedor}</p>
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(insumo)}
                  className="w-full"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Editar
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {insumos.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Nenhum insumo cadastrado
            </h3>
            <p className="text-muted-foreground mb-4">
              Comece cadastrando os insumos para controlar o estoque.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar primeiro insumo
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Estoque;
