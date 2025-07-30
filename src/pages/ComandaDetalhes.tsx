import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { useToast } from "@/hooks/use-toast";
import {
  Coffee,
  Plus,
  Minus,
  ShoppingCart,
  Clock,
  CheckCircle,
  ArrowLeft,
  Users,
  ChefHat,
  Send
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  comandasService,
  comandaItensService,
  produtosService,
  subscribeToTable
} from "@/lib/database";
import type {
  Comanda,
  Produto,
  ComandaItem,
  CategoriaProduto
} from "@/types/database";

const ComandaDetalhes = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [comanda, setComanda] = useState<Comanda | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [observacoes, setObservacoes] = useState("");

  const categorias: { key: CategoriaProduto; label: string; icon: any }[] = [
    { key: "entrada", label: "Entradas", icon: Coffee },
    { key: "prato", label: "Pratos Principais", icon: ChefHat },
    { key: "bebida", label: "Bebidas", icon: Coffee },
    { key: "sobremesa", label: "Sobremesas", icon: Coffee }
  ];

  useEffect(() => {
    if (id) {
      loadComandaData();
      loadProdutos();
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;

    // Subscrever a mudanças nos itens da comanda
    const unsubscribeItens = subscribeToTable("comanda_itens", () => {
      loadComandaData();
    });

    return () => {
      unsubscribeItens();
    };
  }, [id]);

  const loadComandaData = async () => {
    if (!id) return;

    try {
      const comandaData = await comandasService.getById(id);
      setComanda(comandaData);
    } catch (error) {
      console.error("Erro ao carregar comanda:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados da comanda.",
        variant: "destructive"
      });
    }
  };

  const loadProdutos = async () => {
    try {
      setLoading(true);
      const produtosData = await produtosService.getByCategoria();
      setProdutos(produtosData);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar produtos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdicionarItem = async () => {
    if (!produtoSelecionado || !comanda) return;

    try {
      await comandaItensService.create({
        comanda_id: comanda.id,
        produto_id: produtoSelecionado.id,
        quantidade,
        preco_unitario: produtoSelecionado.preco,
        status: "pendente",
        enviado_cozinha: false,
        observacoes: observacoes || undefined
      });

      toast({
        title: "Item adicionado",
        description: `${produtoSelecionado.nome} adicionado à comanda.`
      });

      // Resetar form
      setDialogOpen(false);
      setProdutoSelecionado(null);
      setQuantidade(1);
      setObservacoes("");

      // Recarregar dados
      loadComandaData();
    } catch (error: any) {
      console.error("Erro ao adicionar item:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao adicionar item.",
        variant: "destructive"
      });
    }
  };

  const handleSelecionarProduto = (produto: Produto) => {
    setProdutoSelecionado(produto);
    setQuantidade(1);
    setObservacoes("");
    setDialogOpen(true);
  };

  const handleEnviarParaCozinha = async (itemId: string) => {
    try {
      await comandaItensService.enviarParaCozinha(itemId);
      toast({
        title: "Item enviado",
        description: "Item enviado para a cozinha."
      });
      loadComandaData();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao enviar item para cozinha.",
        variant: "destructive"
      });
    }
  };

  const handleEnviarTodosParaCozinha = async () => {
    if (!comanda?.itens) return;

    const itensNaoEnviados = comanda.itens.filter(
      item => !item.enviado_cozinha && item.status !== 'cancelado'
    );

    try {
      for (const item of itensNaoEnviados) {
        await comandaItensService.enviarParaCozinha(item.id);
      }

      toast({
        title: "Itens enviados",
        description: `${itensNaoEnviados.length} itens enviados para a cozinha.`
      });
      
      loadComandaData();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao enviar itens para cozinha.",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pendente":
        return "outline";
      case "aguardando":
        return "destructive";
      case "preparando":
        return "default";
      case "pronto":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pendente":
        return <Clock className="h-4 w-4" />;
      case "aguardando":
        return <Clock className="h-4 w-4" />;
      case "preparando":
        return <ChefHat className="h-4 w-4" />;
      case "pronto":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pendente":
        return "Pendente";
      case "aguardando":
        return "Aguardando";
      case "preparando":
        return "Preparando";
      case "pronto":
        return "Pronto";
      default:
        return status;
    }
  };

  const produtosPorCategoria = categorias.map((categoria) => ({
    ...categoria,
    produtos: produtos.filter((p) => p.categoria_produto === categoria.key)
  }));

  const itensNaoEnviados = comanda?.itens?.filter(
    item => !item.enviado_cozinha && item.status !== 'cancelado'
  ) || [];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!comanda) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">Comanda não encontrada</h3>
          <Button onClick={() => navigate("/mesas")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar às Mesas
          </Button>
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
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate("/mesas")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold flex items-center space-x-2">
                  <Coffee className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10" />
                  <span>Comanda #{comanda.numero}</span>
                </h1>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mt-1">
                  {comanda.mesa ? `Mesa ${comanda.mesa.numero}` : 'Sem mesa'} • 
                  {comanda.garcom_funcionario ? ` Garçom: ${comanda.garcom_funcionario.nome}` : ' Sem garçom'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Badge
              variant={
                comanda.status === "aberta"
                  ? "default"
                  : comanda.status === "em_preparo"
                  ? "secondary"
                  : comanda.status === "pronto_para_fechamento"
                  ? "outline"
                  : "destructive"
              }
            >
              {comanda.status === "aberta" && "Aberta"}
              {comanda.status === "em_preparo" && "Em Preparo"}
              {comanda.status === "pronto_para_fechamento" && "Pronta"}
              {comanda.status === "fechada" && "Fechada"}
            </Badge>
            <span className="text-lg font-bold">
              R$ {comanda.valor_total.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Itens da Comanda */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Itens da Comanda</CardTitle>
              {itensNaoEnviados.length > 0 && (
                <Button onClick={handleEnviarTodosParaCozinha} variant="destructive">
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Todos para Cozinha ({itensNaoEnviados.length})
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {comanda.itens && comanda.itens.length > 0 ? (
              <div className="space-y-3">
                {comanda.itens.map((item) => (
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
                      <div className="text-xs text-muted-foreground">
                        R$ {item.preco_unitario.toFixed(2)} cada
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="font-bold">
                          R$ {(item.quantidade * item.preco_unitario).toFixed(2)}
                        </div>
                      </div>
                      <Badge variant={getStatusColor(item.status)}>
                        {getStatusIcon(item.status)}
                        <span className="ml-1">
                          {getStatusLabel(item.status)}
                        </span>
                      </Badge>
                      {!item.enviado_cozinha && item.status === "pendente" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEnviarParaCozinha(item.id)}
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Enviar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                Nenhum item na comanda ainda
              </p>
            )}
          </CardContent>
        </Card>

        {/* Cardápio por Categoria */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold">Adicionar Produtos</h2>
          {produtosPorCategoria.map((categoria) => (
            <div key={categoria.key}>
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <categoria.icon className="h-5 w-5" />
                <span>{categoria.label}</span>
              </h3>

              {categoria.produtos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {categoria.produtos.map((produto) => (
                    <Card
                      key={produto.id}
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleSelecionarProduto(produto)}
                    >
                      <CardHeader className="pb-3">
                        {produto.foto_url && (
                          <div className="w-full h-32 bg-muted rounded-lg mb-3 overflow-hidden">
                            <img
                              src={produto.foto_url}
                              alt={produto.nome}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          </div>
                        )}
                        <CardTitle className="text-lg">
                          {produto.nome}
                        </CardTitle>
                        {produto.descricao && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {produto.descricao}
                          </p>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-primary">
                            R$ {produto.preco.toFixed(2)}
                          </span>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="h-4 w-4 mr-1" />
                            {produto.tempo_preparo} min
                          </div>
                        </div>
                        <Button className="w-full mt-3" size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-muted-foreground">
                      Nenhum produto disponível nesta categoria
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          ))}
        </div>

        {/* Dialog para Adicionar Item */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar à Comanda</DialogTitle>
            </DialogHeader>
            {produtoSelecionado && (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  {produtoSelecionado.foto_url && (
                    <img
                      src={produtoSelecionado.foto_url}
                      alt={produtoSelecionado.nome}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  )}
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
                      onChange={(e) =>
                        setQuantidade(parseInt(e.target.value) || 1)
                      }
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
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
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
      </div>
    </DashboardLayout>
  );
};

export default ComandaDetalhes;