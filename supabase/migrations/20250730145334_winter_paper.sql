/*
  # Criar sistema de funcionários simplificado

  1. Nova Tabela
    - `funcionarios_simples`
      - `id` (uuid, primary key)
      - `nome` (text, not null)
      - `tipo` (enum: garcom, caixa, cozinha, estoque)
      - `ativo` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Modificações
    - Adicionar campo `operador_funcionario_id` na tabela turnos
    - Adicionar campo `garcom_funcionario_id` na tabela comandas

  3. Segurança
    - Habilitar RLS na tabela `funcionarios_simples`
    - Adicionar políticas para usuários autenticados
*/

-- Criar enum para tipos de funcionário simplificado
DO $$ BEGIN
  CREATE TYPE funcionario_tipo AS ENUM ('garcom', 'caixa', 'cozinha', 'estoque');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Criar tabela de funcionários simplificada
CREATE TABLE IF NOT EXISTS funcionarios_simples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  tipo funcionario_tipo NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE funcionarios_simples ENABLE ROW LEVEL SECURITY;

-- Criar políticas
CREATE POLICY "Users can read funcionarios_simples"
  ON funcionarios_simples
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Administrators can manage funcionarios_simples"
  ON funcionarios_simples
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.tipo = 'administrador' AND p.ativo = true
    )
  );

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_funcionarios_simples_tipo ON funcionarios_simples(tipo);
CREATE INDEX IF NOT EXISTS idx_funcionarios_simples_ativo ON funcionarios_simples(ativo);

-- Trigger para updated_at
DO $$ BEGIN
  CREATE TRIGGER update_funcionarios_simples_updated_at 
    BEFORE UPDATE ON funcionarios_simples 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Adicionar campo operador_funcionario_id na tabela turnos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'turnos' AND column_name = 'operador_funcionario_id'
  ) THEN
    ALTER TABLE turnos ADD COLUMN operador_funcionario_id uuid REFERENCES funcionarios_simples(id);
  END IF;
END $$;

-- Adicionar campo garcom_funcionario_id na tabela comandas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'comandas' AND column_name = 'garcom_funcionario_id'
  ) THEN
    ALTER TABLE comandas ADD COLUMN garcom_funcionario_id uuid REFERENCES funcionarios_simples(id);
  END IF;
END $$;

-- Criar índices para os novos campos
CREATE INDEX IF NOT EXISTS idx_turnos_operador_funcionario_id ON turnos(operador_funcionario_id);
CREATE INDEX IF NOT EXISTS idx_comandas_garcom_funcionario_id ON comandas(garcom_funcionario_id);

-- Inserir alguns funcionários de exemplo
INSERT INTO funcionarios_simples (nome, tipo) VALUES
  ('João Silva', 'garcom'),
  ('Maria Santos', 'garcom'),
  ('Pedro Costa', 'caixa'),
  ('Ana Oliveira', 'caixa'),
  ('Carlos Lima', 'cozinha'),
  ('Lucia Ferreira', 'estoque')
ON CONFLICT DO NOTHING;