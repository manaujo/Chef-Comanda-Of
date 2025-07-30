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
import { produtosService, comandasService, vendasService, mesasService, pdvService } from "@/lib/database";
import type { Produto, Mesa } from "@/types/database";

interface ItemVenda {
  produto: Produto;
  quantidade: number;
  observacoes?: string;
}

const PDV = () => {
  const [operadorSelecionado, setOperadorSelecionado] = useState<FuncionarioSimples | null>(null);
  const [funcionariosCaixa, setFuncionariosCaixa] = useState<FuncionarioSimples[]>([]);
  const [comandasProntas, setComandasProntas] = useState<any[]>([]);
  const [comandaSelecionada, setComandaSelecionada] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOperadorOpen, setDialogOperadorOpen] = useState(true);
  const [dialogFinalizarOpen, setDialogFinalizarOpen] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState<string>("");
  const [valorDesconto, setValorDesconto] = useState<string>("0");
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [funcionariosData, comandasData] = await Promise.all([
        funcionariosSimplesService.getByTipo('caixa'),
        pdvService.getComandasProntasParaFechamento()
      ]);
      setFuncionariosCaixa(funcionariosData);
      setComandasProntas(comandasData);
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

  const handleSelecionarComanda = (comanda: any) => {
    setComandaSelecionada(comanda);
    setDialogFinalizarOpen(true);
  };

  const calcularSubtotal = () => {
    if (!comandaSelecionada) return 0;
    return comandaSelecionada.valor_total || 0;
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

    if (!comandaSelecionada) {
      toast({
        title: "Erro",
        description: "Selecione uma comanda para finalizar.",
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
      // Fechar a comanda
      await comandasService.fechar(comandaSelecionada.id);

      // Registrar venda
      const subtotal = calcularSubtotal();
      const desconto = parseFloat(valorDesconto) || 0;
      const total = calcularTotal();

      await vendasService.create({
        comanda_id: comandaSelecionada.id,
        operador_id: operadorSelecionado.id,
        valor_total: subtotal,
        valor_desconto: desconto,
        valor_final: total,
        forma_pagamento: formaPagamento,
        data_venda: new Date().toISOString()
      });

      // Liberar mesa
      if (comandaSelecionada.mesa_id) {
        await mesasService.updateStatus(comandaSelecionada.mesa_id, "livre");
      }

      toast({
        title: "Venda finalizada",
        description: `Venda de R$ ${total.toFixed(2)} finalizada com sucesso.`
      });

      // Limpar venda
      setComandaSelecionada(null);
      setFormaPagamento("");
      setValorDesconto("0");
      setDialogFinalizarOpen(false);
      
      // Recarregar comandas
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
          {/* Comandas Prontas */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Comandas Prontas para Pagamento</CardTitle>
              </CardHeader>
              <CardContent>
                {comandasProntas.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      Nenhuma comanda pronta para pagamento.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {comandasProntas.map((comanda) => (
                      <Card
                        key={comanda.id}
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleSelecionarComanda(comanda)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold">Comanda #{comanda.numero}</h3>
                            <Badge variant="default">Pronta</Badge>
                          </div>
                          {comanda.mesa && (
                            <p className="text-sm text-muted-foreground mb-2">
                              Mesa {comanda.mesa.numero}
                            </p>
                          )}
                          {comanda.garcom_funcionario && (
                            <p className="text-sm text-muted-foreground mb-2">
                              Garçom: {comanda.garcom_funcionario.nome}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-primary">
                              R$ {comanda.valor_total.toFixed(2)}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {comanda.itens?.length || 0} itens
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
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
                {!comandaSelecionada ? (
                  <p className="text-muted-foreground text-center py-8">
                    Selecione uma comanda para finalizar
                  </p>
                ) : (
                  <>
                    <div className="space-y-3">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <h4 className="font-medium">Comanda #{comandaSelecionada.numero}</h4>
                        {comandaSelecionada.mesa && (
                          <p className="text-sm text-muted-foreground">
                            Mesa {comandaSelecionada.mesa.numero}
                          </p>
                        )}
                        {comandaSelecionada.garcom_funcionario && (
                          <p className="text-sm text-muted-foreground">
                            Garçom: {comandaSelecionada.garcom_funcionario.nome}
                          </p>
                        )}
                      </div>

                      {comandaSelecionada.itens?.map((item: any) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="flex-1">
                            <h4 className="font-medium">{item.produto?.nome}</h4>
                            <p className="text-sm text-muted-foreground">
                              {item.quantidade}x R$ {item.preco_unitario.toFixed(2)}
                            </p>
                            {item.observacoes && (
                              <p className="text-xs text-muted-foreground">
                                Obs: {item.observacoes}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="font-medium">
                              R$ {(item.quantidade * item.preco_unitario).toFixed(2)}
                            </span>
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
            {comandaSelecionada && (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium">Comanda #{comandaSelecionada.numero}</h4>
                  {comandaSelecionada.mesa && (
                    <p className="text-sm text-muted-foreground">
                      Mesa {comandaSelecionada.mesa.numero}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {comandaSelecionada.itens?.length || 0} itens
                  </p>
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
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default PDV;