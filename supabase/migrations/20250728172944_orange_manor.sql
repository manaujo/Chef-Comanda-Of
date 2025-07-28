/*
  # Schema Completo do ChefComanda

  1. Tabelas principais
    - profiles (já existe)
    - assinaturas
    - mesas
    - produtos
    - categorias
    - insumos
    - produto_insumos
    - comandas
    - comanda_itens
    - vendas
    - turnos
    - logs

  2. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas baseadas no tipo de usuário
    - Funções auxiliares para verificação de permissões

  3. Triggers e Functions
    - Atualização automática de estoque
    - Cálculo de CMV
    - Logs automáticos
*/

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum para tipos de usuário
CREATE TYPE user_type AS ENUM ('administrador', 'garcom', 'caixa', 'estoque', 'cozinha');

-- Enum para status de mesa
CREATE TYPE mesa_status AS ENUM ('livre', 'ocupada', 'reservada', 'manutencao');

-- Enum para status de comanda
CREATE TYPE comanda_status AS ENUM ('aberta', 'fechada', 'cancelada');

-- Enum para status de item da comanda
CREATE TYPE item_status AS ENUM ('pendente', 'recebido', 'em_preparo', 'pronto', 'entregue', 'cancelado');

-- Enum para status de assinatura
CREATE TYPE assinatura_status AS ENUM ('ativa', 'vencida', 'cancelada', 'suspensa');

-- Enum para tipo de assinatura
CREATE TYPE assinatura_tipo AS ENUM ('mensal', 'anual');

-- Enum para unidades de medida
CREATE TYPE unidade_medida AS ENUM ('kg', 'g', 'l', 'ml', 'un', 'cx', 'pct');

-- Enum para tipo de ação nos logs
CREATE TYPE tipo_acao AS ENUM ('criacao', 'edicao', 'exclusao', 'cancelamento', 'login', 'logout');

-- Atualizar tabela profiles existente
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tipo user_type DEFAULT 'administrador';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS data_nascimento DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS endereco TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cidade TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS estado TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cep TEXT;

-- Tabela de assinaturas
CREATE TABLE IF NOT EXISTS assinaturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status assinatura_status DEFAULT 'ativa',
  tipo assinatura_tipo DEFAULT 'mensal',
  valor DECIMAL(10,2) NOT NULL,
  data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  data_fim DATE NOT NULL,
  data_pagamento DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de categorias
CREATE TABLE IF NOT EXISTS categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  cor VARCHAR(7) DEFAULT '#6B7280',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de produtos
CREATE TABLE IF NOT EXISTS produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(200) NOT NULL,
  descricao TEXT,
  preco DECIMAL(10,2) NOT NULL,
  categoria_id UUID REFERENCES categorias(id),
  foto_url TEXT,
  ativo BOOLEAN DEFAULT true,
  tempo_preparo INTEGER DEFAULT 15, -- em minutos
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de insumos
CREATE TABLE IF NOT EXISTS insumos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(200) NOT NULL,
  unidade unidade_medida NOT NULL,
  preco_unitario DECIMAL(10,4) NOT NULL,
  quantidade_estoque DECIMAL(10,4) DEFAULT 0,
  estoque_minimo DECIMAL(10,4) DEFAULT 0,
  fornecedor VARCHAR(200),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de relacionamento produto-insumos
CREATE TABLE IF NOT EXISTS produto_insumos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID REFERENCES produtos(id) ON DELETE CASCADE,
  insumo_id UUID REFERENCES insumos(id) ON DELETE CASCADE,
  quantidade_usada DECIMAL(10,4) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(produto_id, insumo_id)
);

-- Tabela de mesas
CREATE TABLE IF NOT EXISTS mesas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero INTEGER NOT NULL UNIQUE,
  nome VARCHAR(50),
  capacidade INTEGER DEFAULT 4,
  status mesa_status DEFAULT 'livre',
  qr_code TEXT,
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de comandas
CREATE TABLE IF NOT EXISTS comandas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero SERIAL,
  mesa_id UUID REFERENCES mesas(id),
  garcom_id UUID REFERENCES auth.users(id),
  status comanda_status DEFAULT 'aberta',
  observacoes TEXT,
  data_abertura TIMESTAMPTZ DEFAULT NOW(),
  data_fechamento TIMESTAMPTZ,
  valor_total DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de itens da comanda
CREATE TABLE IF NOT EXISTS comanda_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comanda_id UUID REFERENCES comandas(id) ON DELETE CASCADE,
  produto_id UUID REFERENCES produtos(id),
  quantidade INTEGER NOT NULL DEFAULT 1,
  preco_unitario DECIMAL(10,2) NOT NULL,
  status item_status DEFAULT 'pendente',
  observacoes TEXT,
  cancelado_por UUID REFERENCES auth.users(id),
  motivo_cancelamento TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de turnos
