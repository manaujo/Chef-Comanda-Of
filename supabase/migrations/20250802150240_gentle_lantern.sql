/*
  # Criar tabela de itens da comanda

  1. New Tables
    - `comanda_itens`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `comanda_id` (uuid, references comandas)
      - `produto_id` (uuid, references produtos)
      - `quantidade` (integer, default 1)
      - `preco_unitario` (decimal)
      - `status` (enum: pendente, recebido, em_preparo, pronto, entregue, cancelado, enviado, preparando, aguardando)
      - `enviado_cozinha` (boolean, default false)
      - `observacoes` (text, optional)
      - `cancelado_por` (uuid, references profiles, optional)
      - `motivo_cancelamento` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `comanda_itens` table
    - Add policies for users to manage their own order items
*/

-- Create enum for item status
DO $$ BEGIN
  CREATE TYPE item_status AS ENUM ('pendente', 'recebido', 'em_preparo', 'pronto', 'entregue', 'cancelado', 'enviado', 'preparando', 'aguardando');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create comanda_itens table
CREATE TABLE IF NOT EXISTS comanda_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comanda_id uuid NOT NULL REFERENCES comandas(id) ON DELETE CASCADE,
  produto_id uuid NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  quantidade integer DEFAULT 1,
  preco_unitario decimal(10,2) NOT NULL,
  status item_status DEFAULT 'pendente',
  enviado_cozinha boolean DEFAULT false,
  observacoes text,
  cancelado_por uuid REFERENCES profiles(id) ON DELETE SET NULL,
  motivo_cancelamento text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE comanda_itens ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own order items"
  ON comanda_itens
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own order items"
  ON comanda_itens
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own order items"
  ON comanda_itens
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own order items"
  ON comanda_itens
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_comanda_itens_updated_at ON comanda_itens;
CREATE TRIGGER update_comanda_itens_updated_at
  BEFORE UPDATE ON comanda_itens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to update comanda total when items change
CREATE OR REPLACE FUNCTION update_comanda_total()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the total for the affected comanda
  UPDATE comandas 
  SET valor_total = (
    SELECT COALESCE(SUM(quantidade * preco_unitario), 0)
    FROM comanda_itens 
    WHERE comanda_id = COALESCE(NEW.comanda_id, OLD.comanda_id)
    AND status != 'cancelado'
  )
  WHERE id = COALESCE(NEW.comanda_id, OLD.comanda_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update comanda total
DROP TRIGGER IF EXISTS update_comanda_total_on_insert ON comanda_itens;
CREATE TRIGGER update_comanda_total_on_insert
  AFTER INSERT ON comanda_itens
  FOR EACH ROW
  EXECUTE FUNCTION update_comanda_total();

DROP TRIGGER IF EXISTS update_comanda_total_on_update ON comanda_itens;
CREATE TRIGGER update_comanda_total_on_update
  AFTER UPDATE ON comanda_itens
  FOR EACH ROW
  EXECUTE FUNCTION update_comanda_total();

DROP TRIGGER IF EXISTS update_comanda_total_on_delete ON comanda_itens;
CREATE TRIGGER update_comanda_total_on_delete
  AFTER DELETE ON comanda_itens
  FOR EACH ROW
  EXECUTE FUNCTION update_comanda_total();