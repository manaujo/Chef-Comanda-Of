import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase, Mesa, Funcionario, Produto, Comanda as ComandaType, ComandaItem, Empresa } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Minus, Send, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const Comanda = () => {
  const { mesaId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [mesa, setMesa] = useState<Mesa | null>(null);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [comanda, setComanda] = useState<ComandaType | null>(null);
  const [itensComanda, setItensComanda] = useState<(ComandaItem & { produto: Produto })[]>([]);
  
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState("");
  const [produtoSelecionado, setProdutoSelecionado] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [observacoes, setObservacoes] = useState("");

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetchData();
  }, [user, mesaId, navigate]);

  const fetchData = async () => {
    // Buscar empresa
    const { data: empresaData } = await supabase
      .from('empresas')
      .select('*')
      .eq('user_id', user!.id)
      .single();

    if (!empresaData) return;
    setEmpresa(empresaData);

    // Buscar mesa
    const { data: mesaData } = await supabase
      .from('mesas')
      .select('*')
      .eq('id', mesaId)
      .eq('empresa_id', empresaData.id)
      .single();

    if (!mesaData) {
      navigate('/mesas');
      return;
    }
    setMesa(mesaData);

    // Buscar funcionários
    const { data: funcionariosData } = await supabase
      .from('funcionarios')
      .select('*')
      .eq('empresa_id', empresaData.id);

    if (funcionariosData) {
      setFuncionarios(funcionariosData);
    }

    // Buscar produtos
    const { data: produtosData } = await supabase
      .from('produtos')
      .select('*')
      .eq('empresa_id', empresaData.id)
      .eq('ativo', true);

    if (produtosData) {
      setProdutos(produtosData);
    }

    // Buscar comanda existente
    const { data: comandaData } = await supabase
      .from('comandas')
      .select('*')
      .eq('mesa_id', mesaId)
      .eq('status', 'aberta')
      .single();

    if (comandaData) {
      setComanda(comandaData);
      fetchItensComanda(comandaData.id);
    }
  };

  const fetchItensComanda = async (comandaId: string) => {
    const { data } = await supabase
      .from('comanda_itens')
      .select(`
        *,
        produto:produtos(*)
      `)
      .eq('comanda_id', comandaId);

    if (data) {
      setItensComanda(data);
    }
  };

  const criarComanda = async () => {
    if (!funcionarioSelecionado || !mesa || !empresa) return;

    const { data, error } = await supabase
      .from('comandas')
      .insert([
        {
          mesa_id: mesa.id,
          funcionario_id: funcionarioSelecionado,
          status: 'aberta',
          total: 0,
          empresa_id: empresa.id,
        }
      ])
      .select()
      .single();

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar comanda",
        variant: "destructive",
      });
    } else {
      setComanda(data);
      // Atualizar status da mesa
      await supabase
        .from('mesas')
        .update({ status: 'ocupada' })
        .eq('id', mesa.id);
      
      setMesa({ ...mesa, status: 'ocupada' });
    }
  };

  const adicionarItem = async () => {
    if (!produtoSelecionado || !comanda || quantidade <= 0) return;

    const produto = produtos.find(p => p.id === produtoSelecionado);
    if (!produto) return;

    const { error } = await supabase
      .from('comanda_itens')
      .insert([
        {
          comanda_id: comanda.id,
          produto_id: produto.id,
          quantidade,
          preco_unitario: produto.preco,
          observacoes: observacoes || null,
          status: 'pendente',
        }
      ]);

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao adicionar item",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Item adicionado à comanda",
      });
      
      // Limpar formulário
      setProdutoSelecionado("");
      setQuantidade(1);
      setObservacoes("");
      
      // Recarregar itens
      fetchItensComanda(comanda.id);
      
      // Atualizar total da comanda
      atualizarTotalComanda();
    }
  };

  const removerItem = async (itemId: string) => {
    const { error } = await supabase
      .from('comanda_itens')
      .delete()
      .eq('id', itemId);

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao remover item",
        variant: "destructive",
      });
    } else {
      fetchItensComanda(comanda!.id);
      atualizarTotalComanda();
    }
  };

  const atualizarTotalComanda = async () => {
    if (!comanda) return;

    const total = itensComanda.reduce((acc, item) => 
      acc + (item.quantidade * item.preco_unitario), 0
    );

    await supabase
      .from('comandas')
      .update({ total })
      .eq('id', comanda.id);

    setComanda({ ...comanda, total });
  };

  const enviarParaCozinha = async () => {
    if (!comanda) return;

    const { error } = await supabase
      .from('comandas')
      .update({ status: 'enviada' })
      .eq('id', comanda.id);

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao enviar para cozinha",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Pedido enviado para a cozinha",
      });
      setComanda({ ...comanda, status: 'enviada' });
    }
  };

  if (!mesa) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const total = itensComanda.reduce((acc, item) => acc + (item.quantidade * item.preco_unitario), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/5">
      <header className="bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/mesas">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">Mesa {mesa.numero}</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              mesa.status === 'livre' ? 'bg-success text-success-foreground' :
              mesa.status === 'ocupada' ? 'bg-warning text-warning-foreground' :
              'bg-destructive text-destructive-foreground'
            }`}>
              {mesa.status === 'livre' ? 'Livre' : 
               mesa.status === 'ocupada' ? 'Ocupada' : 'Aguardando Pagamento'}
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulário de Pedido */}
          <Card>
            <CardHeader>
              <CardTitle>Novo Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!comanda ? (
                <div>
                  <Label>Selecionar Funcionário</Label>
                  <Select value={funcionarioSelecionado} onValueChange={setFuncionarioSelecionado}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha o funcionário" />
                    </SelectTrigger>
                    <SelectContent>
                      {funcionarios.map((funcionario) => (
                        <SelectItem key={funcionario.id} value={funcionario.id}>
                          {funcionario.nome} - {funcionario.funcao}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={criarComanda} className="w-full mt-4" disabled={!funcionarioSelecionado}>
                    Abrir Comanda
                  </Button>
                </div>
              ) : (
                <>
                  <div>
                    <Label>Produto</Label>
                    <Select value={produtoSelecionado} onValueChange={setProdutoSelecionado}>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha o produto" />
                      </SelectTrigger>
                      <SelectContent>
                        {produtos.map((produto) => (
                          <SelectItem key={produto.id} value={produto.id}>
                            {produto.nome} - R$ {produto.preco.toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Quantidade</Label>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        value={quantidade}
                        onChange={(e) => setQuantidade(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-20 text-center"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setQuantidade(quantidade + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label>Observações</Label>
                    <Textarea
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      placeholder="Observações especiais..."
                    />
                  </div>

                  <Button onClick={adicionarItem} className="w-full" disabled={!produtoSelecionado}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Item
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Lista de Itens */}
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                Itens da Comanda
                <span className="text-2xl font-bold text-primary">
                  R$ {total.toFixed(2)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {itensComanda.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum item adicionado
                </p>
              ) : (
                <div className="space-y-3">
                  {itensComanda.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex justify-between items-center p-3 bg-muted/30 rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{item.produto.nome}</h4>
                        <p className="text-sm text-muted-foreground">
                          {item.quantidade}x R$ {item.preco_unitario.toFixed(2)}
                        </p>
                        {item.observacoes && (
                          <p className="text-sm text-muted-foreground italic">
                            {item.observacoes}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold">
                          R$ {(item.quantidade * item.preco_unitario).toFixed(2)}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removerItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {comanda && itensComanda.length > 0 && comanda.status === 'aberta' && (
                <Button onClick={enviarParaCozinha} className="w-full mt-4" variant="hero">
                  <Send className="h-4 w-4 mr-2" />
                  Enviar para Cozinha
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Comanda;