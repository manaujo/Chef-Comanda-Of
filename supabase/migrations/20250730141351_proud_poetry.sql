/*
  # Adicionar campo senha à tabela funcionários

  1. Modificações
    - Adicionar campo `senha` (text) à tabela funcionários
    - Campo obrigatório para login local

  2. Observações
    - Em produção, as senhas devem ser hasheadas
    - Por simplicidade, armazenamos em texto plano no desenvolvimento
*/

-- Adicionar campo senha se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'funcionarios' AND column_name = 'senha'
  ) THEN
    ALTER TABLE funcionarios ADD COLUMN senha text;
  END IF;
END $$;

-- Atualizar funcionários existentes com senha padrão
UPDATE funcionarios 
SET senha = '123456' 
WHERE senha IS NULL;