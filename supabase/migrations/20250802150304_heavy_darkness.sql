/*
  # Criar tabela de entradas de estoque

  1. New Tables
    - `entradas_estoque`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `insumo_id` (uuid, references insumos)
      - `quantidade` (decimal)
      - `valor_total` (decimal)
      - `valor_unitario` (decimal, calculated)
      - `observacoes` (text, optional)
      - `data_entrada` (timestamp, default now)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `entradas_estoque` table
    - Add policies for users to manage their own stock entries
*/

-- Create entradas_estoque table
CREATE TABLE IF NOT EXISTS entradas_estoque (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insumo_id uuid NOT NULL REFERENCES insumos(id) ON DELETE CASCADE,
  quantidade decimal(10,3) NOT NULL,
  valor_total decimal(10,2) NOT NULL,
  valor_unitario decimal(10,4) GENERATED ALWAYS AS (valor_total / quantidade) STORED,
  observacoes text,
  data_entrada timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE entradas_estoque ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own stock entries"
  ON entradas_estoque
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stock entries"
  ON entradas_estoque
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stock entries"
  ON entradas_estoque
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own stock entries"
  ON entradas_estoque
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to update insumo stock on entry
CREATE OR REPLACE FUNCTION update_insumo_on_entrada()
RETURNS TRIGGER AS $$
BEGIN
  -- Update insumo stock and price
  UPDATE insumos 
  SET 
    quantidade_estoque = quantidade_estoque + NEW.quantidade,
    saldo_atual = quantidade_estoque + NEW.quantidade,
    preco_unitario = NEW.valor_unitario
  WHERE id = NEW.insumo_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update stock on entry
DROP TRIGGER IF EXISTS update_insumo_on_entrada_trigger ON entradas_estoque;
CREATE TRIGGER update_insumo_on_entrada_trigger
  AFTER INSERT ON entradas_estoque
  FOR EACH ROW
  EXECUTE FUNCTION update_insumo_on_entrada();