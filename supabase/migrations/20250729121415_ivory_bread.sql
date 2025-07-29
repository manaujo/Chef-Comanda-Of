/*
  # Criar tabela de relacionamento produto-insumos

  1. Nova Tabela
    - `produto_insumos`
      - `id` (uuid, primary key)
      - `produto_id` (uuid, foreign key para produtos)
      - `insumo_id` (uuid, foreign key para insumos)
      - `quantidade_usada` (numeric, not null)
      - `created_at` (timestamp)

  2. Segurança
    - Habilitar RLS na tabela `produto_insumos`
    - Adicionar políticas para usuários autenticados
*/

-- Criar tabela de relacionamento produto-insumos
CREATE TABLE IF NOT EXISTS produto_insumos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id uuid NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  insumo_id uuid NOT NULL REFERENCES insumos(id) ON DELETE CASCADE,
  quantidade_usada numeric(10,4) NOT NULL,
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT produto_insumos_quantidade_check CHECK (quantidade_usada > 0),
  UNIQUE(produto_id, insumo_id)
);

-- Habilitar RLS
ALTER TABLE produto_insumos ENABLE ROW LEVEL SECURITY;

-- Criar políticas
CREATE POLICY "Users can read produto_insumos"
  ON produto_insumos
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert produto_insumos"
  ON produto_insumos
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update produto_insumos"
  ON produto_insumos
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete produto_insumos"
  ON produto_insumos
  FOR DELETE
  TO authenticated
  USING (true);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_produto_insumos_produto_id ON produto_insumos(produto_id);
CREATE INDEX IF NOT EXISTS idx_produto_insumos_insumo_id ON produto_insumos(insumo_id);