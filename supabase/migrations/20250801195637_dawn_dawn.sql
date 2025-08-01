/*
  # Criar todas as tabelas ausentes e relacionamentos

  1. Tabelas Principais
    - `profiles` - Perfis de usuários
    - `funcionarios_simples` - Funcionários simplificados
    - `entradas_estoque` - Entradas de estoque
    - `saidas_estoque` - Saídas de estoque
    - `historico_turnos` - Histórico de turnos

  2. Relacionamentos
    - Corrigir foreign keys entre tabelas
    - Adicionar campos user_id onde necessário
    - Estabelecer relacionamentos corretos

  3. Segurança
    - Habilitar RLS em todas as tabelas
    - Criar políticas adequadas
    - Garantir isolamento por usuário
*/

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar tipos ENUM se não existirem
DO $$ BEGIN
  CREATE TYPE user_type AS ENUM ('administrador', 'garcom', 'caixa', 'estoque', 'cozinha');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE funcionario_tipo AS ENUM ('garcom', 'caixa', 'cozinha', 'estoque');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE mesa_status AS ENUM ('livre', 'ocupada', 'reservada', 'manutencao', 'aguardando_pagamento', 'fechada');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE comanda_status AS ENUM ('aberta', 'fechada', 'cancelada', 'em_preparo', 'pronta', 'pronto_para_fechamento');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE item_status AS ENUM ('pendente', 'recebido', 'em_preparo', 'pronto', 'entregue', 'cancelado', 'enviado', 'preparando', 'aguardando');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE unidade_medida AS ENUM ('kg', 'g', 'l', 'ml', 'un', 'cx', 'pct');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE tipo_acao AS ENUM ('criacao', 'edicao', 'exclusao', 'cancelamento', 'login', 'logout');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para definir user_id automaticamente
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se usuário é administrador
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND tipo = 'administrador' AND ativo = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. TABELA PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  nome_completo text NOT NULL,
  nome_restaurante text NOT NULL,
  cpf text NOT NULL,
  telefone text NOT NULL,
  tipo user_type DEFAULT 'administrador',
  ativo boolean DEFAULT true,
  data_nascimento date,
  endereco text,
  cidade text,
  estado text,
  cep text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Índices
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_tipo ON profiles(tipo);
CREATE INDEX IF NOT EXISTS idx_profiles_ativo ON profiles(ativo);

-- Trigger
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 2. TABELA CATEGORIAS (garantir que existe com user_id)
CREATE TABLE IF NOT EXISTS categorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  cor text DEFAULT '#6B7280',
  ativo boolean DEFAULT true,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Adicionar user_id se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categorias' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE categorias ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Habilitar RLS
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "Users can manage their categories" ON categorias;
CREATE POLICY "Users can manage their categories"
  ON categorias
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Índices
CREATE INDEX IF NOT EXISTS idx_categorias_user_id ON categorias(user_id);
CREATE INDEX IF NOT EXISTS idx_categorias_ativo ON categorias(ativo);

-- Trigger
DROP TRIGGER IF EXISTS update_categorias_updated_at ON categorias;
CREATE TRIGGER update_categorias_updated_at 
  BEFORE UPDATE ON categorias 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_categorias_user_id ON categorias;
CREATE TRIGGER set_categorias_user_id
  BEFORE INSERT ON categorias
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

-- 3. TABELA PRODUTOS (garantir que existe com user_id)
CREATE TABLE IF NOT EXISTS produtos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  preco numeric(10,2) NOT NULL CHECK (preco >= 0),
  categoria_id uuid REFERENCES categorias(id),
  categoria_produto text DEFAULT 'prato',
  foto text,
  foto_url text,
  ativo boolean DEFAULT true,
  tempo_preparo integer DEFAULT 15 CHECK (tempo_preparo > 0),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Adicionar campos se não existirem
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'produtos' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE produtos ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'produtos' AND column_name = 'categoria_produto'
  ) THEN
    ALTER TABLE produtos ADD COLUMN categoria_produto text DEFAULT 'prato';
  END IF;
