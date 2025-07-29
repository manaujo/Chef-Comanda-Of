/*
  # Criar tabela de insumos

  1. Nova Tabela
    - `insumos`
      - `id` (uuid, primary key)
      - `nome` (text, not null)
      - `unidade` (enum: kg, g, l, ml, un, cx, pct)
      - `preco_unitario` (numeric, not null)
      - `quantidade_estoque` (numeric, not null, default 0)
      - `estoque_minimo` (numeric, not null, default 0)
      - `fornecedor` (text, optional)
      - `ativo` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Segurança
    - Habilitar RLS na tabela `insumos`
    - Adicionar políticas para usuários autenticados
*/

-- Criar enum para unidades de medida
DO $$ BEGIN
  CREATE TYPE unidade_medida AS ENUM ('kg', 'g', 'l', 'ml', 'un', 'cx', 'pct');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Criar tabela de insumos
CREATE TABLE IF NOT EXISTS insumos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  unidade unidade_medida NOT NULL DEFAULT 'un',
  preco_unitario numeric(10,4) NOT NULL,
  quantidade_estoque numeric(10,4) NOT NULL DEFAULT 0,
  estoque_minimo numeric(10,4) NOT NULL DEFAULT 0,
  fornecedor text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT insumos_preco_check CHECK (preco_unitario >= 0),
  CONSTRAINT insumos_quantidade_check CHECK (quantidade_estoque >= 0),
  CONSTRAINT insumos_estoque_minimo_check CHECK (estoque_minimo >= 0)
);

-- Habilitar RLS
ALTER TABLE insumos ENABLE ROW LEVEL SECURITY;

-- Criar políticas
CREATE POLICY "Users can read insumos"
  ON insumos
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert insumos"
  ON insumos
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update insumos"
  ON insumos
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete insumos"
  ON insumos
  FOR DELETE
  TO authenticated
  USING (true);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_insumos_nome ON insumos(nome);
CREATE INDEX IF NOT EXISTS idx_insumos_ativo ON insumos(ativo);
CREATE INDEX IF NOT EXISTS idx_insumos_estoque_baixo ON insumos(quantidade_estoque, estoque_minimo) WHERE quantidade_estoque <= estoque_minimo;

-- Trigger para updated_at
DO $$ BEGIN
  CREATE TRIGGER update_insumos_updated_at 
    BEFORE UPDATE ON insumos 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;