/*
  # Adicionar separação de dados por usuário

  1. Modificações nas tabelas existentes
    - Adicionar campo `user_id` em todas as tabelas principais
    - Atualizar dados existentes com o ID do usuário atual
    - Criar índices para melhor performance

  2. Atualizar políticas RLS
    - Filtrar dados por usuário logado
    - Garantir isolamento completo entre contas

  3. Tabelas afetadas
    - funcionarios_simples
    - mesas
    - comandas
    - produtos
    - categorias
    - insumos
    - turnos
    - vendas
    - logs
*/

-- Adicionar campo user_id nas tabelas se não existir

-- funcionarios_simples
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'funcionarios_simples' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE funcionarios_simples ADD COLUMN user_id uuid NOT NULL DEFAULT auth.uid();
  END IF;
END $$;

-- mesas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mesas' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE mesas ADD COLUMN user_id uuid NOT NULL DEFAULT auth.uid();
  END IF;
END $$;

-- comandas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'comandas' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE comandas ADD COLUMN user_id uuid NOT NULL DEFAULT auth.uid();
  END IF;
END $$;

-- comanda_itens
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'comanda_itens' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE comanda_itens ADD COLUMN user_id uuid NOT NULL DEFAULT auth.uid();
  END IF;
END $$;

-- produtos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'produtos' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE produtos ADD COLUMN user_id uuid NOT NULL DEFAULT auth.uid();
  END IF;
END $$;

-- categorias
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categorias' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE categorias ADD COLUMN user_id uuid NOT NULL DEFAULT auth.uid();
  END IF;
END $$;

-- insumos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'insumos' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE insumos ADD COLUMN user_id uuid NOT NULL DEFAULT auth.uid();
  END IF;
END $$;

-- produto_insumos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'produto_insumos' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE produto_insumos ADD COLUMN user_id uuid NOT NULL DEFAULT auth.uid();
  END IF;
END $$;

-- turnos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'turnos' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE turnos ADD COLUMN user_id uuid NOT NULL DEFAULT auth.uid();
  END IF;
END $$;

-- vendas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendas' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE vendas ADD COLUMN user_id uuid NOT NULL DEFAULT auth.uid();
  END IF;
END $$;

-- entradas_estoque
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'entradas_estoque' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE entradas_estoque ADD COLUMN user_id uuid NOT NULL DEFAULT auth.uid();
  END IF;
END $$;

-- saidas_estoque
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'saidas_estoque' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE saidas_estoque ADD COLUMN user_id uuid NOT NULL DEFAULT auth.uid();
  END IF;
END $$;

-- logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'logs' AND column_name = 'user_id_owner'
  ) THEN
    ALTER TABLE logs ADD COLUMN user_id_owner uuid NOT NULL DEFAULT auth.uid();
  END IF;