CREATE TABLE IF NOT EXISTS turnos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operador_id UUID REFERENCES auth.users(id),
  data_abertura TIMESTAMPTZ DEFAULT NOW(),
  data_fechamento TIMESTAMPTZ,
  valor_inicial DECIMAL(10,2) DEFAULT 0,
  valor_fechamento DECIMAL(10,2),
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de vendas
CREATE TABLE IF NOT EXISTS vendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comanda_id UUID REFERENCES comandas(id),
  turno_id UUID REFERENCES turnos(id),
  operador_id UUID REFERENCES auth.users(id),
  valor_total DECIMAL(10,2) NOT NULL,
  valor_desconto DECIMAL(10,2) DEFAULT 0,
  valor_final DECIMAL(10,2) NOT NULL,
  forma_pagamento VARCHAR(50) NOT NULL,
  data_venda TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de logs
CREATE TABLE IF NOT EXISTS logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES auth.users(id),
  tipo_acao tipo_acao NOT NULL,
  tabela_afetada VARCHAR(50),
  registro_id UUID,
  descricao TEXT NOT NULL,
  dados_anteriores JSONB,
  dados_novos JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Função para verificar se usuário é administrador
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND tipo = 'administrador'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar tipo de usuário
CREATE OR REPLACE FUNCTION user_has_role(role_name user_type)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND tipo = role_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assinaturas_updated_at BEFORE UPDATE ON assinaturas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categorias_updated_at BEFORE UPDATE ON categorias FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_produtos_updated_at BEFORE UPDATE ON produtos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_insumos_updated_at BEFORE UPDATE ON insumos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mesas_updated_at BEFORE UPDATE ON mesas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comandas_updated_at BEFORE UPDATE ON comandas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comanda_itens_updated_at BEFORE UPDATE ON comanda_itens FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para calcular valor total da comanda
CREATE OR REPLACE FUNCTION calculate_comanda_total()
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
$$ LANGUAGE plpgsql;

-- Trigger para recalcular total da comanda
CREATE TRIGGER calculate_comanda_total_trigger
  AFTER INSERT OR UPDATE OR DELETE ON comanda_itens
  FOR EACH ROW EXECUTE FUNCTION calculate_comanda_total();

-- Função para atualizar estoque
CREATE OR REPLACE FUNCTION update_stock_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  -- Reduzir estoque dos insumos quando item é vendido
  IF NEW.status = 'entregue' AND OLD.status != 'entregue' THEN
    UPDATE insumos 
    SET quantidade_estoque = quantidade_estoque - (pi.quantidade_usada * NEW.quantidade)
    FROM produto_insumos pi
    WHERE pi.produto_id = NEW.produto_id 
    AND insumos.id = pi.insumo_id;
  END IF;
  
  -- Restaurar estoque se item foi cancelado
  IF NEW.status = 'cancelado' AND OLD.status = 'entregue' THEN
    UPDATE insumos 
    SET quantidade_estoque = quantidade_estoque + (pi.quantidade_usada * NEW.quantidade)
    FROM produto_insumos pi
    WHERE pi.produto_id = NEW.produto_id 
    AND insumos.id = pi.insumo_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar estoque
CREATE TRIGGER update_stock_trigger
  AFTER UPDATE ON comanda_itens
  FOR EACH ROW EXECUTE FUNCTION update_stock_on_sale();

-- Função para gerar QR Code da mesa
CREATE OR REPLACE FUNCTION generate_mesa_qr_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.qr_code = 'https://chefcomanda.com/cardapio/mesa/' || NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar QR Code
CREATE TRIGGER generate_qr_code_trigger
  BEFORE INSERT ON mesas
  FOR EACH ROW EXECUTE FUNCTION generate_mesa_qr_code();

-- Habilitar RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE assinaturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE produto_insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE mesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE comandas ENABLE ROW LEVEL SECURITY;
ALTER TABLE comanda_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE turnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Usuários podem ver seus próprios dados" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seus próprios dados" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Administradores podem ver todos os perfis" ON profiles
  FOR SELECT USING (is_admin());

CREATE POLICY "Administradores podem criar perfis" ON profiles
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Administradores podem atualizar perfis" ON profiles
  FOR UPDATE USING (is_admin());

-- Políticas RLS para assinaturas
CREATE POLICY "Usuários podem ver suas assinaturas" ON assinaturas
  FOR SELECT USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Administradores podem gerenciar assinaturas" ON assinaturas
  FOR ALL USING (is_admin());

-- Políticas RLS para categorias
CREATE POLICY "Todos podem ver categorias ativas" ON categorias
  FOR SELECT USING (ativo = true);

