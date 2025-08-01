/*
  # Adicionar user_id a todas as tabelas principais

  1. Novas Colunas
    - Adiciona `user_id` às tabelas: produtos, vendas, comandas, categorias, mesas
    - Cria índices para otimização
    - Adiciona foreign keys para auth.users

  2. Triggers
    - Adiciona triggers para definir user_id automaticamente

  3. Políticas RLS
    - Atualiza políticas para filtrar por user_id
    - Garante isolamento completo dos dados
*/

-- Adicionar user_id à tabela produtos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'produtos' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE produtos ADD COLUMN user_id uuid REFERENCES auth.users(id);
    CREATE INDEX IF NOT EXISTS idx_produtos_user_id ON produtos(user_id);
  END IF;
END $$;

-- Adicionar user_id à tabela categorias
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categorias' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE categorias ADD COLUMN user_id uuid REFERENCES auth.users(id);
    CREATE INDEX IF NOT EXISTS idx_categorias_user_id ON categorias(user_id);
  END IF;
END $$;

-- Adicionar user_id à tabela mesas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mesas' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE mesas ADD COLUMN user_id uuid REFERENCES auth.users(id);
    CREATE INDEX IF NOT EXISTS idx_mesas_user_id ON mesas(user_id);
  END IF;
END $$;

-- Adicionar user_id à tabela comandas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'comandas' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE comandas ADD COLUMN user_id uuid REFERENCES auth.users(id);
    CREATE INDEX IF NOT EXISTS idx_comandas_user_id ON comandas(user_id);
  END IF;
END $$;

-- Adicionar user_id à tabela vendas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendas' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE vendas ADD COLUMN user_id uuid REFERENCES auth.users(id);
    CREATE INDEX IF NOT EXISTS idx_vendas_user_id ON vendas(user_id);
  END IF;
END $$;

-- Adicionar user_id à tabela comanda_itens
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'comanda_itens' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE comanda_itens ADD COLUMN user_id uuid REFERENCES auth.users(id);
    CREATE INDEX IF NOT EXISTS idx_comanda_itens_user_id ON comanda_itens(user_id);
  END IF;
END $$;

-- Criar função para definir user_id automaticamente se não existir
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Adicionar triggers para definir user_id automaticamente
DROP TRIGGER IF EXISTS set_produtos_user_id ON produtos;
CREATE TRIGGER set_produtos_user_id
  BEFORE INSERT ON produtos
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

DROP TRIGGER IF EXISTS set_categorias_user_id ON categorias;
CREATE TRIGGER set_categorias_user_id
  BEFORE INSERT ON categorias
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

DROP TRIGGER IF EXISTS set_mesas_user_id ON mesas;
CREATE TRIGGER set_mesas_user_id
  BEFORE INSERT ON mesas
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

DROP TRIGGER IF EXISTS set_comandas_user_id ON comandas;
CREATE TRIGGER set_comandas_user_id
  BEFORE INSERT ON comandas
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

DROP TRIGGER IF EXISTS set_vendas_user_id ON vendas;
CREATE TRIGGER set_vendas_user_id
  BEFORE INSERT ON vendas
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

DROP TRIGGER IF EXISTS set_comanda_itens_user_id ON comanda_itens;
CREATE TRIGGER set_comanda_itens_user_id
  BEFORE INSERT ON comanda_itens
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

-- Atualizar políticas RLS para produtos
DROP POLICY IF EXISTS "Users can manage their products" ON produtos;
CREATE POLICY "Users can manage their products"
  ON produtos
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Atualizar políticas RLS para categorias
DROP POLICY IF EXISTS "Users can insert categories" ON categorias;
DROP POLICY IF EXISTS "Users can read categories" ON categorias;
DROP POLICY IF EXISTS "Users can update categories" ON categorias;
DROP POLICY IF EXISTS "Users can delete categories" ON categorias;

CREATE POLICY "Users can manage their categories"
  ON categorias
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Atualizar políticas RLS para mesas
DROP POLICY IF EXISTS "Users can insert mesas" ON mesas;
DROP POLICY IF EXISTS "Users can read mesas" ON mesas;
DROP POLICY IF EXISTS "Users can update mesas" ON mesas;
DROP POLICY IF EXISTS "Users can delete mesas" ON mesas;

CREATE POLICY "Users can manage their mesas"
  ON mesas
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Atualizar políticas RLS para comandas
DROP POLICY IF EXISTS "Users can insert comandas" ON comandas;
DROP POLICY IF EXISTS "Users can read comandas" ON comandas;
DROP POLICY IF EXISTS "Users can update comandas" ON comandas;
DROP POLICY IF EXISTS "Users can delete comandas" ON comandas;

CREATE POLICY "Users can manage their comandas"
  ON comandas
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Atualizar políticas RLS para vendas
DROP POLICY IF EXISTS "Users can insert vendas" ON vendas;
DROP POLICY IF EXISTS "Users can read vendas" ON vendas;
DROP POLICY IF EXISTS "Users can update vendas" ON vendas;
DROP POLICY IF EXISTS "Users can delete vendas" ON vendas;

CREATE POLICY "Users can manage their vendas"
  ON vendas
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Atualizar políticas RLS para comanda_itens
DROP POLICY IF EXISTS "Users can insert comanda_itens" ON comanda_itens;
DROP POLICY IF EXISTS "Users can read comanda_itens" ON comanda_itens;
DROP POLICY IF EXISTS "Users can update comanda_itens" ON comanda_itens;
DROP POLICY IF EXISTS "Users can delete comanda_itens" ON comanda_itens;

CREATE POLICY "Users can manage their comanda_itens"
  ON comanda_itens
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());