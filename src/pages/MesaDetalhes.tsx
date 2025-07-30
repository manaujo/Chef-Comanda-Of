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
import { useAuth } from "@/hooks/useAuth";

import {
  Coffee,
  Plus,
  Minus,
  ShoppingCart,
  Clock,
  CheckCircle,
  ArrowLeft,
  Users,
  ChefHat
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  mesasService,
  comandasService,
  comandaItensService,
  produtosService,
  subscribeToTable
} from "@/lib/database";
import type {
  Mesa,
  Comanda,
  Produto,
  ComandaItem,
  CategoriaProduto
} from "@/types/database";

const MesaDetalhes = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [mesa, setMesa] = useState<Mesa | null>(null);
  const [comanda, setComanda] = useState<Comanda | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(
    null
  );
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
      loadMesaData();
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;

    // Subscrever a mudanças na comanda
    const unsubscribeComandas = subscribeToTable(
      "comandas",
      () => {
        loadComandaData();
      },
      `mesa_id=eq.${id}`
    );

    // Subscrever a mudanças nos itens da comanda
    const unsubscribeItens = subscribeToTable("comanda_itens", () => {
      loadComandaData();
    });

    return () => {
      unsubscribeComandas();
      unsubscribeItens();
    };
  }, [id, comanda?.id]);

  const loadMesaData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const [mesaData, produtosData] = await Promise.all([
        mesasService.getById(id),
        produtosService.getByCategoria()
      ]);

      setMesa(mesaData);
      setProdutos(produtosData);

      // Carregar comanda se existir
      await loadComandaData();
    } catch (error) {
      console.error("Erro ao carregar dados da mesa:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados da mesa.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadComandaData = async () => {
    if (!id) return;

    try {
      const comandaData = await comandasService.getByMesa(id);
      setComanda(comandaData);
    } catch (error) {
      console.error("Erro ao carregar comanda:", error);
    }
  };

  const handleAdicionarItem = async () => {
    if (!produtoSelecionado || !user) return;

    try {
      let comandaAtual = comanda;

      // Se não existe comanda, criar uma nova
      if (!comandaAtual && mesa) {
        const novaComanda = await comandasService.create({
          mesa_id: mesa.id,
          garcom_id: user.id,
          status: "aberta",
          data_abertura: new Date().toISOString()
        });
        comandaAtual = novaComanda;
        setComanda(novaComanda);
      }

      if (!comandaAtual) {
        throw new Error("Erro ao criar comanda");
      }

      // Adicionar item à comanda
      await comandaItensService.create({
        comanda_id: comandaAtual.id,
        produto_id: produtoSelecionado.id,
        quantidade,
        preco_unitario: produtoSelecionado.preco,
        status: "enviado",
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "enviado":
        return "destructive";
      case "preparando":
        return "secondary";
      case "pronto":
        return "default";
      default:
        return "outline";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "enviado":
        return <Clock className="h-4 w-4" />;
      case "preparando":
        return <ChefHat className="h-4 w-4" />;
      case "pronto":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const produtosPorCategoria = categorias.map((categoria) => ({
    ...categoria,
    produtos: produtos.filter((p) => p.categoria_produto === categoria.key)
  }));

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!mesa) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">Mesa não encontrada</h3>
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
                  <span>Mesa {mesa.numero}</span>
                </h1>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mt-1">
                  {mesa.nome || `Capacidade: ${mesa.capacidade} pessoas`}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Badge
              variant={
                mesa.status === "livre"
                  ? "default"
                  : mesa.status === "ocupada"
                  ? "destructive"
                  : mesa.status === "aguardando_pagamento"
                  ? "secondary"
                  : "outline"
              }
            >
              {mesa.status === "livre" && "Livre"}
              {mesa.status === "ocupada" && "Ocupada"}
              {mesa.status === "aguardando_pagamento" && "Aguardando Pagamento"}
              {mesa.status === "reservada" && "Reservada"}
              {mesa.status === "manutencao" && "Manutenção"}
            </Badge>
            {comanda && (
              <Badge variant="outline">Comanda #{comanda.numero}</Badge>
            )}
          </div>
        </div>

        {/* Comanda Atual */}
        {comanda && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Comanda Atual #{comanda.numero}</span>
                <span className="text-lg font-bold">
                  R$ {comanda.valor_total.toFixed(2)}
                </span>
              </CardTitle>
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
                            R${" "}
                            {(item.quantidade * item.preco_unitario).toFixed(2)}
                          </div>
                        </div>
                        <Badge variant={getStatusColor(item.status)}>
                          {getStatusIcon(item.status)}
                          <span className="ml-1 capitalize">
                            {item.status === "enviado" && "Enviado"}
                            {item.status === "preparando" && "Preparando"}
                            {item.status === "pronto" && "Pronto"}
                          </span>
                        </Badge>
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
        )}

        {/* Cardápio por Categoria */}
        <div className="space-y-6">
          {produtosPorCategoria.map((categoria) => (
            <div key={categoria.key}>
              <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
                <categoria.icon className="h-5 w-5" />
                <span>{categoria.label}</span>
              </h2>

              {categoria.produtos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {categoria.produtos.map((produto) => (
                    <Card
                      key={produto.id}
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleSelecionarProduto(produto)}
                    >
                      <CardHeader className="pb-3">
                        {produto.foto && (
                          <div className="w-full h-32 bg-muted rounded-lg mb-3 overflow-hidden">
                            <img
                              src={produto.foto}
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

        {/* Verificar permissões para mostrar aviso */}
        {user?.tipo === "funcionario" &&
          (user?.userData as any)?.tipo !== "administrador" &&
          (user?.userData as any)?.tipo !== "garcom" && (
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-4 text-center">
                <p className="text-yellow-800">
                  Apenas garçons podem adicionar itens às comandas.
                </p>
              </CardContent>
            </Card>
          )}

        {/* Dialog para Adicionar Item */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar à Comanda</DialogTitle>
            </DialogHeader>
            {produtoSelecionado && (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  {produtoSelecionado.foto && (
                    <img
                      src={produtoSelecionado.foto}
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
                  <Button
                    onClick={handleAdicionarItem}
                    disabled={
                      user?.tipo === "funcionario" &&
                      (user?.userData as any)?.tipo !== "administrador" &&
                      (user?.userData as any)?.tipo !== "garcom"
                    }
                  >
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

export default MesaDetalhes;
