/*
  # Criar tabela de perfis de usuários

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, unique)
      - `nome_completo` (text)
      - `nome_restaurante` (text)
      - `cpf` (text)
      - `telefone` (text)
      - `tipo` (enum: administrador, garcom, caixa, estoque, cozinha)
      - `ativo` (boolean, default true)
      - `endereco` (text, optional)
      - `cidade` (text, optional)
      - `estado` (text, optional)
      - `cep` (text, optional)
      - `data_nascimento` (date, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `profiles` table
    - Add policies for users to manage their own data
*/

-- Create enum for user types
DO $$ BEGIN
  CREATE TYPE user_type AS ENUM ('administrador', 'garcom', 'caixa', 'estoque', 'cozinha');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  nome_completo text NOT NULL,
  nome_restaurante text NOT NULL,
  cpf text NOT NULL,
  telefone text NOT NULL,
  tipo user_type DEFAULT 'administrador',
  ativo boolean DEFAULT true,
  endereco text,
  cidade text,
  estado text,
  cep text,
  data_nascimento date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();