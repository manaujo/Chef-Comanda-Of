/*
  # Criar tabela de comandas

  1. Nova Tabela
    - `comandas`
      - `id` (uuid, primary key)
      - `numero` (integer, auto-increment, unique)
      - `mesa_id` (uuid, foreign key para mesas)
      - `garcom_id` (uuid, foreign key para profiles)
      - `status` (enum: aberta, fechada, cancelada)
      - `observacoes` (text, optional)
      - `data_abertura` (timestamp, default now)
      - `data_fechamento` (timestamp, optional)
      - `valor_total` (numeric, default 0)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Segurança
    - Habilitar RLS na tabela `comandas`
    - Adicionar políticas para usuários autenticados
*/

-- Criar enum para status das comandas
DO $$ BEGIN
  CREATE TYPE comanda_status AS ENUM ('aberta', 'fechada', 'cancelada');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Criar sequência para número da comanda
CREATE SEQUENCE IF NOT EXISTS comandas_numero_seq START 1;

-- Criar tabela de comandas
CREATE TABLE IF NOT EXISTS comandas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero integer UNIQUE NOT NULL DEFAULT nextval('comandas_numero_seq'),
  mesa_id uuid REFERENCES mesas(id),
  garcom_id uuid REFERENCES profiles(id),
  status comanda_status NOT NULL DEFAULT 'aberta',
  observacoes text,
  data_abertura timestamptz NOT NULL DEFAULT now(),
  data_fechamento timestamptz,
  valor_total numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE comandas ENABLE ROW LEVEL SECURITY;

-- Criar políticas
CREATE POLICY "Users can read comandas"
  ON comandas
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert comandas"
  ON comandas
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update comandas"
  ON comandas
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete comandas"
  ON comandas
  FOR DELETE
  TO authenticated
  USING (true);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_comandas_numero ON comandas(numero);
CREATE INDEX IF NOT EXISTS idx_comandas_mesa_id ON comandas(mesa_id);
CREATE INDEX IF NOT EXISTS idx_comandas_garcom_id ON comandas(garcom_id);
CREATE INDEX IF NOT EXISTS idx_comandas_status ON comandas(status);
CREATE INDEX IF NOT EXISTS idx_comandas_data_abertura ON comandas(data_abertura);

-- Trigger para updated_at
DO $$ BEGIN
  CREATE TRIGGER update_comandas_updated_at 
    BEFORE UPDATE ON comandas 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;