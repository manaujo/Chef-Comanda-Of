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
import { funcionariosService, type Funcionario } from "@/lib/funcionarios";
import { useFuncionario } from "@/hooks/useFuncionario";
import type { UserType } from "@/types/database";

const GerenciarFuncionarios = () => {
  const { funcionario: currentUser, isAdmin } = useFuncionario();
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFuncionario, setEditingFuncionario] = useState<Funcionario | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    tipo: "garcom" as UserType,
    senha: "",
    confirmSenha: ""
  });

  useEffect(() => {
    if (isAdmin) {
      loadFuncionarios();
    }
  }, [isAdmin]);

  const loadFuncionarios = async () => {
    try {
      setLoading(true);
      const data = await funcionariosService.getAll();
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

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
        // Atualizar funcionário existente
        await funcionariosService.update(editingFuncionario.id, {
          nome: formData.nome,
          tipo: formData.tipo
        });
        
        toast({
          title: "Funcionário atualizado",
          description: "Funcionário atualizado com sucesso."
        });
      } else {
        // Validações para novo funcionário
        if (!formData.senha || formData.senha.length < 6) {
          toast({
            title: "Erro",
            description: "A senha deve ter pelo menos 6 caracteres.",
            variant: "destructive"
          });
          return;
        }

        if (formData.senha !== formData.confirmSenha) {
          toast({
            title: "Erro",
            description: "As senhas não coincidem.",
            variant: "destructive"
          });
          return;
        }

        const cpfLimpo = formData.cpf.replace(/\D/g, "");
        if (cpfLimpo.length !== 11) {
          toast({
            title: "Erro",
            description: "CPF deve ter 11 dígitos.",
            variant: "destructive"
          });
          return;
        }

        // Criar novo funcionário
        await funcionariosService.create({
          nome: formData.nome,
          cpf: cpfLimpo,
          senha: formData.senha,
          tipo: formData.tipo
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
      
      let errorMessage = "Erro ao salvar funcionário.";
      
      if (error.message?.includes("CPF já cadastrado")) {
        errorMessage = "Este CPF já está cadastrado.";
      } else if (error.message?.includes("User already registered")) {
        errorMessage = "Este CPF já está cadastrado no sistema.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleEdit = (funcionario: Funcionario) => {
    setEditingFuncionario(funcionario);
    setFormData({
      nome: funcionario.nome,
      cpf: formatCPF(funcionario.cpf),
      tipo: funcionario.tipo,
      senha: "",
      confirmSenha: ""
    });
    setDialogOpen(true);
  };

  const handleToggleStatus = async (funcionario: Funcionario) => {
    if (!isAdmin) {
      toast({
        title: "Acesso negado",
        description: "Apenas administradores podem alterar status.",
        variant: "destructive"
      });
      return;
    }

    try {
      await funcionariosService.update(funcionario.id, {
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
      cpf: "",
      tipo: "garcom",
      senha: "",
      confirmSenha: ""
    });
    setEditingFuncionario(null);
  };

  const getTipoColor = (tipo: UserType) => {
    switch (tipo) {
      case "administrador":
        return "destructive";
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

  const getTipoLabel = (tipo: UserType) => {
    switch (tipo) {
      case "administrador":
        return "Administrador";
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
              <span>Funcionários</span>
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mt-1">
              Gerencie os funcionários do restaurante
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="flex-shrink-0">
                <Plus className="h-4 w-4 mr-2" />
                Novo Funcionário
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingFuncionario ? "Editar Funcionário" : "Novo Funcionário"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nome">Nome Completo *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) =>
                        setFormData({ ...formData, nome: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="cpf">CPF *</Label>
                    <Input
                      id="cpf"
                      value={formData.cpf}
                      onChange={(e) =>
                        setFormData({ ...formData, cpf: formatCPF(e.target.value) })
                      }
                      maxLength={14}
                      disabled={!!editingFuncionario}
                      required
                    />
                    {editingFuncionario && (
                      <p className="text-xs text-muted-foreground mt-1">
                        O CPF não pode ser alterado
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="tipo">Tipo de Funcionário *</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value: UserType) =>
                      setFormData({ ...formData, tipo: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="administrador">Administrador</SelectItem>
                      <SelectItem value="garcom">Garçom</SelectItem>
                      <SelectItem value="caixa">Caixa</SelectItem>
                      <SelectItem value="estoque">Estoque</SelectItem>
                      <SelectItem value="cozinha">Cozinha</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {!editingFuncionario && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="senha">Senha *</Label>
                      <Input
                        id="senha"
                        type="password"
                        value={formData.senha}
                        onChange={(e) =>
                          setFormData({ ...formData, senha: e.target.value })
                        }
                        required={!editingFuncionario}
                        minLength={6}
                        placeholder="Mínimo 6 caracteres"
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirmSenha">Confirmar Senha *</Label>
                      <Input
                        id="confirmSenha"
                        type="password"
                        value={formData.confirmSenha}
                        onChange={(e) =>
                          setFormData({ ...formData, confirmSenha: e.target.value })
                        }
                        required={!editingFuncionario}
                        minLength={6}
                        placeholder="Digite a senha novamente"
                      />
                    </div>
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
                  <span className="text-muted-foreground">CPF:</span>
                  <span className="ml-2">{formatCPF(funcionario.cpf)}</span>
                </div>

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
              <Button onClick={() => setDialogOpen(true)}>
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