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
import { Plus, Edit, Users, UserCheck, UserX } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { funcionariosSimplesService, type FuncionarioSimples, type FuncionarioTipo } from "@/lib/funcionarios-simples";
import { useAuth } from "@/hooks/useAuth";

const GerenciarFuncionarios = () => {
  const { user } = useAuth();
  const [funcionarios, setFuncionarios] = useState<FuncionarioSimples[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFuncionario, setEditingFuncionario] = useState<FuncionarioSimples | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nome: "",
    tipo: "garcom" as FuncionarioTipo
  });

  useEffect(() => {
    loadFuncionarios();
  }, []);

  const loadFuncionarios = async () => {
    try {
      setLoading(true);
      const data = await funcionariosSimplesService.getAll();
      setFuncionarios(data);
    } catch (error) {
      console.error("Erro ao carregar funcionários:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar funcionários.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isAdmin = user?.tipo === "admin" || (user?.userData as any)?.tipo === "administrador";

    if (!isAdmin) {
      toast({
        title: "Acesso negado",
        description: "Apenas administradores podem gerenciar funcionários.",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingFuncionario) {
        await funcionariosSimplesService.update(editingFuncionario.id, {
          nome: formData.nome,
          tipo: formData.tipo
        });

        toast({
          title: "Funcionário atualizado",
          description: "Funcionário atualizado com sucesso."
        });
      } else {
        await funcionariosSimplesService.create({
          nome: formData.nome,
          tipo: formData.tipo,
          ativo: true
        });

        toast({
          title: "Funcionário criado",
          description: "Funcionário criado com sucesso."
        });
      }

      setDialogOpen(false);
      resetForm();
      loadFuncionarios();
    } catch (error: any) {
      console.error("Erro ao salvar funcionário:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar funcionário.",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (funcionario: FuncionarioSimples) => {
    setEditingFuncionario(funcionario);
    setFormData({
      nome: funcionario.nome,
      tipo: funcionario.tipo
    });
    setDialogOpen(true);
  };

  const handleToggleStatus = async (funcionario: FuncionarioSimples) => {
    const isAdmin = user?.tipo === "admin" || (user?.userData as any)?.tipo === "administrador";

    if (!isAdmin) {
      toast({
        title: "Acesso negado",
        description: "Apenas administradores podem alterar status.",
        variant: "destructive"
      });
      return;
    }

    try {
      await funcionariosSimplesService.update(funcionario.id, {
        ativo: !funcionario.ativo
      });

      toast({
        title: "Status atualizado",
        description: `Funcionário ${funcionario.ativo ? "desativado" : "ativado"} com sucesso.`
      });

      loadFuncionarios();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do funcionário.",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      tipo: "garcom"
    });
    setEditingFuncionario(null);
  };

  const getTipoColor = (tipo: FuncionarioTipo) => {
    switch (tipo) {
      case "garcom":
        return "default";
      case "caixa":
        return "secondary";
      case "estoque":
        return "outline";
      case "cozinha":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getTipoLabel = (tipo: FuncionarioTipo) => {
    switch (tipo) {
      case "garcom":
        return "Garçom";
      case "caixa":
        return "Caixa";
      case "estoque":
        return "Estoque";
      case "cozinha":
        return "Cozinha";
      default:
        return tipo;
    }
  };

  const isAdmin = user?.tipo === "admin" || (user?.userData as any)?.tipo === "administrador";

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">Acesso Negado</h3>
          <p className="text-muted-foreground">
            Apenas administradores podem acessar esta página.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  const funcionariosAtivos = funcionarios.filter((f) => f.ativo);
  const funcionariosInativos = funcionarios.filter((f) => !f.ativo);

  return (
    <DashboardLayout>
      <div className="space-y-4 lg:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 lg:gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold flex items-center space-x-2">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10" />
              <span>Gerenciar Funcionários</span>
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mt-1">
              Cadastre e gerencie os funcionários do restaurante
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  resetForm();
                  setDialogOpen(true);
                }}
                className="flex-shrink-0"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Funcionário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingFuncionario ? "Editar Funcionário" : "Novo Funcionário"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome do Funcionário *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) =>
                      setFormData({ ...formData, nome: e.target.value })
                    }
                    placeholder="Digite o nome completo"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="tipo">Tipo de Funcionário *</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value: FuncionarioTipo) =>
                      setFormData({ ...formData, tipo: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="garcom">Garçom</SelectItem>
                      <SelectItem value="caixa">Caixa</SelectItem>
                      <SelectItem value="cozinha">Cozinha</SelectItem>
                      <SelectItem value="estoque">Estoque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Nota:</strong> Os funcionários não fazem login no sistema. 
                    Eles são apenas atribuídos nas operações internas como PDV, mesas e relatórios.
                  </p>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingFuncionario ? "Atualizar" : "Criar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Total</span>
              </div>
              <div className="text-2xl font-bold">{funcionarios.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <UserCheck className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Ativos</span>
              </div>
              <div className="text-2xl font-bold">{funcionariosAtivos.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <UserX className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium">Inativos</span>
              </div>
              <div className="text-2xl font-bold">{funcionariosInativos.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Garçons</span>
              </div>
              <div className="text-2xl font-bold">
                {funcionarios.filter((f) => f.tipo === "garcom").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Funcionários Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {funcionarios.map((funcionario) => (
            <Card key={funcionario.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{funcionario.nome}</CardTitle>
                  <div className="flex space-x-2">
                    <Badge variant={getTipoColor(funcionario.tipo)}>
                      {getTipoLabel(funcionario.tipo)}
                    </Badge>
                    <Badge variant={funcionario.ativo ? "default" : "destructive"}>
                      {funcionario.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <span className="text-muted-foreground">Cadastrado em:</span>
                  <span className="ml-2">
                    {new Date(funcionario.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>

                <div className="flex space-x-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(funcionario)}
                    className="flex-1"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Editar
                  </Button>

                  <Button
                    variant={funcionario.ativo ? "destructive" : "default"}
                    size="sm"
                    onClick={() => handleToggleStatus(funcionario)}
                  >
                    {funcionario.ativo ? (
                      <UserX className="h-3 w-3" />
                    ) : (
                      <UserCheck className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {funcionarios.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Nenhum funcionário cadastrado
              </h3>
              <p className="text-muted-foreground mb-4">
                Comece cadastrando os funcionários do seu restaurante.
              </p>
              <Button
                onClick={() => {
                  resetForm();
                  setDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar primeiro funcionário
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default GerenciarFuncionarios;