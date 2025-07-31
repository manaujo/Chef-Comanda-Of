import { supabase } from './supabase';

export interface Insumo {
  id: string;
  nome: string;
  unidade: string;
  quantidade_minima: number;
  saldo_atual: number;
  preco_unitario: number;
  fornecedor?: string;
  ativo: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface EntradaEstoque {
  id: string;
  insumo_id: string;
  quantidade: number;
  valor_total: number;
  valor_unitario: number;
  observacoes?: string;
  data_entrada: string;
  user_id: string;
  created_at: string;
  insumo?: Insumo;
}

export interface SaidaEstoque {
  id: string;
  insumo_id: string;
  quantidade: number;
  motivo: string;
  observacoes?: string;
  data_saida: string;
  user_id: string;
  created_at: string;
  insumo?: Insumo;
}

export interface ProdutoInsumo {
  id: string;
  produto_id: string;
  insumo_id: string;
  quantidade_usada: number;
  user_id: string;
  created_at: string;
  insumo?: Insumo;
}

export interface HistoricoTurno {
  id: string;
  turno_id: string;
  operador_id?: string;
  operador_funcionario_id?: string;
  data_abertura: string;
  data_fechamento?: string;
  valor_inicial: number;
  valor_fechamento?: number;
  total_vendas: number;
  quantidade_vendas: number;
  diferenca?: number;
  observacoes?: string;
  user_id: string;
  created_at: string;
  operador?: any;
  operador_funcionario?: any;
}

// Serviços para Insumos
export const insumosEstoqueService = {
  async getAll() {
    const { data, error } = await supabase
      .from('insumos')
      .select('*')
      .eq('ativo', true)
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .order('nome');
    
    if (error) throw error;
    return data as Insumo[];
  },

  async getEstoqueBaixo() {
    const { data, error } = await supabase
      .from('insumos')
      .select('*')
      .eq('ativo', true)
      .filter('saldo_atual', 'lt', 'quantidade_minima')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .order('nome');
    
    if (error) throw error;
    return data as Insumo[];
  },

  async create(insumo: Omit<Insumo, 'id' | 'created_at' | 'updated_at'>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('insumos')
      .insert({ ...insumo, user_id: user.id })
      .select()
      .single();
    
    if (error) throw error;
    return data as Insumo;
  },

  async update(id: string, updates: Partial<Insumo>) {
    const { data, error } = await supabase
      .from('insumos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Insumo;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('insumos')
      .update({ ativo: false })
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Serviços para Entradas de Estoque
export const entradasEstoqueService = {
  async getAll() {
    const { data, error } = await supabase
      .from('entradas_estoque')
      .select('*')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .order('data_entrada', { ascending: false });
    
    if (error) throw error;
    return data as EntradaEstoque[];
  },

  async getByPeriodo(dataInicio: string, dataFim: string) {
    const { data, error } = await supabase
      .from('entradas_estoque')
      .select('*')
      .gte('data_entrada', dataInicio)
      .lte('data_entrada', dataFim)
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .order('data_entrada', { ascending: false });
    
    if (error) throw error;
    return data as EntradaEstoque[];
  },

  async create(entrada: Omit<EntradaEstoque, 'id' | 'valor_unitario' | 'created_at'>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('entradas_estoque')
      .insert({ ...entrada, user_id: user.id })
      .select('*')
      .single();
    
    if (error) throw error;
    return data as EntradaEstoque;
  }
};

// Serviços para Saídas de Estoque
export const saidasEstoqueService = {
  async getAll() {
    const { data, error } = await supabase
      .from('saidas_estoque')
      .select('*')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .order('data_saida', { ascending: false });
    
    if (error) throw error;
    return data as SaidaEstoque[];
  },

  async getByPeriodo(dataInicio: string, dataFim: string) {
    const { data, error } = await supabase
      .from('saidas_estoque')
      .select('*')
      .gte('data_saida', dataInicio)
      .lte('data_saida', dataFim)
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .order('data_saida', { ascending: false });
    
    if (error) throw error;
    return data as SaidaEstoque[];
  },

  async create(saida: Omit<SaidaEstoque, 'id' | 'created_at'>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('saidas_estoque')
      .insert({ ...saida, user_id: user.id })
      .select('*')
      .single()
    
    if (error) throw error;
    return data as SaidaEstoque;
  }
};

// Serviços para Produto-Insumos
export const produtoInsumosService = {
  async getByProduto(produtoId: string) {
    const { data, error } = await supabase
      .from('produto_insumos')
      .select('*')
      .eq('produto_id', produtoId)
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id);
    
    if (error) throw error;
    return data as ProdutoInsumo[];
  },

  async create(produtoInsumo: Omit<ProdutoInsumo, 'id' | 'created_at'>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('produto_insumos')
      .insert({ ...produtoInsumo, user_id: user.id })
      .select('*')
      .single();
    
    if (error) throw error;
    return data as ProdutoInsumo;
  },

  async update(id: string, updates: Partial<ProdutoInsumo>) {
    const { data, error } = await supabase
      .from('produto_insumos')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();
    
    if (error) throw error;
    return data as ProdutoInsumo;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('produto_insumos')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Serviços para Histórico de Turnos
export const historicoTurnosService = {
  async getAll() {
    const { data, error } = await supabase
      .from('turnos')
      .select('*')
      .eq('ativo', false)
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .order('data_abertura', { ascending: false });
    
    if (error) throw error;
    return data as HistoricoTurno[];
  },

  async getByPeriodo(dataInicio: string, dataFim: string) {
    const { data, error } = await supabase
      .from('turnos')
      .select('*')
      .eq('ativo', false)
      .gte('data_abertura', dataInicio)
      .lte('data_abertura', dataFim)
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .order('data_abertura', { ascending: false });
    
    if (error) throw error;
    return data as HistoricoTurno[];
  }
};