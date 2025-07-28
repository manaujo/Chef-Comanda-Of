import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  UtensilsCrossed, 
  DollarSign, 
  TrendingUp,
  Coffee,
  Clock,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { mesasService, comandasService, vendasService, insumosService } from "@/lib/database";
import type { Mesa, Comanda, Venda, Insumo } from "@/types/database";

const Dashboard = () => {
  const { user } = useAuth();
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [comandas, setComandasAbertas] = useState<Comanda[]>([]);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [insumosEstoqueBaixo, setInsumosEstoqueBaixo] = useState<Insumo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [mesasData, comandasData, vendasData, insumosData] = await Promise.all([
        mesasService.getAll(),
        comandasService.getAbertas(),
        vendasService.getByPeriodo(
          new Date().toISOString().split('T')[0] + 'T00:00:00.000Z',
          new Date().toISOString().split('T')[0] + 'T23:59:59.999Z'
        ),
        user?.tipo === 'administrador' || user?.tipo === 'estoque' 
          ? insumosService.getEstoqueBaixo() 
          : Promise.resolve([])
      ]);

      setMesas(mesasData);
      setComandasAbertas(comandasData);
      setVendas(vendasData);
      setInsumosEstoqueBaixo(insumosData);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const mesasOcupadas = mesas.filter(mesa => mesa.status === 'ocupada').length;
  const mesasLivres = mesas.filter(mesa => mesa.status === 'livre').length;
  const vendasHoje = vendas.reduce((total, venda) => total + venda.valor_final, 0);
  const comandasAbertas = comandas.length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo, {user?.nome_completo}! Aqui está um resumo do seu restaurante.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vendas Hoje</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : `R$ ${vendasHoje.toFixed(2)}`}
              </div>
              <p className="text-xs text-muted-foreground">
                {vendas.length} vendas realizadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comandas Abertas</CardTitle>
              <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : comandasAbertas}
              </div>
              <p className="text-xs text-muted-foreground">
                Comandas em andamento
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mesas Ocupadas</CardTitle>
              <Coffee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : `${mesasOcupadas}/${mesas.length}`}
              </div>
              <p className="text-xs text-muted-foreground">
                {mesasLivres} mesas livres
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : insumosEstoqueBaixo.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Insumos abaixo do mínimo
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mesas Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Coffee className="h-5 w-5" />
                <span>Status das Mesas</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-4 bg-muted rounded animate-pulse" />
                </div>
              ) : (
                <div className="space-y-3">
                  {mesas.slice(0, 6).map((mesa) => (
                    <div key={mesa.id} className="flex items-center justify-between">
                      <span className="font-medium">Mesa {mesa.numero}</span>
                      <Badge 
                        variant={
                          mesa.status === 'livre' ? 'default' :
                          mesa.status === 'ocupada' ? 'destructive' :
                          mesa.status === 'reservada' ? 'secondary' : 'outline'
                        }
                      >
                        {mesa.status === 'livre' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {mesa.status === 'ocupada' && <Clock className="h-3 w-3 mr-1" />}
                        {mesa.status.charAt(0).toUpperCase() + mesa.status.slice(1)}
                      </Badge>
                    </div>
                  ))}
                  {mesas.length > 6 && (
                    <p className="text-sm text-muted-foreground text-center">
                      E mais {mesas.length - 6} mesas...
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comandas Recentes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UtensilsCrossed className="h-5 w-5" />
                <span>Comandas Abertas</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-4 bg-muted rounded animate-pulse" />
                </div>
              ) : comandas.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Nenhuma comanda aberta no momento
                </p>
              ) : (
                <div className="space-y-3">
                  {comandas.slice(0, 5).map((comanda) => (
                    <div key={comanda.id} className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">Comanda #{comanda.numero}</span>
                        {comanda.mesa && (
                          <span className="text-sm text-muted-foreground ml-2">
                            Mesa {comanda.mesa.numero}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-medium">
                        R$ {comanda.valor_total.toFixed(2)}
                      </span>
                    </div>
                  ))}
                  {comandas.length > 5 && (
                    <p className="text-sm text-muted-foreground text-center">
                      E mais {comandas.length - 5} comandas...
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Alertas de Estoque (apenas para admin e estoque) */}
        {(user?.tipo === 'administrador' || user?.tipo === 'estoque') && insumosEstoqueBaixo.length > 0 && (
          <Card className="border-warning">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-warning">
                <AlertTriangle className="h-5 w-5" />
                <span>Alertas de Estoque</span>
              </CardTitle>
              <CardDescription>
                Insumos com estoque abaixo do mínimo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {insumosEstoqueBaixo.slice(0, 5).map((insumo) => (
                  <div key={insumo.id} className="flex items-center justify-between">
                    <span className="font-medium">{insumo.nome}</span>
                    <div className="text-right">
                      <div className="text-sm font-medium text-warning">
                        {insumo.quantidade_estoque} {insumo.unidade}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Mín: {insumo.estoque_minimo} {insumo.unidade}
                      </div>
                    </div>
                  </div>
                ))}
                {insumosEstoqueBaixo.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center">
                    E mais {insumosEstoqueBaixo.length - 5} insumos...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
