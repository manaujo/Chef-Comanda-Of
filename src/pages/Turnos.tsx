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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Clock,
  Play,
  Square,
  DollarSign,
  User,
  Calendar,
  TrendingUp,
  TrendingDown,
  History
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { turnosService } from "@/lib/database";
import { useAuth } from "@/hooks/useAuth";
import { funcionariosSimplesService, type FuncionarioSimples } from "@/lib/funcionarios-simples";
import { historicoTurnosService, type HistoricoTurno } from "@/lib/estoque";
import type { Turno } from "@/types/database";

const Turnos = () => {
  const { user } = useAuth();
  const [turnoAtivo, setTurnoAtivo] = useState<Turno | null>(null);
  const [historicoTurnos, setHistoricoTurnos] = useState<HistoricoTurno[]>([]);
  const [funcionariosCaixa, setFuncionariosCaixa] = useState<FuncionarioSimples[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("turno-atual");
  const [dialogAbrirOpen, setDialogAbrirOpen] = useState(false);
  const [dialogFecharOpen, setDialogFecharOpen] = useState(false);
  const { toast } = useToast();

  const [formAbrir, setFormAbrir] = useState({
    valor_inicial: "0",
    operador_funcionario_id: ""
  });

  const [formFechar, setFormFechar] = useState({
    valor_fechamento: "0",
    observacoes: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [turnoAtivoData, funcionariosData, historicoData] = await Promise.all([
        turnosService.getTurnoAtivo(),
        funcionariosSimplesService.getByTipo('caixa'),
        []  // Temporarily disable historico loading until schema is fixed
      ]);
      setTurnoAtivo(turnoAtivoData);
      setFuncionariosCaixa(funcionariosData);
      setHistoricoTurnos([]);  // Temporarily set empty array
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

      if (!formAbrir.operador_funcionario_id) {
        toast({
          title: "Erro",
          description: "Selecione um operador de caixa.",
          variant: "destructive"
        });
        return;
      }

      const turno = await turnosService.abrirComFuncionario(
        user.id, 
        formAbrir.operador_funcionario_id, 
        valorInicial
      );

      toast({
        title: "Turno aberto",
        description: `Turno aberto com valor inicial de R$ ${valorInicial.toFixed(2)}.`
      });

      setDialogAbrirOpen(false);
      setFormAbrir({ valor_inicial: "0", operador_funcionario_id: "" });
      loadData();
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
        description: `Turno fechado com valor final de R$ ${valorFechamento.toFixed(2)}.`
      });

      setDialogFecharOpen(false);
      setFormFechar({ valor_fechamento: "0", observacoes: "" });
      loadData();
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
              Gerencie os turnos de trabalho e histórico
            </p>
          </div>

          {!turnoAtivo && (
            <Dialog open={dialogAbrirOpen} onOpenChange={setDialogAbrirOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setDialogAbrirOpen(true)} className="flex-shrink-0">
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
                    <Label htmlFor="operador_funcionario_id">Operador de Caixa *</Label>
                    <Select
                      value={formAbrir.operador_funcionario_id}
                      onValueChange={(value) =>
                        setFormAbrir({ ...formAbrir, operador_funcionario_id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um operador de caixa" />
                      </SelectTrigger>
                      <SelectContent>
                        {funcionariosCaixa.map((funcionario) => (
                          <SelectItem key={funcionario.id} value={funcionario.id}>
                            {funcionario.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {funcionariosCaixa.length === 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Nenhum funcionário de caixa ativo encontrado. 
                        Cadastre funcionários na tela de Gerenciar Funcionários.
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="valor_inicial">Valor Inicial do Caixa (R$)</Label>
                    <Input
                      id="valor_inicial"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formAbrir.valor_inicial}
                      onChange={(e) =>
                        setFormAbrir({ ...formAbrir, valor_inicial: e.target.value })
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
                      <span className="font-medium">Responsável:</span>
                    </div>
                    <p>{user?.nome}</p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
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
          )}

          {turnoAtivo && (
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
                      <span className="font-medium">R$ {turnoAtivo.valor_inicial.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tempo de Turno:</span>
                      <span className="font-medium">{formatarTempo(turnoAtivo.data_abertura)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Operador:</span>
                      <span className="font-medium">
                        {turnoAtivo.operador_funcionario?.nome || turnoAtivo.operador?.nome_completo}
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="valor_fechamento">Valor Final do Caixa (R$) *</Label>
                    <Input
                      id="valor_fechamento"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formFechar.valor_fechamento}
                      onChange={(e) =>
                        setFormFechar({ ...formFechar, valor_fechamento: e.target.value })
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
                            calcularDiferenca() >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {calcularDiferenca() >= 0 ? "+" : ""}R$ {calcularDiferenca().toFixed(2)}
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
                        setFormFechar({ ...formFechar, observacoes: e.target.value })
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

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="turno-atual">Turno Atual</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>

          {/* Tab Turno Atual */}
          <TabsContent value="turno-atual" className="space-y-4">
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
                          {turnoAtivo.operador_funcionario?.nome || turnoAtivo.operador?.nome_completo}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Início</p>
                        <p className="font-medium">
                          {new Date(turnoAtivo.data_abertura).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Valor Inicial</p>
                        <p className="font-medium">R$ {turnoAtivo.valor_inicial.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Clock className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Tempo Ativo</p>
                        <p className="font-medium">{formatarTempo(turnoAtivo.data_abertura)}</p>
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
                      <li>• Selecione o funcionário operador de caixa</li>
                      <li>• Informe o valor inicial em dinheiro no caixa</li>
                      <li>• O sistema registra o horário de abertura</li>
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
                      <li>• O histórico é salvo automaticamente</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Histórico */}
          <TabsContent value="historico" className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <History className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Histórico de Turnos</h3>
            </div>

            {/* Stats do Histórico */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Total Turnos</span>
                  </div>
                  <div className="text-2xl font-bold">{historicoTurnos.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Total Vendas</span>
                  </div>
                  <div className="text-2xl font-bold">
                    R$ {historicoTurnos.reduce((total, h) => total + h.total_vendas, 0).toFixed(2)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <TrendingDown className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium">Vendas Realizadas</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {historicoTurnos.reduce((total, h) => total + h.quantidade_vendas, 0)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium">Ticket Médio</span>
                  </div>
                  <div className="text-2xl font-bold">
                    R$ {historicoTurnos.length > 0 
                      ? (historicoTurnos.reduce((total, h) => total + h.total_vendas, 0) / 
                         Math.max(1, historicoTurnos.reduce((total, h) => total + h.quantidade_vendas, 0))).toFixed(2)
                      : "0.00"}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Lista do Histórico */}
            <div className="space-y-4">
              {historicoTurnos.map((historico) => (
                <Card key={historico.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Operador</span>
                        </div>
                        <p className="text-sm">
                          Operador não disponível
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Tipo não disponível
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Período</span>
                        </div>
                        <p className="text-sm">
                          {new Date(historico.data_abertura).toLocaleDateString("pt-BR")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Tempo não disponível
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Valores</span>
                        </div>
                        <p className="text-sm">
                          Inicial: R$ {historico.valor_inicial?.toFixed(2) || "0.00"}
                        </p>
                        <p className="text-sm">
                          Final: R$ {historico.valor_fechamento?.toFixed(2) || "0.00"}
                        </p>
                        <p className={`text-sm font-medium ${
                          (historico.diferenca || 0) >= 0 ? "text-green-600" : "text-red-600"
                        }`}>
                          Diferença: {(historico.diferenca || 0) >= 0 ? "+" : ""}R$ {(historico.diferenca || 0).toFixed(2)}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Vendas</span>
                        </div>
                        <p className="text-sm">
                          Total: R$ {historico.total_vendas?.toFixed(2) || "0.00"}
                        </p>
                        <p className="text-sm">
                          Quantidade: {historico.quantidade_vendas || 0}
                        </p>
                        <p className="text-sm">
                          Ticket Médio: R$ {(historico.quantidade_vendas || 0) > 0 
                            ? ((historico.total_vendas || 0) / (historico.quantidade_vendas || 1)).toFixed(2)
                            : "0.00"}
                        </p>
                      </div>
                    </div>

                    {historico.observacoes && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm text-muted-foreground">
                          <strong>Observações:</strong> {historico.observacoes}
                        </p>
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        Turno #{historico.id?.slice(-8) || 'N/A'}
                      </div>
                      <Badge variant={historico.data_fechamento ? "secondary" : "default"}>
                        {historico.data_fechamento ? "Fechado" : "Ativo"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {historicoTurnos.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum histórico encontrado</h3>
                    <p className="text-muted-foreground">
                      O histórico de turnos aparecerá aqui após o primeiro turno ser fechado.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Turnos;