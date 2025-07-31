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
  CheckCircle,
  Clock,
  UtensilsCrossed,
  User,
  RefreshCw,
  Coffee,
  AlertCircle,
  Plus,
  Minus,
  ShoppingCart,
  CreditCard,
  Smartphone,
  Receipt,
  Percent,
  DollarSign,
  ChefHat,
  Eye,
  X,
  Trash2,
  Edit
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { funcionariosSimplesService, type FuncionarioSimples } from "@/lib/funcionarios-simples";
import { 
  mesasService, 
  comandasService,
  comandaItensService,
  produtosService,
  vendasService,
  subscribeToTable 
} from "@/lib/database";
import type { Mesa, Comanda, Produto, CategoriaProduto } from "@/types/database";

const Mesas = () => {
  const navigate = useNavigate();
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [funcionariosGarcom, setFuncionariosGarcom] = useState<FuncionarioSimples[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Estados dos modais
  const [dialogGarcomOpen, setDialogGarcomOpen] = useState(false);
  const [dialogProdutosOpen, setDialogProdutosOpen] = useState(false);
  const [dialogPagamentoOpen, setDialogPagamentoOpen] = useState(false);
  const [dialogComandaOpen, setDialogComandaOpen] = useState(false);
  const [dialogCriarMesaOpen, setDialogCriarMesaOpen] = useState(false);
  const [dialogEditarMesaOpen, setDialogEditarMesaOpen] = useState(false);

  // Estados de seleção
  const [mesaSelecionada, setMesaSelecionada] = useState<Mesa | null>(null);
  const [comandaSelecionada, setComandaSelecionada] = useState<Comanda | null>(null);
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [garcomSelecionado, setGarcomSelecionado] = useState<string>("");

  // Estados do formulário de produto
  const [quantidade, setQuantidade] = useState(1);
  const [observacoes, setObservacoes] = useState("");

  // Estados do pagamento
  const [formaPagamento, setFormaPagamento] = useState<string>("");
  const [valorDesconto, setValorDesconto] = useState<string>("0");
  const [tipoDesconto, setTipoDesconto] = useState<"valor" | "percentual">("valor");
  const [valorCouvert, setValorCouvert] = useState<string>("0");

  // Estados do formulário de mesa
  const [formMesa, setFormMesa] = useState({
    numero: "",
    nome: "",
    capacidade: "4"
  });

  const categorias: { key: CategoriaProduto; label: string; icon: any }[] = [
    { key: "entrada", label: "Entradas", icon: Coffee },
    { key: "prato", label: "Pratos Principais", icon: ChefHat },
    { key: "bebida", label: "Bebidas", icon: Coffee },
    { key: "sobremesa", label: "Sobremesas", icon: UtensilsCrossed }
  ];

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
      setError(null);
      const [mesasData, produtosData, funcionariosData] = await Promise.all([
        mesasService.getAll(),
        produtosService.getByCategoria(),
        funcionariosSimplesService.getByTipo('garcom')
      ]);
      setMesas(mesasData);
      setProdutos(produtosData);
      setFuncionariosGarcom(funcionariosData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      setError("Erro ao carregar dados das mesas");
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
      setError(null);
    } catch (error) {
      console.error("Erro ao carregar mesas:", error);
      setError("Erro ao atualizar dados das mesas");
    }
  };

  const handleClickMesa = async (mesa: Mesa, acao: 'produtos' | 'pagamento' | 'comanda') => {
    // Verificar se a mesa está em estado "fechada" e permitir uso
    if (mesa.status === "fechada") {
      // Liberar mesa automaticamente se estiver fechada
      try {
        await mesasService.updateStatus(mesa.id, "livre");
        loadMesas();
        toast({
          title: "Mesa liberada",
          description: "Mesa liberada automaticamente."
        });
        return;
      } catch (error) {
        console.error("Erro ao liberar mesa:", error);
      }
    }

    setMesaSelecionada(mesa);
    
    if (acao === 'produtos') {
      if (mesa.status === "livre") {
        // Mesa livre - selecionar garçom primeiro
        setDialogGarcomOpen(true);
      } else {
        // Mesa ocupada - abrir produtos diretamente
        try {
          const comandas = await comandasService.getByMesa(mesa.id);
          if (comandas.length > 0) {
            setComandaSelecionada(comandas[0]);
            setDialogProdutosOpen(true);
          }
        } catch (error) {
          console.error("Erro ao carregar comanda:", error);
          toast({
            title: "Erro",
            description: "Erro ao carregar dados da mesa.",
            variant: "destructive"
          });
        }
      }
    } else if (acao === 'pagamento') {
      try {
        const comandas = await comandasService.getByMesa(mesa.id);
        if (comandas.length > 0) {
          setComandaSelecionada(comandas[0]);
          setDialogPagamentoOpen(true);
        }
      } catch (error) {
        console.error("Erro ao carregar comanda:", error);
        toast({
          title: "Erro",
          description: "Erro ao carregar dados da mesa.",
          variant: "destructive"
        });
      }
    } else if (acao === 'comanda') {
      try {
        const comandas = await comandasService.getByMesa(mesa.id);
        if (comandas.length > 0) {
          setComandaSelecionada(comandas[0]);
          setDialogComandaOpen(true);
        }
      } catch (error) {
        console.error("Erro ao carregar comanda:", error);
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

      setComandaSelecionada(comanda);
      setDialogGarcomOpen(false);
      setDialogProdutosOpen(true);
      setGarcomSelecionado("");
      
      toast({
        title: "Mesa ocupada",
        description: "Mesa atribuída ao garçom com sucesso."
      });
      
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

  const handleAdicionarItem = async () => {
    if (!produtoSelecionado || !comandaSelecionada) return;

    try {
      await comandaItensService.create({
        comanda_id: comandaSelecionada.id,
        produto_id: produtoSelecionado.id,
        quantidade,
        preco_unitario: produtoSelecionado.preco,
        status: "enviado",
        enviado_cozinha: true,
        observacoes: observacoes || undefined
      });

      toast({
        title: "Item adicionado",
        description: `${produtoSelecionado.nome} adicionado à comanda.`
      });

      // Resetar form
      setProdutoSelecionado(null);
      setQuantidade(1);
      setObservacoes("");
      
      // Recarregar comanda
      const comandaAtualizada = await comandasService.getById(comandaSelecionada.id);
      setComandaSelecionada(comandaAtualizada);
      
      loadMesas();
    } catch (error: any) {
      console.error("Erro ao adicionar item:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao adicionar item.",
        variant: "destructive"
      });
    }
  };

  const handleCriarMesa = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await mesasService.create({
        numero: parseInt(formMesa.numero),
        nome: formMesa.nome || undefined,
        capacidade: parseInt(formMesa.capacidade),
        status: "livre",
        ativo: true
      });

      toast({
        title: "Mesa criada",
        description: "Mesa criada com sucesso."
      });

      setDialogCriarMesaOpen(false);
      setFormMesa({ numero: "", nome: "", capacidade: "4" });
      loadMesas();
    } catch (error: any) {
      console.error("Erro ao criar mesa:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar mesa.",
        variant: "destructive"
      });
    }
  };

  const handleEditarMesa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mesaSelecionada) return;

    try {
      await mesasService.update(mesaSelecionada.id, {
        numero: parseInt(formMesa.numero),
        nome: formMesa.nome || undefined,
        capacidade: parseInt(formMesa.capacidade)
      });

      toast({
        title: "Mesa atualizada",
        description: "Mesa atualizada com sucesso."
      });

      setDialogEditarMesaOpen(false);
      setMesaSelecionada(null);
      setFormMesa({ numero: "", nome: "", capacidade: "4" });
      loadMesas();
    } catch (error: any) {
      console.error("Erro ao atualizar mesa:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar mesa.",
        variant: "destructive"
      });
    }
  };

  const handleExcluirMesa = async (mesa: Mesa) => {
    if (mesa.status !== "livre") {
      toast({
        title: "Erro",
        description: "Não é possível excluir uma mesa ocupada.",
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
      } catch (error: any) {
        console.error("Erro ao excluir mesa:", error);
        toast({
          title: "Erro",
          description: error.message || "Erro ao excluir mesa.",
          variant: "destructive"
        });
      }
    }
  };

  const handleEditarMesaClick = (mesa: Mesa) => {
    setMesaSelecionada(mesa);
    setFormMesa({
      numero: mesa.numero.toString(),
      nome: mesa.nome || "",
      capacidade: mesa.capacidade.toString()
    });
    setDialogEditarMesaOpen(true);
  };

  const calcularSubtotal = () => {
    if (!comandaSelecionada?.itens) return 0;
    return comandaSelecionada.itens.reduce(
      (total, item) => total + (item.quantidade * item.preco_unitario),
      0
    );
  };

  const calcularDesconto = () => {
    const subtotal = calcularSubtotal();
    const desconto = parseFloat(valorDesconto) || 0;
    
    if (tipoDesconto === "percentual") {
      return (subtotal * desconto) / 100;
    }
    return desconto;
  };

  const calcularTotal = () => {
    const subtotal = calcularSubtotal();
    const desconto = calcularDesconto();
    const couvert = parseFloat(valorCouvert) || 0;
    return Math.max(0, subtotal - desconto + couvert);
  };

  const handleFinalizarPagamento = async () => {
    if (!comandaSelecionada || !formaPagamento) {
      toast({
        title: "Erro",
        description: "Selecione a forma de pagamento.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Fechar a comanda
      await comandasService.fechar(comandaSelecionada.id);

      // Registrar venda
      const subtotal = calcularSubtotal();
      const desconto = calcularDesconto();
      const couvert = parseFloat(valorCouvert) || 0;
      const total = calcularTotal();

      await vendasService.create({
        comanda_id: comandaSelecionada.id,
        operador_id: comandaSelecionada.garcom_id || comandaSelecionada.garcom_funcionario_id || '',
        valor_total: subtotal + couvert,
        valor_desconto: desconto,
        valor_final: total,
        forma_pagamento: formaPagamento,
        data_venda: new Date().toISOString()
      });

      // Liberar mesa
      if (mesaSelecionada) {
        await mesasService.updateStatus(mesaSelecionada.id, "livre");
      }

      toast({
        title: "Pagamento realizado",
        description: `Pagamento de R$ ${total.toFixed(2)} realizado com sucesso.`
      });

      // Limpar estados
      setDialogPagamentoOpen(false);
      setComandaSelecionada(null);
      setFormaPagamento("");
      setValorDesconto("0");
      setValorCouvert("0");
      
      loadMesas();
    } catch (error: any) {
      console.error("Erro ao finalizar pagamento:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao finalizar pagamento.",
        variant: "destructive"
      });
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "livre":
        return {
          color: "bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 hover:from-emerald-100 hover:to-emerald-200",
          textColor: "text-emerald-800",
          badgeColor: "bg-emerald-500 text-white",
          icon: CheckCircle,
          iconColor: "text-emerald-600",
          label: "Livre",
          shadowColor: "hover:shadow-emerald-200"
        };
      case "ocupada":
        return {
          color: "bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:from-red-100 hover:to-red-200",
          textColor: "text-red-800",
          badgeColor: "bg-red-500 text-white",
          icon: Clock,
          iconColor: "text-red-600",
          label: "Ocupada",
          shadowColor: "hover:shadow-red-200"
        };
      case "fechada":
      case "aguardando_pagamento":
        return {
          color: "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:from-blue-100 hover:to-blue-200",
          textColor: "text-blue-800",
          badgeColor: "bg-blue-500 text-white",
          icon: UtensilsCrossed,
          iconColor: "text-blue-600",
          label: "Pronta",
          shadowColor: "hover:shadow-blue-200"
        };
      default:
        return {
          color: "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 hover:from-gray-100 hover:to-gray-200",
          textColor: "text-gray-800",
          badgeColor: "bg-gray-500 text-white",
          icon: AlertCircle,
          iconColor: "text-gray-600",
          label: status,
          shadowColor: "hover:shadow-gray-200"
        };
    }
  };

  const produtosPorCategoria = categorias.map((categoria) => ({
    ...categoria,
    produtos: produtos.filter((p) => p.categoria_produto === categoria.key)
  }));

  const handleTryAgain = () => {
    loadData();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando mesas...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          <div className="flex items-center justify-center h-64">
            <Card className="max-w-md mx-auto shadow-xl">
              <CardContent className="p-6 text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Erro ao carregar dados</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={handleTryAgain} className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Tentar Novamente
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const mesasLivres = mesas.filter(m => m.status === "livre").length;
  const mesasOcupadas = mesas.filter(m => m.status === "ocupada").length;
  const mesasProntas = mesas.filter(m => m.status === "fechada" || m.status === "aguardando_pagamento").length;

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="space-y-8 p-4 lg:p-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-3 flex items-center justify-center space-x-3">
                <Coffee className="h-10 w-10 lg:h-12 lg:w-12 text-primary" />
                <span>Controle de Mesas</span>
              </h1>
              <p className="text-xl text-gray-600">
                Gerencie comandas, adicione produtos e processe pagamentos
              </p>
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={() => setDialogCriarMesaOpen(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Mesa
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-emerald-100 rounded-xl">
                    <CheckCircle className="h-8 w-8 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Livres</p>
                    <p className="text-3xl font-bold text-emerald-600">{mesasLivres}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-red-100 rounded-xl">
                    <Clock className="h-8 w-8 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Ocupadas</p>
                    <p className="text-3xl font-bold text-red-600">{mesasOcupadas}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <UtensilsCrossed className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Prontas</p>
                    <p className="text-3xl font-bold text-blue-600">{mesasProntas}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <Users className="h-8 w-8 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total</p>
                    <p className="text-3xl font-bold text-purple-600">{mesas.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Grid de Mesas */}
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
              {mesas.map((mesa) => {
                const statusConfig = getStatusConfig(mesa.status);
                const StatusIcon = statusConfig.icon;
                
                return (
                  <Card
                    key={mesa.id}
                    className={`
                      transition-all duration-300 transform hover:scale-105 hover:shadow-2xl
                      border-2 ${statusConfig.color} backdrop-blur-sm ${statusConfig.shadowColor}
                      relative overflow-hidden
                    `}
                  >
                    {/* Status Badge */}
                    <div className="absolute top-4 right-4 z-10">
                      <Badge className={`${statusConfig.badgeColor} border-0 font-semibold px-3 py-1 shadow-lg`}>
                        {statusConfig.label}
                      </Badge>
                    </div>

                    {/* Botões de Ação da Mesa */}
                    <div className="absolute top-4 left-4 z-10 flex space-x-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 bg-white/90 hover:bg-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditarMesaClick(mesa);
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      {mesa.status === "livre" && (
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExcluirMesa(mesa);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>

                    <CardContent className="p-6 pt-12">
                      <div className="text-center space-y-6">
                        {/* Ícone e Número da Mesa */}
                        <div className="flex flex-col items-center space-y-3">
                          <div className="p-4 bg-white rounded-2xl shadow-lg">
                            <StatusIcon className={`h-10 w-10 ${statusConfig.iconColor}`} />
                          </div>
                          <div>
                            <h3 className={`text-2xl font-bold ${statusConfig.textColor}`}>
                              Mesa {mesa.numero}
                            </h3>
                            {mesa.nome && (
                              <p className="text-sm text-gray-600 mt-1">{mesa.nome}</p>
                            )}
                          </div>
                        </div>

                        {/* Capacidade */}
                        <div className="flex items-center justify-center space-x-2 text-gray-600 bg-white/50 rounded-lg p-2">
                          <Users className="h-5 w-5" />
                          <span className="font-medium">
                            {mesa.capacidade} pessoas
                          </span>
                        </div>

                        {/* Botões de Ação */}
                        <div className="space-y-3">
                          {mesa.status === "livre" ? (
                            <Button
                              onClick={() => handleClickMesa(mesa, 'produtos')}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                            >
                              <Plus className="h-5 w-5 mr-2" />
                              Iniciar Atendimento
                            </Button>
                          ) : mesa.status === "fechada" || mesa.status === "aguardando_pagamento" ? (
                            <div className="space-y-2">
                              <Button
                                onClick={() => handleClickMesa(mesa, 'comanda')}
                                variant="outline"
                                className="w-full border-2 font-semibold py-3 rounded-xl hover:shadow-lg transition-all duration-200"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Comanda
                              </Button>

                              <Button
                                onClick={() => handleClickMesa(mesa, 'pagamento')}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                              >
                                <CreditCard className="h-4 w-4 mr-2" />
                                Finalizar Pagamento
                              </Button>

                              <Button
                                onClick={() => handleClickMesa(mesa, 'produtos')}
                                variant="outline"
                                className="w-full border-2 font-semibold py-3 rounded-xl hover:shadow-lg transition-all duration-200"
                              >
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                Adicionar Itens
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Button
                                onClick={() => handleClickMesa(mesa, 'produtos')}
                                variant="outline"
                                className="w-full border-2 font-semibold py-3 rounded-xl hover:shadow-lg transition-all duration-200"
                              >
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                Adicionar Itens
                              </Button>
                              
                              <Button
                                onClick={() => handleClickMesa(mesa, 'comanda')}
                                variant="outline"
                                className="w-full border-2 font-semibold py-3 rounded-xl hover:shadow-lg transition-all duration-200"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Comanda
                              </Button>

                              <Button
                                onClick={() => handleClickMesa(mesa, 'pagamento')}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                              >
                                <CreditCard className="h-4 w-4 mr-2" />
                                Finalizar Pagamento
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Indicador visual */}
                        <div className={`h-2 w-full rounded-full ${statusConfig.badgeColor.replace('text-white', '').replace('bg-', 'bg-')}`} />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Mensagem quando não há mesas */}
          {mesas.length === 0 && (
            <Card className="max-w-md mx-auto bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-8 text-center">
                <Coffee className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nenhuma mesa cadastrada
                </h3>
                <p className="text-gray-600 mb-4">
                  Configure as mesas do seu restaurante para começar.
                </p>
                <Button onClick={() => setDialogCriarMesaOpen(true)} className="mr-2">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Mesa
                </Button>
                <Button onClick={handleTryAgain} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Dialog Criar Mesa */}
          <Dialog open={dialogCriarMesaOpen} onOpenChange={setDialogCriarMesaOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Mesa</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCriarMesa} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="numero">Número da Mesa *</Label>
                    <Input
                      id="numero"
                      type="number"
                      min="1"
                      value={formMesa.numero}
                      onChange={(e) => setFormMesa({ ...formMesa, numero: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="capacidade">Capacidade *</Label>
                    <Input
                      id="capacidade"
                      type="number"
                      min="1"
                      value={formMesa.capacidade}
                      onChange={(e) => setFormMesa({ ...formMesa, capacidade: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="nome">Nome da Mesa (opcional)</Label>
                  <Input
                    id="nome"
                    value={formMesa.nome}
                    onChange={(e) => setFormMesa({ ...formMesa, nome: e.target.value })}
                    placeholder="Ex: Mesa da Janela"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogCriarMesaOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Mesa
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Dialog Editar Mesa */}
          <Dialog open={dialogEditarMesaOpen} onOpenChange={setDialogEditarMesaOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Mesa {mesaSelecionada?.numero}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleEditarMesa} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="numero_edit">Número da Mesa *</Label>
                    <Input
                      id="numero_edit"
                      type="number"
                      min="1"
                      value={formMesa.numero}
                      onChange={(e) => setFormMesa({ ...formMesa, numero: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="capacidade_edit">Capacidade *</Label>
                    <Input
                      id="capacidade_edit"
                      type="number"
                      min="1"
                      value={formMesa.capacidade}
                      onChange={(e) => setFormMesa({ ...formMesa, capacidade: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="nome_edit">Nome da Mesa (opcional)</Label>
                  <Input
                    id="nome_edit"
                    value={formMesa.nome}
                    onChange={(e) => setFormMesa({ ...formMesa, nome: e.target.value })}
                    placeholder="Ex: Mesa da Janela"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogEditarMesaOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    <Edit className="h-4 w-4 mr-2" />
                    Atualizar Mesa
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Outros dialogs permanecem iguais... */}
          {/* Dialog Selecionar Garçom */}
          <Dialog open={dialogGarcomOpen} onOpenChange={setDialogGarcomOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-center flex items-center justify-center space-x-2">
                  <User className="h-6 w-6 text-primary" />
                  <span>Atribuir Garçom à Mesa {mesaSelecionada?.numero}</span>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="text-center">
                  <div className="p-4 bg-primary/10 rounded-2xl w-fit mx-auto mb-4">
                    <User className="h-10 w-10 text-primary" />
                  </div>
                  <p className="text-muted-foreground">
                    Selecione o garçom responsável por esta mesa:
                  </p>
                </div>
                
                {funcionariosGarcom.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                    <p className="text-muted-foreground mb-2">
                      Nenhum garçom ativo encontrado.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Cadastre funcionários na tela de Gerenciar Funcionários.
                    </p>
                  </div>
                ) : (
                  <>
                    <div>
                      <Select value={garcomSelecionado} onValueChange={setGarcomSelecionado}>
                        <SelectTrigger className="w-full h-12">
                          <SelectValue placeholder="Escolha um garçom" />
                        </SelectTrigger>
                        <SelectContent>
                          {funcionariosGarcom.map((garcom) => (
                            <SelectItem key={garcom.id} value={garcom.id}>
                              <div className="flex items-center space-x-2">
                                <User className="h-4 w-4" />
                                <span>{garcom.nome}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex space-x-3">
                      <Button
                        variant="outline"
                        onClick={() => setDialogGarcomOpen(false)}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleSelecionarGarcom}
                        disabled={!garcomSelecionado}
                        className="flex-1"
                      >
                        <User className="h-4 w-4 mr-2" />
                        Confirmar
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Dialog Produtos */}
          <Dialog open={dialogProdutosOpen} onOpenChange={setDialogProdutosOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <ShoppingCart className="h-6 w-6 text-primary" />
                  <span>Adicionar Produtos - Mesa {mesaSelecionada?.numero}</span>
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Comanda Atual */}
                {comandaSelecionada && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>Comanda #{comandaSelecionada.numero}</span>
                        <span className="text-xl font-bold text-primary">
                          R$ {comandaSelecionada.valor_total.toFixed(2)}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {comandaSelecionada.itens && comandaSelecionada.itens.length > 0 ? (
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {comandaSelecionada.itens.map((item) => (
                            <div key={item.id} className="flex items-center justify-between text-sm bg-white p-2 rounded">
                              <span>{item.quantidade}x {item.produto?.nome}</span>
                              <span className="font-semibold">R$ {(item.quantidade * item.preco_unitario).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-2">Nenhum item ainda</p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Produtos por Categoria */}
                <div className="space-y-6">
                  {produtosPorCategoria.map((categoria) => (
                    <div key={categoria.key}>
                      <h3 className="text-xl font-bold mb-4 flex items-center space-x-2">
                        <categoria.icon className="h-6 w-6 text-primary" />
                        <span>{categoria.label}</span>
                      </h3>
                      
                      {categoria.produtos.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {categoria.produtos.map((produto) => (
                            <Card
                              key={produto.id}
                              className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-primary/50"
                              onClick={() => setProdutoSelecionado(produto)}
                            >
                              <CardContent className="p-4">
                                <div className="space-y-3">
                                  <div>
                                    <h4 className="font-semibold text-lg">{produto.nome}</h4>
                                    {produto.descricao && (
                                      <p className="text-sm text-muted-foreground line-clamp-2">
                                        {produto.descricao}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-xl font-bold text-primary">
                                      R$ {produto.preco.toFixed(2)}
                                    </span>
                                    <div className="flex items-center text-sm text-muted-foreground">
                                      <Clock className="h-4 w-4 mr-1" />
                                      {produto.tempo_preparo}min
                                    </div>
                                  </div>
                                  <Button className="w-full" size="sm">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Adicionar
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-4">
                          Nenhum produto disponível nesta categoria
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Dialog Adicionar Item */}
          <Dialog open={!!produtoSelecionado} onOpenChange={() => setProdutoSelecionado(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar à Comanda</DialogTitle>
              </DialogHeader>
              {produtoSelecionado && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-4 p-4 bg-muted rounded-lg">
                    <div>
                      <h3 className="font-semibold text-lg">{produtoSelecionado.nome}</h3>
                      <p className="text-sm text-muted-foreground">
                        {produtoSelecionado.descricao}
                      </p>
                      <p className="text-xl font-bold text-primary">
                        R$ {produtoSelecionado.preco.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="quantidade">Quantidade</Label>
                    <div className="flex items-center space-x-3 mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        id="quantidade"
                        type="number"
                        min="1"
                        value={quantidade}
                        onChange={(e) => setQuantidade(parseInt(e.target.value) || 1)}
                        className="w-20 text-center"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantidade(quantidade + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea
                      id="observacoes"
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      placeholder="Observações especiais para o preparo..."
                    />
                  </div>

                  <div className="bg-primary/10 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total do item:</span>
                      <span className="text-xl font-bold text-primary">
                        R$ {(produtoSelecionado.preco * quantidade).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setProdutoSelecionado(null)}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleAdicionarItem}>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Adicionar à Comanda
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Dialog Ver Comanda */}
          <Dialog open={dialogComandaOpen} onOpenChange={setDialogComandaOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <Receipt className="h-6 w-6 text-primary" />
                  <span>Comanda #{comandaSelecionada?.numero} - Mesa {mesaSelecionada?.numero}</span>
                </DialogTitle>
              </DialogHeader>
              
              {comandaSelecionada && (
                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Garçom:</span>
                        <p className="font-medium">{comandaSelecionada.garcom_funcionario?.nome || 'Não atribuído'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Abertura:</span>
                        <p className="font-medium">
                          {new Date(comandaSelecionada.data_abertura).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {comandaSelecionada.itens && comandaSelecionada.itens.length > 0 ? (
                    <div className="space-y-3">
                      <h4 className="font-semibold">Itens da Comanda:</h4>
                      {comandaSelecionada.itens.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div>
                            <div className="font-medium">{item.quantidade}x {item.produto?.nome}</div>
                            {item.observacoes && (
                              <div className="text-sm text-muted-foreground">Obs: {item.observacoes}</div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-bold">R$ {(item.quantidade * item.preco_unitario).toFixed(2)}</div>
                            <div className="text-sm text-muted-foreground">R$ {item.preco_unitario.toFixed(2)} cada</div>
                          </div>
                        </div>
                      ))}
                      
                      <div className="border-t pt-3">
                        <div className="flex justify-between items-center text-lg font-bold">
                          <span>Total:</span>
                          <span className="text-primary">R$ {comandaSelecionada.valor_total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">Nenhum item na comanda</p>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Dialog Pagamento */}
          <Dialog open={dialogPagamentoOpen} onOpenChange={setDialogPagamentoOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <CreditCard className="h-6 w-6 text-primary" />
                  <span>Finalizar Pagamento - Mesa {mesaSelecionada?.numero}</span>
                </DialogTitle>
              </DialogHeader>
              
              {comandaSelecionada && (
                <div className="space-y-6">
                  {/* Resumo da Comanda */}
                  <Card className="bg-muted/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Resumo da Comanda #{comandaSelecionada.numero}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {comandaSelecionada.itens && comandaSelecionada.itens.length > 0 ? (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {comandaSelecionada.itens.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span>{item.quantidade}x {item.produto?.nome}</span>
                              <span className="font-semibold">R$ {(item.quantidade * item.preco_unitario).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">Nenhum item na comanda</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Forma de Pagamento */}
                  <div>
                    <Label htmlFor="forma_pagamento">Forma de Pagamento *</Label>
                    <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Selecione a forma de pagamento" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pix">
                          <div className="flex items-center space-x-2">
                            <Smartphone className="h-4 w-4" />
                            <span>PIX</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="cartao_credito">
                          <div className="flex items-center space-x-2">
                            <CreditCard className="h-4 w-4" />
                            <span>Cartão de Crédito</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="cartao_debito">
                          <div className="flex items-center space-x-2">
                            <CreditCard className="h-4 w-4" />
                            <span>Cartão de Débito</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="dinheiro">
                          <div className="flex items-center space-x-2">
                            <DollarSign className="h-4 w-4" />
                            <span>Dinheiro</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Desconto */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="tipo_desconto">Tipo de Desconto</Label>
                      <Select value={tipoDesconto} onValueChange={(value: "valor" | "percentual") => setTipoDesconto(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="valor">
                            <div className="flex items-center space-x-2">
                              <DollarSign className="h-4 w-4" />
                              <span>Valor (R$)</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="percentual">
                            <div className="flex items-center space-x-2">
                              <Percent className="h-4 w-4" />
                              <span>Percentual (%)</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="desconto">
                        Desconto {tipoDesconto === "percentual" ? "(%)" : "(R$)"}
                      </Label>
                      <Input
                        id="desconto"
                        type="number"
                        step="0.01"
                        min="0"
                        max={tipoDesconto === "percentual" ? "100" : undefined}
                        value={valorDesconto}
                        onChange={(e) => setValorDesconto(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Taxa de Couvert */}
                  <div>
                    <Label htmlFor="couvert">Taxa de Couvert (R$)</Label>
                    <Input
                      id="couvert"
                      type="number"
                      step="0.01"
                      min="0"
                      value={valorCouvert}
                      onChange={(e) => setValorCouvert(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>

                  {/* Resumo do Pagamento */}
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>R$ {calcularSubtotal().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Desconto:</span>
                        <span>- R$ {calcularDesconto().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Taxa de Couvert:</span>
                        <span>+ R$ {(parseFloat(valorCouvert) || 0).toFixed(2)}</span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between text-xl font-bold">
                          <span>Total:</span>
                          <span className="text-primary">R$ {calcularTotal().toFixed(2)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setDialogPagamentoOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleFinalizarPagamento}
                      disabled={!formaPagamento}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Confirmar Pagamento
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Mesas;