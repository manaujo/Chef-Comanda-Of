/*
  # Módulo Completo de Estoque

  1. Novas Tabelas
    - `entradas_estoque` - Registro de entradas de insumos
    - `saidas_estoque` - Registro de saídas de insumos
    - `historico_turnos` - Histórico completo de turnos

  2. Modificações
    - Atualizar tabela `insumos` com novos campos
    - Atualizar tabela `produto_insumos` para vincular receitas

  3. Triggers
    - Atualizar saldo automático nas entradas/saídas
    - Descontar estoque automaticamente nas vendas

  4. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas baseadas em permissões
*/

-- Atualizar tabela insumos com novos campos necessários
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'insumos' AND column_name = 'saldo_atual'
  ) THEN
    ALTER TABLE insumos ADD COLUMN saldo_atual numeric(10,4) DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'insumos' AND column_name = 'quantidade_minima'
  ) THEN
    ALTER TABLE insumos ADD COLUMN quantidade_minima numeric(10,4) DEFAULT 0;
  END IF;
END $$;

-- Migrar dados existentes
UPDATE insumos 
SET saldo_atual = quantidade_estoque, quantidade_minima = estoque_minimo 
WHERE saldo_atual IS NULL OR quantidade_minima IS NULL;

-- Criar tabela de entradas de estoque
CREATE TABLE IF NOT EXISTS entradas_estoque (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  insumo_id uuid NOT NULL REFERENCES insumos(id) ON DELETE CASCADE,
  quantidade numeric(10,4) NOT NULL CHECK (quantidade > 0),
  valor_total numeric(10,2) NOT NULL CHECK (valor_total >= 0),
  valor_unitario numeric(10,4) GENERATED ALWAYS AS (valor_total / quantidade) STORED,
  observacoes text,
  data_entrada timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Criar tabela de saídas de estoque
CREATE TABLE IF NOT EXISTS saidas_estoque (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  insumo_id uuid NOT NULL REFERENCES insumos(id) ON DELETE CASCADE,
  quantidade numeric(10,4) NOT NULL CHECK (quantidade > 0),
  motivo text NOT NULL,
  observacoes text,
  data_saida timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Criar tabela de histórico de turnos
CREATE TABLE IF NOT EXISTS historico_turnos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  turno_id uuid NOT NULL REFERENCES turnos(id) ON DELETE CASCADE,
  operador_id uuid REFERENCES profiles(id),
  operador_funcionario_id uuid REFERENCES funcionarios_simples(id),
  data_abertura timestamptz NOT NULL,
  data_fechamento timestamptz,
  valor_inicial numeric(10,2) NOT NULL,
  valor_fechamento numeric(10,2),
  total_vendas numeric(10,2) DEFAULT 0,
  quantidade_vendas integer DEFAULT 0,
  diferenca numeric(10,2) GENERATED ALWAYS AS (
    CASE 
      WHEN valor_fechamento IS NOT NULL 
      THEN valor_fechamento - valor_inicial 
      ELSE NULL 
    END
  ) STORED,
  observacoes text,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE entradas_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE saidas_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_turnos ENABLE ROW LEVEL SECURITY;

-- Políticas para entradas_estoque
CREATE POLICY "Estoque users can read entradas"
  ON entradas_estoque
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.tipo IN ('administrador', 'estoque') 
      AND p.ativo = true
    )
  );

CREATE POLICY "Estoque users can manage entradas"
  ON entradas_estoque
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.tipo IN ('administrador', 'estoque') 
      AND p.ativo = true
    )
  );

-- Políticas para saidas_estoque
CREATE POLICY "Estoque users can read saidas"
  ON saidas_estoque
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.tipo IN ('administrador', 'estoque') 
      AND p.ativo = true
    )
  );

CREATE POLICY "Estoque users can manage saidas"
  ON saidas_estoque
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.tipo IN ('administrador', 'estoque') 
      AND p.ativo = true
    )
  );