END $$;

-- Habilitar RLS
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "Users can manage their products" ON produtos;
CREATE POLICY "Users can manage their products"
  ON produtos
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Índices
CREATE INDEX IF NOT EXISTS idx_produtos_user_id ON produtos(user_id);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria_id ON produtos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_produtos_ativo ON produtos(ativo);

-- Triggers
DROP TRIGGER IF EXISTS update_produtos_updated_at ON produtos;
CREATE TRIGGER update_produtos_updated_at 
  BEFORE UPDATE ON produtos 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_produtos_user_id ON produtos;
CREATE TRIGGER set_produtos_user_id
  BEFORE INSERT ON produtos
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

-- 4. TABELA MESAS (garantir que existe com user_id)
CREATE TABLE IF NOT EXISTS mesas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero integer NOT NULL,
  nome text,
  capacidade integer DEFAULT 4,
  status mesa_status DEFAULT 'livre',
  comanda_id uuid,
  qr_code text,
  observacoes text,
  ativo boolean DEFAULT true,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Adicionar user_id se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mesas' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE mesas ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Habilitar RLS
ALTER TABLE mesas ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "Users can manage their mesas" ON mesas;
CREATE POLICY "Users can manage their mesas"
  ON mesas
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Índices
CREATE INDEX IF NOT EXISTS idx_mesas_user_id ON mesas(user_id);
CREATE INDEX IF NOT EXISTS idx_mesas_numero_user ON mesas(numero, user_id);
CREATE INDEX IF NOT EXISTS idx_mesas_status ON mesas(status);
CREATE INDEX IF NOT EXISTS idx_mesas_comanda_id ON mesas(comanda_id);

-- Triggers
DROP TRIGGER IF EXISTS update_mesas_updated_at ON mesas;
CREATE TRIGGER update_mesas_updated_at 
  BEFORE UPDATE ON mesas 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_mesas_user_id ON mesas;
CREATE TRIGGER set_mesas_user_id
  BEFORE INSERT ON mesas
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

-- 5. TABELA FUNCIONARIOS_SIMPLES
CREATE TABLE IF NOT EXISTS funcionarios_simples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  tipo funcionario_tipo NOT NULL,
  ativo boolean DEFAULT true,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE funcionarios_simples ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can manage their funcionarios_simples"
  ON funcionarios_simples
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Índices
CREATE INDEX IF NOT EXISTS idx_funcionarios_simples_user_id ON funcionarios_simples(user_id);
CREATE INDEX IF NOT EXISTS idx_funcionarios_simples_tipo ON funcionarios_simples(tipo);
CREATE INDEX IF NOT EXISTS idx_funcionarios_simples_ativo ON funcionarios_simples(ativo);

-- Triggers
CREATE TRIGGER update_funcionarios_simples_updated_at 
  BEFORE UPDATE ON funcionarios_simples 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_funcionarios_simples_user_id
  BEFORE INSERT ON funcionarios_simples
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

-- 6. TABELA COMANDAS (garantir que existe com todos os campos)
CREATE TABLE IF NOT EXISTS comandas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero serial,
  mesa_id uuid REFERENCES mesas(id),
  garcom_id uuid REFERENCES profiles(id),
  garcom_funcionario_id uuid REFERENCES funcionarios_simples(id),
  status comanda_status DEFAULT 'aberta',
  observacoes text,
  data_abertura timestamptz DEFAULT now(),
  data_fechamento timestamptz,
  valor_total numeric(10,2) DEFAULT 0,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Adicionar campos se não existirem
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'comandas' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE comandas ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'comandas' AND column_name = 'garcom_funcionario_id'
  ) THEN
    ALTER TABLE comandas ADD COLUMN garcom_funcionario_id uuid REFERENCES funcionarios_simples(id);
  END IF;
END $$;

