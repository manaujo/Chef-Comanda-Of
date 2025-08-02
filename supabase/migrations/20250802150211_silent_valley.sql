/*
  # Criar tabela de produtos

  1. New Tables
    - `produtos`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `nome` (text)
      - `descricao` (text, optional)
      - `preco` (decimal)
      - `categoria_id` (uuid, references categorias, optional)
      - `categoria_produto` (enum: prato, entrada, bebida, sobremesa)
      - `foto_url` (text, optional)
      - `ativo` (boolean, default true)
      - `tempo_preparo` (integer, default 15)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `produtos` table
    - Add policies for users to manage their own products
*/

-- Create enum for product categories
DO $$ BEGIN
  CREATE TYPE categoria_produto AS ENUM ('prato', 'entrada', 'bebida', 'sobremesa');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create produtos table
CREATE TABLE IF NOT EXISTS produtos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  descricao text,
  preco decimal(10,2) NOT NULL DEFAULT 0,
  categoria_id uuid REFERENCES categorias(id) ON DELETE SET NULL,
  categoria_produto categoria_produto DEFAULT 'prato',
  foto_url text,
  ativo boolean DEFAULT true,
  tempo_preparo integer DEFAULT 15,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own products"
  ON produtos
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own products"
  ON produtos
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products"
  ON produtos
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own products"
  ON produtos
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_produtos_updated_at ON produtos;
CREATE TRIGGER update_produtos_updated_at
  BEFORE UPDATE ON produtos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();