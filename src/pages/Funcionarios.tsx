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
import { Plus, Edit, Users, UserCheck, UserX, Mail, Phone } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { profilesService } from "@/lib/database";
import { signUp } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import type { Profile, UserType } from "@/types/database";

const Funcionarios = () => {
  const { user } = useAuth();
  const [funcionarios, setFuncionarios] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFuncionario, setEditingFuncionario] = useState<Profile | null>(
    null
  );
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nome_completo: "",
    email: "",
    telefone: "",
    cpf: "",
    tipo: "garcom" as UserType,
    ativo: true,
    password: "",
    confirmPassword: ""
  });

  // Check if user is admin
  const isAdmin = user?.tipo === 'administrador';

  useEffect(() => {
    loadFuncionarios();
  }, []);

  const loadFuncionarios = async () => {
    try {
      setLoading(true);
      const data = await profilesService.getAll();
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

    // Check if user has admin privileges before proceeding
    if (!isAdmin) {
      toast({
        title: "Acesso negado",
        description: "Apenas administradores podem criar ou editar funcionários.",
        variant: "destructive"
      });
      return;
    }

    try {
      const funcionarioData = {
        nome_completo: formData.nome_completo,
        email: formData.email,
        telefone: formData.telefone.replace(/\D/g, ""),
        cpf: formData.cpf.replace(/\D/g, ""),
        tipo: formData.tipo,
        ativo: formData.ativo
      };

      if (editingFuncionario) {
        await profilesService.update(editingFuncionario.id, funcionarioData);
        toast({
          title: "Funcionário atualizado",
          description: "Funcionário atualizado com sucesso."
        });
      } else {
        // Validate password for new employees
        if (!formData.password || formData.password.length < 6) {
          toast({
            title: "Erro",
            description: "A senha deve ter pelo menos 6 caracteres.",
            variant: "destructive"
          });
          return;
        }

        if (formData.password !== formData.confirmPassword) {
          toast({
            title: "Erro",
            description: "As senhas não coincidem.",
            variant: "destructive"
          });
          return;
        }

        // Create new user with Supabase Auth
        await signUp({
          email: formData.email,
          password: formData.password,
          nome_completo: formData.nome_completo,
          nome_restaurante: user?.nome_restaurante || "Restaurante",
          cpf: formData.cpf.replace(/\D/g, ""),
          telefone: formData.telefone.replace(/\D/g, ""),
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
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar funcionário.",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (funcionario: Profile) => {
    setEditingFuncionario(funcionario);
    setFormData({
      nome_completo: funcionario.nome_completo,
      email: funcionario.email,
      telefone: funcionario.telefone,
      cpf: funcionario.cpf,
      tipo: funcionario.tipo,
      ativo: funcionario.ativo
    });
    setDialogOpen(true);
  };

  const handleToggleStatus = async (funcionario: Profile) => {
    // Check if user has admin privileges before proceeding
    if (!isAdmin) {
      toast({
        title: "Acesso negado",
        description: "Apenas administradores podem alterar o status de funcionários.",
        variant: "destructive"
      });
      return;
    }

    try {
      await profilesService.update(funcionario.id, {
        ativo: !funcionario.ativo
      });
      toast({
        title: "Status atualizado",
        description: `Funcionário ${
          funcionario.ativo ? "desativado" : "ativado"
        } com sucesso.`
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
      nome_completo: "",
      email: "",
      telefone: "",
      cpf: "",
      tipo: "garcom",
      ativo: true,
      password: "",
      confirmPassword: ""
    });
    setEditingFuncionario(null);
  };

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  };

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1");
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
              <Button 
                onClick={resetForm} 
                className="flex-shrink-0"
                disabled={!isAdmin}
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Funcionário
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingFuncionario
                    ? "Editar Funcionário"
                    : "Novo Funcionário"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nome_completo">Nome Completo *</Label>
                    <Input
                      id="nome_completo"
                      value={formData.nome_completo}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          nome_completo: e.target.value
                        })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">E-mail *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cpf">CPF *</Label>
                    <Input
                      id="cpf"
                      value={formData.cpf}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          cpf: formatCPF(e.target.value)
                        })
                      }
                      maxLength={14}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefone">Telefone *</Label>
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          telefone: formatPhone(e.target.value)
                        })
                      }
                      maxLength={15}
                      required
                    />
                  </div>
                </div>

                {!editingFuncionario && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="password">Senha *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        required={!editingFuncionario}
                        minLength={6}
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          setFormData({ ...formData, confirmPassword: e.target.value })
                        }
                        required={!editingFuncionario}
                        minLength={6}
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tipo">Tipo de Usuário *</Label>
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
                        <SelectItem value="administrador">
                          Administrador
                        </SelectItem>
                        <SelectItem value="garcom">Garçom</SelectItem>
                        <SelectItem value="caixa">Caixa</SelectItem>
                        <SelectItem value="estoque">Estoque</SelectItem>
                        <SelectItem value="cozinha">Cozinha</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="ativo">Status</Label>
                    <Select
                      value={formData.ativo.toString()}
                      onValueChange={(value) =>
                        setFormData({ ...formData, ativo: value === "true" })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Ativo</SelectItem>
                        <SelectItem value="false">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={!isAdmin}>
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
              <div className="text-2xl font-bold">
                {funcionariosAtivos.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <UserX className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium">Inativos</span>
              </div>
              <div className="text-2xl font-bold">
                {funcionariosInativos.length}
              </div>
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
            <Card
              key={funcionario.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {funcionario.nome_completo}
                  </CardTitle>
                  <div className="flex space-x-2">
                    <Badge variant={getTipoColor(funcionario.tipo)}>
                      {getTipoLabel(funcionario.tipo)}
                    </Badge>
                    <Badge
                      variant={funcionario.ativo ? "default" : "destructive"}
                    >
                      {funcionario.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{funcionario.email}</span>
                </div>

                <div className="flex items-center space-x-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{formatPhone(funcionario.telefone)}</span>
                </div>

                <div className="text-sm">
                  <span className="text-muted-foreground">CPF:</span>
                  <span className="ml-2">{formatCPF(funcionario.cpf)}</span>
                </div>

                <div className="text-sm">
                  <span className="text-muted-foreground">Cadastrado em:</span>
                  <span className="ml-2">
                    {new Date(funcionario.created_at).toLocaleDateString(
                      "pt-BR"
                    )}
                  </span>
                </div>

                <div className="flex space-x-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(funcionario)}
                    className="flex-1"
                    disabled={!isAdmin}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Editar
                  </Button>

                  <Button
                    variant={funcionario.ativo ? "destructive" : "default"}
                    size="sm"
                    onClick={() => handleToggleStatus(funcionario)}
                    disabled={!isAdmin}
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
                onClick={() => setDialogOpen(true)}
                disabled={!isAdmin}
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

export default Funcionarios;
