import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Package,
  Plus,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Edit,
  Trash2,
  Download,
  Filter
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  insumosEstoqueService,
  entradasEstoqueService,
  saidasEstoqueService,
  produtoInsumosService,
  type Insumo,
  type EntradaEstoque,
  type SaidaEstoque
} from "@/lib/estoque";

const Estoque = () => {
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [entradas, setEntradas] = useState<EntradaEstoque[]>([]);
  const [saidas, setSaidas] = useState<SaidaEstoque[]>([]);
  const [insumosEstoqueBaixo, setInsumosEstoqueBaixo] = useState<Insumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("insumos");
  const { toast } = useToast();

  // Estados dos modais
  const [dialogInsumoOpen, setDialogInsumoOpen] = useState(false);
  const [dialogEntradaOpen, setDialogEntradaOpen] = useState(false);
  const [dialogSaidaOpen, setDialogSaidaOpen] = useState(false);
  const [editingInsumo, setEditingInsumo] = useState<Insumo | null>(null);

  // Estados dos formulários
  const [formInsumo, setFormInsumo] = useState({
    nome: "",
    unidade: "kg",
    quantidade_minima: "0",
    preco_unitario: "0",
    fornecedor: ""
  });

  const [formEntrada, setFormEntrada] = useState({
    insumo_id: "",
    quantidade: "0",
    valor_total: "0",
    observacoes: ""
  });

  const [formSaida, setFormSaida] = useState({
    insumo_id: "",
    quantidade: "0",
    motivo: "",
    observacoes: ""
  });

  const [filtros, setFiltros] = useState({
    dataInicio: new Date().toISOString().split("T")[0],
    dataFim: new Date().toISOString().split("T")[0]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [insumosData, entradasData, saidasData, estoqueBaixoData] = await Promise.all([
        insumosEstoqueService.getAll(),
        entradasEstoqueService.getAll(),
        saidasEstoqueService.getAll(),
        insumosEstoqueService.getEstoqueBaixo()
      ]);
      
      setInsumos(insumosData);
      setEntradas(entradasData);
      setSaidas(saidasData);
      setInsumosEstoqueBaixo(estoqueBaixoData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do estoque.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitInsumo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const insumoData = {
        nome: formInsumo.nome,
        unidade: formInsumo.unidade,
        quantidade_minima: parseFloat(formInsumo.quantidade_minima),
        preco_unitario: parseFloat(formInsumo.preco_unitario),
        fornecedor: formInsumo.fornecedor || undefined,
        saldo_atual: 0,
        ativo: true
      };

      if (editingInsumo) {
        await insumosEstoqueService.update(editingInsumo.id, insumoData);
        toast({
          title: "Insumo atualizado",
          description: "Insumo atualizado com sucesso."
        });
      } else {
        await insumosEstoqueService.create(insumoData);
        toast({
          title: "Insumo criado",
          description: "Insumo criado com sucesso."
        });
      }

      setDialogInsumoOpen(false);
      resetFormInsumo();
      loadData();
    } catch (error: any) {
      console.error("Erro ao salvar insumo:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar insumo.",
        variant: "destructive"
      });
    }
  };

  const handleSubmitEntrada = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await entradasEstoqueService.create({
        insumo_id: formEntrada.insumo_id,
        quantidade: parseFloat(formEntrada.quantidade),
        valor_total: parseFloat(formEntrada.valor_total),
        observacoes: formEntrada.observacoes || undefined,
        data_entrada: new Date().toISOString()
      });

      toast({
        title: "Entrada registrada",
        description: "Entrada de estoque registrada com sucesso."
      });

      setDialogEntradaOpen(false);
      resetFormEntrada();
      loadData();
    } catch (error: any) {
      console.error("Erro ao registrar entrada:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao registrar entrada.",
        variant: "destructive"
      });
    }
  };

  const handleSubmitSaida = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saidasEstoqueService.create({
        insumo_id: formSaida.insumo_id,
        quantidade: parseFloat(formSaida.quantidade),
        motivo: formSaida.motivo,
        observacoes: formSaida.observacoes || undefined,
        data_saida: new Date().toISOString()
      });

      toast({
        title: "Saída registrada",
        description: "Saída de estoque registrada com sucesso."
      });

      setDialogSaidaOpen(false);
      resetFormSaida();
      loadData();
    } catch (error: any) {
      console.error("Erro ao registrar saída:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao registrar saída.",
        variant: "destructive"
      });
    }
  };

  const handleEditInsumo = (insumo: Insumo) => {
    setEditingInsumo(insumo);
    setFormInsumo({
      nome: insumo.nome,
      unidade: insumo.unidade,
      quantidade_minima: insumo.quantidade_minima.toString(),
      preco_unitario: insumo.preco_unitario.toString(),
      fornecedor: insumo.fornecedor || ""
    });
    setDialogInsumoOpen(true);
  };

  const handleDeleteInsumo = async (insumo: Insumo) => {
    if (confirm(`Tem certeza que deseja excluir o insumo "${insumo.nome}"?`)) {
      try {
        await insumosEstoqueService.delete(insumo.id);
        toast({
          title: "Insumo excluído",
          description: "Insumo excluído com sucesso."
        });
        loadData();
      } catch (error) {
        console.error("Erro ao excluir insumo:", error);
        toast({
          title: "Erro",
          description: "Erro ao excluir insumo.",
          variant: "destructive"
        });
      }
    }
  };

  const resetFormInsumo = () => {
    setFormInsumo({
      nome: "",
      unidade: "kg",
      quantidade_minima: "0",
      preco_unitario: "0",
      fornecedor: ""
    });
    setEditingInsumo(null);
  };

  const resetFormEntrada = () => {
    setFormEntrada({
      insumo_id: "",
      quantidade: "0",
      valor_total: "0",
      observacoes: ""
    });
  };

  const resetFormSaida = () => {
    setFormSaida({
      insumo_id: "",
      quantidade: "0",
      motivo: "",
      observacoes: ""
    });
  };

  const handleFiltrar = async () => {
    try {
      const [entradasData, saidasData] = await Promise.all([
        entradasEstoqueService.getByPeriodo(
          filtros.dataInicio + "T00:00:00.000Z",
          filtros.dataFim + "T23:59:59.999Z"
        ),
        saidasEstoqueService.getByPeriodo(
          filtros.dataInicio + "T00:00:00.000Z",
          filtros.dataFim + "T23:59:59.999Z"
        )
      ]);
      
      setEntradas(entradasData);
      setSaidas(saidasData);
    } catch (error) {
      console.error("Erro ao filtrar dados:", error);
      toast({
        title: "Erro",
        description: "Erro ao filtrar dados.",
        variant: "destructive"
      });
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

  const valorTotalEstoque = insumos.reduce(
    (total, insumo) => total + (insumo.quantidade_estoque * insumo.preco_unitario),
    0
  );

  return (
    <DashboardLayout>
      <div className="space-y-4 lg:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 lg:gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold flex items-center space-x-2">
              <Package className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10" />
              <span>Controle de Estoque</span>
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mt-1">
              Gerencie insumos, entradas e saídas de estoque
            </p>
          </div>
        </div>

        {/* Alertas de Estoque Baixo */}
        {insumosEstoqueBaixo.length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-red-800">
                <AlertTriangle className="h-5 w-5" />
                <span>Alertas de Estoque Baixo</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {insumosEstoqueBaixo.map((insumo) => (
                  <div
                    key={insumo.id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200"
                  >
                    <div>
                      <div className="font-medium text-red-800">{insumo.nome}</div>
                      <div className="text-sm text-red-600">
                        Atual: {insumo.quantidade_estoque} {insumo.unidade}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-red-600">
                        Mín: {insumo.estoque_minimo} {insumo.unidade}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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
              <div className="text-2xl font-bold">{insumosEstoqueBaixo.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Valor Total</span>
              </div>
              <div className="text-2xl font-bold">R$ {valorTotalEstoque.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingDown className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">Entradas Hoje</span>
              </div>
              <div className="text-2xl font-bold">
                {entradas.filter(e => 
                  new Date(e.data_entrada).toDateString() === new Date().toDateString()
                ).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="insumos">Insumos</TabsTrigger>
            <TabsTrigger value="entradas">Entradas</TabsTrigger>
            <TabsTrigger value="saidas">Saídas</TabsTrigger>
            <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
          </TabsList>

          {/* Tab Insumos */}
          <TabsContent value="insumos" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Insumos Cadastrados</h3>
              <Dialog open={dialogInsumoOpen} onOpenChange={setDialogInsumoOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetFormInsumo}>
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
                  <form onSubmit={handleSubmitInsumo} className="space-y-4">
                    <div>
                      <Label htmlFor="nome">Nome do Insumo *</Label>
                      <Input
                        id="nome"
                        value={formInsumo.nome}
                        onChange={(e) =>
                          setFormInsumo({ ...formInsumo, nome: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="unidade">Unidade de Medida *</Label>
                        <Select
                          value={formInsumo.unidade}
                          onValueChange={(value) =>
                            setFormInsumo({ ...formInsumo, unidade: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="kg">Quilograma (kg)</SelectItem>
                            <SelectItem value="g">Grama (g)</SelectItem>
                            <SelectItem value="l">Litro (L)</SelectItem>
                            <SelectItem value="ml">Mililitro (ml)</SelectItem>
                            <SelectItem value="un">Unidade (un)</SelectItem>
                            <SelectItem value="cx">Caixa (cx)</SelectItem>
                            <SelectItem value="pct">Pacote (pct)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="quantidade_minima">Estoque Mínimo *</Label>
                        <Input
                          id="quantidade_minima"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formInsumo.quantidade_minima}
                          onChange={(e) =>
                            setFormInsumo({ ...formInsumo, quantidade_minima: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="preco_unitario">Preço Unitário (R$) *</Label>
                        <Input
                          id="preco_unitario"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formInsumo.preco_unitario}
                          onChange={(e) =>
                            setFormInsumo({ ...formInsumo, preco_unitario: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="fornecedor">Fornecedor</Label>
                        <Input
                          id="fornecedor"
                          value={formInsumo.fornecedor}
                          onChange={(e) =>
                            setFormInsumo({ ...formInsumo, fornecedor: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setDialogInsumoOpen(false)}
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {insumos.map((insumo) => (
                <Card key={insumo.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{insumo.nome}</CardTitle>
                      {insumo.quantidade_estoque <= insumo.estoque_minimo && (
                        <Badge variant="destructive">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Baixo
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Saldo:</span>
                        <p className="font-medium">
                          {insumo.quantidade_estoque} {insumo.unidade}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Mínimo:</span>
                        <p className="font-medium">
                          {insumo.estoque_minimo} {insumo.unidade}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Preço:</span>
                        <p className="font-medium">R$ {insumo.preco_unitario.toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Valor Total:</span>
                        <p className="font-medium">
                          R$ {(insumo.quantidade_estoque * insumo.preco_unitario).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {insumo.fornecedor && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Fornecedor:</span>
                        <p className="font-medium">{insumo.fornecedor}</p>
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditInsumo(insumo)}
                        className="flex-1"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteInsumo(insumo)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {insumos.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Nenhum insumo cadastrado
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Comece cadastrando os insumos do seu estoque.
                  </p>
                  <Button onClick={() => setDialogInsumoOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Cadastrar primeiro insumo
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab Entradas */}
          <TabsContent value="entradas" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Entradas de Estoque</h3>
              <Dialog open={dialogEntradaOpen} onOpenChange={setDialogEntradaOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetFormEntrada}>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Nova Entrada
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Registrar Entrada de Estoque</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmitEntrada} className="space-y-4">
                    <div>
                      <Label htmlFor="insumo_entrada">Insumo *</Label>
                      <Select
                        value={formEntrada.insumo_id}
                        onValueChange={(value) =>
                          setFormEntrada({ ...formEntrada, insumo_id: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um insumo" />
                        </SelectTrigger>
                        <SelectContent>
                          {insumos.map((insumo) => (
                            <SelectItem key={insumo.id} value={insumo.id}>
                              {insumo.nome} ({insumo.unidade})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="quantidade_entrada">Quantidade *</Label>
                        <Input
                          id="quantidade_entrada"
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={formEntrada.quantidade}
                          onChange={(e) =>
                            setFormEntrada({ ...formEntrada, quantidade: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="valor_total_entrada">Valor Total (R$) *</Label>
                        <Input
                          id="valor_total_entrada"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formEntrada.valor_total}
                          onChange={(e) =>
                            setFormEntrada({ ...formEntrada, valor_total: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>

                    {formEntrada.quantidade && formEntrada.valor_total && (
                      <div className="bg-muted p-3 rounded-lg">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Valor unitário:</span>
                          <span className="ml-2 font-medium">
                            R$ {(parseFloat(formEntrada.valor_total) / parseFloat(formEntrada.quantidade)).toFixed(4)}
                          </span>
                        </div>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="observacoes_entrada">Observações</Label>
                      <Textarea
                        id="observacoes_entrada"
                        value={formEntrada.observacoes}
                        onChange={(e) =>
                          setFormEntrada({ ...formEntrada, observacoes: e.target.value })
                        }
                        placeholder="Observações sobre a entrada..."
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setDialogEntradaOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Registrar Entrada
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-3">
              {entradas.map((entrada) => (
                <Card key={entrada.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Entrada de Estoque</h4>
                        <p className="text-sm text-muted-foreground">
                          Quantidade: {entrada.quantidade} • 
                          R$ {entrada.valor_unitario?.toFixed(4) || '0.00'} por unidade
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(entrada.data_entrada).toLocaleString("pt-BR")}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          R$ {entrada.valor_total.toFixed(2)}
                        </div>
                        <Badge variant="secondary">Entrada</Badge>
                      </div>
                    </div>
                    {entrada.observacoes && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Obs: {entrada.observacoes}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Tab Saídas */}
          <TabsContent value="saidas" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Saídas de Estoque</h3>
              <Dialog open={dialogSaidaOpen} onOpenChange={setDialogSaidaOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetFormSaida} variant="destructive">
                    <TrendingDown className="h-4 w-4 mr-2" />
                    Nova Saída
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Registrar Saída de Estoque</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmitSaida} className="space-y-4">
                    <div>
                      <Label htmlFor="insumo_saida">Insumo *</Label>
                      <Select
                        value={formSaida.insumo_id}
                        onValueChange={(value) =>
                          setFormSaida({ ...formSaida, insumo_id: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um insumo" />
                        </SelectTrigger>
                        <SelectContent>
                          {insumos.filter(i => i.quantidade_estoque > 0).map((insumo) => (
                            <SelectItem key={insumo.id} value={insumo.id}>
                              {insumo.nome} (Saldo: {insumo.quantidade_estoque} {insumo.unidade})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="quantidade_saida">Quantidade *</Label>
                        <Input
                          id="quantidade_saida"
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={formSaida.quantidade}
                          onChange={(e) =>
                            setFormSaida({ ...formSaida, quantidade: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="motivo">Motivo *</Label>
                        <Select
                          value={formSaida.motivo}
                          onValueChange={(value) =>
                            setFormSaida({ ...formSaida, motivo: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o motivo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="desperdicio">Desperdício</SelectItem>
                            <SelectItem value="perda">Perda/Vencimento</SelectItem>
                            <SelectItem value="consumo_interno">Consumo Interno</SelectItem>
                            <SelectItem value="ajuste_inventario">Ajuste de Inventário</SelectItem>
                            <SelectItem value="outros">Outros</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="observacoes_saida">Observações</Label>
                      <Textarea
                        id="observacoes_saida"
                        value={formSaida.observacoes}
                        onChange={(e) =>
                          setFormSaida({ ...formSaida, observacoes: e.target.value })
                        }
                        placeholder="Observações sobre a saída..."
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setDialogSaidaOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" variant="destructive">
                        <TrendingDown className="h-4 w-4 mr-2" />
                        Registrar Saída
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-3">
              {saidas.map((saida) => (
                <Card key={saida.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Saída de Estoque</h4>
                        <p className="text-sm text-muted-foreground">
                          Quantidade: {saida.quantidade} • 
                          Motivo: {saida.motivo}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(saida.data_saida).toLocaleString("pt-BR")}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="destructive">Saída</Badge>
                      </div>
                    </div>
                    {saida.observacoes && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Obs: {saida.observacoes}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Tab Relatórios */}
          <TabsContent value="relatorios" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Filter className="h-5 w-5" />
                  <span>Filtros</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="dataInicio">Data Início</Label>
                    <Input
                      id="dataInicio"
                      type="date"
                      value={filtros.dataInicio}
                      onChange={(e) =>
                        setFiltros({ ...filtros, dataInicio: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="dataFim">Data Fim</Label>
                    <Input
                      id="dataFim"
                      type="date"
                      value={filtros.dataFim}
                      onChange={(e) =>
                        setFiltros({ ...filtros, dataFim: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleFiltrar} className="w-full">
                      <Filter className="h-4 w-4 mr-2" />
                      Filtrar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Resumo de Estoque</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {insumos.map((insumo) => (
                      <div
                        key={insumo.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          insumo.quantidade_estoque <= insumo.estoque_minimo
                            ? "bg-red-50 border-red-200"
                            : "bg-muted/50"
                        }`}
                      >
                        <div>
                          <div className="font-medium">{insumo.nome}</div>
                          <div className="text-sm text-muted-foreground">
                            {insumo.fornecedor || "Sem fornecedor"}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">
                            {insumo.quantidade_estoque} {insumo.unidade}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Mín: {insumo.estoque_minimo} {insumo.unidade}
                          </div>
                          <div className="text-sm font-medium">
                            R$ {(insumo.quantidade_estoque * insumo.preco_unitario).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Movimentações do Período</CardTitle>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Exportar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {entradas.length}
                        </div>
                        <div className="text-sm text-green-700">Entradas</div>
                      </div>
                      <div className="p-3 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">
                          {saidas.length}
                        </div>
                        <div className="text-sm text-red-700">Saídas</div>
                      </div>
                    </div>
                    
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        R$ {entradas.reduce((total, e) => total + e.valor_total, 0).toFixed(2)}
                      </div>
                      <div className="text-sm text-blue-700">Valor Total Investido</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Estoque;