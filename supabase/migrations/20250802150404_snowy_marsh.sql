/*
  # Configurar subscriptions em tempo real

  1. Changes
    - Enable realtime for all main tables
    - Configure publication for real-time updates

  2. Security
    - Ensure realtime respects RLS policies
*/

-- Enable realtime for all main tables
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE funcionarios_simples;
ALTER PUBLICATION supabase_realtime ADD TABLE categorias;
ALTER PUBLICATION supabase_realtime ADD TABLE produtos;
ALTER PUBLICATION supabase_realtime ADD TABLE mesas;
ALTER PUBLICATION supabase_realtime ADD TABLE comandas;
ALTER PUBLICATION supabase_realtime ADD TABLE comanda_itens;
ALTER PUBLICATION supabase_realtime ADD TABLE insumos;
ALTER PUBLICATION supabase_realtime ADD TABLE entradas_estoque;
ALTER PUBLICATION supabase_realtime ADD TABLE saidas_estoque;
ALTER PUBLICATION supabase_realtime ADD TABLE turnos;
ALTER PUBLICATION supabase_realtime ADD TABLE vendas;
ALTER PUBLICATION supabase_realtime ADD TABLE logs;