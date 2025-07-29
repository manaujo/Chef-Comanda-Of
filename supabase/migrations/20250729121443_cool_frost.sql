/*
  # Atualizar tabela de profiles

  1. Modificações
    - Adicionar campo `tipo` (enum: administrador, garcom, caixa, estoque, cozinha)
    - Adicionar campo `ativo` (boolean, default true)
    - Adicionar campos opcionais de endereço
    - Atualizar trigger para updated_at

  2. Segurança
    - Manter políticas existentes
*/

-- Criar enum para tipos de usuário
DO $$ BEGIN
  CREATE TYPE user_type AS ENUM ('administrador', 'garcom', 'caixa', 'estoque', 'cozinha');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Adicionar colunas se não existirem
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'tipo'
  ) THEN
    ALTER TABLE profiles ADD COLUMN tipo user_type DEFAULT 'administrador';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'ativo'
  ) THEN
    ALTER TABLE profiles ADD COLUMN ativo boolean DEFAULT true;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'data_nascimento'
  ) THEN
    ALTER TABLE profiles ADD COLUMN data_nascimento date;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'endereco'
  ) THEN
    ALTER TABLE profiles ADD COLUMN endereco text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'cidade'
  ) THEN
    ALTER TABLE profiles ADD COLUMN cidade text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'estado'
  ) THEN
    ALTER TABLE profiles ADD COLUMN estado text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'cep'
  ) THEN
    ALTER TABLE profiles ADD COLUMN cep text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Criar trigger para updated_at se não existir
DO $$ BEGIN
  CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Criar índices adicionais
CREATE INDEX IF NOT EXISTS idx_profiles_tipo ON profiles(tipo);
CREATE INDEX IF NOT EXISTS idx_profiles_ativo ON profiles(ativo);