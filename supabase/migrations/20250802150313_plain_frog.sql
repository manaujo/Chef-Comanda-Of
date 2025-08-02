/*
  # Criar tabela de saídas de estoque

  1. New Tables
    - `saidas_estoque`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `insumo_id` (uuid, references insumos)
      - `quantidade` (decimal)
      - `motivo` (text)
      - `observacoes` (text, optional)
      - `data_saida` (timestamp, default now)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `saidas_estoque` table
    - Add policies for users to manage their own stock exits
*/

-- Create saidas_estoque table
CREATE TABLE IF NOT EXISTS saidas_estoque (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insumo_id uuid NOT NULL REFERENCES insumos(id) ON DELETE CASCADE,
  quantidade decimal(10,3) NOT NULL,
  motivo text NOT NULL,
  observacoes text,
  data_saida timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE saidas_estoque ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own stock exits"
  ON saidas_estoque
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stock exits"
  ON saidas_estoque
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stock exits"
  ON saidas_estoque
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own stock exits"
  ON saidas_estoque
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to update insumo stock on exit
CREATE OR REPLACE FUNCTION update_insumo_on_saida()
RETURNS TRIGGER AS $$
BEGIN
  -- Update insumo stock
  UPDATE insumos 
  SET 
    quantidade_estoque = GREATEST(0, quantidade_estoque - NEW.quantidade),
    saldo_atual = GREATEST(0, quantidade_estoque - NEW.quantidade)
  WHERE id = NEW.insumo_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update stock on exit
DROP TRIGGER IF EXISTS update_insumo_on_saida_trigger ON saidas_estoque;
CREATE TRIGGER update_insumo_on_saida_trigger
  AFTER INSERT ON saidas_estoque
  FOR EACH ROW
  EXECUTE FUNCTION update_insumo_on_saida();