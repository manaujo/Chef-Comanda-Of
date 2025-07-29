import { supabase } from './supabase';
import type { UserType } from '../types/database';

export interface Funcionario {
  id: string;
  user_id: string;
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
      .select('*')
      .order('nome');
    
    if (error) throw error;
    return data as Funcionario[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('funcionarios')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Funcionario;
  },

  async getByUserId(userId: string) {
    const { data, error } = await supabase
      .from('funcionarios')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data as Funcionario | null;
  },

  async getByCpf(cpf: string) {
    const { data, error } = await supabase
      .from('funcionarios')
      .select('*')
      .eq('cpf', cpf)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data as Funcionario | null;
  },

  async create(funcionarioData: {
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

    // Criar usuário no Supabase Auth usando CPF como email
    const email = `${funcionarioData.cpf}@chefcomanda.com`;
    
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
      .select()
      .single();

    if (error) {
      // Se falhar ao criar funcionário, tentar deletar o usuário criado
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw error;
    }

    return data as Funcionario;
  },

  async update(id: string, updates: Partial<Funcionario>) {
    const { data, error } = await supabase
      .from('funcionarios')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Funcionario;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('funcionarios')
      .update({ ativo: false })
      .eq('id', id);
    
    if (error) throw error;
  }
};

export const authFuncionarios = {
  async signInWithCpf(cpf: string, password: string) {
    const email = `${cpf}@chefcomanda.com`;
    
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

      const funcionario = await funcionariosService.getByUserId(user.id);
      return funcionario;
    } catch (error) {
      console.error('Erro ao buscar funcionário atual:', error);
      return null;
    }
  }
};