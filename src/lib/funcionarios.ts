import { supabase } from './supabase';
import type { UserType } from '../types/database';

export interface Funcionario {
  id: string;
  user_id: string;
  nome: string;
  cpf: string;
  senha?: string;
  tipo: UserType;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

// Interface para funcionário local (sem user_id do Supabase Auth)
export interface FuncionarioLocal {
  id: string;
  nome: string;
  cpf: string;
  tipo: UserType;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export const funcionariosService = {
  async getAll() {
    const { data, error } = await supabase
      .from('funcionarios')
      .select('id, nome, cpf, tipo, ativo, created_at, updated_at')
      .order('nome');
    
    if (error) throw error;
    return data as FuncionarioLocal[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('funcionarios')
      .select('id, nome, cpf, tipo, ativo, created_at, updated_at')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as FuncionarioLocal;
  },

  async getByCpf(cpf: string) {
    const { data, error } = await supabase
      .from('funcionarios')
      .select('id, nome, cpf, tipo, ativo, created_at, updated_at')
      .eq('cpf', cpf)
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data as FuncionarioLocal | null;
  },

  async createLocal(funcionarioData: {
    nome: string;
    cpf: string;
    senha: string;
    tipo: UserType;
  }) {
    // Verificar se CPF já existe
    const existingFuncionario = await this.getByCpf(funcionarioData.cpf);
    if (existingFuncionario) {
      throw new Error('CPF já cadastrado');
    }

    // Criar funcionário local (sem Supabase Auth)
    const { data, error } = await supabase
      .from('funcionarios')
      .insert({
        nome: funcionarioData.nome,
        cpf: funcionarioData.cpf,
        senha: funcionarioData.senha, // Em produção, usar hash
        tipo: funcionarioData.tipo,
        ativo: true
      })
      .select('id, nome, cpf, tipo, ativo, created_at, updated_at')
      .single();
    
    if (error) throw error;
    return data as FuncionarioLocal;
  },

  async updateLocal(id: string, updates: Partial<FuncionarioLocal & { senha?: string }>) {
    const { data, error } = await supabase
      .from('funcionarios')
      .update(updates)
      .eq('id', id)
      .select('id, nome, cpf, tipo, ativo, created_at, updated_at')
      .single();
    
    if (error) throw error;
    return data as FuncionarioLocal;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('funcionarios')
      .update({ ativo: false })
      .eq('id', id);
    
    if (error) throw error;
  },

  // Método para login local
  async loginLocal(cpf: string, senha: string): Promise<FuncionarioLocal> {
    const { data, error } = await supabase
      .from('funcionarios')
      .select('id, nome, cpf, tipo, ativo, created_at, updated_at, senha')
      .eq('cpf', cpf)
      .eq('ativo', true)
      .single();

    if (error || !data) {
      throw new Error('CPF ou senha incorretos');
    }

    // Verificar senha (em produção, usar hash)
    if (data.senha !== senha) {
      throw new Error('CPF ou senha incorretos');
    }

    // Retornar dados sem a senha
    const { senha: _, ...funcionarioData } = data;
    return funcionarioData as FuncionarioLocal;
  }
};

// Serviços para funcionários com Supabase Auth (manter compatibilidade)
export const funcionariosAuthService = {
  async create(funcionarioData: {
    nome: string;
    cpf: string;
    senha: string;
    tipo: UserType;
  }) {
    // Verificar se CPF já existe
    const existingFuncionario = await funcionariosService.getByCpf(funcionarioData.cpf);
    if (existingFuncionario) {
      throw new Error('CPF já cadastrado');
    }

    // Criar usuário no Supabase Auth usando CPF como email
    const email = `cpf_${funcionarioData.cpf}@chefcomanda.com`;
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: funcionarioData.senha,
      options: {
        data: {
          nome: funcionarioData.nome,
          cpf: funcionarioData.cpf,
          tipo: funcionarioData.tipo
        }
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Erro ao criar usuário');

    // Criar registro na tabela funcionarios
    const { data, error } = await supabase
      .from('funcionarios')
      .insert({
        user_id: authData.user.id,
        nome: funcionarioData.nome,
        cpf: funcionarioData.cpf,
        tipo: funcionarioData.tipo,
        ativo: true
      })
      .select('id, user_id, nome, cpf, tipo, ativo, created_at, updated_at')
      .single();

    if (error) {
      // Se falhar ao criar funcionário, tentar deletar o usuário criado
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw error;
    }

    return data as Funcionario;
  },

  async getByUserId(userId: string) {
    const { data, error } = await supabase
      .from('funcionarios')
      .select('id, user_id, nome, cpf, tipo, ativo, created_at, updated_at')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data as Funcionario | null;
  },

  async signInWithCpf(cpf: string, password: string) {
    const email = `cpf_${cpf}@chefcomanda.com`;
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  },

  async getCurrentFuncionario(): Promise<Funcionario | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;

      const funcionario = await this.getByUserId(user.id);
      return funcionario;
    } catch (error) {
      console.error('Erro ao buscar funcionário atual:', error);
      return null;
    }
  }
};

// Context para funcionário local logado
export interface FuncionarioLocalContext {
  funcionario: FuncionarioLocal | null;
  login: (cpf: string, senha: string) => Promise<void>;
  logout: () => void;
  isLoggedIn: boolean;
}

// Utilitários para localStorage
export const funcionarioLocalStorage = {
  save(funcionario: FuncionarioLocal) {
    localStorage.setItem('funcionario_local', JSON.stringify(funcionario));
  },

  get(): FuncionarioLocal | null {
    const data = localStorage.getItem('funcionario_local');
    return data ? JSON.parse(data) : null;
  },

  remove() {
    localStorage.removeItem('funcionario_local');
  }
};