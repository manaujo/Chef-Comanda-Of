/*
  # Criar tabela de vendas

  1. Nova Tabela
    - `vendas`
      - `id` (uuid, primary key)
      - `comanda_id` (uuid, foreign key para comandas)
      - `turno_id` (uuid, foreign key para turnos)
      - `operador_id` (uuid, foreign key para profiles)
      - `valor_total` (numeric, not null)
      - `valor_desconto` (numeric, default 0)
      - `valor_final` (numeric, not null)
      - `forma_pagamento` (text, not null)
      - `data_venda` (timestamp, default now)
      - `created_at` (timestamp)

  2. Segurança
    - Habilitar RLS na tabela `vendas`
    - Adicionar políticas para usuários autenticados
*/

-- Criar tabela de vendas
CREATE TABLE IF NOT EXISTS vendas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comanda_id uuid NOT NULL REFERENCES comandas(id),
  turno_id uuid REFERENCES turnos(id),
  operador_id uuid NOT NULL REFERENCES profiles(id),
  valor_total numeric(10,2) NOT NULL,
  valor_desconto numeric(10,2) NOT NULL DEFAULT 0,
  valor_final numeric(10,2) NOT NULL,
  forma_pagamento text NOT NULL,
  data_venda timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT vendas_valor_total_check CHECK (valor_total >= 0),
  CONSTRAINT vendas_valor_desconto_check CHECK (valor_desconto >= 0),
  CONSTRAINT vendas_valor_final_check CHECK (valor_final >= 0),
  CONSTRAINT vendas_forma_pagamento_check CHECK (forma_pagamento IN ('dinheiro', 'cartao_credito', 'cartao_debito', 'pix'))
);

-- Habilitar RLS
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;

-- Criar políticas
CREATE POLICY "Users can read vendas"
  ON vendas
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert vendas"
  ON vendas
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update vendas"
  ON vendas
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete vendas"
  ON vendas
  FOR DELETE
  TO authenticated
  USING (true);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_vendas_comanda_id ON vendas(comanda_id);
CREATE INDEX IF NOT EXISTS idx_vendas_turno_id ON vendas(turno_id);
CREATE INDEX IF NOT EXISTS idx_vendas_operador_id ON vendas(operador_id);
CREATE INDEX IF NOT EXISTS idx_vendas_data_venda ON vendas(data_venda);
CREATE INDEX IF NOT EXISTS idx_vendas_forma_pagamento ON vendas(forma_pagamento);