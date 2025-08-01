import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  AlertTriangle,
  CheckCircle,
  Database,
  RefreshCw,
  Trash2,
  Plus
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { databaseUtils } from "@/lib/database-utils";
import { supabase } from "@/lib/supabase";

const Diagnostico = () => {
  const [integrity, setIntegrity] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [issues, setIssues] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    checkIntegrity();
  }, []);

  const checkIntegrity = async () => {
    try {
      setLoading(true);
      const data = await databaseUtils.checkDataIntegrity();
      setIntegrity(data);

      // Verificar problemas específicos
      const foundIssues: string[] = [];
      
      if (data.mesas === 0) {
        foundIssues.push("Nenhuma mesa cadastrada");
      }
      
      if (data.funcionarios === 0) {
        foundIssues.push("Nenhum funcionário cadastrado");
      }
      
      if (data.turnosAtivos > 1) {
        foundIssues.push("Múltiplos turnos ativos encontrados");
      }

      setIssues(foundIssues);
    } catch (error) {
      console.error("Erro ao verificar integridade:", error);
      toast({
        title: "Erro",
        description: "Erro ao verificar integridade dos dados",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetData = async () => {
    if (confirm('⚠️ ATENÇÃO: Isso irá remover TODOS os seus dados. Continuar?')) {
      try {
        setLoading(true);
        await databaseUtils.resetAllUserData();
        await databaseUtils.createTestData();
        
        toast({
          title: "Dados resetados",
          description: "Dados resetados e recriados com sucesso"
        });
        
        checkIntegrity();
      } catch (error) {
        console.error("Erro ao resetar dados:", error);
        toast({
          title: "Erro",
          description: "Erro ao resetar dados",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCreateTestData = async () => {
    try {
      setLoading(true);
      await databaseUtils.createTestData();
      
      toast({
        title: "Dados criados",
        description: "Dados de teste criados com sucesso"
      });
      
      checkIntegrity();
    } catch (error) {
      console.error("Erro ao criar dados:", error);
      toast({
        title: "Erro",
        description: "Erro ao criar dados de teste",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRunSQLQuery = async (query: string) => {
    try {
      const { data, error } = await supabase.rpc('exec_sql', { query });
      
      if (error) throw error;
      
      toast({
        title: "Query executada",
        description: "Query SQL executada com sucesso"
      });
      
      console.log("Resultado da query:", data);
    } catch (error) {
      console.error("Erro ao executar query:", error);
      toast({
        title: "Erro",
        description: "Erro ao executar query SQL",
        variant: "destructive"
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center space-x-2">
              <Database className="h-8 w-8" />
              <span>Diagnóstico do Sistema</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Verificação e correção de problemas no banco de dados
            </p>
          </div>
          
          <div className="flex space-x-2">
            <Button
              onClick={checkIntegrity}
              disabled={loading}
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Verificar Novamente
            </Button>
          </div>
        </div>

        {/* Status Geral */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {issues.length === 0 ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              )}
              <span>Status Geral do Sistema</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Verificando integridade...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {issues.length === 0 ? (
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>Sistema funcionando corretamente</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-yellow-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Problemas encontrados:</span>
                    </div>
                    {issues.map((issue, index) => (
                      <div key={index} className="ml-6 text-sm text-muted-foreground">
                        • {issue}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Estatísticas dos Dados */}
        {integrity && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{integrity.mesas}</div>
                <div className="text-sm text-muted-foreground">Mesas</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{integrity.comandas}</div>
                <div className="text-sm text-muted-foreground">Comandas</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{integrity.comandasProntas}</div>
                <div className="text-sm text-muted-foreground">Prontas PDV</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{integrity.vendas}</div>
                <div className="text-sm text-muted-foreground">Vendas</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{integrity.turnosAtivos}</div>
                <div className="text-sm text-muted-foreground">Turnos Ativos</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{integrity.funcionarios}</div>
                <div className="text-sm text-muted-foreground">Funcionários</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Ações de Correção */}
        <Card>
          <CardHeader>
            <CardTitle>Ações de Correção</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={handleCreateTestData}
                disabled={loading}
                variant="outline"
                className="justify-start"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Dados de Teste
              </Button>
              
              <Button
                onClick={handleResetData}
                disabled={loading}
                variant="destructive"
                className="justify-start"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Resetar Todos os Dados
              </Button>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2">Problemas Comuns e Soluções:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• <strong>Mesas não aparecem:</strong> Execute "Criar Dados de Teste"</li>
                <li>• <strong>Erro de foreign key:</strong> Execute "Resetar Todos os Dados"</li>
                <li>• <strong>Comandas não aparecem no PDV:</strong> Verifique se têm status "pronto_para_fechamento"</li>
                <li>• <strong>Múltiplos turnos ativos:</strong> Feche turnos antigos na tela de Turnos</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Queries SQL Úteis */}
        <Card>
          <CardHeader>
            <CardTitle>Queries SQL Úteis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Para executar no SQL Editor do Supabase:</h4>
              <div className="space-y-2 text-sm font-mono">
                <div className="bg-white p-2 rounded border">
                  <code>-- Verificar comandas prontas para PDV</code><br/>
                  <code>SELECT * FROM comandas WHERE status = 'pronto_para_fechamento' AND valor_total > 0;</code>
                </div>
                
                <div className="bg-white p-2 rounded border">
                  <code>-- Limpar dados órfãos</code><br/>
                  <code>DELETE FROM vendas WHERE operador_id NOT IN (SELECT id FROM profiles);</code>
                </div>
                
                <div className="bg-white p-2 rounded border">
                  <code>-- Resetar status das mesas</code><br/>
                  <code>UPDATE mesas SET status = 'livre', comanda_id = NULL;</code>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Diagnostico;