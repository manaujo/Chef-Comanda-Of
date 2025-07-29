/*
  # Criar tabela de logs

  1. Nova Tabela
    - `logs`
      - `id` (uuid, primary key)
      - `usuario_id` (uuid, foreign key para profiles)
      - `tipo_acao` (enum: criacao, edicao, exclusao, cancelamento, login, logout)
      - `tabela_afetada` (text, optional)
      - `registro_id` (uuid, optional)
      - `descricao` (text, not null)
      - `dados_anteriores` (jsonb, optional)
      - `dados_novos` (jsonb, optional)
      - `ip_address` (text, optional)
      - `user_agent` (text, optional)
      - `created_at` (timestamp)

  2. Segurança
    - Habilitar RLS na tabela `logs`
    - Adicionar políticas para usuários autenticados
*/

-- Criar enum para tipos de ação
DO $$ BEGIN
  CREATE TYPE tipo_acao AS ENUM ('criacao', 'edicao', 'exclusao', 'cancelamento', 'login', 'logout');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Criar tabela de logs
CREATE TABLE IF NOT EXISTS logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid REFERENCES profiles(id),
  tipo_acao tipo_acao NOT NULL,
  tabela_afetada text,
  registro_id uuid,
  descricao text NOT NULL,
  dados_anteriores jsonb,
  dados_novos jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- Criar políticas
CREATE POLICY "Users can read logs"
  ON logs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert logs"
  ON logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_logs_usuario_id ON logs(usuario_id);
CREATE INDEX IF NOT EXISTS idx_logs_tipo_acao ON logs(tipo_acao);
CREATE INDEX IF NOT EXISTS idx_logs_tabela_afetada ON logs(tabela_afetada);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at);
CREATE INDEX IF NOT EXISTS idx_logs_registro_id ON logs(registro_id);