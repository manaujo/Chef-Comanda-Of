/*
  # Criar tabela de turnos de trabalho

  1. New Tables
    - `turnos`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `operador_id` (uuid, references profiles)
      - `operador_funcionario_id` (uuid, references funcionarios_simples, optional)
      - `data_abertura` (timestamp, default now)
      - `data_fechamento` (timestamp, optional)
      - `valor_inicial` (decimal, default 0)
      - `valor_fechamento` (decimal, optional)
      - `total_vendas` (decimal, default 0)
      - `quantidade_vendas` (integer, default 0)
      - `diferenca` (decimal, calculated)
      - `observacoes` (text, optional)
      - `ativo` (boolean, default true)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `turnos` table
    - Add policies for users to manage their own shifts
*/

-- Create turnos table
CREATE TABLE IF NOT EXISTS turnos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  operador_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  operador_funcionario_id uuid REFERENCES funcionarios_simples(id) ON DELETE SET NULL,
  data_abertura timestamptz DEFAULT now(),
  data_fechamento timestamptz,
  valor_inicial decimal(10,2) DEFAULT 0,
  valor_fechamento decimal(10,2),
  total_vendas decimal(10,2) DEFAULT 0,
  quantidade_vendas integer DEFAULT 0,
  diferenca decimal(10,2) GENERATED ALWAYS AS (COALESCE(valor_fechamento, 0) - valor_inicial) STORED,
  observacoes text,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE turnos ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own shifts"
  ON turnos
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own shifts"
  ON turnos
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shifts"
  ON turnos
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own shifts"
  ON turnos
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create constraint to ensure only one active shift per user
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_turno_per_user 
ON turnos (user_id) 
WHERE ativo = true;