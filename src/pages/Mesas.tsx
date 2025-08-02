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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Coffee,
  Plus,
  Minus,
  Eye,
  CreditCard,
  Trash2,
  ShoppingCart,
  Search,
  Users,
  DollarSign,
  Receipt,
  Calculator,
  Percent,
  AlertTriangle
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  mesasService, 
  comandasService, 
  comandaItensService,
  produtosService,
  vendasService,
  turnosService,
  subscribeToTable 
} from "@/lib/database";
import { funcionariosSimplesService } from "@/lib/funcionarios-simples";
import { useAuth } from "@/hooks/useAuth";
import type { Mesa, MesaStatus, Comanda, Produto, ComandaItem } from "@/types/database";

const Mesas = () => {
  const { user } = useAuth();
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [comandas, setComandasMap] = useState<Record<string, Comanda>>({});
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtosFiltrados, setProdutosFiltrados] = useState<Produto[]>([]);
  const [garconsDisponiveis, setGarconsDisponiveis] = useState<any[]>([]);
  const [turnoAtivo, setTurnoAtivo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Estados dos modais
  const [dialogNovaOpen, setDialogNovaOpen] = useState(false);
  const [dialogPedidoOpen, setDialogPedidoOpen] = useState(false);
  const [dialogComandaOpen, setDialogComandaOpen] = useState(false);
  const [dialogPagamentoOpen, setDialogPagamentoOpen] = useState(false);
  
  // Estados das operações
  const [mesaSelecionada, setMesaSelecionada] = useState<Mesa | null>(null);
  const [comandaSelecionada, setComandaSelecionada] = useState<Comanda | null>(null);
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>("todas");
  
  // Estados dos formulários
  const [formNovaMesa, setFormNovaMesa] = useState({
    numero: "",
    nome: "",
    capacidade: "4",
    observacoes: ""
  });

  const [formPedido, setFormPedido] = useState({
    garcom_id: "",
    quantidade: 1,
    observacoes: ""
  });

  const [formPagamento, setFormPagamento] = useState({
    desconto_tipo: "valor", // "valor" ou "porcentagem"
    desconto_valor: "0",
    couvert: "0",
    forma_pagamento: "",
    valor_pago: "0",
    observacoes: ""
  });

  const { toast } = useToast();

  useEffect(() => {
    loadData();

    // Subscrever a mudanças em tempo real
    const unsubscribeMesas = subscribeToTable("mesas", loadMesas);
    const unsubscribeComandasItens = subscribeToTable("comanda_itens", loadComandasData);
    const unsubscribeComandasTable = subscribeToTable("comandas", loadComandasData);

    return () => {
      unsubscribeMesas();
      unsubscribeComandasItens();
      unsubscribeComandasTable();
    };
  }, []);

  useEffect(() => {
    // Filtrar produtos por busca e categoria
    let filtered = produtos;
    
    if (searchTerm) {
      filtered = filtered.filter(produto =>
        produto.nome.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (categoriaSelecionada !== "todas") {
      filtered = filtered.filter(produto =>
        produto.categoria_produto === categoriaSelecionada
      );
    }
    
    setProdutosFiltrados(filtered);
  }, [produtos, searchTerm, categoriaSelecionada]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadMesas(),
        loadComandasData(),
        loadProdutos(),
        loadGarcons(),
        loadTurnoAtivo()
      ]);
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
    const data = await mesasService.getAll();
    setMesas(data);
  };

  const loadComandasData = async () => {
    const comandasData = await comandasService.getAbertas();
    const comandasMap: Record<string, Comanda> = {};
    
    comandasData.forEach(comanda => {
      if (comanda.mesa_id) {
        comandasMap[comanda.mesa_id] = comanda;
      }
    });
    
    setComandasMap(comandasMap);
  };

  const loadProdutos = async () => {
    const data = await produtosService.getAll();
    setProdutos(data);
  };

  const loadGarcons = async () => {
    const data = await funcionariosSimplesService.getByTipo('garcom');
    setGarconsDisponiveis(data);
  };

  const loadTurnoAtivo = async () => {
    const data = await turnosService.getTurnoAtivo();
    setTurnoAtivo(data);
  };

  // Criar nova mesa
  const handleCriarMesa = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await mesasService.create({
        numero: parseInt(formNovaMesa.numero),
        nome: formNovaMesa.nome || undefined,
        capacidade: parseInt(formNovaMesa.capacidade),
        observacoes: formNovaMesa.observacoes || undefined,
        status: "livre" as MesaStatus,
        ativo: true
      });

      toast({
        title: "Mesa criada",
        description: "Mesa criada com sucesso."
      });

      setDialogNovaOpen(false);
      resetFormNovaMesa();
      loadMesas();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar mesa.",
        variant: "destructive"
      });
    }
  };

  // Criar pedido
  const handleCriarPedido = async (mesa: Mesa) => {
    if (!produtoSelecionado || !formPedido.garcom_id) {
      toast({
        title: "Erro",
        description: "Selecione um garçom e um produto.",
        variant: "destructive"
      });
      return;
    }

    try {
      let comanda = comandas[mesa.id];

      // Criar comanda se não existir
      if (!comanda) {
        comanda = await comandasService.create({
          mesa_id: mesa.id,
          garcom_funcionario_id: formPedido.garcom_id,
          status: "aberta",
          data_abertura: new Date().toISOString()
        });

        // Atualizar status da mesa
        await mesasService.updateStatus(mesa.id, "ocupada");
      }

      // Adicionar item à comanda
      await comandaItensService.create({
        comanda_id: comanda.id,
        produto_id: produtoSelecionado.id,
        quantidade: formPedido.quantidade,
        preco_unitario: produtoSelecionado.preco,
        status: "pendente",
        enviado_cozinha: false,
        observacoes: formPedido.observacoes || undefined
      });

      toast({
        title: "Item adicionado",
        description: `${produtoSelecionado.nome} adicionado à comanda.`
      });

      setDialogPedidoOpen(false);
      resetFormPedido();
      loadData();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar pedido.",
        variant: "destructive"
      });
    }
  };

  // Finalizar pagamento
  const handleFinalizarPagamento = async () => {
    if (!comandaSelecionada || !turnoAtivo) {
      toast({
        title: "Erro",
        description: "Comanda ou turno não encontrado.",
        variant: "destructive"
      });
      return;
    }

    if (!formPagamento.forma_pagamento) {
      toast({
        title: "Erro",
        description: "Selecione a forma de pagamento.",
        variant: "destructive"
      });
      return;
    }

    try {
      const subtotal = comandaSelecionada.valor_total;
      const couvert = parseFloat(formPagamento.couvert) || 0;
      
      let desconto = 0;
      if (formPagamento.desconto_tipo === "porcentagem") {
        desconto = (subtotal * (parseFloat(formPagamento.desconto_valor) || 0)) / 100;
      } else {
        desconto = parseFloat(formPagamento.desconto_valor) || 0;
      }

      const valorFinal = Math.max(0, subtotal + couvert - desconto);

      // Fechar comanda
      await comandasService.fechar(comandaSelecionada.id);

      // Registrar venda
      await vendasService.create({
        comanda_id: comandaSelecionada.id,
        turno_id: turnoAtivo.id,
        operador_id: turnoAtivo.operador_funcionario_id || turnoAtivo.operador_id,
        valor_total: subtotal + couvert,
        valor_desconto: desconto,
        valor_final: valorFinal,
        forma_pagamento: formPagamento.forma_pagamento,
        data_venda: new Date().toISOString()
      });

      // Liberar mesa
      if (comandaSelecionada.mesa_id) {
        await mesasService.updateStatus(comandaSelecionada.mesa_id, "livre");
      }

      toast({
        title: "Pagamento finalizado",
        description: `Venda de R$ ${valorFinal.toFixed(2)} finalizada com sucesso.`
      });

      setDialogPagamentoOpen(false);
      resetFormPagamento();
      loadData();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao finalizar pagamento.",
        variant: "destructive"
      });
    }
  };

  // Excluir mesa
  const handleExcluirMesa = async (mesa: Mesa) => {
    if (comandas[mesa.id]) {
      toast({
        title: "Erro",
        description: "Não é possível excluir mesa com comanda ativa.",
        variant: "destructive"
      });
      return;
    }

    if (confirm(`Tem certeza que deseja excluir a Mesa ${mesa.numero}?`)) {
      try {
        await mesasService.delete(mesa.id);
        toast({
          title: "Mesa excluída",
          description: "Mesa excluída com sucesso."
        });
        loadMesas();
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao excluir mesa.",
          variant: "destructive"
        });
      }
    }
  };

  // Funções auxiliares
  const resetFormNovaMesa = () => {
    setFormNovaMesa({
      numero: "",
      nome: "",
      capacidade: "4",
      observacoes: ""
    });
  };

  const resetFormPedido = () => {
    setFormPedido({
      garcom_id: "",
      quantidade: 1,
      observacoes: ""
    });
    setProdutoSelecionado(null);
    setSearchTerm("");
    setCategoriaSelecionada("todas");
  };

  const resetFormPagamento = () => {
    setFormPagamento({
      desconto_tipo: "valor",
      desconto_valor: "0",
      couvert: "0",
      forma_pagamento: "",
      valor_pago: "0",
      observacoes: ""
    });
    setComandaSelecionada(null);
  };

  const calcularTotalPagamento = () => {
    if (!comandaSelecionada) return 0;
    
    const subtotal = comandaSelecionada.valor_total;
    const couvert = parseFloat(formPagamento.couvert) || 0;
    
    let desconto = 0;
    if (formPagamento.desconto_tipo === "porcentagem") {
      desconto = (subtotal * (parseFloat(formPagamento.desconto_valor) || 0)) / 100;
    } else {
      desconto = parseFloat(formPagamento.desconto_valor) || 0;
    }

    return Math.max(0, subtotal + couvert - desconto);
  };

  const calcularTroco = () => {
    const total = calcularTotalPagamento();
    const valorPago = parseFloat(formPagamento.valor_pago) || 0;
    return Math.max(0, valorPago - total);
  };

  const getStatusMesa = (mesa: Mesa) => {
    const comanda = comandas[mesa.id];
    
    if (!comanda) {
      return {
        label: "Disponível",
        color: "bg-green-100 text-green-800 border-green-200",
        icon: "🟢"
      };
    }

    if (comanda.status === "aberta") {
      return {
        label: "Em atendimento",
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: "🔵"
      };
    }

    if (comanda.status === "pronto_para_fechamento") {
      return {
        label: "Aguardando pagamento",
        color: "bg-orange-100 text-orange-800 border-orange-200",
        icon: "🟠"
      };
    }

    return {
      label: "Ocupada",
      color: "bg-red-100 text-red-800 border-red-200",
      icon: "🔴"
    };
  };

  const categorias = [
    { key: "todas", label: "Todas" },
    { key: "entrada", label: "Entradas" },
    { key: "prato", label: "Pratos" },
    { key: "bebida", label: "Bebidas" },
    { key: "sobremesa", label: "Sobremesas" }
  ];

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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center space-x-3">
              <Coffee className="h-8 w-8 text-primary" />
              <span>Gestão de Mesas</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie mesas, pedidos e pagamentos do restaurante
            </p>
          </div>

          <Dialog open={dialogNovaOpen} onOpenChange={setDialogNovaOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetFormNovaMesa} size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Nova Mesa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Mesa</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCriarMesa} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="numero">Número *</Label>
                    <Input
                      id="numero"
                      type="number"
                      min="1"
                      value={formNovaMesa.numero}
                      onChange={(e) =>
                        setFormNovaMesa({ ...formNovaMesa, numero: e.target.value })
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
                      value={formNovaMesa.capacidade}
                      onChange={(e) =>
                        setFormNovaMesa({ ...formNovaMesa, capacidade: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="nome">Nome da Mesa</Label>
                  <Input
                    id="nome"
                    value={formNovaMesa.nome}
                    onChange={(e) =>
                      setFormNovaMesa({ ...formNovaMesa, nome: e.target.value })
                    }
                    placeholder="Ex: Mesa da Janela"
                  />
                </div>

                <div>
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={formNovaMesa.observacoes}
                    onChange={(e) =>
                      setFormNovaMesa({ ...formNovaMesa, observacoes: e.target.value })
                    }
                    placeholder="Observações sobre a mesa..."
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogNovaOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">Criar Mesa</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-700">
                {mesas.filter(m => !comandas[m.id]).length}
              </div>
              <div className="text-sm text-green-600">Disponíveis</div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-700">
                {mesas.filter(m => comandas[m.id]?.status === "aberta").length}
              </div>
              <div className="text-sm text-blue-600">Em atendimento</div>
            </CardContent>
          </Card>

          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-700">
                {mesas.filter(m => comandas[m.id]?.status === "pronto_para_fechamento").length}
              </div>
              <div className="text-sm text-orange-600">Aguardando pagamento</div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-700">
                R$ {Object.values(comandas).reduce((total, c) => total + c.valor_total, 0).toFixed(2)}
              </div>
              <div className="text-sm text-purple-600">Total em comandas</div>
            </CardContent>
          </Card>
        </div>

        {/* Grid de Mesas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
          {mesas.map((mesa) => {
            const comanda = comandas[mesa.id];
            const status = getStatusMesa(mesa);
            const temComanda = !!comanda;

            return (
              <Card
                key={mesa.id}
                className={`relative hover:shadow-lg transition-all duration-300 ${status.color} border-2`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <span>{status.icon}</span>
                      <span>Mesa {mesa.numero}</span>
                    </CardTitle>
                    
                    {/* Botão excluir - apenas se mesa vazia */}
                    {!temComanda && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleExcluirMesa(mesa)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  
                  {mesa.nome && (
                    <p className="text-sm text-muted-foreground">{mesa.nome}</p>
                  )}
                  
                  <Badge className={`w-fit ${status.color}`}>
                    {status.label}
                  </Badge>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      Capacidade:
                    </span>
                    <span className="font-medium">{mesa.capacidade} pessoas</span>
                  </div>

                  {comanda && (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Comanda:</span>
                        <span className="font-medium">#{comanda.numero}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          Total:
                        </span>
                        <span className="text-lg font-bold text-primary">
                          R$ {comanda.valor_total.toFixed(2)}
                        </span>
                      </div>

                      {comanda.garcom_funcionario && (
                        <div className="text-xs text-muted-foreground">
                          Garçom: {comanda.garcom_funcionario.nome}
                        </div>
                      )}
                    </>
                  )}

                  {/* Botões de Ação */}
                  <div className="space-y-2 pt-2">
                    {/* Criar Pedido */}
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setMesaSelecionada(mesa);
                        resetFormPedido();
                        setDialogPedidoOpen(true);
                      }}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {temComanda ? "Adicionar Item" : "Criar Pedido"}
                    </Button>

                    {/* Ver Comanda */}
                    {temComanda && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setComandaSelecionada(comanda);
                          setDialogComandaOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Comanda
                      </Button>
                    )}

                    {/* Pagamento */}
                    {temComanda && comanda.valor_total > 0 && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full bg-green-100 text-green-800 hover:bg-green-200"
                        onClick={() => {
                          setComandaSelecionada(comanda);
                          resetFormPagamento();
                          setDialogPagamentoOpen(true);
                        }}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Pagamento
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {mesas.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Coffee className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma mesa cadastrada</h3>
              <p className="text-muted-foreground mb-4">
                Comece criando as mesas do seu restaurante.
              </p>
              <Button onClick={() => setDialogNovaOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar primeira mesa
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Modal Criar Pedido */}
        <Dialog open={dialogPedidoOpen} onOpenChange={setDialogPedidoOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {mesaSelecionada ? `Criar Pedido - Mesa ${mesaSelecionada.numero}` : "Criar Pedido"}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Seleção de Garçom */}
              {!comandas[mesaSelecionada?.id || ""] && (
                <div>
                  <Label htmlFor="garcom">Garçom Responsável *</Label>
                  <Select
                    value={formPedido.garcom_id}
                    onValueChange={(value) =>
                      setFormPedido({ ...formPedido, garcom_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um garçom" />
                    </SelectTrigger>
                    <SelectContent>
                      {garconsDisponiveis.map((garcom) => (
                        <SelectItem key={garcom.id} value={garcom.id}>
                          {garcom.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Busca e Filtros */}
              <div className="space-y-4">
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <Label htmlFor="search">Buscar Produto</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="Digite o nome do produto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="categoria">Categoria</Label>
                    <Select
                      value={categoriaSelecionada}
                      onValueChange={setCategoriaSelecionada}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categorias.map((cat) => (
                          <SelectItem key={cat.key} value={cat.key}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Lista de Produtos */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                {produtosFiltrados.map((produto) => (
                  <Card
                    key={produto.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      produtoSelecionado?.id === produto.id
                        ? "ring-2 ring-primary bg-primary/5"
                        : ""
                    }`}
                    onClick={() => setProdutoSelecionado(produto)}
                  >
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-sm">{produto.nome}</h4>
                        <span className="text-sm font-bold text-primary">
                          R$ {produto.preco.toFixed(2)}
                        </span>
                      </div>
                      {produto.descricao && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {produto.descricao}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Detalhes do Produto Selecionado */}
              {produtoSelecionado && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold">{produtoSelecionado.nome}</h3>
                        <p className="text-sm text-muted-foreground">
                          {produtoSelecionado.descricao}
                        </p>
                        <p className="text-lg font-bold text-primary">
                          R$ {produtoSelecionado.preco.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="quantidade">Quantidade</Label>
                        <div className="flex items-center space-x-2 mt-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              setFormPedido({
                                ...formPedido,
                                quantidade: Math.max(1, formPedido.quantidade - 1)
                              })
                            }
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Input
                            id="quantidade"
                            type="number"
                            min="1"
                            value={formPedido.quantidade}
                            onChange={(e) =>
                              setFormPedido({
                                ...formPedido,
                                quantidade: parseInt(e.target.value) || 1
                              })
                            }
                            className="w-20 text-center"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              setFormPedido({
                                ...formPedido,
                                quantidade: formPedido.quantidade + 1
                              })
                            }
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="observacoes_pedido">Observações</Label>
                        <Textarea
                          id="observacoes_pedido"
                          value={formPedido.observacoes}
                          onChange={(e) =>
                            setFormPedido({ ...formPedido, observacoes: e.target.value })
                          }
                          placeholder="Observações especiais..."
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-4 p-3 bg-white rounded-lg">
                      <span className="font-medium">Total do item:</span>
                      <span className="text-xl font-bold text-primary">
                        R$ {(produtoSelecionado.preco * formPedido.quantidade).toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogPedidoOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCriarPedido}
                  disabled={!produtoSelecionado || (!formPedido.garcom_id && !comandas[mesaSelecionada?.id || ""])}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Adicionar Item
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal Ver Comanda */}
        <Dialog open={dialogComandaOpen} onOpenChange={setDialogComandaOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {comandaSelecionada ? `Comanda #${comandaSelecionada.numero}` : "Ver Comanda"}
              </DialogTitle>
            </DialogHeader>
            
            {comandaSelecionada && (
              <div className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Mesa:</span>
                      <span className="ml-2 font-medium">
                        {comandaSelecionada.mesa?.numero}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Garçom:</span>
                      <span className="ml-2 font-medium">
                        {comandaSelecionada.garcom_funcionario?.nome}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <span className="ml-2 font-medium capitalize">
                        {comandaSelecionada.status}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Itens:</span>
                      <span className="ml-2 font-medium">
                        {comandaSelecionada.itens?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Itens da Comanda */}
                <div className="space-y-3">
                  <h4 className="font-semibold">Itens do Pedido:</h4>
                  {comandaSelecionada.itens && comandaSelecionada.itens.length > 0 ? (
                    comandaSelecionada.itens.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
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
                            R$ {item.preco_unitario.toFixed(2)} cada
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">
                            R$ {(item.quantidade * item.preco_unitario).toFixed(2)}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {item.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      Nenhum item na comanda
                    </p>
                  )}
                </div>

                {/* Total */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total da Comanda:</span>
                    <span className="text-primary">
                      R$ {comandaSelecionada.valor_total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal Pagamento */}
        <Dialog open={dialogPagamentoOpen} onOpenChange={setDialogPagamentoOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <span>Finalizar Pagamento</span>
              </DialogTitle>
            </DialogHeader>
            
            {comandaSelecionada && (
              <div className="space-y-6">
                {/* Resumo da Comanda */}
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Comanda #{comandaSelecionada.numero}</h4>
                  <div className="text-sm space-y-1">
                    <div>Mesa: {comandaSelecionada.mesa?.numero}</div>
                    <div>Garçom: {comandaSelecionada.garcom_funcionario?.nome}</div>
                    <div>Itens: {comandaSelecionada.itens?.length || 0}</div>
                  </div>
                </div>

                {/* Desconto */}
                <div className="space-y-3">
                  <Label>Desconto</Label>
                  <div className="flex space-x-2">
                    <Select
                      value={formPagamento.desconto_tipo}
                      onValueChange={(value) =>
                        setFormPagamento({ ...formPagamento, desconto_tipo: value })
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="valor">R$</SelectItem>
                        <SelectItem value="porcentagem">%</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formPagamento.desconto_valor}
                      onChange={(e) =>
                        setFormPagamento({ ...formPagamento, desconto_valor: e.target.value })
                      }
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Couvert */}
                <div>
                  <Label htmlFor="couvert">Taxa de Couvert (R$)</Label>
                  <Input
                    id="couvert"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formPagamento.couvert}
                    onChange={(e) =>
                      setFormPagamento({ ...formPagamento, couvert: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>

                {/* Forma de Pagamento */}
                <div>
                  <Label htmlFor="forma_pagamento">Forma de Pagamento *</Label>
                  <Select
                    value={formPagamento.forma_pagamento}
                    onValueChange={(value) =>
                      setFormPagamento({ ...formPagamento, forma_pagamento: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a forma de pagamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                      <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Valor Pago */}
                <div>
                  <Label htmlFor="valor_pago">Valor Pago (R$)</Label>
                  <Input
                    id="valor_pago"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formPagamento.valor_pago}
                    onChange={(e) =>
                      setFormPagamento({ ...formPagamento, valor_pago: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>

                {/* Cálculos */}
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>R$ {comandaSelecionada.valor_total.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Couvert:</span>
                    <span>R$ {(parseFloat(formPagamento.couvert) || 0).toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Desconto:</span>
                    <span className="text-red-600">
                      - R$ {(() => {
                        const subtotal = comandaSelecionada.valor_total;
                        if (formPagamento.desconto_tipo === "porcentagem") {
                          return ((subtotal * (parseFloat(formPagamento.desconto_valor) || 0)) / 100).toFixed(2);
                        }
                        return (parseFloat(formPagamento.desconto_valor) || 0).toFixed(2);
                      })()}
                    </span>
                  </div>
                  
                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>Total:</span>
                    <span className="text-primary">R$ {calcularTotalPagamento().toFixed(2)}</span>
                  </div>
                  
                  {formPagamento.valor_pago && parseFloat(formPagamento.valor_pago) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Troco:</span>
                      <span className="font-medium">R$ {calcularTroco().toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Observações */}
                <div>
                  <Label htmlFor="observacoes_pagamento">Observações</Label>
                  <Textarea
                    id="observacoes_pagamento"
                    value={formPagamento.observacoes}
                    onChange={(e) =>
                      setFormPagamento({ ...formPagamento, observacoes: e.target.value })
                    }
                    placeholder="Observações sobre o pagamento..."
                  />
                </div>

                {/* Botões */}
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogPagamentoOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleFinalizarPagamento}
                    disabled={!formPagamento.forma_pagamento}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Receipt className="h-4 w-4 mr-2" />
                    Finalizar Venda
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Mesas;