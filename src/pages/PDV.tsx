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
import { useAuth } from "@/hooks/useAuth";
import {
  CreditCard,
  DollarSign,
  Receipt,
  Calculator,
  ShoppingCart
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { comandasService, vendasService, turnosService } from "@/lib/database";
import type { Comanda, Venda, Turno } from "@/types/database";

const PDV = () => {
  const { user } = useAuth();
  const [comandasAbertas, setComandasAbertas] = useState<Comanda[]>([]);
  const [turnoAtivo, setTurnoAtivo] = useState<Turno | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [comandaSelecionada, setComandaSelecionada] = useState<Comanda | null>(
    null
  );
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    forma_pagamento: "",
    valor_desconto: "0",
    valor_pago: "0"
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [comandasData, turnoData] = await Promise.all([
        comandasService.getAbertas(),
        turnosService.getTurnoAtivo()
      ]);
      setComandasAbertas(comandasData);
      setTurnoAtivo(turnoData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizarVenda = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!comandaSelecionada || !turnoAtivo) {
      toast({
        title: "Erro",
        description:
          "Selecione uma comanda e certifique-se de que há um turno ativo.",
        variant: "destructive"
      });
      return;
    }

    try {
      const valorDesconto = parseFloat(formData.valor_desconto) || 0;
      const valorFinal = comandaSelecionada.valor_total - valorDesconto;

      const vendaData = {
        comanda_id: comandaSelecionada.id,
        turno_id: turnoAtivo?.id,
        operador_id: user?.id || "",
        valor_total: comandaSelecionada.valor_total,
        valor_desconto: valorDesconto,
        valor_final: valorFinal,
        forma_pagamento: formData.forma_pagamento,
        data_venda: new Date().toISOString()
      };

      await vendasService.create(vendaData);
      await comandasService.fechar(comandaSelecionada.id);

      toast({
        title: "Venda finalizada",
        description: `Venda de R$ ${valorFinal.toFixed(
          2
        )} finalizada com sucesso.`
      });

      setDialogOpen(false);
      resetForm();
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

  const handleSelecionarComanda = (comanda: Comanda) => {
    setComandaSelecionada(comanda);
    setFormData({
      forma_pagamento: "",
      valor_desconto: "0",
      valor_pago: comanda.valor_total.toString()
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      forma_pagamento: "",
      valor_desconto: "0",
      valor_pago: "0"
    });
    setComandaSelecionada(null);
  };

  const calcularValorFinal = () => {
    if (!comandaSelecionada) return 0;
    const desconto = parseFloat(formData.valor_desconto) || 0;
    return comandaSelecionada.valor_total - desconto;
  };

  const calcularTroco = () => {
    const valorPago = parseFloat(formData.valor_pago) || 0;
    const valorFinal = calcularValorFinal();
    return Math.max(0, valorPago - valorFinal);
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
              <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10" />
              <span>PDV</span>
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mt-1">
              Ponto de Venda - Finalize vendas e receba pagamentos
            </p>
          </div>

          {turnoAtivo && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">Turno Ativo</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Operador: {turnoAtivo.operador?.nome_completo}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {!turnoAtivo && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calculator className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">
                  Nenhum turno ativo. Abra um turno para realizar vendas.
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Comandas Abertas</span>
              </div>
              <div className="text-2xl font-bold">{comandasAbertas.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Valor Total</span>
              </div>
              <div className="text-2xl font-bold">
                R${" "}
                {comandasAbertas
                  .reduce((total, c) => total + c.valor_total, 0)
                  .toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Receipt className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Ticket Médio</span>
              </div>
              <div className="text-2xl font-bold">
                R${" "}
                {comandasAbertas.length > 0
                  ? (
                      comandasAbertas.reduce(
                        (total, c) => total + c.valor_total,
                        0
                      ) / comandasAbertas.length
                    ).toFixed(2)
                  : "0.00"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calculator className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">Itens Total</span>
              </div>
              <div className="text-2xl font-bold">
                {comandasAbertas.reduce(
                  (total, c) => total + (c.itens?.length || 0),
                  0
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comandas para Finalizar */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {comandasAbertas.map((comanda) => (
            <Card
              key={comanda.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Comanda #{comanda.numero}
                  </CardTitle>
                  <Badge variant="default">Aberta</Badge>
                </div>
                {comanda.mesa && (
                  <p className="text-sm text-muted-foreground">
                    Mesa {comanda.mesa.numero}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Valor Total:
                  </span>
                  <span className="font-bold text-lg">
                    R$ {comanda.valor_total.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Itens:</span>
                  <span className="font-medium">
                    {comanda.itens?.length || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Abertura:</span>
                  <span className="font-medium">
                    {new Date(comanda.data_abertura).toLocaleTimeString(
                      "pt-BR",
                      {
                        hour: "2-digit",
                        minute: "2-digit"
                      }
                    )}
                  </span>
                </div>

                {comanda.garcom && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Garçom:</span>
                    <span className="font-medium">
                      {comanda.garcom.nome_completo}
                    </span>
                  </div>
                )}

                <Button
                  onClick={() => handleSelecionarComanda(comanda)}
                  className="w-full"
                  disabled={!turnoAtivo}
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  Finalizar Venda
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {comandasAbertas.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Nenhuma comanda para finalizar
              </h3>
              <p className="text-muted-foreground">
                Todas as comandas foram finalizadas ou não há comandas abertas.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Dialog de Finalização */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                Finalizar Comanda #{comandaSelecionada?.numero}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleFinalizarVenda} className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span>Valor da Comanda:</span>
                  <span className="font-bold">
                    R$ {comandaSelecionada?.valor_total.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span>Desconto:</span>
                  <span className="font-bold text-red-600">
                    - R$ {parseFloat(formData.valor_desconto).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
                  <span>Total a Pagar:</span>
                  <span>R$ {calcularValorFinal().toFixed(2)}</span>
                </div>
              </div>

              <div>
                <Label htmlFor="forma_pagamento">Forma de Pagamento *</Label>
                <Select
                  value={formData.forma_pagamento}
                  onValueChange={(value) =>
                    setFormData({ ...formData, forma_pagamento: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a forma de pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="cartao_credito">
                      Cartão de Crédito
                    </SelectItem>
                    <SelectItem value="cartao_debito">
                      Cartão de Débito
                    </SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="valor_desconto">Desconto (R$)</Label>
                <Input
                  id="valor_desconto"
                  type="number"
                  step="0.01"
                  min="0"
                  max={comandaSelecionada?.valor_total}
                  value={formData.valor_desconto}
                  onChange={(e) =>
                    setFormData({ ...formData, valor_desconto: e.target.value })
                  }
                />
              </div>

              {formData.forma_pagamento === "dinheiro" && (
                <div>
                  <Label htmlFor="valor_pago">Valor Pago (R$)</Label>
                  <Input
                    id="valor_pago"
                    type="number"
                    step="0.01"
                    min={calcularValorFinal()}
                    value={formData.valor_pago}
                    onChange={(e) =>
                      setFormData({ ...formData, valor_pago: e.target.value })
                    }
                  />
                  {calcularTroco() > 0 && (
                    <div className="mt-2 p-2 bg-green-50 rounded text-green-800">
                      <strong>Troco: R$ {calcularTroco().toFixed(2)}</strong>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={!formData.forma_pagamento}>
                  <Receipt className="h-4 w-4 mr-2" />
                  Finalizar Venda
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default PDV;
