/*
  # Schema inicial do ChefComanda

  1. Novas Tabelas
    - `empresas`
      - `id` (uuid, primary key)
      - `nome` (text)
      - `user_id` (uuid, foreign key to auth.users)
      - `created_at` (timestamp)
    
    - `mesas`
      - `id` (uuid, primary key)
      - `numero` (integer)
      - `status` (text: livre, ocupada, aguardando_pagamento)
      - `empresa_id` (uuid, foreign key)
      - `created_at` (timestamp)
    
    - `funcionarios`
      - `id` (uuid, primary key)
      - `nome` (text)
      - `funcao` (text: garcom, cozinheiro, caixa)
      - `empresa_id` (uuid, foreign key)
      - `created_at` (timestamp)
    
    - `produtos`
      - `id` (uuid, primary key)
      - `nome` (text)
      - `preco` (decimal)
      - `categoria` (text)
      - `ativo` (boolean)
      - `empresa_id` (uuid, foreign key)
      - `created_at` (timestamp)
    
    - `comandas`
      - `id` (uuid, primary key)
      - `mesa_id` (uuid, foreign key)
      - `funcionario_id` (uuid, foreign key)
      - `status` (text: aberta, enviada, finalizada)
      - `total` (decimal)
      - `empresa_id` (uuid, foreign key)
      - `created_at` (timestamp)
    
    - `comanda_itens`
      - `id` (uuid, primary key)
      - `comanda_id` (uuid, foreign key)
      - `produto_id` (uuid, foreign key)
      - `quantidade` (integer)
      - `preco_unitario` (decimal)
      - `observacoes` (text, nullable)
      - `status` (text: pendente, preparando, pronto)
      - `created_at` (timestamp)
    
    - `vendas`
      - `id` (uuid, primary key)
      - `comanda_id` (uuid, foreign key)
      - `total` (decimal)
      - `forma_pagamento` (text: dinheiro, cartao, pix)
      - `empresa_id` (uuid, foreign key)
      - `created_at` (timestamp)
    
    - `estoque`
      - `id` (uuid, primary key)
      - `nome` (text)
      - `quantidade` (decimal)
      - `minimo` (decimal)
      - `unidade` (text)
      - `empresa_id` (uuid, foreign key)
      - `created_at` (timestamp)

  2. Segurança
    - Habilitar RLS em todas as tabelas
    - Políticas baseadas em empresa_id para isolamento multiempresa
*/

-- Criar tabela empresas
CREATE TABLE IF NOT EXISTS empresas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Criar tabela mesas
CREATE TABLE IF NOT EXISTS mesas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero integer NOT NULL,
  status text NOT NULL DEFAULT 'livre' CHECK (status IN ('livre', 'ocupada', 'aguardando_pagamento')),
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(numero, empresa_id)
);

-- Criar tabela funcionarios
CREATE TABLE IF NOT EXISTS funcionarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  funcao text NOT NULL CHECK (funcao IN ('garcom', 'cozinheiro', 'caixa')),
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Criar tabela produtos
CREATE TABLE IF NOT EXISTS produtos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  preco decimal(10,2) NOT NULL,
  categoria text NOT NULL,
  ativo boolean DEFAULT true,
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Criar tabela comandas
CREATE TABLE IF NOT EXISTS comandas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mesa_id uuid REFERENCES mesas(id) ON DELETE CASCADE,
  funcionario_id uuid REFERENCES funcionarios(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'enviada', 'finalizada')),
  total decimal(10,2) DEFAULT 0,
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Criar tabela comanda_itens
CREATE TABLE IF NOT EXISTS comanda_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comanda_id uuid REFERENCES comandas(id) ON DELETE CASCADE,
  produto_id uuid REFERENCES produtos(id) ON DELETE CASCADE,
  quantidade integer NOT NULL DEFAULT 1,
  preco_unitario decimal(10,2) NOT NULL,
  observacoes text,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'preparando', 'pronto')),
  created_at timestamptz DEFAULT now()
);

-- Criar tabela vendas
CREATE TABLE IF NOT EXISTS vendas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comanda_id uuid REFERENCES comandas(id) ON DELETE CASCADE,
  total decimal(10,2) NOT NULL,
  forma_pagamento text NOT NULL CHECK (forma_pagamento IN ('dinheiro', 'cartao', 'pix')),
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Criar tabela estoque
CREATE TABLE IF NOT EXISTS estoque (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  quantidade decimal(10,2) NOT NULL DEFAULT 0,
  minimo decimal(10,2) NOT NULL DEFAULT 0,
  unidade text NOT NULL,
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE mesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE comandas ENABLE ROW LEVEL SECURITY;
ALTER TABLE comanda_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE estoque ENABLE ROW LEVEL SECURITY;

-- Políticas para empresas
CREATE POLICY "Users can read own empresa"
  ON empresas
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own empresa"
  ON empresas
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Políticas para mesas
CREATE POLICY "Users can manage mesas of own empresa"
  ON mesas
  FOR ALL
  TO authenticated
  USING (
    empresa_id IN (
      SELECT id FROM empresas WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    empresa_id IN (
      SELECT id FROM empresas WHERE user_id = auth.uid()
    )
  );

-- Políticas para funcionarios
CREATE POLICY "Users can manage funcionarios of own empresa"
  ON funcionarios
  FOR ALL
  TO authenticated
  USING (
    empresa_id IN (
      SELECT id FROM empresas WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    empresa_id IN (
      SELECT id FROM empresas WHERE user_id = auth.uid()
    )
  );

-- Políticas para produtos
CREATE POLICY "Users can manage produtos of own empresa"
  ON produtos
  FOR ALL
  TO authenticated
  USING (
    empresa_id IN (
      SELECT id FROM empresas WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    empresa_id IN (
      SELECT id FROM empresas WHERE user_id = auth.uid()
    )
  );

-- Políticas para comandas
CREATE POLICY "Users can manage comandas of own empresa"
  ON comandas
  FOR ALL
  TO authenticated
  USING (
    empresa_id IN (
      SELECT id FROM empresas WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    empresa_id IN (
      SELECT id FROM empresas WHERE user_id = auth.uid()
    )
  );

-- Políticas para comanda_itens
CREATE POLICY "Users can manage comanda_itens of own empresa"
  ON comanda_itens
  FOR ALL
  TO authenticated
  USING (
    comanda_id IN (
      SELECT id FROM comandas WHERE empresa_id IN (
        SELECT id FROM empresas WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    comanda_id IN (
      SELECT id FROM comandas WHERE empresa_id IN (
        SELECT id FROM empresas WHERE user_id = auth.uid()
      )
    )
  );

-- Políticas para vendas
CREATE POLICY "Users can manage vendas of own empresa"
  ON vendas
  FOR ALL
  TO authenticated
  USING (
    empresa_id IN (
      SELECT id FROM empresas WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    empresa_id IN (
      SELECT id FROM empresas WHERE user_id = auth.uid()
    )
  );

-- Políticas para estoque
CREATE POLICY "Users can manage estoque of own empresa"
  ON estoque
  FOR ALL
  TO authenticated
  USING (
    empresa_id IN (
      SELECT id FROM empresas WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    empresa_id IN (
      SELECT id FROM empresas WHERE user_id = auth.uid()
    )
  );