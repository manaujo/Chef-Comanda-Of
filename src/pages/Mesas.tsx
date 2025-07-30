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
  Users,
  Coffee,
  Plus,
  Minus,
  User,
  CheckCircle,
  Clock,
  UtensilsCrossed
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { funcionariosSimplesService, type FuncionarioSimples } from "@/lib/funcionarios-simples";
import { 
  mesasService, 
  comandasService, 
  comandaItensService, 
  produtosService,
  subscribeToTable 
} from "@/lib/database";
import type { Mesa, Comanda, Produto, ComandaItem } from "@/types/database";

const Mesas = () => {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [funcionariosGarcom, setFuncionariosGarcom] = useState<FuncionarioSimples[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogGarcomOpen, setDialogGarcomOpen] = useState(false);
  const [dialogMesaOpen, setDialogMesaOpen] = useState(false);
  const [dialogProdutoOpen, setDialogProdutoOpen] = useState(false);
  const [mesaSelecionada, setMesaSelecionada] = useState<Mesa | null>(null);
  const [comandaAtual, setComandaAtual] = useState<Comanda | null>(null);
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [observacoes, setObservacoes] = useState("");
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
      if (comandaAtual) {
        loadComandaDetalhes(comandaAtual.id);
      }
    });

    return () => {
      unsubscribeMesas();
      unsubscribeComandasItens();
    };
  }, [comandaAtual]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [mesasData, funcionariosData, produtosData] = await Promise.all([
        mesasService.getAll(),
        funcionariosSimplesService.getByTipo('garcom'),
        produtosService.getAll()
      ]);
      setMesas(mesasData);
      setFuncionariosGarcom(funcionariosData);
      setProdutos(produtosData);
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

  const loadComandaDetalhes = async (comandaId: string) => {
    try {
      const comandaData = await comandasService.getById(comandaId);
      setComandaAtual(comandaData);
    } catch (error) {
      console.error("Erro ao carregar detalhes da comanda:", error);
    }
  };

  const handleClickMesa = async (mesa: Mesa) => {
    setMesaSelecionada(mesa);
    
    if (mesa.status === "livre") {
      setDialogGarcomOpen(true);
    } else if (mesa.status === "ocupada" || mesa.status === "fechada") {
      // Mesa ocupada - carregar comanda
      try {
        const comanda = await comandasService.getByMesa(mesa.id);
        if (comanda) {
          setComandaAtual(comanda);
          setDialogMesaOpen(true);
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

  const handleSelecionarGarcom = async (garcomId: string) => {
    if (!mesaSelecionada) return;

    try {
      // Criar nova comanda
      const comanda = await comandasService.create({
        mesa_id: mesaSelecionada.id,
        garcom_funcionario_id: garcomId,
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
      setComandaAtual(comanda);
      setDialogMesaOpen(true);
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

  const handleAdicionarProduto = (produto: Produto) => {
    setProdutoSelecionado(produto);
    setQuantidade(1);
    setObservacoes("");
    setDialogProdutoOpen(true);
  };

  const handleConfirmarProduto = async () => {
    if (!comandaAtual || !produtoSelecionado) return;

    try {
      await comandaItensService.create({
        comanda_id: comandaAtual.id,
        produto_id: produtoSelecionado.id,
        quantidade,
        preco_unitario: produtoSelecionado.preco,
        status: "pendente",
        enviado_cozinha: false,
        observacoes: observacoes || undefined
      });

      toast({
        title: "Produto adicionado",
        description: `${produtoSelecionado.nome} adicionado à comanda.`
      });

      setDialogProdutoOpen(false);
      setProdutoSelecionado(null);
      setQuantidade(1);
      setObservacoes("");
      
      // Recarregar comanda
      loadComandaDetalhes(comandaAtual.id);
    } catch (error: any) {
      console.error("Erro ao adicionar produto:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao adicionar produto.",
        variant: "destructive"
      });
    }
  };

  const handleFecharComanda = async () => {
    if (!comandaAtual || !mesaSelecionada) return;

    try {
      // Verificar se todos os itens foram enviados para cozinha
      const itensNaoEnviados = comandaAtual.itens?.filter(item => !item.enviado_cozinha && item.status !== 'cancelado') || [];
      
      if (itensNaoEnviados.length > 0) {
        toast({
          title: "Atenção",
          description: "Há itens que ainda não foram enviados para a cozinha. Envie todos os itens antes de fechar a comanda.",
          variant: "destructive"
        });
        return;
      }

      // Se todos os itens foram enviados, a comanda será fechada automaticamente quando todos estiverem prontos
      toast({
        title: "Comanda em produção",
        description: "Todos os itens foram enviados para a cozinha. A comanda será liberada para pagamento quando todos os itens estiverem prontos."
      });

      setDialogMesaOpen(false);
      setComandaAtual(null);
      setMesaSelecionada(null);
      loadMesas();
    } catch (error: any) {
      console.error("Erro ao fechar comanda:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao processar comanda.",
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
              Gerencie as mesas e comandas do restaurante
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
                <UtensilsCrossed className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium">Aguardando Pagamento</span>
              </div>
              <div className="text-2xl font-bold">
                {mesas.filter(m => m.status === "aguardando_pagamento").length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-600" />
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
                    {mesa.status === "livre" && "Livre"}
                    {mesa.status === "ocupada" && "Ocupada"}
                    {mesa.status === "fechada" && "Pronta"}
                    {mesa.status === "aguardando_pagamento" && "Aguardando"}
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
              <DialogTitle>Selecione o Garçom para essa mesa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Mesa {mesaSelecionada?.numero} - Selecione o garçom responsável:
              </p>
              
              {funcionariosGarcom.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Nenhum garçom ativo encontrado.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Cadastre garçons na tela de Gerenciar Funcionários.
                  </p>
                </div>
              ) : (
                <div className="grid gap-2">
                  {funcionariosGarcom.map((garcom) => (
                    <Button
                      key={garcom.id}
                      variant="outline"
                      className="justify-start h-auto p-4"
                      onClick={() => handleSelecionarGarcom(garcom.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">{garcom.nome}</div>
                          <div className="text-sm text-muted-foreground">
                            Garçom
                          </div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog Mesa Ocupada */}
        <Dialog open={dialogMesaOpen} onOpenChange={setDialogMesaOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Mesa {mesaSelecionada?.numero} - Comanda #{comandaAtual?.numero}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {comandaAtual?.garcom_funcionario && (
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Garçom: <strong>{comandaAtual.garcom_funcionario.nome}</strong>
                  </span>
                </div>
              )}

              {/* Itens da Comanda */}
              <div>
                <h4 className="font-semibold mb-3">Itens da Comanda</h4>
                {comandaAtual?.itens && comandaAtual.itens.length > 0 ? (
                  <div className="space-y-2">
                    {comandaAtual.itens.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
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
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            R$ {(item.quantidade * item.preco_unitario).toFixed(2)}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {item.status === "pendente" && "Pendente"}
                              {item.status === "aguardando" && "Aguardando"}
                              {item.status === "preparando" && "Preparando"}
                              {item.status === "pronto" && "Pronto"}
                            </Badge>
                            {!item.enviado_cozinha && item.status === "pendente" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  try {
                                    await comandaItensService.enviarParaCozinha(item.id);
                                    toast({
                                      title: "Item enviado",
                                      description: "Item enviado para a cozinha."
                                    });
                                    loadComandaDetalhes(comandaAtual.id);
                                  } catch (error) {
                                    toast({
                                      title: "Erro",
                                      description: "Erro ao enviar item para cozinha.",
                                      variant: "destructive"
                                    });
                                  }
                                }}
                              >
                                Enviar p/ Cozinha
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhum item na comanda
                  </p>
                )}
              </div>

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>R$ {comandaAtual?.valor_total.toFixed(2) || "0.00"}</span>
                </div>
              </div>

              {/* Produtos para Adicionar */}
              <div>
                <h4 className="font-semibold mb-3">Adicionar Produtos</h4>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {produtos.slice(0, 8).map((produto) => (
                    <Button
                      key={produto.id}
                      variant="outline"
                      className="h-auto p-3 text-left"
                      onClick={() => handleAdicionarProduto(produto)}
                    >
                      <div className="w-full">
                        <div className="font-medium text-sm">{produto.nome}</div>
                        <div className="text-xs text-muted-foreground">
                          R$ {produto.preco.toFixed(2)}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Ações */}
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setDialogMesaOpen(false)}
                >
                  Fechar
                </Button>
                {comandaAtual?.status === "pronto_para_fechamento" ? (
                  <Button
                    variant="default"
                    onClick={() => {
                      setDialogMesaOpen(false);
                      // Redirecionar para PDV ou mostrar que está pronta para pagamento
                      toast({
                        title: "Comanda pronta",
                        description: "Esta comanda está pronta para pagamento no PDV."
                      });
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Pronta para Pagamento
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    onClick={handleFecharComanda}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Enviar para Produção
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog Adicionar Produto */}
        <Dialog open={dialogProdutoOpen} onOpenChange={setDialogProdutoOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Produto</DialogTitle>
            </DialogHeader>
            {produtoSelecionado && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">{produtoSelecionado.nome}</h3>
                  <p className="text-sm text-muted-foreground">
                    {produtoSelecionado.descricao}
                  </p>
                  <p className="text-lg font-bold text-primary">
                    R$ {produtoSelecionado.preco.toFixed(2)}
                  </p>
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
                  <Input
                    id="observacoes"
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Observações especiais..."
                  />
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span>Total do item:</span>
                    <span className="text-lg font-bold">
                      R$ {(produtoSelecionado.preco * quantidade).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setDialogProdutoOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleConfirmarProduto}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
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