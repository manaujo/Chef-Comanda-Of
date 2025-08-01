import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase, Mesa, Empresa } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Coffee } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const Mesas = () => {
  const { user } = useAuth();
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [novoNumero, setNovoNumero] = useState("");
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
      fetchMesas();
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

  const fetchMesas = async () => {
    const { data } = await supabase
      .from('mesas')
      .select('*')
      .eq('empresa_id', empresa!.id)
      .order('numero');

    if (data) {
      setMesas(data);
    }
  };

  const criarMesa = async () => {
    if (!novoNumero || !empresa) return;

    const { error } = await supabase
      .from('mesas')
      .insert([
        {
          numero: parseInt(novoNumero),
          status: 'livre',
          empresa_id: empresa.id,
        }
      ]);

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar mesa",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Mesa criada com sucesso",
      });
      setNovoNumero("");
      setDialogOpen(false);
      fetchMesas();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'livre':
        return 'bg-gradient-to-br from-success/20 to-success/10 border-success/30';
      case 'ocupada':
        return 'bg-gradient-to-br from-warning/20 to-warning/10 border-warning/30';
      case 'aguardando_pagamento':
        return 'bg-gradient-to-br from-destructive/20 to-destructive/10 border-destructive/30';
      default:
        return 'bg-gradient-to-br from-muted/20 to-muted/10 border-muted/30';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'livre':
        return 'Livre';
      case 'ocupada':
        return 'Ocupada';
      case 'aguardando_pagamento':
        return 'Aguardando Pagamento';
      default:
        return 'Desconhecido';
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
            <Coffee className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Controle de Mesas</h1>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="hero">
                <Plus className="h-4 w-4 mr-2" />
                Nova Mesa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Mesa</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="numero">Número da Mesa</Label>
                  <Input
                    id="numero"
                    type="number"
                    value={novoNumero}
                    onChange={(e) => setNovoNumero(e.target.value)}
                    placeholder="Ex: 1"
                  />
                </div>
                <Button onClick={criarMesa} className="w-full">
                  Criar Mesa
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {mesas.length === 0 ? (
          <div className="text-center py-12">
            <Coffee className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhuma mesa cadastrada</h3>
            <p className="text-muted-foreground mb-4">Crie sua primeira mesa para começar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {mesas.map((mesa, index) => (
              <motion.div
                key={mesa.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`${getStatusColor(mesa.status)} hover:shadow-warm transition-all duration-300 hover:scale-105 cursor-pointer`}>
                  <Link to={`/comanda/${mesa.id}`}>
                    <CardHeader className="text-center pb-2">
                      <CardTitle className="text-3xl font-bold">
                        Mesa {mesa.numero}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="mb-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          mesa.status === 'livre' ? 'bg-success text-success-foreground' :
                          mesa.status === 'ocupada' ? 'bg-warning text-warning-foreground' :
                          'bg-destructive text-destructive-foreground'
                        }`}>
                          {getStatusText(mesa.status)}
                        </span>
                      </div>
                      <Button 
                        variant={mesa.status === 'livre' ? 'hero' : 'outline'} 
                        size="sm"
                        className="w-full"
                      >
                        {mesa.status === 'livre' ? 'Abrir Comanda' : 'Ver Comanda'}
                      </Button>
                    </CardContent>
                  </Link>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Mesas;