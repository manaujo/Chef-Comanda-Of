import { useState, useEffect, createContext, useContext } from 'react';
import { funcionariosService, type FuncionarioLocal, funcionarioLocalStorage } from '@/lib/funcionarios';
import { useToast } from '@/hooks/use-toast';

interface FuncionarioLocalContextType {
  funcionario: FuncionarioLocal | null;
  login: (cpf: string, senha: string) => Promise<void>;
  logout: () => void;
  isLoggedIn: boolean;
  isLoading: boolean;
}

const FuncionarioLocalContext = createContext<FuncionarioLocalContextType | null>(null);

export const useFuncionarioLocal = () => {
  const context = useContext(FuncionarioLocalContext);
  if (!context) {
    throw new Error('useFuncionarioLocal deve ser usado dentro de FuncionarioLocalProvider');
  }
  return context;
};

export const useFuncionarioLocalHook = () => {
  const [funcionario, setFuncionario] = useState<FuncionarioLocal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Carregar funcionário do localStorage ao inicializar
    const savedFuncionario = funcionarioLocalStorage.get();
    if (savedFuncionario) {
      setFuncionario(savedFuncionario);
    }
    setIsLoading(false);
  }, []);

  const login = async (cpf: string, senha: string) => {
    try {
      setIsLoading(true);
      const funcionarioData = await funcionariosService.loginLocal(cpf, senha);
      
      setFuncionario(funcionarioData);
      funcionarioLocalStorage.save(funcionarioData);
      
      toast({
        title: "Login realizado",
        description: `Bem-vindo, ${funcionarioData.nome}!`,
      });
    } catch (error: any) {
      console.error('Erro no login local:', error);
      toast({
        title: "Erro no login",
        description: error.message || "CPF ou senha incorretos",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setFuncionario(null);
    funcionarioLocalStorage.remove();
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso.",
    });
  };

  return {
    funcionario,
    login,
    logout,
    isLoggedIn: !!funcionario,
    isLoading
  };
};

export { FuncionarioLocalContext };