import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save, Building, Bell, Printer, Palette } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";

const Configuracoes = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [configuracoes, setConfiguracoes] = useState({
    // Informações do Restaurante
    nome_restaurante: user?.nome_restaurante || "",
    endereco: "",
    telefone: "",
    email: "",
    cnpj: "",

    // Configurações de Funcionamento
    horario_abertura: "08:00",
    horario_fechamento: "22:00",
    tempo_preparo_padrao: "15",

    // Notificações
    notificar_estoque_baixo: true,
    notificar_novos_pedidos: true,
    notificar_pedidos_prontos: true,

    // Impressão
    impressora_comandas: "",
    impressora_recibos: "",
    imprimir_automatico: true,

    // Aparência
    tema_escuro: false,
    cor_primaria: "#dc2626",
    mostrar_fotos_produtos: true
  });

  const handleSave = async () => {
    try {
      // Aqui você salvaria as configurações no banco de dados
      toast({
        title: "Configurações salvas",
        description: "As configurações foram salvas com sucesso."
      });
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações.",
        variant: "destructive"
      });
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setConfiguracoes((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 lg:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 lg:gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold flex items-center space-x-2">
              <Settings className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10" />
              <span>Configurações</span>
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mt-1">
              Configure as preferências do sistema
            </p>
          </div>

          <Button onClick={handleSave} className="flex-shrink-0">
            <Save className="h-4 w-4 mr-2" />
            Salvar Configurações
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-4 lg:gap-6">
          {/* Informações do Restaurante */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>Informações do Restaurante</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="nome_restaurante">Nome do Restaurante</Label>
                <Input
                  id="nome_restaurante"
                  value={configuracoes.nome_restaurante}
                  onChange={(e) =>
                    handleInputChange("nome_restaurante", e.target.value)
                  }
                />
              </div>

              <div>
                <Label htmlFor="endereco">Endereço</Label>
                <Textarea
                  id="endereco"
                  value={configuracoes.endereco}
                  onChange={(e) =>
                    handleInputChange("endereco", e.target.value)
                  }
                  placeholder="Endereço completo do restaurante"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={configuracoes.telefone}
                    onChange={(e) =>
                      handleInputChange("telefone", e.target.value)
                    }
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={configuracoes.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="contato@restaurante.com"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={configuracoes.cnpj}
                  onChange={(e) => handleInputChange("cnpj", e.target.value)}
                  placeholder="00.000.000/0000-00"
                />
              </div>
            </CardContent>
          </Card>

          {/* Configurações de Funcionamento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Funcionamento</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="horario_abertura">Horário de Abertura</Label>
                  <Input
                    id="horario_abertura"
                    type="time"
                    value={configuracoes.horario_abertura}
                    onChange={(e) =>
                      handleInputChange("horario_abertura", e.target.value)
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="horario_fechamento">
                    Horário de Fechamento
                  </Label>
                  <Input
                    id="horario_fechamento"
                    type="time"
                    value={configuracoes.horario_fechamento}
                    onChange={(e) =>
                      handleInputChange("horario_fechamento", e.target.value)
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="tempo_preparo_padrao">
                  Tempo de Preparo Padrão (minutos)
                </Label>
                <Input
                  id="tempo_preparo_padrao"
                  type="number"
                  min="1"
                  value={configuracoes.tempo_preparo_padrao}
                  onChange={(e) =>
                    handleInputChange("tempo_preparo_padrao", e.target.value)
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Notificações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Notificações</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notificar_estoque_baixo">Estoque Baixo</Label>
                  <p className="text-sm text-muted-foreground">
                    Notificar quando insumos estiverem abaixo do mínimo
                  </p>
                </div>
                <Switch
                  id="notificar_estoque_baixo"
                  checked={configuracoes.notificar_estoque_baixo}
                  onCheckedChange={(checked) =>
                    handleInputChange("notificar_estoque_baixo", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notificar_novos_pedidos">Novos Pedidos</Label>
                  <p className="text-sm text-muted-foreground">
                    Notificar a cozinha sobre novos pedidos
                  </p>
                </div>
                <Switch
                  id="notificar_novos_pedidos"
                  checked={configuracoes.notificar_novos_pedidos}
                  onCheckedChange={(checked) =>
                    handleInputChange("notificar_novos_pedidos", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notificar_pedidos_prontos">
                    Pedidos Prontos
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Notificar garçons quando pedidos estiverem prontos
                  </p>
                </div>
                <Switch
                  id="notificar_pedidos_prontos"
                  checked={configuracoes.notificar_pedidos_prontos}
                  onCheckedChange={(checked) =>
                    handleInputChange("notificar_pedidos_prontos", checked)
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Configurações de Impressão */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Printer className="h-5 w-5" />
                <span>Impressão</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="impressora_comandas">
                  Impressora de Comandas
                </Label>
                <Input
                  id="impressora_comandas"
                  value={configuracoes.impressora_comandas}
                  onChange={(e) =>
                    handleInputChange("impressora_comandas", e.target.value)
                  }
                  placeholder="Nome da impressora da cozinha"
                />
              </div>

              <div>
                <Label htmlFor="impressora_recibos">
                  Impressora de Recibos
                </Label>
                <Input
                  id="impressora_recibos"
                  value={configuracoes.impressora_recibos}
                  onChange={(e) =>
                    handleInputChange("impressora_recibos", e.target.value)
                  }
                  placeholder="Nome da impressora do caixa"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="imprimir_automatico">
                    Impressão Automática
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Imprimir comandas automaticamente ao criar pedidos
                  </p>
                </div>
                <Switch
                  id="imprimir_automatico"
                  checked={configuracoes.imprimir_automatico}
                  onCheckedChange={(checked) =>
                    handleInputChange("imprimir_automatico", checked)
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Aparência */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="h-5 w-5" />
                <span>Aparência</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="tema_escuro">Tema Escuro</Label>
                  <p className="text-sm text-muted-foreground">
                    Usar tema escuro na interface
                  </p>
                </div>
                <Switch
                  id="tema_escuro"
                  checked={configuracoes.tema_escuro}
                  onCheckedChange={(checked) =>
                    handleInputChange("tema_escuro", checked)
                  }
                />
              </div>

              <div>
                <Label htmlFor="cor_primaria">Cor Primária</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="cor_primaria"
                    type="color"
                    value={configuracoes.cor_primaria}
                    onChange={(e) =>
                      handleInputChange("cor_primaria", e.target.value)
                    }
                    className="w-16 h-10"
                  />
                  <Input
                    value={configuracoes.cor_primaria}
                    onChange={(e) =>
                      handleInputChange("cor_primaria", e.target.value)
                    }
                    placeholder="#dc2626"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="mostrar_fotos_produtos">
                    Fotos dos Produtos
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Mostrar fotos dos produtos no cardápio
                  </p>
                </div>
                <Switch
                  id="mostrar_fotos_produtos"
                  checked={configuracoes.mostrar_fotos_produtos}
                  onCheckedChange={(checked) =>
                    handleInputChange("mostrar_fotos_produtos", checked)
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Informações do Sistema */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Versão:</span>
                  <p className="font-medium">ChefComanda v1.0.0</p>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    Última Atualização:
                  </span>
                  <p className="font-medium">28/01/2025</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Banco de Dados:</span>
                  <p className="font-medium">PostgreSQL (Supabase)</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <p className="font-medium text-green-600">Online</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Para suporte técnico, entre em contato através do email:
                  <a
                    href="mailto:suporte@chefcomanda.com.br"
                    className="text-primary hover:underline ml-1"
                  >
                    suporte@chefcomanda.com.br
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Configuracoes;