-- Habilitar RLS
ALTER TABLE comandas ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "Users can manage their comandas" ON comandas;
CREATE POLICY "Users can manage their comandas"
  ON comandas
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Índices
CREATE INDEX IF NOT EXISTS idx_comandas_user_id ON comandas(user_id);
CREATE INDEX IF NOT EXISTS idx_comandas_mesa_id ON comandas(mesa_id);
CREATE INDEX IF NOT EXISTS idx_comandas_garcom_id ON comandas(garcom_id);
CREATE INDEX IF NOT EXISTS idx_comandas_garcom_funcionario_id ON comandas(garcom_funcionario_id);
CREATE INDEX IF NOT EXISTS idx_comandas_status ON comandas(status);

-- Triggers
DROP TRIGGER IF EXISTS update_comandas_updated_at ON comandas;
CREATE TRIGGER update_comandas_updated_at 
  BEFORE UPDATE ON comandas 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_comandas_user_id ON comandas;
CREATE TRIGGER set_comandas_user_id
  BEFORE INSERT ON comandas
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

-- 7. TABELA COMANDA_ITENS (garantir que existe com todos os campos)
CREATE TABLE IF NOT EXISTS comanda_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comanda_id uuid REFERENCES comandas(id) ON DELETE CASCADE,
  produto_id uuid REFERENCES produtos(id),
  quantidade integer NOT NULL DEFAULT 1,
  preco_unitario numeric(10,2) NOT NULL,
  status item_status DEFAULT 'pendente',
  enviado_cozinha boolean DEFAULT false,
  observacoes text,
  cancelado_por text,
  motivo_cancelamento text,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT comanda_itens_quantidade_check CHECK (quantidade > 0),
  CONSTRAINT comanda_itens_preco_check CHECK (preco_unitario >= 0)
);

-- Adicionar campos se não existirem
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'comanda_itens' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE comanda_itens ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'comanda_itens' AND column_name = 'enviado_cozinha'
  ) THEN
    ALTER TABLE comanda_itens ADD COLUMN enviado_cozinha boolean DEFAULT false;
  END IF;
END $$;

-- Habilitar RLS
ALTER TABLE comanda_itens ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "Users can manage their comanda_itens" ON comanda_itens;
CREATE POLICY "Users can manage their comanda_itens"
  ON comanda_itens
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Índices
CREATE INDEX IF NOT EXISTS idx_comanda_itens_user_id ON comanda_itens(user_id);
CREATE INDEX IF NOT EXISTS idx_comanda_itens_comanda_id ON comanda_itens(comanda_id);
CREATE INDEX IF NOT EXISTS idx_comanda_itens_produto_id ON comanda_itens(produto_id);
CREATE INDEX IF NOT EXISTS idx_comanda_itens_status ON comanda_itens(status);
CREATE INDEX IF NOT EXISTS idx_comanda_itens_enviado_cozinha ON comanda_itens(enviado_cozinha);

-- Triggers
DROP TRIGGER IF EXISTS update_comanda_itens_updated_at ON comanda_itens;
CREATE TRIGGER update_comanda_itens_updated_at 
  BEFORE UPDATE ON comanda_itens 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger especial para definir user_id baseado na comanda
CREATE OR REPLACE FUNCTION set_comanda_item_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    SELECT user_id INTO NEW.user_id
    FROM comandas 
    WHERE id = NEW.comanda_id;
    
    IF NEW.user_id IS NULL THEN
      NEW.user_id = auth.uid();
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_comanda_item_user_id_trigger ON comanda_itens;
CREATE TRIGGER set_comanda_item_user_id_trigger
  BEFORE INSERT ON comanda_itens
  FOR EACH ROW
  EXECUTE FUNCTION set_comanda_item_user_id();

