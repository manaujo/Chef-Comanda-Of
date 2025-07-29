/*
  # Criar tabela de funcionários

  1. Nova Tabela
    - `funcionarios`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key para auth.users)
      - `nome` (text, not null)
      - `cpf` (text, unique, not null)
      - `tipo` (enum: administrador, garcom, caixa, cozinha, estoque)
      - `ativo` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Segurança
    - Habilitar RLS na tabela `funcionarios`
    - Adicionar políticas para usuários autenticados
*/

-- Criar tabela de funcionários
CREATE TABLE IF NOT EXISTS funcionarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  cpf text UNIQUE NOT NULL,
  tipo user_type NOT NULL DEFAULT 'garcom',
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT funcionarios_cpf_check CHECK (length(cpf) = 11 AND cpf ~ '^[0-9]+$')
);

-- Habilitar RLS
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;

-- Criar políticas
CREATE POLICY "Users can read funcionarios"
  ON funcionarios
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Administrators can manage funcionarios"
  ON funcionarios
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM funcionarios f 
      WHERE f.user_id = auth.uid() AND f.tipo = 'administrador'
    )
  );

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_funcionarios_user_id ON funcionarios(user_id);
CREATE INDEX IF NOT EXISTS idx_funcionarios_cpf ON funcionarios(cpf);
CREATE INDEX IF NOT EXISTS idx_funcionarios_tipo ON funcionarios(tipo);
CREATE INDEX IF NOT EXISTS idx_funcionarios_ativo ON funcionarios(ativo);

-- Trigger para updated_at
DO $$ BEGIN
  CREATE TRIGGER update_funcionarios_updated_at 
    BEFORE UPDATE ON funcionarios 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Função para verificar se usuário é administrador (usando tabela funcionarios)
CREATE OR REPLACE FUNCTION is_admin_funcionario()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM funcionarios 
    WHERE user_id = auth.uid() AND tipo = 'administrador' AND ativo = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter tipo do funcionário
CREATE OR REPLACE FUNCTION get_funcionario_tipo()
RETURNS user_type AS $$
DECLARE
  funcionario_tipo user_type;
BEGIN
  SELECT tipo INTO funcionario_tipo
  FROM funcionarios 
  WHERE user_id = auth.uid() AND ativo = true;
  
  RETURN funcionario_tipo;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;