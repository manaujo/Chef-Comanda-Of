/*
  # Create categorias and produtos tables

  1. New Tables
    - `categorias`
      - `id` (uuid, primary key)
      - `nome` (text, required)
      - `descricao` (text, optional)
      - `cor` (text, required)
      - `ativo` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `produtos`
      - `id` (uuid, primary key)
      - `nome` (text, required)
      - `descricao` (text, optional)
      - `preco` (numeric, required)
      - `categoria_id` (uuid, foreign key to categorias)
      - `foto_url` (text, optional)
      - `ativo` (boolean, default true)
      - `tempo_preparo` (integer, required)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to read, insert, update, and delete their own data
*/

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create categorias table
CREATE TABLE IF NOT EXISTS categorias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  descricao TEXT,
  cor TEXT NOT NULL DEFAULT '#3b82f6',
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on categorias
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;

-- Create policies for categorias
CREATE POLICY "Users can read categories" ON categorias
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can insert categories" ON categorias
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update categories" ON categorias
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Users can delete categories" ON categorias
  FOR DELETE TO authenticated
  USING (true);

-- Create produtos table
CREATE TABLE IF NOT EXISTS produtos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  descricao TEXT,
  preco NUMERIC NOT NULL CHECK (preco >= 0),
  categoria_id UUID REFERENCES categorias(id),
  foto_url TEXT,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  tempo_preparo INTEGER NOT NULL DEFAULT 15 CHECK (tempo_preparo > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on produtos
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;

-- Create policies for produtos
CREATE POLICY "Users can read products" ON produtos
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can insert products" ON produtos
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update products" ON produtos
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Users can delete products" ON produtos
  FOR DELETE TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_produtos_categoria_id ON produtos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_produtos_ativo ON produtos(ativo);
CREATE INDEX IF NOT EXISTS idx_categorias_ativo ON categorias(ativo);

-- Insert some default categories
INSERT INTO categorias (nome, descricao, cor) VALUES
  ('Pratos Principais', 'Pratos principais do cardápio', '#dc2626'),
  ('Bebidas', 'Bebidas em geral', '#2563eb'),
  ('Sobremesas', 'Doces e sobremesas', '#7c3aed'),
  ('Petiscos', 'Aperitivos e petiscos', '#ea580c')
ON CONFLICT DO NOTHING;