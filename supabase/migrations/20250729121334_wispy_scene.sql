/*
  # Criar tabela de mesas

  1. Nova Tabela
    - `mesas`
      - `id` (uuid, primary key)
      - `numero` (integer, unique, not null)
      - `nome` (text, optional)
      - `capacidade` (integer, not null)
      - `status` (enum: livre, ocupada, reservada, manutencao)
      - `qr_code` (text, optional)
      - `observacoes` (text, optional)
      - `ativo` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Segurança
    - Habilitar RLS na tabela `mesas`
    - Adicionar políticas para usuários autenticados
*/

-- Criar enum para status das mesas
DO $$ BEGIN
  CREATE TYPE mesa_status AS ENUM ('livre', 'ocupada', 'reservada', 'manutencao');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Criar tabela de mesas
CREATE TABLE IF NOT EXISTS mesas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero integer UNIQUE NOT NULL,
  nome text,
  capacidade integer NOT NULL DEFAULT 4,
  status mesa_status NOT NULL DEFAULT 'livre',
  qr_code text,
  observacoes text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE mesas ENABLE ROW LEVEL SECURITY;

-- Criar políticas
CREATE POLICY "Users can read mesas"
  ON mesas
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert mesas"
  ON mesas
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update mesas"
  ON mesas
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete mesas"
  ON mesas
  FOR DELETE
  TO authenticated
  USING (true);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_mesas_numero ON mesas(numero);
CREATE INDEX IF NOT EXISTS idx_mesas_status ON mesas(status);
CREATE INDEX IF NOT EXISTS idx_mesas_ativo ON mesas(ativo);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ BEGIN
  CREATE TRIGGER update_mesas_updated_at 
    BEFORE UPDATE ON mesas 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;