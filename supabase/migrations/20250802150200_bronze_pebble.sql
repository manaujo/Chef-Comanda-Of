/*
  # Criar tabela de funcionários simples

  1. New Tables
    - `funcionarios_simples`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `nome` (text)
      - `tipo` (enum: garcom, caixa, cozinha, estoque)
      - `ativo` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `funcionarios_simples` table
    - Add policies for users to manage their own employees
*/

-- Create enum for employee types
DO $$ BEGIN
  CREATE TYPE funcionario_tipo AS ENUM ('garcom', 'caixa', 'cozinha', 'estoque');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create funcionarios_simples table
CREATE TABLE IF NOT EXISTS funcionarios_simples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  tipo funcionario_tipo NOT NULL,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE funcionarios_simples ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own employees"
  ON funcionarios_simples
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own employees"
  ON funcionarios_simples
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own employees"
  ON funcionarios_simples
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own employees"
  ON funcionarios_simples
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_funcionarios_simples_updated_at ON funcionarios_simples;
CREATE TRIGGER update_funcionarios_simples_updated_at
  BEFORE UPDATE ON funcionarios_simples
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();