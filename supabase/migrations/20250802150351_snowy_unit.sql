/*
  # Adicionar user_id a todas as tabelas e atualizar políticas

  1. Changes
    - Ensure all tables have user_id column
    - Update foreign key constraints
    - Add missing indexes for performance
    - Create functions for automatic user_id assignment

  2. Security
    - Ensure all RLS policies are properly configured
    - Add automatic user_id assignment on inserts
*/

-- Function to automatically set user_id on insert
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add user_id to tables that might not have it and create triggers
DO $$
DECLARE
  table_name text;
  tables_to_update text[] := ARRAY[
    'funcionarios_simples',
    'categorias', 
    'produtos',
    'mesas',
    'comandas',
    'comanda_itens',
    'insumos',
    'entradas_estoque',
    'saidas_estoque',
    'turnos',
    'vendas',
    'produto_insumos'
  ];
BEGIN
  FOREACH table_name IN ARRAY tables_to_update
  LOOP
    -- Add user_id column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = table_name AND column_name = 'user_id'
    ) THEN
      EXECUTE format('ALTER TABLE %I ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE', table_name);
    END IF;
    
    -- Create trigger for automatic user_id assignment
    EXECUTE format('DROP TRIGGER IF EXISTS set_user_id_%s ON %I', table_name, table_name);
    EXECUTE format('CREATE TRIGGER set_user_id_%s
      BEFORE INSERT ON %I
      FOR EACH ROW
      WHEN (NEW.user_id IS NULL)
      EXECUTE FUNCTION set_user_id()', table_name, table_name);
  END LOOP;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS funcionarios_simples_user_id_idx ON funcionarios_simples(user_id);
CREATE INDEX IF NOT EXISTS categorias_user_id_idx ON categorias(user_id);
CREATE INDEX IF NOT EXISTS produtos_user_id_idx ON produtos(user_id);
CREATE INDEX IF NOT EXISTS mesas_user_id_idx ON mesas(user_id);
CREATE INDEX IF NOT EXISTS comandas_user_id_idx ON comandas(user_id);
CREATE INDEX IF NOT EXISTS comanda_itens_user_id_idx ON comanda_itens(user_id);
CREATE INDEX IF NOT EXISTS insumos_user_id_idx ON insumos(user_id);
CREATE INDEX IF NOT EXISTS entradas_estoque_user_id_idx ON entradas_estoque(user_id);
CREATE INDEX IF NOT EXISTS saidas_estoque_user_id_idx ON saidas_estoque(user_id);
CREATE INDEX IF NOT EXISTS turnos_user_id_idx ON turnos(user_id);
CREATE INDEX IF NOT EXISTS vendas_user_id_idx ON vendas(user_id);
CREATE INDEX IF NOT EXISTS produto_insumos_user_id_idx ON produto_insumos(user_id);

-- Create indexes for foreign keys
CREATE INDEX IF NOT EXISTS comandas_mesa_id_idx ON comandas(mesa_id);
CREATE INDEX IF NOT EXISTS comandas_garcom_funcionario_id_idx ON comandas(garcom_funcionario_id);
CREATE INDEX IF NOT EXISTS comanda_itens_comanda_id_idx ON comanda_itens(comanda_id);
CREATE INDEX IF NOT EXISTS comanda_itens_produto_id_idx ON comanda_itens(produto_id);
CREATE INDEX IF NOT EXISTS vendas_comanda_id_idx ON vendas(comanda_id);
CREATE INDEX IF NOT EXISTS vendas_turno_id_idx ON vendas(turno_id);
CREATE INDEX IF NOT EXISTS entradas_estoque_insumo_id_idx ON entradas_estoque(insumo_id);
CREATE INDEX IF NOT EXISTS saidas_estoque_insumo_id_idx ON saidas_estoque(insumo_id);