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
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  DollarSign,
  User,
  CreditCard
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { funcionariosSimplesService, type FuncionarioSimples } from "@/lib/funcionarios-simples";
import { produtosService, comandasService, vendasService, mesasService } from "@/lib/database";
import type { Produto, Mesa } from "@/types/database";

interface ItemVenda {
  produto: Produto;
  quantidade: number;
  observacoes?: string;
}

const PDV = () => {
  const [operadorSelecionado, setOperadorSelecionado] = useState<FuncionarioSimples | null>(null);
  const [funcionariosCaixa, setFuncionariosCaixa] = useState<FuncionarioSimples[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [itensVenda, setItensVenda] = useState<ItemVenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOperadorOpen, setDialogOperadorOpen] = useState(true);
  const [dialogFinalizarOpen, setDialogFinalizarOpen] = useState(false);
  const [mesaSelecionada, setMesaSelecionada] = useState<string>("");
  const [formaPagamento, setFormaPagamento] = useState<string>("");
  const [valorDesconto, setValorDesconto] = useState<string>("0");
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [funcionariosData, produtosData, mesasData] = await Promise.all([
        funcionariosSimplesService.getByTipo('caixa'),
        produtosService.getAll(),
        mesasService.getAll()
      ]);
      setFuncionariosCaixa(funcionariosData);
      setProdutos(produtosData);
      setMesas(mesasData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do PDV.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelecionarOperador = (funcionarioId: string) => {
    const funcionario = funcionariosCaixa.find(f => f.id === funcionarioId);
    if (funcionario) {
      setOperadorSelecionado(funcionario);
      setDialogOperadorOpen(false);
      toast({
        title: "Operador selecionado",
        description: `${funcionario.nome} está operando o PDV.`
      });
    }
  };

  const handleAdicionarProduto = (produto: Produto) => {
    const itemExistente = itensVenda.find(item => item.produto.id === produto.id);
    
    if (itemExistente) {
      setItensVenda(itens => 
        itens.map(item => 
          item.produto.id === produto.id 
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        )
      );
    } else {
      setItensVenda(itens => [...itens, { produto, quantidade: 1 }]);
    }
  };

  const handleAlterarQuantidade = (produtoId: string, novaQuantidade: number) => {
    if (novaQuantidade <= 0) {
      handleRemoverItem(produtoId);
      return;
    }
    
    setItensVenda(itens => 
      itens.map(item => 
        item.produto.id === produtoId 
          ? { ...item, quantidade: novaQuantidade }
          : item
      )
    );
  };

  const handleRemoverItem = (produtoId: string) => {
    setItensVenda(itens => itens.filter(item => item.produto.id !== produtoId));
  };

  const calcularSubtotal = () => {
    return itensVenda.reduce((total, item) => total + (item.produto.preco * item.quantidade), 0);
  };

  const calcularTotal = () => {
    const subtotal = calcularSubtotal();
    const desconto = parseFloat(valorDesconto) || 0;
    return Math.max(0, subtotal - desconto);
  };

  const handleFinalizarVenda = async () => {
    if (!operadorSelecionado) {
      toast({
        title: "Erro",
        description: "Nenhum operador selecionado.",
        variant: "destructive"
      });
      return;
    }

    if (itensVenda.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um item à venda.",
        variant: "destructive"
      });
      return;
    }

    if (!formaPagamento) {
      toast({
        title: "Erro",
        description: "Selecione a forma de pagamento.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Criar comanda
      const comandaData = {
        mesa_id: mesaSelecionada || undefined,
        garcom_funcionario_id: operadorSelecionado.id,
        status: "fechada" as const,
        data_abertura: new Date().toISOString(),
        data_fechamento: new Date().toISOString()
      };

      const comanda = await comandasService.create(comandaData);

      // Adicionar itens à comanda
      for (const item of itensVenda) {
        await comandaItensService.create({
          comanda_id: comanda.id,
          produto_id: item.produto.id,
          quantidade: item.quantidade,
          preco_unitario: item.produto.preco,
          status: "entregue",
          observacoes: item.observacoes
        });
      }

      // Registrar venda
      const subtotal = calcularSubtotal();
      const desconto = parseFloat(valorDesconto) || 0;
      const total = calcularTotal();

      await vendasService.create({
        comanda_id: comanda.id,
        operador_id: operadorSelecionado.id,
        valor_total: subtotal,
        valor_desconto: desconto,
        valor_final: total,
        forma_pagamento: formaPagamento,
        data_venda: new Date().toISOString()
      });

      // Liberar mesa se foi selecionada
      if (mesaSelecionada) {
        await mesasService.updateStatus(mesaSelecionada, "livre");
      }

      toast({
        title: "Venda finalizada",
        description: `Venda de R$ ${total.toFixed(2)} finalizada com sucesso.`
      });

      // Limpar venda
      setItensVenda([]);
      setMesaSelecionada("");
      setFormaPagamento("");
      setValorDesconto("0");
      setDialogFinalizarOpen(false);
      
      // Recarregar mesas
      loadData();
    } catch (error: any) {
      console.error("Erro ao finalizar venda:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao finalizar venda.",
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

  return (
    <DashboardLayout>
      <div className="space-y-4 lg:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 lg:gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold flex items-center space-x-2">
              <ShoppingCart className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10" />
              <span>PDV - Ponto de Venda</span>
            </h1>
            {operadorSelecionado && (
              <div className="flex items-center space-x-2 mt-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Operador: <strong>{operadorSelecionado.nome}</strong>
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDialogOperadorOpen(true)}
                >
                  Trocar Operador
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Produtos */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Produtos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {produtos.map((produto) => (
                    <Card
                      key={produto.id}
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleAdicionarProduto(produto)}
                    >
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2">{produto.nome}</h3>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {produto.descricao}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-primary">
                            R$ {produto.preco.toFixed(2)}
                          </span>
                          <Button size="sm">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resumo da Venda */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Resumo da Venda</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {itensVenda.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum item adicionado
                  </p>
                ) : (
                  <>
                    <div className="space-y-3">
                      {itensVenda.map((item) => (
                        <div
                          key={item.produto.id}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="flex-1">
                            <h4 className="font-medium">{item.produto.nome}</h4>
                            <p className="text-sm text-muted-foreground">
                              R$ {item.produto.preco.toFixed(2)} cada
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                handleAlterarQuantidade(
                                  item.produto.id,
                                  item.quantidade - 1
                                )
                              }
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center font-medium">
                              {item.quantidade}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                handleAlterarQuantidade(
                                  item.produto.id,
                                  item.quantidade + 1
                                )
                              }
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleRemoverItem(item.produto.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span className="font-medium">
                          R$ {calcularSubtotal().toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Desconto:</span>
                        <span className="font-medium">
                          R$ {(parseFloat(valorDesconto) || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total:</span>
                        <span>R$ {calcularTotal().toFixed(2)}</span>
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() => setDialogFinalizarOpen(true)}
                      disabled={!operadorSelecionado}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Finalizar Venda
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Dialog Selecionar Operador */}
        <Dialog open={dialogOperadorOpen} onOpenChange={() => {}}>
          <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>Selecione o Operador do PDV</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Selecione o funcionário que irá operar o PDV:
              </p>
              
              {funcionariosCaixa.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Nenhum funcionário de caixa ativo encontrado.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Cadastre funcionários na tela de Gerenciar Funcionários.
                  </p>
                </div>
              ) : (
                <div className="grid gap-2">
                  {funcionariosCaixa.map((funcionario) => (
                    <Button
                      key={funcionario.id}
                      variant="outline"
                      className="justify-start h-auto p-4"
                      onClick={() => handleSelecionarOperador(funcionario.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">{funcionario.nome}</div>
                          <div className="text-sm text-muted-foreground">
                            Operador de Caixa
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

        {/* Dialog Finalizar Venda */}
        <Dialog open={dialogFinalizarOpen} onOpenChange={setDialogFinalizarOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Finalizar Venda</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="mesa">Mesa (Opcional)</Label>
                <Select value={mesaSelecionada} onValueChange={setMesaSelecionada}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma mesa (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Venda no balcão</SelectItem>
                    {mesas
                      .filter(mesa => mesa.status === "ocupada")
                      .map((mesa) => (
                        <SelectItem key={mesa.id} value={mesa.id}>
                          Mesa {mesa.numero}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="forma_pagamento">Forma de Pagamento *</Label>
                <Select value={formaPagamento} onValueChange={setFormaPagamento}>
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

              <div>
                <Label htmlFor="desconto">Desconto (R$)</Label>
                <Input
                  id="desconto"
                  type="number"
                  step="0.01"
                  min="0"
                  value={valorDesconto}
                  onChange={(e) => setValorDesconto(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>R$ {calcularSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Desconto:</span>
                  <span>R$ {(parseFloat(valorDesconto) || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>R$ {calcularTotal().toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setDialogFinalizarOpen(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleFinalizarVenda}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Confirmar Venda
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default PDV;