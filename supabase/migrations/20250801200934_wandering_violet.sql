/*
  # Fix Missing Database Schema

  This migration creates all missing tables, columns, and relationships that are causing the application errors.

  ## New Tables
  - `profiles` - User profiles for administrators
  - `funcionarios_simples` - Simple employee records
  - `saidas_estoque` - Stock outbound movements
  - `entradas_estoque` - Stock inbound movements

  ## Schema Updates
  - Add missing `user_id` column to `insumos` table
  - Add missing foreign key relationships
  - Enable RLS on all tables
  - Create appropriate policies

  ## Security
  - Enable RLS on all new tables
  - Add policies for authenticated users to manage their own data
*/

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  nome_completo text NOT NULL,
  nome_restaurante text NOT NULL,
  cpf text,
  telefone text,
  tipo text DEFAULT 'admin',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create funcionarios_simples table if it doesn't exist
CREATE TABLE IF NOT EXISTS funcionarios_simples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  nome text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('garcom', 'caixa', 'cozinha', 'estoque')),
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add user_id column to insumos if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'insumos' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE insumos ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
  END IF;
END $$;

-- Rename columns in insumos table to match application expectations
DO $$
BEGIN
  -- Rename quantidade_minima to estoque_minimo if needed
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'insumos' AND column_name = 'quantidade_minima'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'insumos' AND column_name = 'estoque_minimo'
  ) THEN
    ALTER TABLE insumos RENAME COLUMN quantidade_minima TO estoque_minimo;
  END IF;

  -- Add estoque_minimo if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'insumos' AND column_name = 'estoque_minimo'
  ) THEN
    ALTER TABLE insumos ADD COLUMN estoque_minimo numeric DEFAULT 0;
  END IF;

  -- Rename saldo_atual to quantidade_estoque if needed
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'insumos' AND column_name = 'saldo_atual'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'insumos' AND column_name = 'quantidade_estoque'
  ) THEN
    ALTER TABLE insumos RENAME COLUMN saldo_atual TO quantidade_estoque;
  END IF;

  -- Add quantidade_estoque if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'insumos' AND column_name = 'quantidade_estoque'
  ) THEN
    ALTER TABLE insumos ADD COLUMN quantidade_estoque numeric DEFAULT 0;
  END IF;
END $$;

-- Create entradas_estoque table if it doesn't exist
CREATE TABLE IF NOT EXISTS entradas_estoque (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  insumo_id uuid REFERENCES insumos(id) ON DELETE CASCADE,
  quantidade numeric NOT NULL,
  valor_total numeric NOT NULL,
  valor_unitario numeric GENERATED ALWAYS AS (CASE WHEN quantidade > 0 THEN valor_total / quantidade ELSE 0 END) STORED,
  observacoes text,
  data_entrada timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create saidas_estoque table if it doesn't exist
CREATE TABLE IF NOT EXISTS saidas_estoque (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  insumo_id uuid REFERENCES insumos(id) ON DELETE CASCADE,
  quantidade numeric NOT NULL,
  motivo text NOT NULL,
  observacoes text,
  data_saida timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add missing foreign key columns to existing tables if they don't exist
DO $$
BEGIN
  -- Add operador_funcionario_id to turnos if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'turnos' AND column_name = 'operador_funcionario_id'
  ) THEN
    ALTER TABLE turnos ADD COLUMN operador_funcionario_id uuid REFERENCES funcionarios_simples(id);
  END IF;

  -- Add garcom_funcionario_id to comandas if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'comandas' AND column_name = 'garcom_funcionario_id'
  ) THEN
    ALTER TABLE comandas ADD COLUMN garcom_funcionario_id uuid REFERENCES funcionarios_simples(id);
  END IF;

  -- Add produto_id to comanda_itens if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'comanda_itens' AND column_name = 'produto_id'
  ) THEN
    ALTER TABLE comanda_itens ADD COLUMN produto_id uuid REFERENCES produtos(id);
  END IF;

  -- Add comanda_id to vendas if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendas' AND column_name = 'comanda_id'
  ) THEN
    ALTER TABLE vendas ADD COLUMN comanda_id uuid REFERENCES comandas(id);
  END IF;
END $$;

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to tables that need them
DO $$
BEGIN
  -- profiles
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at') THEN
    CREATE TRIGGER update_profiles_updated_at
      BEFORE UPDATE ON profiles
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- funcionarios_simples
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_funcionarios_simples_updated_at') THEN
    CREATE TRIGGER update_funcionarios_simples_updated_at
      BEFORE UPDATE ON funcionarios_simples
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE funcionarios_simples ENABLE ROW LEVEL SECURITY;
ALTER TABLE entradas_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE saidas_estoque ENABLE ROW LEVEL SECURITY;

-- Ensure insumos has RLS enabled
ALTER TABLE insumos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create RLS policies for funcionarios_simples
CREATE POLICY "Users can manage own funcionarios"
  ON funcionarios_simples
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for entradas_estoque
CREATE POLICY "Users can manage own entradas_estoque"
  ON entradas_estoque
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for saidas_estoque
CREATE POLICY "Users can manage own saidas_estoque"
  ON saidas_estoque
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Update insumos RLS policy to use user_id
DROP POLICY IF EXISTS "Users can manage own insumos" ON insumos;
CREATE POLICY "Users can manage own insumos"
  ON insumos
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to automatically update stock on entrada/saida
CREATE OR REPLACE FUNCTION update_insumo_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'entradas_estoque' THEN
    -- Add to stock on entrada
    IF TG_OP = 'INSERT' THEN
      UPDATE insumos 
      SET quantidade_estoque = COALESCE(quantidade_estoque, 0) + NEW.quantidade
      WHERE id = NEW.insumo_id;
    END IF;
  ELSIF TG_TABLE_NAME = 'saidas_estoque' THEN
    -- Subtract from stock on saida
    IF TG_OP = 'INSERT' THEN
      UPDATE insumos 
      SET quantidade_estoque = GREATEST(0, COALESCE(quantidade_estoque, 0) - NEW.quantidade)
      WHERE id = NEW.insumo_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic stock updates
DROP TRIGGER IF EXISTS trigger_update_stock_entrada ON entradas_estoque;
CREATE TRIGGER trigger_update_stock_entrada
  AFTER INSERT ON entradas_estoque
  FOR EACH ROW EXECUTE FUNCTION update_insumo_stock();

DROP TRIGGER IF EXISTS trigger_update_stock_saida ON saidas_estoque;
CREATE TRIGGER trigger_update_stock_saida
  AFTER INSERT ON saidas_estoque
  FOR EACH ROW EXECUTE FUNCTION update_insumo_stock();

-- Insert default data for testing if tables are empty
DO $$
BEGIN
  -- Insert a default profile for the current user if none exists
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()) AND auth.uid() IS NOT NULL THEN
    INSERT INTO profiles (id, email, nome_completo, nome_restaurante, cpf, telefone)
    VALUES (
      auth.uid(),
      COALESCE((SELECT email FROM auth.users WHERE id = auth.uid()), 'admin@example.com'),
      'Administrador',
      'Meu Restaurante',
      '000.000.000-00',
      '(00) 00000-0000'
    );
  END IF;
END $$;