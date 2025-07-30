import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  BarChart3,
  DollarSign,
  TrendingUp,
  Calendar,
  Download,
  Filter
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { vendasService, produtosService } from "@/lib/database";
import type { Venda, Produto } from "@/types/database";

const Relatorios = () => {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [filtros, setFiltros] = useState({
    dataInicio: new Date().toISOString().split("T")[0],
    dataFim: new Date().toISOString().split("T")[0],
    tipoRelatorio: "vendas"
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [vendasData, produtosData] = await Promise.all([
        vendasService.getByPeriodo(
          filtros.dataInicio + "T00:00:00.000Z",
          filtros.dataFim + "T23:59:59.999Z"
        ),
        produtosService.getAll()
      ]);
      setVendas(vendasData);
      setProdutos(produtosData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados dos relatórios.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFiltrar = () => {
    loadData();
  };

  const calcularEstatisticas = () => {
    const totalVendas = vendas.reduce(
      (total, venda) => total + venda.valor_final,
      0
    );
    const totalDescontos = vendas.reduce(
      (total, venda) => total + venda.valor_desconto,
      0
    );
    const ticketMedio = vendas.length > 0 ? totalVendas / vendas.length : 0;

    const vendasPorFormaPagamento = vendas.reduce((acc, venda) => {
      acc[venda.forma_pagamento] =
        (acc[venda.forma_pagamento] || 0) + venda.valor_final;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalVendas,
      totalDescontos,
      ticketMedio,
      quantidadeVendas: vendas.length,
      vendasPorFormaPagamento
    };
  };

  const estatisticas = calcularEstatisticas();

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
              <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10" />
              <span>Relatórios</span>
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mt-1">
              Visualize relatórios e análises do seu negócio
            </p>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filtros</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="dataInicio">Data Início</Label>
                <Input
                  id="dataInicio"
                  type="date"
                  value={filtros.dataInicio}
                  onChange={(e) =>
                    setFiltros({ ...filtros, dataInicio: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="dataFim">Data Fim</Label>
                <Input
                  id="dataFim"
                  type="date"
                  value={filtros.dataFim}
                  onChange={(e) =>
                    setFiltros({ ...filtros, dataFim: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="tipoRelatorio">Tipo de Relatório</Label>
                <Select
                  value={filtros.tipoRelatorio}
                  onValueChange={(value) =>
                    setFiltros({ ...filtros, tipoRelatorio: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vendas">Vendas</SelectItem>
                    <SelectItem value="produtos">Produtos</SelectItem>
                    <SelectItem value="formas_pagamento">
                      Formas de Pagamento
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={handleFiltrar} className="w-full">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtrar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Total Vendas</span>
              </div>
              <div className="text-2xl font-bold">
                R$ {estatisticas.totalVendas.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Quantidade</span>
              </div>
              <div className="text-2xl font-bold">
                {estatisticas.quantidadeVendas}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Ticket Médio</span>
              </div>
              <div className="text-2xl font-bold">
                R$ {estatisticas.ticketMedio.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">Descontos</span>
              </div>
              <div className="text-2xl font-bold">
                R$ {estatisticas.totalDescontos.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Relatório de Vendas */}
        {filtros.tipoRelatorio === "vendas" && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Vendas por Período</CardTitle>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Data</th>
                      <th className="text-left p-2">Comanda</th>
                      <th className="text-left p-2">Operador</th>
                      <th className="text-left p-2">Funcionário</th>
                      <th className="text-left p-2">Valor Total</th>
                      <th className="text-left p-2">Desconto</th>
                      <th className="text-left p-2">Valor Final</th>
                      <th className="text-left p-2">Pagamento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendas.map((venda) => (
                      <tr key={venda.id} className="border-b">
                        <td className="p-2">
                          {new Date(venda.data_venda).toLocaleDateString(
                            "pt-BR"
                          )}
                        </td>
                        <td className="p-2">#{venda.comanda?.numero}</td>
                        <td className="p-2">{venda.operador?.nome_completo}</td>
                        <td className="p-2">{venda.turno?.operador_funcionario?.nome || '-'}</td>
                        <td className="p-2">
                          R$ {venda.valor_total.toFixed(2)}
                        </td>
                        <td className="p-2">
                          R$ {venda.valor_desconto.toFixed(2)}
                        </td>
                        <td className="p-2 font-medium">
                          R$ {venda.valor_final.toFixed(2)}
                        </td>
                        <td className="p-2 capitalize">
                          {venda.forma_pagamento.replace("_", " ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {vendas.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma venda encontrada no período selecionado.
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Relatório por Forma de Pagamento */}
        {filtros.tipoRelatorio === "formas_pagamento" && (
          <Card>
            <CardHeader>
              <CardTitle>Vendas por Forma de Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(estatisticas.vendasPorFormaPagamento).map(
                  ([forma, valor]) => (
                    <div
                      key={forma}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <h4 className="font-medium capitalize">
                          {forma.replace("_", " ")}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {
                            vendas.filter((v) => v.forma_pagamento === forma)
                              .length
                          }{" "}
                          vendas
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          R$ {valor.toFixed(2)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {((valor / estatisticas.totalVendas) * 100).toFixed(
                            1
                          )}
                          %
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
              {Object.keys(estatisticas.vendasPorFormaPagamento).length ===
                0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma venda encontrada no período selecionado.
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Relatório de Produtos */}
        {filtros.tipoRelatorio === "produtos" && (
          <Card>
            <CardHeader>
              <CardTitle>Produtos Cadastrados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Nome</th>
                      <th className="text-left p-2">Categoria</th>
                      <th className="text-left p-2">Preço</th>
                      <th className="text-left p-2">Tempo Preparo</th>
                      <th className="text-left p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {produtos.map((produto) => (
                      <tr key={produto.id} className="border-b">
                        <td className="p-2 font-medium">{produto.nome}</td>
                        <td className="p-2">
                          {produto.categoria?.nome || "Sem categoria"}
                        </td>
                        <td className="p-2">R$ {produto.preco.toFixed(2)}</td>
                        <td className="p-2">{produto.tempo_preparo} min</td>
                        <td className="p-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              produto.ativo
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {produto.ativo ? "Ativo" : "Inativo"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Relatorios;
