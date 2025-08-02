/*
  # Criar tabela de vendas

  1. New Tables
    - `vendas`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `comanda_id` (uuid, references comandas)
      - `turno_id` (uuid, references turnos, optional)
      - `operador_id` (uuid, references profiles)
      - `valor_total` (decimal)
      - `valor_desconto` (decimal, default 0)
      - `valor_final` (decimal)
      - `forma_pagamento` (text)
      - `data_venda` (timestamp, default now)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `vendas` table
    - Add policies for users to manage their own sales
*/

-- Create vendas table
CREATE TABLE IF NOT EXISTS vendas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comanda_id uuid NOT NULL REFERENCES comandas(id) ON DELETE CASCADE,
  turno_id uuid REFERENCES turnos(id) ON DELETE SET NULL,
  operador_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  valor_total decimal(10,2) NOT NULL,
  valor_desconto decimal(10,2) DEFAULT 0,
  valor_final decimal(10,2) NOT NULL,
  forma_pagamento text NOT NULL,
  data_venda timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own sales"
  ON vendas
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sales"
  ON vendas
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sales"
  ON vendas
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sales"
  ON vendas
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to update turno totals when sales are added
CREATE OR REPLACE FUNCTION update_turno_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Update turno totals if turno_id is provided
  IF NEW.turno_id IS NOT NULL THEN
    UPDATE turnos 
    SET 
      total_vendas = (
        SELECT COALESCE(SUM(valor_final), 0)
        FROM vendas 
        WHERE turno_id = NEW.turno_id
      ),
      quantidade_vendas = (
        SELECT COUNT(*)
        FROM vendas 
        WHERE turno_id = NEW.turno_id
      )
    WHERE id = NEW.turno_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update turno totals
DROP TRIGGER IF EXISTS update_turno_totals_trigger ON vendas;
CREATE TRIGGER update_turno_totals_trigger
  AFTER INSERT ON vendas
  FOR EACH ROW
  EXECUTE FUNCTION update_turno_totals();