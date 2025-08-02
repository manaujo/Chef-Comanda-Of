/*
  # Criar tabela de logs de auditoria

  1. New Tables
    - `logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users, optional)
      - `usuario_id` (uuid, references profiles, optional)
      - `tipo_acao` (enum: criacao, edicao, exclusao, cancelamento, login, logout)
      - `tabela_afetada` (text, optional)
      - `registro_id` (uuid, optional)
      - `descricao` (text)
      - `dados_anteriores` (jsonb, optional)
      - `dados_novos` (jsonb, optional)
      - `ip_address` (text, optional)
      - `user_agent` (text, optional)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `logs` table
    - Add policies for users to read their own logs
*/

-- Create enum for action types
DO $$ BEGIN
  CREATE TYPE tipo_acao AS ENUM ('criacao', 'edicao', 'exclusao', 'cancelamento', 'login', 'logout');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create logs table
CREATE TABLE IF NOT EXISTS logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  usuario_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
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

-- Enable RLS
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own logs"
  ON logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = usuario_id);

CREATE POLICY "Users can insert own logs"
  ON logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR auth.uid() = usuario_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS logs_user_id_idx ON logs(user_id);
CREATE INDEX IF NOT EXISTS logs_created_at_idx ON logs(created_at DESC);
CREATE INDEX IF NOT EXISTS logs_tipo_acao_idx ON logs(tipo_acao);