-- 8. TABELA INSUMOS (garantir que existe com user_id)
CREATE TABLE IF NOT EXISTS insumos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  unidade unidade_medida NOT NULL DEFAULT 'un',
  preco_unitario numeric(10,4) NOT NULL,
  quantidade_estoque numeric(10,4) DEFAULT 0,
  estoque_minimo numeric(10,4) DEFAULT 0,
  saldo_atual numeric(10,4) DEFAULT 0,
  quantidade_minima numeric(10,4) DEFAULT 0,
  fornecedor text,
  ativo boolean DEFAULT true,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT insumos_preco_check CHECK (preco_unitario >= 0),
  CONSTRAINT insumos_quantidade_check CHECK (quantidade_estoque >= 0),
  CONSTRAINT insumos_estoque_minimo_check CHECK (estoque_minimo >= 0)
);

-- Adicionar user_id se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'insumos' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE insumos ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Adicionar campos de saldo se não existirem
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

-- Habilitar RLS
ALTER TABLE insumos ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "Users can manage their insumos" ON insumos;
CREATE POLICY "Users can manage their insumos"
  ON insumos
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Índices
CREATE INDEX IF NOT EXISTS idx_insumos_user_id ON insumos(user_id);
CREATE INDEX IF NOT EXISTS idx_insumos_nome ON insumos(nome);
CREATE INDEX IF NOT EXISTS idx_insumos_ativo ON insumos(ativo);

-- Triggers
DROP TRIGGER IF EXISTS update_insumos_updated_at ON insumos;
CREATE TRIGGER update_insumos_updated_at 
  BEFORE UPDATE ON insumos 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_insumos_user_id ON insumos;
CREATE TRIGGER set_insumos_user_id
  BEFORE INSERT ON insumos
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

-- 9. TABELA ENTRADAS_ESTOQUE
CREATE TABLE IF NOT EXISTS entradas_estoque (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  insumo_id uuid NOT NULL REFERENCES insumos(id) ON DELETE CASCADE,
  quantidade numeric(10,4) NOT NULL CHECK (quantidade > 0),
  valor_total numeric(10,2) NOT NULL CHECK (valor_total >= 0),
  valor_unitario numeric(10,4) GENERATED ALWAYS AS (valor_total / quantidade) STORED,
  observacoes text,
  data_entrada timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE entradas_estoque ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can manage their entradas_estoque"
  ON entradas_estoque
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Índices
CREATE INDEX IF NOT EXISTS idx_entradas_estoque_user_id ON entradas_estoque(user_id);
CREATE INDEX IF NOT EXISTS idx_entradas_estoque_insumo_id ON entradas_estoque(insumo_id);
CREATE INDEX IF NOT EXISTS idx_entradas_estoque_data_entrada ON entradas_estoque(data_entrada);

-- Trigger
CREATE TRIGGER set_entradas_estoque_user_id
  BEFORE INSERT ON entradas_estoque
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

-- 10. TABELA SAIDAS_ESTOQUE
CREATE TABLE IF NOT EXISTS saidas_estoque (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  insumo_id uuid NOT NULL REFERENCES insumos(id) ON DELETE CASCADE,
  quantidade numeric(10,4) NOT NULL CHECK (quantidade > 0),
  motivo text NOT NULL,
  observacoes text,
  data_saida timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE saidas_estoque ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can manage their saidas_estoque"
  ON saidas_estoque
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Índices
CREATE INDEX IF NOT EXISTS idx_saidas_estoque_user_id ON saidas_estoque(user_id);
CREATE INDEX IF NOT EXISTS idx_saidas_estoque_insumo_id ON saidas_estoque(insumo_id);
CREATE INDEX IF NOT EXISTS idx_saidas_estoque_data_saida ON saidas_estoque(data_saida);

-- Trigger
CREATE TRIGGER set_saidas_estoque_user_id
  BEFORE INSERT ON saidas_estoque
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

-- 11. TABELA TURNOS (garantir que existe com todos os campos)
CREATE TABLE IF NOT EXISTS turnos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operador_id uuid REFERENCES profiles(id),
  operador_funcionario_id uuid REFERENCES funcionarios_simples(id),
  data_abertura timestamptz DEFAULT now(),
  data_fechamento timestamptz,
  valor_inicial numeric(10,2) DEFAULT 0,
  valor_fechamento numeric(10,2),
  observacoes text,
  ativo boolean DEFAULT true,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT turnos_valor_inicial_check CHECK (valor_inicial >= 0),
  CONSTRAINT turnos_valor_fechamento_check CHECK (valor_fechamento IS NULL OR valor_fechamento >= 0)
);

-- Adicionar campos se não existirem
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'turnos' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE turnos ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'turnos' AND column_name = 'operador_funcionario_id'
  ) THEN
    ALTER TABLE turnos ADD COLUMN operador_funcionario_id uuid REFERENCES funcionarios_simples(id);
  END IF;
