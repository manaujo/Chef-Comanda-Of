/*
  # Criar tabela de comandas

  1. New Tables
    - `comandas`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `numero` (integer, auto-increment per user)
      - `mesa_id` (uuid, references mesas, optional)
      - `garcom_id` (uuid, references profiles, optional)
      - `garcom_funcionario_id` (uuid, references funcionarios_simples, optional)
      - `status` (enum: aberta, fechada, cancelada, em_preparo, pronta, pronto_para_fechamento)
      - `observacoes` (text, optional)
      - `data_abertura` (timestamp, default now)
      - `data_fechamento` (timestamp, optional)
      - `valor_total` (decimal, default 0)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `comandas` table
    - Add policies for users to manage their own orders
*/

-- Create enum for order status
DO $$ BEGIN
  CREATE TYPE comanda_status AS ENUM ('aberta', 'fechada', 'cancelada', 'em_preparo', 'pronta', 'pronto_para_fechamento');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create sequence for comanda numbers per user
CREATE SEQUENCE IF NOT EXISTS comandas_numero_seq;

-- Create comandas table
CREATE TABLE IF NOT EXISTS comandas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  numero integer NOT NULL,
  mesa_id uuid REFERENCES mesas(id) ON DELETE SET NULL,
  garcom_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  garcom_funcionario_id uuid REFERENCES funcionarios_simples(id) ON DELETE SET NULL,
  status comanda_status DEFAULT 'aberta',
  observacoes text,
  data_abertura timestamptz DEFAULT now(),
  data_fechamento timestamptz,
  valor_total decimal(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE comandas ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own orders"
  ON comandas
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders"
  ON comandas
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders"
  ON comandas
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own orders"
  ON comandas
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to auto-generate comanda number per user
CREATE OR REPLACE FUNCTION generate_comanda_numero()
RETURNS TRIGGER AS $$
BEGIN
  SELECT COALESCE(MAX(numero), 0) + 1 INTO NEW.numero
  FROM comandas 
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-generating numero
DROP TRIGGER IF EXISTS generate_comanda_numero_trigger ON comandas;
CREATE TRIGGER generate_comanda_numero_trigger
  BEFORE INSERT ON comandas
  FOR EACH ROW
  WHEN (NEW.numero IS NULL)
  EXECUTE FUNCTION generate_comanda_numero();

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_comandas_updated_at ON comandas;
CREATE TRIGGER update_comandas_updated_at
  BEFORE UPDATE ON comandas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add foreign key constraint for mesa_id after mesas table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'comandas_mesa_id_fkey'
  ) THEN
    ALTER TABLE comandas 
    ADD CONSTRAINT comandas_mesa_id_fkey 
    FOREIGN KEY (mesa_id) REFERENCES mesas(id) ON DELETE SET NULL;
  END IF;
END $$;