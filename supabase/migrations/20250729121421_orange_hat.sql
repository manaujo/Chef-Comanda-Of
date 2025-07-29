/*
  # Criar tabela de turnos

  1. Nova Tabela
    - `turnos`
      - `id` (uuid, primary key)
      - `operador_id` (uuid, foreign key para profiles)
      - `data_abertura` (timestamp, default now)
      - `data_fechamento` (timestamp, optional)
      - `valor_inicial` (numeric, not null)
      - `valor_fechamento` (numeric, optional)
      - `observacoes` (text, optional)
      - `ativo` (boolean, default true)
      - `created_at` (timestamp)

  2. Segurança
    - Habilitar RLS na tabela `turnos`
    - Adicionar políticas para usuários autenticados
*/

-- Criar tabela de turnos
CREATE TABLE IF NOT EXISTS turnos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operador_id uuid NOT NULL REFERENCES profiles(id),
  data_abertura timestamptz NOT NULL DEFAULT now(),
  data_fechamento timestamptz,
  valor_inicial numeric(10,2) NOT NULL DEFAULT 0,
  valor_fechamento numeric(10,2),
  observacoes text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT turnos_valor_inicial_check CHECK (valor_inicial >= 0),
  CONSTRAINT turnos_valor_fechamento_check CHECK (valor_fechamento IS NULL OR valor_fechamento >= 0)
);

-- Habilitar RLS
ALTER TABLE turnos ENABLE ROW LEVEL SECURITY;

-- Criar políticas
CREATE POLICY "Users can read turnos"
  ON turnos
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert turnos"
  ON turnos
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update turnos"
  ON turnos
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete turnos"
  ON turnos
  FOR DELETE
  TO authenticated
  USING (true);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_turnos_operador_id ON turnos(operador_id);
CREATE INDEX IF NOT EXISTS idx_turnos_ativo ON turnos(ativo);
CREATE INDEX IF NOT EXISTS idx_turnos_data_abertura ON turnos(data_abertura);

-- Constraint para garantir apenas um turno ativo por vez
CREATE UNIQUE INDEX IF NOT EXISTS idx_turnos_ativo_unique 
  ON turnos(ativo) 
  WHERE ativo = true AND data_fechamento IS NULL;