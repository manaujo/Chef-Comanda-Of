/*
  # Criar tabela de relacionamento produto-insumos

  1. New Tables
    - `produto_insumos`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `produto_id` (uuid, references produtos)
      - `insumo_id` (uuid, references insumos)
      - `quantidade_usada` (decimal)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `produto_insumos` table
    - Add policies for users to manage their own product-ingredient relationships
*/

-- Create produto_insumos table
CREATE TABLE IF NOT EXISTS produto_insumos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  produto_id uuid NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  insumo_id uuid NOT NULL REFERENCES insumos(id) ON DELETE CASCADE,
  quantidade_usada decimal(10,3) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(produto_id, insumo_id)
);

-- Enable RLS
ALTER TABLE produto_insumos ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own product ingredients"
  ON produto_insumos
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own product ingredients"
  ON produto_insumos
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own product ingredients"
  ON produto_insumos
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own product ingredients"
  ON produto_insumos
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);