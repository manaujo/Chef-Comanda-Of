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
  DollarSign,
  User,
  CreditCard,
  AlertCircle
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { comandasService, vendasService, mesasService, pdvService, turnosService } from "@/lib/database";

const PDV = () => {
  const [turnoAtivo, setTurnoAtivo] = useState<any>(null);
  const [comandasProntas, setComandasProntas] = useState<any[]>([]);
  const [comandaSelecionada, setComandaSelecionada] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogFinalizarOpen, setDialogFinalizarOpen] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState<string>("");
  const [valorDesconto, setValorDesconto] = useState<string>("0");
  const { toast } = useToast();

  useEffect(() => {
    loadData();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [turnoAtivoData, comandasData] = await Promise.all([
        turnosService.getTurnoAtivo(),
        pdvService.getComandasProntasParaFechamento()
      ]);
      
      setTurnoAtivo(turnoAtivoData);
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
    if (!turnoAtivo) {
      toast({
        title: "Erro",
        description: "Nenhum turno ativo encontrado. Abra um turno primeiro.",
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

      // Verificar se temos um operador válido
      const operadorId = turnoAtivo.operador_id;
      if (!operadorId) {
        throw new Error('Operador do turno não encontrado');
      }
      await vendasService.create({
        comanda_id: comandaSelecionada.id,
        turno_id: turnoAtivo.id,
        operador_id: operadorId,
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

  if (!turnoAtivo) {
    return (
      <DashboardLayout>
        <div className="space-y-4 lg:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 lg:gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold flex items-center space-x-2">
                <ShoppingCart className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10" />
                <span>PDV - Ponto de Venda</span>
              </h1>
            </div>
          </div>

          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                Nenhum turno ativo
              </h3>
              <p className="text-yellow-700 mb-4">
                É necessário abrir um turno na área de Turnos para operar o PDV.
              </p>
              <Button asChild>
                <a href="/turnos">Ir para Turnos</a>
              </Button>
            </CardContent>
          </Card>
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
            <div className="flex items-center space-x-2 mt-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Operador: <strong>
                  {turnoAtivo.operador_funcionario?.nome || turnoAtivo.operador?.nome_completo}
                </strong>
              </span>
              <Badge variant="secondary">Turno Ativo</Badge>
            </div>
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