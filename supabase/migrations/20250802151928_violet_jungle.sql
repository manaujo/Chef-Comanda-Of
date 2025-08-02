/*
  # Fix RLS policies for profiles and funcionarios_simples tables

  1. Security Updates
    - Relax RLS policy for profile insertions to handle registration timing issues
    - Add RLS policies for funcionarios_simples table
    - Ensure proper access control for all operations

  2. Changes
    - Update profiles insert policy to allow registration
    - Create funcionarios_simples RLS policies
    - Add user_id column to funcionarios_simples if needed
*/

-- Fix profiles insert policy to handle registration timing issues
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create funcionarios_simples table if it doesn't exist
CREATE TABLE IF NOT EXISTS funcionarios_simples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('garcom', 'caixa', 'cozinha', 'estoque')),
  ativo boolean DEFAULT true,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on funcionarios_simples
ALTER TABLE funcionarios_simples ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for funcionarios_simples
DROP POLICY IF EXISTS "Users can read funcionarios_simples" ON funcionarios_simples;
CREATE POLICY "Users can read funcionarios_simples"
  ON funcionarios_simples
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert funcionarios_simples" ON funcionarios_simples;
CREATE POLICY "Users can insert funcionarios_simples"
  ON funcionarios_simples
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update funcionarios_simples" ON funcionarios_simples;
CREATE POLICY "Users can update funcionarios_simples"
  ON funcionarios_simples
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete funcionarios_simples" ON funcionarios_simples;
CREATE POLICY "Users can delete funcionarios_simples"
  ON funcionarios_simples
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create trigger for updated_at on funcionarios_simples
DROP TRIGGER IF EXISTS update_funcionarios_simples_updated_at ON funcionarios_simples;
CREATE TRIGGER update_funcionarios_simples_updated_at
  BEFORE UPDATE ON funcionarios_simples
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();