END $$;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_funcionarios_simples_user_id ON funcionarios_simples(user_id);
CREATE INDEX IF NOT EXISTS idx_mesas_user_id ON mesas(user_id);
CREATE INDEX IF NOT EXISTS idx_comandas_user_id ON comandas(user_id);
CREATE INDEX IF NOT EXISTS idx_comanda_itens_user_id ON comanda_itens(user_id);
CREATE INDEX IF NOT EXISTS idx_produtos_user_id ON produtos(user_id);
CREATE INDEX IF NOT EXISTS idx_categorias_user_id ON categorias(user_id);
CREATE INDEX IF NOT EXISTS idx_insumos_user_id ON insumos(user_id);
CREATE INDEX IF NOT EXISTS idx_produto_insumos_user_id ON produto_insumos(user_id);
CREATE INDEX IF NOT EXISTS idx_turnos_user_id ON turnos(user_id);
CREATE INDEX IF NOT EXISTS idx_vendas_user_id ON vendas(user_id);
CREATE INDEX IF NOT EXISTS idx_entradas_estoque_user_id ON entradas_estoque(user_id);
CREATE INDEX IF NOT EXISTS idx_saidas_estoque_user_id ON saidas_estoque(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_user_id_owner ON logs(user_id_owner);

-- Atualizar políticas RLS para filtrar por user_id

-- funcionarios_simples
DROP POLICY IF EXISTS "Users can read funcionarios_simples" ON funcionarios_simples;
DROP POLICY IF EXISTS "Administrators can manage funcionarios_simples" ON funcionarios_simples;

CREATE POLICY "Users can read their funcionarios_simples" ON funcionarios_simples
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their funcionarios_simples" ON funcionarios_simples
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- mesas
DROP POLICY IF EXISTS "Users can read mesas" ON mesas;
DROP POLICY IF EXISTS "Users can insert mesas" ON mesas;
DROP POLICY IF EXISTS "Users can update mesas" ON mesas;
DROP POLICY IF EXISTS "Users can delete mesas" ON mesas;

CREATE POLICY "Users can read their mesas" ON mesas
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their mesas" ON mesas
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- comandas
DROP POLICY IF EXISTS "Users can read comandas" ON comandas;
DROP POLICY IF EXISTS "Users can insert comandas" ON comandas;
DROP POLICY IF EXISTS "Users can update comandas" ON comandas;
DROP POLICY IF EXISTS "Users can delete comandas" ON comandas;
DROP POLICY IF EXISTS "Garçons podem ver suas comandas" ON comandas;
DROP POLICY IF EXISTS "Garçons podem criar comandas" ON comandas;
DROP POLICY IF EXISTS "Garçons podem atualizar suas comandas" ON comandas;

CREATE POLICY "Users can read their comandas" ON comandas
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their comandas" ON comandas
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- comanda_itens
DROP POLICY IF EXISTS "Users can read comanda_itens" ON comanda_itens;
DROP POLICY IF EXISTS "Users can insert comanda_itens" ON comanda_itens;
DROP POLICY IF EXISTS "Users can update comanda_itens" ON comanda_itens;
DROP POLICY IF EXISTS "Users can delete comanda_itens" ON comanda_itens;
DROP POLICY IF EXISTS "Usuários podem ver itens de comandas" ON comanda_itens;
DROP POLICY IF EXISTS "Garçons podem gerenciar itens de suas comandas" ON comanda_itens;
DROP POLICY IF EXISTS "Cozinha pode atualizar status dos itens" ON comanda_itens;

CREATE POLICY "Users can read their comanda_itens" ON comanda_itens
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their comanda_itens" ON comanda_itens
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- produtos
DROP POLICY IF EXISTS "Users can read products" ON produtos;
DROP POLICY IF EXISTS "Users can insert products" ON produtos;
DROP POLICY IF EXISTS "Users can update products" ON produtos;
DROP POLICY IF EXISTS "Users can delete products" ON produtos;
DROP POLICY IF EXISTS "Todos podem ver produtos ativos" ON produtos;
DROP POLICY IF EXISTS "Administradores podem gerenciar produtos" ON produtos;

CREATE POLICY "Users can read their produtos" ON produtos
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their produtos" ON produtos
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- categorias
DROP POLICY IF EXISTS "Users can read categories" ON categorias;
DROP POLICY IF EXISTS "Users can insert categories" ON categorias;
DROP POLICY IF EXISTS "Users can update categories" ON categorias;
DROP POLICY IF EXISTS "Users can delete categories" ON categorias;
DROP POLICY IF EXISTS "Todos podem ver categorias ativas" ON categorias;
DROP POLICY IF EXISTS "Administradores podem gerenciar categorias" ON categorias;

CREATE POLICY "Users can read their categorias" ON categorias
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their categorias" ON categorias
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- insumos
DROP POLICY IF EXISTS "Users can read insumos" ON insumos;
DROP POLICY IF EXISTS "Users can insert insumos" ON insumos;
DROP POLICY IF EXISTS "Users can update insumos" ON insumos;
DROP POLICY IF EXISTS "Users can delete insumos" ON insumos;
DROP POLICY IF EXISTS "Usuários de estoque podem ver insumos" ON insumos;
DROP POLICY IF EXISTS "Usuários de estoque podem gerenciar insumos" ON insumos;

CREATE POLICY "Users can read their insumos" ON insumos
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their insumos" ON insumos
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- produto_insumos
DROP POLICY IF EXISTS "Users can read produto_insumos" ON produto_insumos;
DROP POLICY IF EXISTS "Users can insert produto_insumos" ON produto_insumos;
DROP POLICY IF EXISTS "Users can update produto_insumos" ON produto_insumos;
DROP POLICY IF EXISTS "Users can delete produto_insumos" ON produto_insumos;
DROP POLICY IF EXISTS "Usuários de estoque podem ver produto_insumos" ON produto_insumos;
DROP POLICY IF EXISTS "Usuários de estoque podem gerenciar produto_insumos" ON produto_insumos;

CREATE POLICY "Users can read their produto_insumos" ON produto_insumos
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their produto_insumos" ON produto_insumos
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- turnos
DROP POLICY IF EXISTS "Users can read turnos" ON turnos;
DROP POLICY IF EXISTS "Users can insert turnos" ON turnos;
DROP POLICY IF EXISTS "Users can update turnos" ON turnos;
DROP POLICY IF EXISTS "Users can delete turnos" ON turnos;
DROP POLICY IF EXISTS "Operadores podem ver seus turnos" ON turnos;
DROP POLICY IF EXISTS "Operadores de caixa podem gerenciar turnos" ON turnos;

CREATE POLICY "Users can read their turnos" ON turnos
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their turnos" ON turnos
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- vendas
DROP POLICY IF EXISTS "Users can read vendas" ON vendas;
DROP POLICY IF EXISTS "Users can insert vendas" ON vendas;
DROP POLICY IF EXISTS "Users can update vendas" ON vendas;
DROP POLICY IF EXISTS "Users can delete vendas" ON vendas;
DROP POLICY IF EXISTS "Operadores podem ver suas vendas" ON vendas;
DROP POLICY IF EXISTS "Operadores de caixa podem criar vendas" ON vendas;

CREATE POLICY "Users can read their vendas" ON vendas
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their vendas" ON vendas
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- entradas_estoque
DROP POLICY IF EXISTS "Estoque users can read entradas" ON entradas_estoque;
DROP POLICY IF EXISTS "Estoque users can manage entradas" ON entradas_estoque;

CREATE POLICY "Users can read their entradas_estoque" ON entradas_estoque
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their entradas_estoque" ON entradas_estoque
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- saidas_estoque
DROP POLICY IF EXISTS "Estoque users can read saidas" ON saidas_estoque;
DROP POLICY IF EXISTS "Estoque users can manage saidas" ON saidas_estoque;

CREATE POLICY "Users can read their saidas_estoque" ON saidas_estoque
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their saidas_estoque" ON saidas_estoque
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- logs
DROP POLICY IF EXISTS "Administradores podem ver todos os logs" ON logs;
DROP POLICY IF EXISTS "Sistema pode inserir logs" ON logs;

CREATE POLICY "Users can read their logs" ON logs
  FOR SELECT
  TO authenticated
  USING (user_id_owner = auth.uid());

CREATE POLICY "Users can insert their logs" ON logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id_owner = auth.uid());

