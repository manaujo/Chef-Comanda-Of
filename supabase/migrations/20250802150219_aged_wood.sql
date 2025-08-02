/*
  # Criar tabela de mesas

  1. New Tables
    - `mesas`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `numero` (integer)
      - `nome` (text, optional)
      - `capacidade` (integer, default 4)
      - `status` (enum: livre, ocupada, reservada, manutencao, aguardando_pagamento, fechada)
      - `comanda_id` (uuid, references comandas, optional)
      - `qr_code` (text, optional)
      - `observacoes` (text, optional)
      - `ativo` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `mesas` table
    - Add policies for users to manage their own tables
*/

-- Create enum for table status
DO $$ BEGIN
  CREATE TYPE mesa_status AS ENUM ('livre', 'ocupada', 'reservada', 'manutencao', 'aguardando_pagamento', 'fechada');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create mesas table
CREATE TABLE IF NOT EXISTS mesas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  numero integer NOT NULL,
  nome text,
  capacidade integer DEFAULT 4,
  status mesa_status DEFAULT 'livre',
  comanda_id uuid,
  qr_code text,
  observacoes text,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, numero)
);

-- Enable RLS
ALTER TABLE mesas ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own tables"
  ON mesas
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tables"
  ON mesas
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tables"
  ON mesas
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tables"
  ON mesas
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_mesas_updated_at ON mesas;
CREATE TRIGGER update_mesas_updated_at
  BEFORE UPDATE ON mesas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();