-- Políticas para historico_turnos
CREATE POLICY "Users can read historico_turnos"
  ON historico_turnos
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Administrators can manage historico_turnos"
  ON historico_turnos
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.tipo = 'administrador' 
      AND p.ativo = true
    )
  );

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_entradas_estoque_insumo_id ON entradas_estoque(insumo_id);
CREATE INDEX IF NOT EXISTS idx_entradas_estoque_data_entrada ON entradas_estoque(data_entrada);
CREATE INDEX IF NOT EXISTS idx_saidas_estoque_insumo_id ON saidas_estoque(insumo_id);
CREATE INDEX IF NOT EXISTS idx_saidas_estoque_data_saida ON saidas_estoque(data_saida);
CREATE INDEX IF NOT EXISTS idx_historico_turnos_turno_id ON historico_turnos(turno_id);
CREATE INDEX IF NOT EXISTS idx_historico_turnos_data_abertura ON historico_turnos(data_abertura);

-- Função para atualizar saldo do insumo nas entradas
CREATE OR REPLACE FUNCTION update_saldo_entrada()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE insumos 
  SET saldo_atual = saldo_atual + NEW.quantidade,
      preco_unitario = NEW.valor_unitario
  WHERE id = NEW.insumo_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar saldo do insumo nas saídas
CREATE OR REPLACE FUNCTION update_saldo_saida()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE insumos 
  SET saldo_atual = saldo_atual - NEW.quantidade
  WHERE id = NEW.insumo_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para descontar estoque automaticamente nas vendas
CREATE OR REPLACE FUNCTION descontar_estoque_venda()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando um item é marcado como pronto, descontar do estoque
  IF NEW.status = 'pronto' AND OLD.status != 'pronto' THEN
    UPDATE insumos 
    SET saldo_atual = saldo_atual - (pi.quantidade_usada * NEW.quantidade)
    FROM produto_insumos pi
    WHERE pi.produto_id = NEW.produto_id 
    AND insumos.id = pi.insumo_id
    AND insumos.saldo_atual >= (pi.quantidade_usada * NEW.quantidade);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para criar histórico do turno
CREATE OR REPLACE FUNCTION criar_historico_turno()
RETURNS TRIGGER AS $$
DECLARE
  vendas_info RECORD;
BEGIN
  -- Quando um turno é fechado, criar histórico
  IF NEW.data_fechamento IS NOT NULL AND OLD.data_fechamento IS NULL THEN
    -- Buscar informações das vendas do turno
    SELECT 
      COALESCE(SUM(valor_final), 0) as total_vendas,
      COUNT(*) as quantidade_vendas
    INTO vendas_info
    FROM vendas 
    WHERE turno_id = NEW.id;
    
    -- Inserir no histórico
    INSERT INTO historico_turnos (
      turno_id,
      operador_id,
      operador_funcionario_id,
      data_abertura,
      data_fechamento,
      valor_inicial,
      valor_fechamento,
      total_vendas,
      quantidade_vendas,
      observacoes
    ) VALUES (
      NEW.id,
      NEW.operador_id,
      NEW.operador_funcionario_id,
      NEW.data_abertura,
      NEW.data_fechamento,
      NEW.valor_inicial,
      NEW.valor_fechamento,
      vendas_info.total_vendas,
      vendas_info.quantidade_vendas,
      NEW.observacoes
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar triggers
CREATE TRIGGER trigger_update_saldo_entrada
  AFTER INSERT ON entradas_estoque
  FOR EACH ROW
  EXECUTE FUNCTION update_saldo_entrada();

CREATE TRIGGER trigger_update_saldo_saida
  AFTER INSERT ON saidas_estoque
  FOR EACH ROW
  EXECUTE FUNCTION update_saldo_saida();

CREATE TRIGGER trigger_descontar_estoque_venda
  AFTER UPDATE ON comanda_itens
  FOR EACH ROW
  EXECUTE FUNCTION descontar_estoque_venda();

CREATE TRIGGER trigger_criar_historico_turno
  AFTER UPDATE ON turnos
  FOR EACH ROW
  EXECUTE FUNCTION criar_historico_turno();