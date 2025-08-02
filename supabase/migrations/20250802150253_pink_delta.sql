/*
  # Criar tabela de insumos para controle de estoque

  1. New Tables
    - `insumos`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `nome` (text)
      - `unidade` (enum: kg, g, l, ml, un, cx, pct)
      - `preco_unitario` (decimal, default 0)
      - `quantidade_estoque` (decimal, default 0)
      - `estoque_minimo` (decimal, default 0)
      - `saldo_atual` (decimal, default 0) - for compatibility
      - `quantidade_minima` (decimal, default 0) - for compatibility
      - `fornecedor` (text, optional)
      - `ativo` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `insumos` table
    - Add policies for users to manage their own inventory
*/

-- Create enum for measurement units
DO $$ BEGIN
  CREATE TYPE unidade_medida AS ENUM ('kg', 'g', 'l', 'ml', 'un', 'cx', 'pct');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create insumos table
CREATE TABLE IF NOT EXISTS insumos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  unidade unidade_medida DEFAULT 'kg',
  preco_unitario decimal(10,4) DEFAULT 0,
  quantidade_estoque decimal(10,3) DEFAULT 0,
  estoque_minimo decimal(10,3) DEFAULT 0,
  saldo_atual decimal(10,3) DEFAULT 0,
  quantidade_minima decimal(10,3) DEFAULT 0,
  fornecedor text,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE insumos ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own inventory"
  ON insumos
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own inventory"
  ON insumos
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own inventory"
  ON insumos
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own inventory"
  ON insumos
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_insumos_updated_at ON insumos;
CREATE TRIGGER update_insumos_updated_at
  BEFORE UPDATE ON insumos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to sync saldo_atual with quantidade_estoque
CREATE OR REPLACE FUNCTION sync_insumo_saldo()
RETURNS TRIGGER AS $$
BEGIN
  NEW.saldo_atual = NEW.quantidade_estoque;
  NEW.quantidade_minima = NEW.estoque_minimo;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_insumo_saldo_trigger ON insumos;
CREATE TRIGGER sync_insumo_saldo_trigger
  BEFORE INSERT OR UPDATE ON insumos
  FOR EACH ROW
  EXECUTE FUNCTION sync_insumo_saldo();