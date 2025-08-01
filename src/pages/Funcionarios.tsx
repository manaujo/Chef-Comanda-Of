import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase, Funcionario, Empresa } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Users, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const Funcionarios = () => {
  const { user } = useAuth();
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [nome, setNome] = useState("");
  const [funcao, setFuncao] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetchEmpresa();
  }, [user, navigate]);

  useEffect(() => {
    if (empresa) {
      fetchFuncionarios();
    }
  }, [empresa]);

  const fetchEmpresa = async () => {
    const { data } = await supabase
      .from('empresas')
      .select('*')
      .eq('user_id', user!.id)
      .single();

    if (data) {
      setEmpresa(data);
    }
  };

  const fetchFuncionarios = async () => {
    const { data } = await supabase
      .from('funcionarios')
      .select('*')
      .eq('empresa_id', empresa!.id)
      .order('nome');

    if (data) {
      setFuncionarios(data);
    }
  };

  const criarFuncionario = async () => {
    if (!nome || !funcao || !empresa) return;

    const { error } = await supabase
      .from('funcionarios')
      .insert([
        {
          nome,
          funcao: funcao as 'garcom' | 'cozinheiro' | 'caixa',
          empresa_id: empresa.id,
        }
      ]);

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar funcionário",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Funcionário criado com sucesso",
      });
      setNome("");
      setFuncao("");
      setDialogOpen(false);
      fetchFuncionarios();
    }
  };

  const removerFuncionario = async (id: string) => {
    const { error } = await supabase
      .from('funcionarios')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao remover funcionário",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Funcionário removido com sucesso",
      });
      fetchFuncionarios();
    }
  };

  const getFuncaoColor = (funcao: string) => {
    switch (funcao) {
      case 'garcom':
        return 'bg-gradient-to-br from-primary/20 to-primary/10 border-primary/30';
      case 'cozinheiro':
        return 'bg-gradient-to-br from-accent/20 to-accent/10 border-accent/30';
      case 'caixa':
        return 'bg-gradient-to-br from-success/20 to-success/10 border-success/30';
      default:
        return 'bg-gradient-to-br from-muted/20 to-muted/10 border-muted/30';
    }
  };

  const getFuncaoText = (funcao: string) => {
    switch (funcao) {
      case 'garcom':
        return 'Garçom';
      case 'cozinheiro':
        return 'Cozinheiro';
      case 'caixa':
        return 'Caixa';
      default:
        return funcao;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/5">
      <header className="bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Link>
            </Button>
            <Users className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Funcionários</h1>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="hero">
                <Plus className="h-4 w-4 mr-2" />
                Novo Funcionário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Funcionário</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Nome do funcionário"
                  />
                </div>
                <div>
                  <Label>Função</Label>
                  <Select value={funcao} onValueChange={setFuncao}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a função" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="garcom">Garçom</SelectItem>
                      <SelectItem value="cozinheiro">Cozinheiro</SelectItem>
                      <SelectItem value="caixa">Caixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={criarFuncionario} className="w-full" disabled={!nome || !funcao}>
                  Criar Funcionário
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {funcionarios.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhum funcionário cadastrado</h3>
            <p className="text-muted-foreground mb-4">Cadastre funcionários para gerenciar comandas</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {funcionarios.map((funcionario, index) => (
              <motion.div
                key={funcionario.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`${getFuncaoColor(funcionario.funcao)} hover:shadow-warm transition-all duration-300`}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg">{funcionario.nome}</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removerFuncionario(funcionario.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        funcionario.funcao === 'garcom' ? 'bg-primary text-primary-foreground' :
                        funcionario.funcao === 'cozinheiro' ? 'bg-accent text-accent-foreground' :
                        'bg-success text-success-foreground'
                      }`}>
                        {getFuncaoText(funcionario.funcao)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Funcionarios;