-- Atualizar triggers para incluir user_id automaticamente

-- Trigger para comanda_itens incluir user_id da comanda
CREATE OR REPLACE FUNCTION set_comanda_item_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Definir user_id baseado na comanda
  SELECT user_id INTO NEW.user_id
  FROM comandas 
  WHERE id = NEW.comanda_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_comanda_item_user_id_trigger ON comanda_itens;
CREATE TRIGGER set_comanda_item_user_id_trigger
  BEFORE INSERT ON comanda_itens
  FOR EACH ROW
  EXECUTE FUNCTION set_comanda_item_user_id();

-- Trigger para vendas incluir user_id da comanda
CREATE OR REPLACE FUNCTION set_venda_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Definir user_id baseado na comanda
  SELECT user_id INTO NEW.user_id
  FROM comandas 
  WHERE id = NEW.comanda_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_venda_user_id_trigger ON vendas;
CREATE TRIGGER set_venda_user_id_trigger
  BEFORE INSERT ON vendas
  FOR EACH ROW
  EXECUTE FUNCTION set_venda_user_id();

-- Trigger para produto_insumos incluir user_id do produto
CREATE OR REPLACE FUNCTION set_produto_insumo_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Definir user_id baseado no produto
  SELECT user_id INTO NEW.user_id
  FROM produtos 
  WHERE id = NEW.produto_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_produto_insumo_user_id_trigger ON produto_insumos;
CREATE TRIGGER set_produto_insumo_user_id_trigger
  BEFORE INSERT ON produto_insumos
  FOR EACH ROW
  EXECUTE FUNCTION set_produto_insumo_user_id();