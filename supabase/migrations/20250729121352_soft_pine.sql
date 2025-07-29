/*
  # Criar tabela de itens da comanda

  1. Nova Tabela
    - `comanda_itens`
      - `id` (uuid, primary key)
      - `comanda_id` (uuid, foreign key para comandas)
      - `produto_id` (uuid, foreign key para produtos)
      - `quantidade` (integer, not null)
      - `preco_unitario` (numeric, not null)
      - `status` (enum: pendente, recebido, em_preparo, pronto, entregue, cancelado)
      - `observacoes` (text, optional)
      - `cancelado_por` (uuid, foreign key para profiles)
      - `motivo_cancelamento` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Segurança
    - Habilitar RLS na tabela `comanda_itens`
    - Adicionar políticas para usuários autenticados
*/

-- Criar enum para status dos itens
DO $$ BEGIN
  CREATE TYPE item_status AS ENUM ('pendente', 'recebido', 'em_preparo', 'pronto', 'entregue', 'cancelado');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Criar tabela de itens da comanda
CREATE TABLE IF NOT EXISTS comanda_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comanda_id uuid NOT NULL REFERENCES comandas(id) ON DELETE CASCADE,
  produto_id uuid NOT NULL REFERENCES produtos(id),
  quantidade integer NOT NULL DEFAULT 1,
  preco_unitario numeric(10,2) NOT NULL,
  status item_status NOT NULL DEFAULT 'pendente',
  observacoes text,
  cancelado_por uuid REFERENCES profiles(id),
  motivo_cancelamento text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT comanda_itens_quantidade_check CHECK (quantidade > 0),
  CONSTRAINT comanda_itens_preco_check CHECK (preco_unitario >= 0)
);

-- Habilitar RLS
ALTER TABLE comanda_itens ENABLE ROW LEVEL SECURITY;

-- Criar políticas
CREATE POLICY "Users can read comanda_itens"
  ON comanda_itens
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert comanda_itens"
  ON comanda_itens
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update comanda_itens"
  ON comanda_itens
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete comanda_itens"
  ON comanda_itens
  FOR DELETE
  TO authenticated
  USING (true);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_comanda_itens_comanda_id ON comanda_itens(comanda_id);
CREATE INDEX IF NOT EXISTS idx_comanda_itens_produto_id ON comanda_itens(produto_id);
CREATE INDEX IF NOT EXISTS idx_comanda_itens_status ON comanda_itens(status);

-- Trigger para updated_at
DO $$ BEGIN
  CREATE TRIGGER update_comanda_itens_updated_at 
    BEFORE UPDATE ON comanda_itens 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Função para atualizar valor total da comanda
CREATE OR REPLACE FUNCTION update_comanda_valor_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE comandas 
  SET valor_total = (
    SELECT COALESCE(SUM(quantidade * preco_unitario), 0)
    FROM comanda_itens 
    WHERE comanda_id = COALESCE(NEW.comanda_id, OLD.comanda_id)
    AND status != 'cancelado'
  )
  WHERE id = COALESCE(NEW.comanda_id, OLD.comanda_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Triggers para atualizar valor total da comanda
DO $$ BEGIN
  CREATE TRIGGER update_comanda_valor_total_insert
    AFTER INSERT ON comanda_itens
    FOR EACH ROW
    EXECUTE FUNCTION update_comanda_valor_total();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_comanda_valor_total_update
    AFTER UPDATE ON comanda_itens
    FOR EACH ROW
    EXECUTE FUNCTION update_comanda_valor_total();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_comanda_valor_total_delete
    AFTER DELETE ON comanda_itens
    FOR EACH ROW
    EXECUTE FUNCTION update_comanda_valor_total();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;