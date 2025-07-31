import { supabase } from './supabase';
import { funcionariosService } from './funcionarios';
import { funcionariosSimplesService } from './funcionarios-simples';
import { insumosEstoqueService } from './estoque';
import type { 
  Profile, 
  Mesa, 
  Produto, 
  Categoria, 
  Comanda, 
  ComandaItem, 
  Insumo,
  ProdutoInsumo,
  Turno,
  Venda,
  Log,
  UserType,
  MesaStatus,
  ComandaStatus,
  ItemStatus,
  CategoriaProduto
} from '../types/database';
import type { FuncionarioSimples } from './funcionarios-simples';

// Profiles
export const profilesService = {
  async getAll() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('nome_completo');
    
    if (error) throw error;
    return data as Profile[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Profile;
  },

  async create(profile: Partial<Profile>) {
    const { data, error } = await supabase
      .from('profiles')
      .insert(profile)
      .select()
      .single();
    
    if (error) throw error;
    return data as Profile;
  },

  async update(id: string, updates: Partial<Profile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Profile;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Categorias
export const categoriasService = {
  async getAll() {
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .eq('ativo', true)
      .order('nome');
    
    if (error) throw error;
    return data as Categoria[];
  },

  async create(categoria: Omit<Categoria, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('categorias')
      .insert(categoria)
      .select()
      .single();
    
    if (error) throw error;
    return data as Categoria;
  },

  async update(id: string, updates: Partial<Categoria>) {
    const { data, error } = await supabase
      .from('categorias')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Categoria;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('categorias')
      .update({ ativo: false })
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Produtos
export const produtosService = {
  async getAll() {
    const { data, error } = await supabase
      .from('produtos')
      .select(`
        *,
        categoria:categorias(*)
      `)
      .eq('ativo', true)
      .order('nome');
    
    if (error) throw error;
    return data as Produto[];
  },

  async getByCategoria() {
    const { data, error } = await supabase
      .from('produtos')
      .select(`
        *,
        categoria:categorias(*)
      `)
      .eq('ativo', true)
      .order('nome');
    
    if (error) throw error;
    return data as Produto[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('produtos')
      .select(`
        *,
        categoria:categorias(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Produto;
  },

  async create(produto: Omit<Produto, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('produtos')
      .insert(produto)
      .select(`
        *,
        categoria:categorias(*)
      `)
      .single();
    
    if (error) throw error;
    return data as Produto;
  },

  async update(id: string, updates: Partial<Produto>) {
    const { data, error } = await supabase
      .from('produtos')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        categoria:categorias(*)
      `)
      .single();
    
    if (error) throw error;
    return data as Produto;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('produtos')
      .update({ ativo: false })
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Mesas
export const mesasService = {
  async getAll() {
    const { data, error } = await supabase
      .from('mesas')
      .select('*')
      .eq('ativo', true)
      .order('numero');
    
    if (error) throw error;
    return data as Mesa[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('mesas')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Mesa;
  },

  async create(mesa: Omit<Mesa, 'id' | 'created_at' | 'updated_at' | 'qr_code'>) {
    const { data, error } = await supabase
      .from('mesas')
      .insert(mesa)
      .select()
      .single();
    
    if (error) throw error;
    return data as Mesa;
  },

  async update(id: string, updates: Partial<Mesa>) {
    const { data, error } = await supabase
      .from('mesas')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Mesa;
  },

  async updateStatus(id: string, status: MesaStatus) {
    const { data, error } = await supabase
      .from('mesas')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Mesa;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('mesas')
      .update({ ativo: false })
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Comandas
export const comandasService = {
  async getAll() {
    const { data, error } = await supabase
      .from('comandas')
      .select(`
        *,
        mesa:mesas!comandas_mesa_id_fkey(*),
        garcom:profiles(*),
        garcom_funcionario:funcionarios_simples(*),
        itens:comanda_itens(
          *,
          produto:produtos(*)
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Comanda[];
  },

  async getAbertas() {
    const { data, error } = await supabase
      .from('comandas')
      .select(`
        *,
        mesa:mesas!comandas_mesa_id_fkey(*),
        garcom:profiles(*),
        garcom_funcionario:funcionarios_simples(*),
        itens:comanda_itens(
          *,
          produto:produtos(*)
        )
      `)
      .eq('status', 'aberta')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Comanda[];
  },

  async getByMesa(mesaId: string) {
    const { data, error } = await supabase
      .from('comandas')
      .select(`
        *,
        mesa:mesas!comandas_mesa_id_fkey(*),
        garcom:profiles(*),
        garcom_funcionario:funcionarios_simples(*),
        itens:comanda_itens(
          *,
          produto:produtos(*)
        )
      `)
      .eq('mesa_id', mesaId)
      .in('status', ['aberta', 'em_preparo', 'pronto_para_fechamento'])
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Comanda[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('comandas')
      .select(`
        *,
        mesa:mesas!comandas_mesa_id_fkey(*),
        garcom:profiles(*),
        garcom_funcionario:funcionarios_simples(*),
        itens:comanda_itens(
          *,
          produto:produtos(*)
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Comanda;
  },

  async create(comanda: Omit<Comanda, 'id' | 'numero' | 'created_at' | 'updated_at' | 'valor_total'>) {
    const { data, error } = await supabase
      .from('comandas')
      .insert({
        ...comanda
      })
      .select(`
        *,
        mesa:mesas!comandas_mesa_id_fkey(*),
        garcom:profiles(*),
        garcom_funcionario:funcionarios_simples(*)
      `)
      .single();
    
    if (error) throw error;
    return data as Comanda;
  },

  async update(id: string, updates: Partial<Comanda>) {
    const { data, error } = await supabase
      .from('comandas')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        mesa:mesas!comandas_mesa_id_fkey(*),
        garcom:profiles(*),
        garcom_funcionario:funcionarios_simples(*)
      `)
      .single();
    
    if (error) throw error;
    return data as Comanda;
  },

  async fechar(id: string) {
    const { data, error } = await supabase
      .from('comandas')
      .update({ 
        status: 'fechada' as ComandaStatus,
        data_fechamento: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Comanda;
  }
};

// Itens da Comanda
export const comandaItensService = {
  async create(item: Omit<ComandaItem, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('comanda_itens')
      .insert(item)
      .select(`
        *,
        produto:produtos(*)
      `)
      .single();
    
    if (error) throw error;
    return data as ComandaItem;
  },

  async updateStatus(id: string, status: ItemStatus) {
    const { data, error } = await supabase
      .from('comanda_itens')
      .update({ status })
      .eq('id', id)
      .select(`
        *,
        produto:produtos(*)
      `)
      .single();
    
    if (error) throw error;
    return data as ComandaItem;
  },

  async cancelar(id: string, cancelado_por: string, motivo: string) {
    const { data, error } = await supabase
      .from('comanda_itens')
      .update({ 
        status: 'cancelado' as ItemStatus,
        cancelado_por,
        motivo_cancelamento: motivo
      })
      .eq('id', id)
      .select(`
        *,
        produto:produtos(*)
      `)
      .single();
    
    if (error) throw error;
    return data as ComandaItem;
  },

  async getByComanda(comandaId: string) {
    const { data, error } = await supabase
      .from('comanda_itens')
      .select(`
        *,
        produto:produtos(*)
      `)
      .eq('comanda_id', comandaId)
      .order('created_at');
    
    if (error) throw error;
    return data as ComandaItem[];
  },

  async getByCozinha() {
    const { data, error } = await supabase
      .from('comanda_itens')
      .select(`
        *,
        produto:produtos(*),
        comanda:comandas(
          *,
          mesa:mesas!comandas_mesa_id_fkey(*),
          garcom:profiles(*),
          garcom_funcionario:funcionarios_simples(*)
        )
      `)
      .eq('enviado_cozinha', true)
      .in('status', ['aguardando', 'preparando', 'pronto'])
      .order('created_at');
    
    if (error) throw error;
    return data as ComandaItem[];
  },

  async enviarParaCozinha(id: string) {
    const { data, error } = await supabase
      .from('comanda_itens')
      .update({ 
        enviado_cozinha: true,
        status: 'aguardando'
      })
      .eq('id', id)
      .select(`
        *,
        produto:produtos(*)
      `)
      .single();
    
    if (error) throw error;
    return data as ComandaItem;
  }
};

// Comandas prontas para fechamento (PDV)
export const pdvService = {
  async getComandasProntasParaFechamento() {
    const { data, error } = await supabase
      .from('comandas')
      .select(`
        *,
        mesa:mesas!comandas_mesa_id_fkey(*),
        garcom:profiles(*),
        garcom_funcionario:funcionarios_simples(*),
        itens:comanda_itens(
          *,
          produto:produtos(*)
        )
      `)
      .in('status', ['pronto_para_fechamento', 'fechada'])
      .order('created_at');
    
    if (error) throw error;
    return data as Comanda[];
  }
};

// Insumos
export const insumosService = {
  async getAll() {
    const { data, error } = await supabase
      .from('insumos')
      .select('*')
      .eq('ativo', true)
      .order('nome');
    
    if (error) throw error;
    return data as Insumo[];
  },

  async getEstoqueBaixo() {
    const { data, error } = await supabase
      .from('insumos')
      .select('*')
      .eq('ativo', true)
      .filter('quantidade_estoque', 'lte', 'estoque_minimo')
      .order('nome');
    
    if (error) throw error;
    return data as Insumo[];
  },

  async create(insumo: Omit<Insumo, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('insumos')
      .insert(insumo)
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

// Turnos
export const turnosService = {
  async getTurnoAtivo() {
    const { data, error } = await supabase
      .from('turnos')
      .select(`
        *,
        operador:profiles(*),
        operador_funcionario:funcionarios_simples(*)
      `)
      .eq('ativo', true)
      .is('data_fechamento', null)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data as Turno | null;
  },

  async abrir(operador_id: string, valor_inicial: number) {
    const { data, error } = await supabase
      .from('turnos')
      .insert({
        operador_id,
        valor_inicial,
        ativo: true
      })
      .select(`
        *,
        operador:profiles(*)
      `)
      .single();
    
    if (error) throw error;
    return data as Turno;
  },

  async abrirComFuncionario(operador_id: string, operador_funcionario_id: string, valor_inicial: number) {
    const { data, error } = await supabase
      .from('turnos')
      .insert({
        operador_id,
        operador_funcionario_id,
        valor_inicial,
        ativo: true
      })
      .select(`
        *,
        operador:profiles(*),
        operador_funcionario:funcionarios_simples(*)
      `)
      .single();
    
    if (error) throw error;
    return data as Turno;
  },

  async fechar(id: string, valor_fechamento: number, observacoes?: string) {
    const { data, error } = await supabase
      .from('turnos')
      .update({
        data_fechamento: new Date().toISOString(),
        valor_fechamento,
        observacoes,
        ativo: false
      })
      .eq('id', id)
      .select(`
        *,
        operador:profiles(*),
        operador_funcionario:funcionarios_simples(*)
      `)
      .single();
    
    if (error) throw error;
    return data as Turno;
  }
};

// Vendas
export const vendasService = {
  async create(venda: Omit<Venda, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('vendas')
      .insert(venda)
      .select(`
        *,
        comanda:comandas(*),
        turno:turnos(*),
        operador:profiles(*)
      `)
      .single();
    
    if (error) throw error;
    return data as Venda;
  },

  async getByPeriodo(dataInicio: string, dataFim: string) {
    const { data, error } = await supabase
      .from('vendas')
      .select(`
        *,
        comanda:comandas(*),
        operador:profiles(*)
      `)
      .gte('data_venda', dataInicio)
      .lte('data_venda', dataFim)
      .order('data_venda', { ascending: false });
    
    if (error) throw error;
    return data as Venda[];
  }
};

// Logs
export const logsService = {
  async create(log: Omit<Log, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('logs')
      .insert(log)
      .select()
      .single();
    
    if (error) throw error;
    return data as Log;
  },

  async getRecentes(limit = 50) {
    const { data, error } = await supabase
      .from('logs')
      .select(`
        *,
        usuario:profiles(*)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data as Log[];
  }
};

// Realtime subscriptions
export const subscribeToTable = (
  table: string,
  callback: (payload: any) => void,
  filter?: string
) => {
  let subscription = supabase
    .channel(`${table}_changes`)
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table,
        filter 
      }, 
      callback
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
};