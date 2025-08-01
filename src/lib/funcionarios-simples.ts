import { supabase } from './supabase';

export type FuncionarioTipo = 'garcom' | 'caixa' | 'cozinha' | 'estoque';

export interface FuncionarioSimples {
  id: string;
  nome: string;
  tipo: FuncionarioTipo;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export const funcionariosSimplesService = {
  async getAll() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('funcionarios_simples')
      .select('*')
      .order('nome');
    
    if (error) throw error;
    return data as FuncionarioSimples[];
  },

  async getByTipo(tipo: FuncionarioTipo) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('funcionarios_simples')
      .select('*')
      .eq('tipo', tipo)
      .eq('ativo', true)
      .eq('user_id', user.id)
      .order('nome');
    
    if (error) throw error;
    return data as FuncionarioSimples[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('funcionarios_simples')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as FuncionarioSimples;
  },

  async create(funcionario: Omit<FuncionarioSimples, 'id' | 'created_at' | 'updated_at'>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('funcionarios_simples')
      .insert(funcionario)
      .select()
      .single();
    
    if (error) throw error;
    return data as FuncionarioSimples;
  },

  async update(id: string, updates: Partial<FuncionarioSimples>) {
    const { data, error } = await supabase
      .from('funcionarios_simples')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as FuncionarioSimples;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('funcionarios_simples')
      .update({ ativo: false })
      .eq('id', id);
    
    if (error) throw error;
  }
};