END $$;

-- Habilitar RLS
ALTER TABLE turnos ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "Users can manage their turnos" ON turnos;
CREATE POLICY "Users can manage their turnos"
  ON turnos
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Índices
CREATE INDEX IF NOT EXISTS idx_turnos_user_id ON turnos(user_id);
CREATE INDEX IF NOT EXISTS idx_turnos_operador_id ON turnos(operador_id);
CREATE INDEX IF NOT EXISTS idx_turnos_operador_funcionario_id ON turnos(operador_funcionario_id);
CREATE INDEX IF NOT EXISTS idx_turnos_ativo ON turnos(ativo);

-- Constraint para garantir apenas um turno ativo por usuário
DROP INDEX IF EXISTS idx_turnos_ativo_user_unique;
CREATE UNIQUE INDEX idx_turnos_ativo_user_unique 
  ON turnos(user_id, ativo) 
  WHERE ativo = true AND data_fechamento IS NULL;

-- Trigger
CREATE TRIGGER set_turnos_user_id
  BEFORE INSERT ON turnos
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

-- 12. TABELA VENDAS (garantir que existe com todos os campos)
CREATE TABLE IF NOT EXISTS vendas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comanda_id uuid REFERENCES comandas(id),
  turno_id uuid REFERENCES turnos(id),
  operador_id uuid REFERENCES profiles(id),
  valor_total numeric(10,2) NOT NULL,
  valor_desconto numeric(10,2) DEFAULT 0,
  valor_final numeric(10,2) NOT NULL,
  forma_pagamento text NOT NULL,
  data_venda timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT vendas_valor_total_check CHECK (valor_total >= 0),
  CONSTRAINT vendas_valor_desconto_check CHECK (valor_desconto >= 0),
  CONSTRAINT vendas_valor_final_check CHECK (valor_final >= 0)
);

-- Adicionar user_id se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendas' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE vendas ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Habilitar RLS
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "Users can manage their vendas" ON vendas;
CREATE POLICY "Users can manage their vendas"
  ON vendas
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Índices
CREATE INDEX IF NOT EXISTS idx_vendas_user_id ON vendas(user_id);
CREATE INDEX IF NOT EXISTS idx_vendas_comanda_id ON vendas(comanda_id);
CREATE INDEX IF NOT EXISTS idx_vendas_turno_id ON vendas(turno_id);
CREATE INDEX IF NOT EXISTS idx_vendas_operador_id ON vendas(operador_id);
CREATE INDEX IF NOT EXISTS idx_vendas_data_venda ON vendas(data_venda);

-- Trigger especial para definir user_id baseado na comanda
CREATE OR REPLACE FUNCTION set_venda_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    SELECT user_id INTO NEW.user_id
    FROM comandas 
    WHERE id = NEW.comanda_id;
    
    IF NEW.user_id IS NULL THEN
      NEW.user_id = auth.uid();
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_venda_user_id_trigger ON vendas;
CREATE TRIGGER set_venda_user_id_trigger
  BEFORE INSERT ON vendas
  FOR EACH ROW
  EXECUTE FUNCTION set_venda_user_id();

-- 13. CORRIGIR FOREIGN KEY PARA MESAS -> COMANDAS
-- Adicionar foreign key constraint para comanda_id em mesas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'mesas_comanda_id_fkey' 
    AND table_name = 'mesas'
  ) THEN
    ALTER TABLE mesas 
    ADD CONSTRAINT mesas_comanda_id_fkey 
    FOREIGN KEY (comanda_id) REFERENCES comandas(id);
  END IF;
