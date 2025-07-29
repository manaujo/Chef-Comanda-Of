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
import { useToast } from "@/hooks/use-toast";
import {
  Clock,
  Play,
  Square,
  DollarSign,
  User,
  Calendar,
  Plus
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { turnosService } from "@/lib/database";
import { useAuth } from "@/hooks/useAuth";
import type { Turno } from "@/types/database";

const Turnos = () => {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [turnoAtivo, setTurnoAtivo] = useState<Turno | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogAbrirOpen, setDialogAbrirOpen] = useState(false);
  const [dialogFecharOpen, setDialogFecharOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const [formAbrir, setFormAbrir] = useState({
    valor_inicial: "0"
  });

  const [formFechar, setFormFechar] = useState({
    valor_fechamento: "0",
    observacoes: ""
  });

  useEffect(() => {
    loadTurnos();
  }, []);

  const loadTurnos = async () => {
    try {
      setLoading(true);
      const turnoAtivoData = await turnosService.getTurnoAtivo();
      setTurnoAtivo(turnoAtivoData);

      // Aqui você pode carregar histórico de turnos se necessário
      // const turnosData = await turnosService.getAll();
      // setTurnos(turnosData);
    } catch (error) {
      console.error("Erro ao carregar turnos:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar turnos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAbrirTurno = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não encontrado.",
        variant: "destructive"
      });
      return;
    }

    try {
      const valorInicial = parseFloat(formAbrir.valor_inicial) || 0;

      const turno = await turnosService.abrir(user.id, valorInicial);

      toast({
        title: "Turno aberto",
        description: `Turno aberto com valor inicial de R$ ${valorInicial.toFixed(
          2
        )}.`
      });

      setDialogAbrirOpen(false);
      setFormAbrir({ valor_inicial: "0" });
      loadTurnos();
    } catch (error: any) {
      console.error("Erro ao abrir turno:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao abrir turno.",
        variant: "destructive"
      });
    }
  };

  const handleFecharTurno = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!turnoAtivo) {
      toast({
        title: "Erro",
        description: "Nenhum turno ativo encontrado.",
        variant: "destructive"
      });
      return;
    }

    try {
      const valorFechamento = parseFloat(formFechar.valor_fechamento) || 0;

      await turnosService.fechar(
        turnoAtivo.id,
        valorFechamento,
        formFechar.observacoes || undefined
      );

      toast({
        title: "Turno fechado",
        description: `Turno fechado com valor final de R$ ${valorFechamento.toFixed(
          2
        )}.`
      });

      setDialogFecharOpen(false);
      setFormFechar({ valor_fechamento: "0", observacoes: "" });
      loadTurnos();
    } catch (error: any) {
      console.error("Erro ao fechar turno:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao fechar turno.",
        variant: "destructive"
      });
    }
  };

  const calcularDiferenca = () => {
    if (!turnoAtivo) return 0;
    const valorFechamento = parseFloat(formFechar.valor_fechamento) || 0;
    return valorFechamento - turnoAtivo.valor_inicial;
  };

  const formatarTempo = (dataInicio: string, dataFim?: string) => {
    const inicio = new Date(dataInicio);
    const fim = dataFim ? new Date(dataFim) : new Date();
    const diff = fim.getTime() - inicio.getTime();

    const horas = Math.floor(diff / (1000 * 60 * 60));
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${horas}h ${minutos}m`;
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
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10" />
              <span>Turnos</span>
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mt-1">
              Gerencie os turnos de trabalho
            </p>
          </div>

          {!turnoAtivo ? (
            <Dialog open={dialogAbrirOpen} onOpenChange={setDialogAbrirOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => setDialogAbrirOpen(true)}
                  className="flex-shrink-0"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Abrir Turno
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Abrir Novo Turno</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAbrirTurno} className="space-y-4">
                  <div>
                    <Label htmlFor="valor_inicial">
                      Valor Inicial do Caixa (R$)
                    </Label>
                    <Input
                      id="valor_inicial"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formAbrir.valor_inicial}
                      onChange={(e) =>
                        setFormAbrir({ valor_inicial: e.target.value })
                      }
                      placeholder="0.00"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Valor em dinheiro no caixa no início do turno
                    </p>
                  </div>

                  <div className="bg-muted p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <User className="h-4 w-4" />
                      <span className="font-medium">Operador:</span>
                    </div>
                    <p>{user?.nome_completo}</p>
                    <p className="text-sm text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogAbrirOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit">
                      <Play className="h-4 w-4 mr-2" />
                      Abrir Turno
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          ) : (
            <Dialog open={dialogFecharOpen} onOpenChange={setDialogFecharOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <Square className="h-4 w-4 mr-2" />
                  Fechar Turno
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Fechar Turno Atual</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleFecharTurno} className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span>Valor Inicial:</span>
                      <span className="font-medium">
                        R$ {turnoAtivo.valor_inicial.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tempo de Turno:</span>
                      <span className="font-medium">
                        {formatarTempo(turnoAtivo.data_abertura)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Operador:</span>
                      <span className="font-medium">
                        {turnoAtivo.operador?.nome_completo}
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="valor_fechamento">
                      Valor Final do Caixa (R$) *
                    </Label>
                    <Input
                      id="valor_fechamento"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formFechar.valor_fechamento}
                      onChange={(e) =>
                        setFormFechar({
                          ...formFechar,
                          valor_fechamento: e.target.value
                        })
                      }
                      required
                      placeholder="0.00"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Valor em dinheiro no caixa no final do turno
                    </p>
                  </div>

                  {formFechar.valor_fechamento && (
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span>Diferença:</span>
                        <span
                          className={`font-bold ${
                            calcularDiferenca() >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {calcularDiferenca() >= 0 ? "+" : ""}R${" "}
                          {calcularDiferenca().toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea
                      id="observacoes"
                      value={formFechar.observacoes}
                      onChange={(e) =>
                        setFormFechar({
                          ...formFechar,
                          observacoes: e.target.value
                        })
                      }
                      placeholder="Observações sobre o fechamento do turno..."
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogFecharOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" variant="destructive">
                      <Square className="h-4 w-4 mr-2" />
                      Fechar Turno
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Status do Turno Atual */}
        {turnoAtivo ? (
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-800 flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span>Turno Ativo</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Operador</p>
                    <p className="font-medium">
                      {turnoAtivo.operador?.nome_completo}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Início</p>
                    <p className="font-medium">
                      {new Date(turnoAtivo.data_abertura).toLocaleString(
                        "pt-BR"
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Valor Inicial
                    </p>
                    <p className="font-medium">
                      R$ {turnoAtivo.valor_inicial.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Tempo Ativo</p>
                    <p className="font-medium">
                      {formatarTempo(turnoAtivo.data_abertura)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-6 text-center">
              <Clock className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                Nenhum turno ativo
              </h3>
              <p className="text-yellow-700 mb-4">
                Abra um turno para começar a registrar vendas no caixa.
              </p>
              <Button onClick={() => setDialogAbrirOpen(true)}>
                <Play className="h-4 w-4 mr-2" />
                Abrir Turno
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Instruções */}
        <Card>
          <CardHeader>
            <CardTitle>Como funciona o controle de turnos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2 flex items-center space-x-2">
                  <Play className="h-4 w-4 text-green-600" />
                  <span>Abertura de Turno</span>
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Informe o valor inicial em dinheiro no caixa</li>
                  <li>• O sistema registra o operador e horário de abertura</li>
                  <li>• Apenas um turno pode estar ativo por vez</li>
                  <li>• Todas as vendas serão vinculadas ao turno ativo</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2 flex items-center space-x-2">
                  <Square className="h-4 w-4 text-red-600" />
                  <span>Fechamento de Turno</span>
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Conte o dinheiro no caixa e informe o valor final</li>
                  <li>• O sistema calcula automaticamente a diferença</li>
                  <li>• Adicione observações se necessário</li>
                  <li>• Após o fechamento, um novo turno pode ser aberto</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Turnos;
