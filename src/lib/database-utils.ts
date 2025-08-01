import { supabase } from './supabase';

export const databaseUtils = {
  /**
   * Reseta todos os dados de teste do usuário atual
   * CUIDADO: Esta função remove TODOS os dados do usuário
   */
  async resetAllUserData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    try {
      console.log('🧹 Iniciando limpeza dos dados...');

      // 1. Remover itens de comanda
      const { error: itemsError } = await supabase
        .from('comanda_itens')
        .delete()
        .eq('user_id', user.id);
      
      if (itemsError) throw itemsError;
      console.log('✅ Itens de comanda removidos');

      // 2. Remover vendas
      const { error: vendasError } = await supabase
        .from('vendas')
        .delete()
        .eq('user_id', user.id);
      
      if (vendasError) throw vendasError;
      console.log('✅ Vendas removidas');

      // 3. Remover comandas
      const { error: comandasError } = await supabase
        .from('comandas')
        .delete()
        .eq('user_id', user.id);
      
      if (comandasError) throw comandasError;
      console.log('✅ Comandas removidas');

      // 4. Fechar turnos ativos
      const { error: turnosError } = await supabase
        .from('turnos')
        .update({ 
          ativo: false, 
          data_fechamento: new Date().toISOString() 
        })
        .eq('user_id', user.id)
        .eq('ativo', true);
      
      if (turnosError) throw turnosError;
      console.log('✅ Turnos fechados');

      // 5. Resetar status das mesas
      const { error: mesasError } = await supabase
        .from('mesas')
        .update({ 
          status: 'livre', 
          comanda_id: null 
        })
        .eq('user_id', user.id);
      
      if (mesasError) throw mesasError;
      console.log('✅ Mesas resetadas');

      console.log('🎉 Limpeza concluída com sucesso!');
      return true;
    } catch (error) {
      console.error('❌ Erro na limpeza:', error);
      throw error;
    }
  },

  /**
   * Cria dados de teste básicos para o usuário
   */
  async createTestData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    try {
      console.log('🏗️ Criando dados de teste...');

      // 1. Verificar se já existem mesas
      const { data: existingMesas } = await supabase
        .from('mesas')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (!existingMesas || existingMesas.length === 0) {
        // Criar mesas de exemplo
        const { error: mesasError } = await supabase
          .from('mesas')
          .insert([
            { numero: 1, nome: 'Mesa 01', capacidade: 4, status: 'livre' },
            { numero: 2, nome: 'Mesa 02', capacidade: 4, status: 'livre' },
            { numero: 3, nome: 'Mesa 03', capacidade: 2, status: 'livre' },
            { numero: 4, nome: 'Mesa 04', capacidade: 6, status: 'livre' },
            { numero: 5, nome: 'Mesa 05', capacidade: 4, status: 'livre' }
          ]);

        if (mesasError) throw mesasError;
        console.log('✅ Mesas de teste criadas');
      }

      // 2. Verificar se já existem categorias
      const { data: existingCategorias } = await supabase
        .from('categorias')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (!existingCategorias || existingCategorias.length === 0) {
        // Criar categorias de exemplo
        const { error: categoriasError } = await supabase
          .from('categorias')
          .insert([
            { nome: 'Pratos Principais', descricao: 'Pratos principais do cardápio', cor: '#dc2626' },
            { nome: 'Bebidas', descricao: 'Bebidas em geral', cor: '#2563eb' },
            { nome: 'Sobremesas', descricao: 'Doces e sobremesas', cor: '#7c3aed' },
            { nome: 'Petiscos', descricao: 'Aperitivos e petiscos', cor: '#ea580c' }
          ]);

        if (categoriasError) throw categoriasError;
        console.log('✅ Categorias de teste criadas');
      }

      // 3. Verificar se já existem funcionários
      const { data: existingFuncionarios } = await supabase
        .from('funcionarios_simples')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (!existingFuncionarios || existingFuncionarios.length === 0) {
        // Criar funcionários de exemplo
        const { error: funcionariosError } = await supabase
          .from('funcionarios_simples')
          .insert([
            { nome: 'João Silva', tipo: 'garcom' },
            { nome: 'Maria Santos', tipo: 'garcom' },
            { nome: 'Pedro Costa', tipo: 'caixa' },
            { nome: 'Ana Oliveira', tipo: 'caixa' },
            { nome: 'Carlos Lima', tipo: 'cozinha' }
          ]);

        if (funcionariosError) throw funcionariosError;
        console.log('✅ Funcionários de teste criados');
      }

      console.log('🎉 Dados de teste criados com sucesso!');
      return true;
    } catch (error) {
      console.error('❌ Erro ao criar dados de teste:', error);
      throw error;
    }
  },

  /**
   * Verifica a integridade dos dados do usuário
   */
  async checkDataIntegrity() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const results = {
        mesas: 0,
        comandas: 0,
        comandasProntas: 0,
        vendas: 0,
        turnosAtivos: 0,
        funcionarios: 0
      };

      // Contar mesas
      const { count: mesasCount } = await supabase
        .from('mesas')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      results.mesas = mesasCount || 0;

      // Contar comandas
      const { count: comandasCount } = await supabase
        .from('comandas')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      results.comandas = comandasCount || 0;

      // Contar comandas prontas para PDV
      const { count: comandasProntasCount } = await supabase
        .from('comandas')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('status', ['pronto_para_fechamento', 'pronta'])
        .gt('valor_total', 0);
      results.comandasProntas = comandasProntasCount || 0;

      // Contar vendas
      const { count: vendasCount } = await supabase
        .from('vendas')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      results.vendas = vendasCount || 0;

      // Contar turnos ativos
      const { count: turnosCount } = await supabase
        .from('turnos')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('ativo', true);
      results.turnosAtivos = turnosCount || 0;

      // Contar funcionários
      const { count: funcionariosCount } = await supabase
        .from('funcionarios_simples')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      results.funcionarios = funcionariosCount || 0;

      console.log('📊 Integridade dos dados:', results);
      return results;
    } catch (error) {
      console.error('❌ Erro ao verificar integridade:', error);
      throw error;
    }
  }
};