END $$;

-- 14. FUNÇÕES PARA ATUALIZAR VALOR TOTAL DA COMANDA
CREATE OR REPLACE FUNCTION update_comanda_valor_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE comandas 
  SET valor_total = (
    SELECT COALESCE(SUM(quantidade * preco_unitario), 0)
    FROM comanda_itens 
    WHERE comanda_id = COALESCE(NEW.comanda_id, OLD.comanda_id)
    AND status NOT IN ('cancelado')
  ),
  updated_at = now()
  WHERE id = COALESCE(NEW.comanda_id, OLD.comanda_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar valor total da comanda
DROP TRIGGER IF EXISTS update_comanda_valor_total_insert ON comanda_itens;
DROP TRIGGER IF EXISTS update_comanda_valor_total_update ON comanda_itens;
DROP TRIGGER IF EXISTS update_comanda_valor_total_delete ON comanda_itens;

CREATE TRIGGER update_comanda_valor_total_insert
  AFTER INSERT ON comanda_itens
  FOR EACH ROW
  EXECUTE FUNCTION update_comanda_valor_total();

CREATE TRIGGER update_comanda_valor_total_update
  AFTER UPDATE ON comanda_itens
  FOR EACH ROW
  EXECUTE FUNCTION update_comanda_valor_total();

CREATE TRIGGER update_comanda_valor_total_delete
  AFTER DELETE ON comanda_itens
  FOR EACH ROW
  EXECUTE FUNCTION update_comanda_valor_total();

-- 15. INSERIR DADOS BÁSICOS SE NÃO EXISTIREM

-- Inserir categorias padrão
INSERT INTO categorias (nome, descricao, cor) VALUES
  ('Pratos Principais', 'Pratos principais do cardápio', '#dc2626'),
  ('Bebidas', 'Bebidas em geral', '#2563eb'),
  ('Sobremesas', 'Doces e sobremesas', '#7c3aed'),
  ('Petiscos', 'Aperitivos e petiscos', '#ea580c')
ON CONFLICT DO NOTHING;

-- Inserir mesas padrão (apenas se não existirem mesas para o usuário)
DO $$
DECLARE
    current_user_id uuid;
    mesa_count integer;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NOT NULL THEN
        SELECT COUNT(*) INTO mesa_count
        FROM mesas 
        WHERE user_id = current_user_id;
        
        IF mesa_count = 0 THEN
            INSERT INTO mesas (numero, nome, capacidade, status, user_id) VALUES
                (1, 'Mesa 01', 4, 'livre', current_user_id),
                (2, 'Mesa 02', 4, 'livre', current_user_id),
                (3, 'Mesa 03', 2, 'livre', current_user_id),
                (4, 'Mesa 04', 6, 'livre', current_user_id),
                (5, 'Mesa 05', 4, 'livre', current_user_id)
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;
END $$;

-- Inserir funcionários padrão (apenas se não existirem para o usuário)
DO $$
DECLARE
    current_user_id uuid;
    funcionario_count integer;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NOT NULL THEN
        SELECT COUNT(*) INTO funcionario_count
        FROM funcionarios_simples 
        WHERE user_id = current_user_id;
        
        IF funcionario_count = 0 THEN
            INSERT INTO funcionarios_simples (nome, tipo, user_id) VALUES
                ('João Silva', 'garcom', current_user_id),
                ('Maria Santos', 'garcom', current_user_id),
                ('Pedro Costa', 'caixa', current_user_id),
                ('Ana Oliveira', 'caixa', current_user_id),
                ('Carlos Lima', 'cozinha', current_user_id)
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;
END $$;

-- 16. FUNÇÃO PARA ATUALIZAR SALDO DO ESTOQUE
CREATE OR REPLACE FUNCTION update_saldo_entrada()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE insumos 
  SET saldo_atual = saldo_atual + NEW.quantidade,
      preco_unitario = NEW.valor_unitario,
      updated_at = now()
  WHERE id = NEW.insumo_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_saldo_saida()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE insumos 
  SET saldo_atual = saldo_atual - NEW.quantidade,
      updated_at = now()
  WHERE id = NEW.insumo_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para estoque
DROP TRIGGER IF EXISTS trigger_update_saldo_entrada ON entradas_estoque;
CREATE TRIGGER trigger_update_saldo_entrada
  AFTER INSERT ON entradas_estoque
  FOR EACH ROW
  EXECUTE FUNCTION update_saldo_entrada();

DROP TRIGGER IF EXISTS trigger_update_saldo_saida ON saidas_estoque;
CREATE TRIGGER trigger_update_saldo_saida
  AFTER INSERT ON saidas_estoque
  FOR EACH ROW
  EXECUTE FUNCTION update_saldo_saida();

-- 17. FUNÇÃO PARA ATUALIZAR STATUS DA MESA
CREATE OR REPLACE FUNCTION update_mesa_comanda_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando uma comanda é criada, vincular à mesa e marcar como ocupada
  IF TG_OP = 'INSERT' AND NEW.mesa_id IS NOT NULL THEN
    UPDATE mesas 
    SET status = 'ocupada', comanda_id = NEW.id, updated_at = now()
    WHERE id = NEW.mesa_id AND status = 'livre';
  END IF;
  
  -- Quando uma comanda é fechada, liberar a mesa
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    IF NEW.status = 'fechada' AND NEW.mesa_id IS NOT NULL THEN
      UPDATE mesas 
      SET status = 'livre', comanda_id = NULL, updated_at = now()
      WHERE id = NEW.mesa_id;
    ELSIF NEW.status = 'pronto_para_fechamento' AND NEW.mesa_id IS NOT NULL THEN
      UPDATE mesas 
      SET status = 'aguardando_pagamento', updated_at = now()
      WHERE id = NEW.mesa_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar status da mesa
DROP TRIGGER IF EXISTS update_mesa_comanda_status_trigger ON comandas;
CREATE TRIGGER update_mesa_comanda_status_trigger
  AFTER INSERT OR UPDATE ON comandas
  FOR EACH ROW
  EXECUTE FUNCTION update_mesa_comanda_status();

-- 18. MIGRAR DADOS EXISTENTES
-- Atualizar saldo_atual dos insumos existentes
UPDATE insumos 
SET saldo_atual = quantidade_estoque, quantidade_minima = estoque_minimo 
WHERE saldo_atual IS NULL OR quantidade_minima IS NULL;

-- 19. VERIFICAÇÃO FINAL
-- Função para verificar se todas as tabelas foram criadas
CREATE OR REPLACE FUNCTION verify_tables_exist()
RETURNS text AS $$
DECLARE
    result text := 'Verificação das tabelas:' || E'\n';
    table_exists boolean;
BEGIN
    -- Verificar cada tabela
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'profiles' AND table_schema = 'public'
    ) INTO table_exists;
    result := result || '- profiles: ' || CASE WHEN table_exists THEN 'OK' ELSE 'FALTANDO' END || E'\n';
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'funcionarios_simples' AND table_schema = 'public'
    ) INTO table_exists;
    result := result || '- funcionarios_simples: ' || CASE WHEN table_exists THEN 'OK' ELSE 'FALTANDO' END || E'\n';
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'entradas_estoque' AND table_schema = 'public'
    ) INTO table_exists;
    result := result || '- entradas_estoque: ' || CASE WHEN table_exists THEN 'OK' ELSE 'FALTANDO' END || E'\n';
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'saidas_estoque' AND table_schema = 'public'
    ) INTO table_exists;
    result := result || '- saidas_estoque: ' || CASE WHEN table_exists THEN 'OK' ELSE 'FALTANDO' END || E'\n';
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Executar verificação
SELECT verify_tables_exist();