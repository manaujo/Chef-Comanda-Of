/*
  # Adicionar colunas user_id faltantes

  1. Tabelas Afetadas
    - `funcionarios_simples` - adicionar user_id
    - `insumos` - adicionar user_id  
    - `entradas_estoque` - adicionar user_id
    - `saidas_estoque` - adicionar user_id
    - `turnos` - adicionar user_id (se não existir)

  2. Segurança
    - Atualizar políticas RLS para filtrar por user_id
    - Adicionar triggers para definir user_id automaticamente

  3. Dados Existentes
    - Manter dados existentes com user_id NULL temporariamente
    - Administradores podem migrar dados manualmente se necessário
*/

-- Adicionar user_id na tabela funcionarios_simples
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'funcionarios_simples' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE funcionarios_simples ADD COLUMN user_id uuid REFERENCES auth.users(id);
    CREATE INDEX IF NOT EXISTS idx_funcionarios_simples_user_id ON funcionarios_simples(user_id);
  END IF;
END $$;

-- Adicionar user_id na tabela insumos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'insumos' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE insumos ADD COLUMN user_id uuid REFERENCES auth.users(id);
    CREATE INDEX IF NOT EXISTS idx_insumos_user_id ON insumos(user_id);
  END IF;
END $$;

-- Adicionar user_id na tabela entradas_estoque
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'entradas_estoque' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE entradas_estoque ADD COLUMN user_id uuid REFERENCES auth.users(id);
    CREATE INDEX IF NOT EXISTS idx_entradas_estoque_user_id ON entradas_estoque(user_id);
  END IF;
END $$;

-- Adicionar user_id na tabela saidas_estoque
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'saidas_estoque' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE saidas_estoque ADD COLUMN user_id uuid REFERENCES auth.users(id);
    CREATE INDEX IF NOT EXISTS idx_saidas_estoque_user_id ON saidas_estoque(user_id);
  END IF;
END $$;

-- Verificar e adicionar user_id na tabela turnos se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'turnos' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE turnos ADD COLUMN user_id uuid REFERENCES auth.users(id);
    CREATE INDEX IF NOT EXISTS idx_turnos_user_id ON turnos(user_id);
  END IF;
END $$;

-- Função para definir user_id automaticamente
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers para definir user_id automaticamente em inserções
DROP TRIGGER IF EXISTS set_funcionarios_simples_user_id ON funcionarios_simples;
CREATE TRIGGER set_funcionarios_simples_user_id
  BEFORE INSERT ON funcionarios_simples
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

DROP TRIGGER IF EXISTS set_insumos_user_id ON insumos;
CREATE TRIGGER set_insumos_user_id
  BEFORE INSERT ON insumos
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

DROP TRIGGER IF EXISTS set_entradas_estoque_user_id ON entradas_estoque;
CREATE TRIGGER set_entradas_estoque_user_id
  BEFORE INSERT ON entradas_estoque
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

DROP TRIGGER IF EXISTS set_saidas_estoque_user_id ON saidas_estoque;
CREATE TRIGGER set_saidas_estoque_user_id
  BEFORE INSERT ON saidas_estoque
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

DROP TRIGGER IF EXISTS set_turnos_user_id ON turnos;
CREATE TRIGGER set_turnos_user_id
  BEFORE INSERT ON turnos
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

-- Atualizar políticas RLS para funcionarios_simples
DROP POLICY IF EXISTS "Administrators can manage funcionarios_simples" ON funcionarios_simples;
DROP POLICY IF EXISTS "Users can read funcionarios_simples" ON funcionarios_simples;

CREATE POLICY "Users can manage their funcionarios_simples"
  ON funcionarios_simples
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Atualizar políticas RLS para insumos
DROP POLICY IF EXISTS "Users can delete insumos" ON insumos;
DROP POLICY IF EXISTS "Users can insert insumos" ON insumos;
DROP POLICY IF EXISTS "Users can read insumos" ON insumos;
DROP POLICY IF EXISTS "Users can update insumos" ON insumos;

CREATE POLICY "Users can manage their insumos"
  ON insumos
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Atualizar políticas RLS para entradas_estoque
DROP POLICY IF EXISTS "Estoque users can manage entradas" ON entradas_estoque;
DROP POLICY IF EXISTS "Estoque users can read entradas" ON entradas_estoque;

CREATE POLICY "Users can manage their entradas_estoque"
  ON entradas_estoque
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Atualizar políticas RLS para saidas_estoque
DROP POLICY IF EXISTS "Estoque users can manage saidas" ON saidas_estoque;
DROP POLICY IF EXISTS "Estoque users can read saidas" ON saidas_estoque;

CREATE POLICY "Users can manage their saidas_estoque"
  ON saidas_estoque
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Atualizar políticas RLS para turnos (se necessário)
DROP POLICY IF EXISTS "Users can delete turnos" ON turnos;
DROP POLICY IF EXISTS "Users can insert turnos" ON turnos;
DROP POLICY IF EXISTS "Users can read turnos" ON turnos;
DROP POLICY IF EXISTS "Users can update turnos" ON turnos;

CREATE POLICY "Users can manage their turnos"
  ON turnos
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());