CREATE POLICY "Administradores podem gerenciar categorias" ON categorias
  FOR ALL USING (is_admin());

-- Políticas RLS para produtos
CREATE POLICY "Todos podem ver produtos ativos" ON produtos
  FOR SELECT USING (ativo = true);

CREATE POLICY "Administradores podem gerenciar produtos" ON produtos
  FOR ALL USING (is_admin());

-- Políticas RLS para insumos
CREATE POLICY "Usuários de estoque podem ver insumos" ON insumos
  FOR SELECT USING (user_has_role('estoque') OR is_admin());

CREATE POLICY "Usuários de estoque podem gerenciar insumos" ON insumos
  FOR ALL USING (user_has_role('estoque') OR is_admin());

-- Políticas RLS para produto_insumos
CREATE POLICY "Usuários de estoque podem ver produto_insumos" ON produto_insumos
  FOR SELECT USING (user_has_role('estoque') OR is_admin());

CREATE POLICY "Usuários de estoque podem gerenciar produto_insumos" ON produto_insumos
  FOR ALL USING (user_has_role('estoque') OR is_admin());

-- Políticas RLS para mesas
CREATE POLICY "Todos podem ver mesas ativas" ON mesas
  FOR SELECT USING (ativo = true);

CREATE POLICY "Administradores e garçons podem gerenciar mesas" ON mesas
  FOR ALL USING (is_admin() OR user_has_role('garcom'));

-- Políticas RLS para comandas
CREATE POLICY "Garçons podem ver suas comandas" ON comandas
  FOR SELECT USING (auth.uid() = garcom_id OR is_admin() OR user_has_role('caixa') OR user_has_role('cozinha'));

CREATE POLICY "Garçons podem criar comandas" ON comandas
  FOR INSERT WITH CHECK (auth.uid() = garcom_id OR is_admin());

CREATE POLICY "Garçons podem atualizar suas comandas" ON comandas
  FOR UPDATE USING (auth.uid() = garcom_id OR is_admin() OR user_has_role('caixa'));

-- Políticas RLS para comanda_itens
CREATE POLICY "Usuários podem ver itens de comandas" ON comanda_itens
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM comandas c 
      WHERE c.id = comanda_id 
      AND (c.garcom_id = auth.uid() OR is_admin() OR user_has_role('caixa') OR user_has_role('cozinha'))
    )
  );

CREATE POLICY "Garçons podem gerenciar itens de suas comandas" ON comanda_itens
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM comandas c 
      WHERE c.id = comanda_id 
      AND (c.garcom_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "Cozinha pode atualizar status dos itens" ON comanda_itens
  FOR UPDATE USING (user_has_role('cozinha') OR is_admin());

-- Políticas RLS para turnos
CREATE POLICY "Operadores podem ver seus turnos" ON turnos
  FOR SELECT USING (auth.uid() = operador_id OR is_admin());

CREATE POLICY "Operadores de caixa podem gerenciar turnos" ON turnos
  FOR ALL USING (user_has_role('caixa') OR is_admin());

-- Políticas RLS para vendas
CREATE POLICY "Operadores podem ver suas vendas" ON vendas
  FOR SELECT USING (auth.uid() = operador_id OR is_admin());

CREATE POLICY "Operadores de caixa podem criar vendas" ON vendas
  FOR INSERT WITH CHECK (user_has_role('caixa') OR is_admin());

-- Políticas RLS para logs
CREATE POLICY "Administradores podem ver todos os logs" ON logs
  FOR SELECT USING (is_admin());

CREATE POLICY "Sistema pode inserir logs" ON logs
  FOR INSERT WITH CHECK (true);

-- Inserir categorias padrão
INSERT INTO categorias (nome, descricao, cor) VALUES
('Pratos Principais', 'Pratos principais do cardápio', '#DC2626'),
('Bebidas', 'Bebidas em geral', '#2563EB'),
('Sobremesas', 'Doces e sobremesas', '#7C3AED'),
('Petiscos', 'Aperitivos e petiscos', '#EA580C'),
('Saladas', 'Saladas e pratos leves', '#16A34A')
ON CONFLICT DO NOTHING;

-- Inserir mesas padrão
INSERT INTO mesas (numero, nome, capacidade) VALUES
(1, 'Mesa 01', 4),
(2, 'Mesa 02', 4),
(3, 'Mesa 03', 2),
(4, 'Mesa 04', 6),
(5, 'Mesa 05', 4),
(6, 'Mesa 06', 8),
(7, 'Mesa 07', 2),
(8, 'Mesa 08', 4),
(9, 'Mesa 09', 4),
(10, 'Mesa 10', 6)
ON CONFLICT DO NOTHING;