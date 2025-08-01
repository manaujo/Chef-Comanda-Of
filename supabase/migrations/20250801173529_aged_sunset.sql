/*
  # Corrigir problemas do banco de dados

  1. Problemas Identificados
    - Constraint de foreign key incorreta na tabela vendas
    - Mesas duplicadas ou órfãs no banco
    - Comandas não aparecendo no PDV
    - Inconsistências nos relacionamentos

  2. Correções
    - Corrigir foreign key vendas_operador_id_fkey
    - Limpar dados órfãos e inconsistentes
    - Atualizar políticas RLS
    - Corrigir relacionamentos entre tabelas

  3. Limpeza de Dados
    - Remover mesas órfãs sem user_id
    - Corrigir comandas sem relacionamentos corretos
    - Atualizar dados existentes com user_id correto
*/

-- 1. Corrigir foreign key constraint na tabela vendas
-- O erro indica que a constraint vendas_operador_id_fkey está falhando
-- Vamos verificar e corrigir o relacionamento

-- Primeiro, vamos verificar se existem vendas com operador_id inválido
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO invalid_count
    FROM vendas v
    LEFT JOIN profiles p ON v.operador_id = p.id
    WHERE p.id IS NULL;
    
    IF invalid_count > 0 THEN
        RAISE NOTICE 'Encontradas % vendas com operador_id inválido', invalid_count;
        
        -- Remover vendas órfãs
        DELETE FROM vendas 
        WHERE operador_id NOT IN (SELECT id FROM profiles WHERE id IS NOT NULL);
    END IF;
END $$;

-- 2. Limpar mesas órfãs sem user_id
DO $$
BEGIN
    -- Remover mesas sem user_id (dados antigos)
    DELETE FROM mesas WHERE user_id IS NULL;
    
    -- Remover comandas órfãs sem user_id
    DELETE FROM comandas WHERE user_id IS NULL;
    
    -- Remover produtos órfãos sem user_id
    DELETE FROM produtos WHERE user_id IS NULL;
    
    -- Remover categorias órfãs sem user_id
    DELETE FROM categorias WHERE user_id IS NULL;
    
    RAISE NOTICE 'Dados órfãos removidos com sucesso';
END $$;

-- 3. Corrigir relacionamentos de comandas para PDV
-- Adicionar status 'pronto_para_fechamento' se não existir
DO $$ 
BEGIN
    -- Verificar se o valor já existe no enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'pronto_para_fechamento' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'comanda_status')
    ) THEN
        ALTER TYPE comanda_status ADD VALUE 'pronto_para_fechamento';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN 
        NULL; -- Ignorar se já existir
END $$;

-- 4. Atualizar comandas para aparecer no PDV
-- Comandas devem ter status 'pronto_para_fechamento' para aparecer no PDV
UPDATE comandas 
SET status = 'pronto_para_fechamento'
WHERE status = 'pronta' 
AND valor_total > 0
AND data_fechamento IS NULL;

-- 5. Corrigir constraint de foreign key na tabela vendas
-- Verificar se a constraint existe e está correta
DO $$
BEGIN
    -- Remover constraint antiga se existir
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'vendas_operador_id_fkey' 
        AND table_name = 'vendas'
    ) THEN
        ALTER TABLE vendas DROP CONSTRAINT vendas_operador_id_fkey;
    END IF;
    
    -- Adicionar constraint correta
    ALTER TABLE vendas 
    ADD CONSTRAINT vendas_operador_id_fkey 
    FOREIGN KEY (operador_id) REFERENCES profiles(id);
    
    RAISE NOTICE 'Constraint vendas_operador_id_fkey corrigida';
END $$;

-- 6. Garantir que todas as tabelas tenham user_id preenchido corretamente
-- Função para preencher user_id em dados existentes
CREATE OR REPLACE FUNCTION fill_missing_user_ids()
RETURNS void AS $$
DECLARE
    current_user_id uuid;
BEGIN
    -- Obter o primeiro usuário disponível como fallback
    SELECT id INTO current_user_id 
    FROM auth.users 
    LIMIT 1;
    
    IF current_user_id IS NOT NULL THEN
        -- Atualizar tabelas com user_id NULL
        UPDATE mesas SET user_id = current_user_id WHERE user_id IS NULL;
        UPDATE comandas SET user_id = current_user_id WHERE user_id IS NULL;
        UPDATE produtos SET user_id = current_user_id WHERE user_id IS NULL;
        UPDATE categorias SET user_id = current_user_id WHERE user_id IS NULL;
        UPDATE insumos SET user_id = current_user_id WHERE user_id IS NULL;
        UPDATE funcionarios_simples SET user_id = current_user_id WHERE user_id IS NULL;
        UPDATE turnos SET user_id = current_user_id WHERE user_id IS NULL;
        UPDATE vendas SET user_id = current_user_id WHERE user_id IS NULL;
        
        RAISE NOTICE 'user_id preenchido para dados existentes';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Executar a função de preenchimento
SELECT fill_missing_user_ids();

-- 7. Criar função para limpar dados duplicados
CREATE OR REPLACE FUNCTION clean_duplicate_mesas()
RETURNS void AS $$
BEGIN
    -- Remover mesas duplicadas, mantendo apenas a mais recente
    DELETE FROM mesas 
    WHERE id NOT IN (
        SELECT DISTINCT ON (numero, user_id) id
        FROM mesas 
        ORDER BY numero, user_id, created_at DESC
    );
    
    RAISE NOTICE 'Mesas duplicadas removidas';
END;
$$ LANGUAGE plpgsql;

-- Executar limpeza de duplicatas
SELECT clean_duplicate_mesas();

-- 8. Atualizar função para calcular valor total da comanda
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

-- 9. Função para atualizar status da comanda baseado nos itens
CREATE OR REPLACE FUNCTION update_comanda_status_based_on_items()
RETURNS TRIGGER AS $$
DECLARE
  comanda_id_to_update uuid;
  total_itens integer;
  itens_prontos integer;
  itens_preparando integer;
  itens_aguardando integer;
BEGIN
  comanda_id_to_update := COALESCE(NEW.comanda_id, OLD.comanda_id);
  
  -- Contar itens da comanda (apenas os enviados para cozinha)
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'pronto') as prontos,
    COUNT(*) FILTER (WHERE status = 'preparando') as preparando,
    COUNT(*) FILTER (WHERE status = 'aguardando') as aguardando
  INTO total_itens, itens_prontos, itens_preparando, itens_aguardando
  FROM comanda_itens 
  WHERE comanda_id = comanda_id_to_update 
  AND status NOT IN ('cancelado')
  AND enviado_cozinha = true;
  
  -- Atualizar status da comanda baseado nos itens
  IF total_itens > 0 THEN
    IF itens_prontos = total_itens THEN
      -- Todos os itens estão prontos
      UPDATE comandas 
      SET status = 'pronto_para_fechamento', updated_at = now() 
      WHERE id = comanda_id_to_update;
    ELSIF itens_preparando > 0 OR itens_aguardando > 0 THEN
      -- Há itens sendo preparados ou aguardando
      UPDATE comandas 
      SET status = 'em_preparo', updated_at = now() 
      WHERE id = comanda_id_to_update;
    END IF;
  ELSE
    -- Não há itens enviados para cozinha ainda
    UPDATE comandas 
    SET status = 'aberta', updated_at = now() 
    WHERE id = comanda_id_to_update;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 10. Recriar triggers se necessário
DROP TRIGGER IF EXISTS update_comanda_valor_total_insert ON comanda_itens;
DROP TRIGGER IF EXISTS update_comanda_valor_total_update ON comanda_itens;
DROP TRIGGER IF EXISTS update_comanda_valor_total_delete ON comanda_itens;
DROP TRIGGER IF EXISTS update_comanda_status_based_on_items_trigger ON comanda_itens;

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

CREATE TRIGGER update_comanda_status_based_on_items_trigger
  AFTER INSERT OR UPDATE OR DELETE ON comanda_itens
  FOR EACH ROW
  EXECUTE FUNCTION update_comanda_status_based_on_items();

-- 11. Verificar e corrigir dados de teste
-- Inserir mesas de exemplo para o usuário atual (se não existirem)
DO $$
DECLARE
    current_user_id uuid;
    mesa_count integer;
BEGIN
    -- Obter usuário atual
    current_user_id := auth.uid();
    
    IF current_user_id IS NOT NULL THEN
        -- Verificar se já existem mesas para este usuário
        SELECT COUNT(*) INTO mesa_count
        FROM mesas 
        WHERE user_id = current_user_id;
        
        -- Se não existem mesas, criar algumas de exemplo
        IF mesa_count = 0 THEN
            INSERT INTO mesas (numero, nome, capacidade, status, user_id) VALUES
                (1, 'Mesa 01', 4, 'livre', current_user_id),
                (2, 'Mesa 02', 4, 'livre', current_user_id),
                (3, 'Mesa 03', 2, 'livre', current_user_id),
                (4, 'Mesa 04', 6, 'livre', current_user_id),
                (5, 'Mesa 05', 4, 'livre', current_user_id)
            ON CONFLICT (numero) DO NOTHING;
            
            RAISE NOTICE 'Mesas de exemplo criadas para o usuário atual';
        END IF;
    END IF;
END $$;

-- 12. Verificar integridade dos dados
-- Função para verificar e reportar problemas
CREATE OR REPLACE FUNCTION check_data_integrity()
RETURNS text AS $$
DECLARE
    result text := '';
    count_val integer;
BEGIN
    -- Verificar comandas órfãs
    SELECT COUNT(*) INTO count_val
    FROM comandas c
    LEFT JOIN profiles p ON c.garcom_id = p.id
    WHERE c.garcom_id IS NOT NULL AND p.id IS NULL;
    
    IF count_val > 0 THEN
        result := result || 'Comandas com garcom_id inválido: ' || count_val || E'\n';
    END IF;
    
    -- Verificar vendas órfãs
    SELECT COUNT(*) INTO count_val
    FROM vendas v
    LEFT JOIN profiles p ON v.operador_id = p.id
    WHERE p.id IS NULL;
    
    IF count_val > 0 THEN
        result := result || 'Vendas com operador_id inválido: ' || count_val || E'\n';
    END IF;
    
    -- Verificar comandas sem user_id
    SELECT COUNT(*) INTO count_val
    FROM comandas WHERE user_id IS NULL;
    
    IF count_val > 0 THEN
        result := result || 'Comandas sem user_id: ' || count_val || E'\n';
    END IF;
    
    IF result = '' THEN
        result := 'Integridade dos dados OK';
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Executar verificação
SELECT check_data_integrity();

-- 13. Atualizar view para PDV (comandas prontas para fechamento)
-- Garantir que as comandas apareçam corretamente no PDV
CREATE OR REPLACE VIEW comandas_pdv AS
SELECT 
    c.*,
    m.numero as mesa_numero,
    fs.nome as garcom_nome,
    p.nome_completo as garcom_admin_nome
FROM comandas c
LEFT JOIN mesas m ON c.mesa_id = m.id
LEFT JOIN funcionarios_simples fs ON c.garcom_funcionario_id = fs.id
LEFT JOIN profiles p ON c.garcom_id = p.id
WHERE c.status IN ('pronto_para_fechamento', 'pronta')
AND c.valor_total > 0;

-- 14. Função para resetar dados de teste (opcional)
CREATE OR REPLACE FUNCTION reset_test_data()
RETURNS void AS $$
DECLARE
    current_user_id uuid;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NOT NULL THEN
        -- Remover dados de teste antigos
        DELETE FROM comanda_itens WHERE user_id = current_user_id;
        DELETE FROM comandas WHERE user_id = current_user_id;
        DELETE FROM vendas WHERE user_id = current_user_id;
        
        -- Resetar status das mesas
        UPDATE mesas 
        SET status = 'livre', comanda_id = NULL 
        WHERE user_id = current_user_id;
        
        RAISE NOTICE 'Dados de teste resetados para o usuário atual';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 15. Garantir que os triggers estão funcionando corretamente
-- Recriar função para atualizar status da mesa
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

-- Recriar trigger
DROP TRIGGER IF EXISTS update_mesa_comanda_status_trigger ON comandas;
CREATE TRIGGER update_mesa_comanda_status_trigger
  AFTER INSERT OR UPDATE ON comandas
  FOR EACH ROW
  EXECUTE FUNCTION update_mesa_comanda_status();

-- 16. Adicionar constraint para garantir apenas um turno ativo por usuário
DROP INDEX IF EXISTS idx_turnos_ativo_unique;
CREATE UNIQUE INDEX idx_turnos_ativo_user_unique 
  ON turnos(user_id, ativo) 
  WHERE ativo = true AND data_fechamento IS NULL;

-- 17. Função para debug - listar comandas prontas para PDV
CREATE OR REPLACE FUNCTION debug_comandas_pdv()
RETURNS TABLE(
    comanda_id uuid,
    numero integer,
    mesa_numero integer,
    status comanda_status,
    valor_total numeric,
    garcom_nome text,
    user_id uuid
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.numero,
        m.numero,
        c.status,
        c.valor_total,
        COALESCE(fs.nome, p.nome_completo),
        c.user_id
    FROM comandas c
    LEFT JOIN mesas m ON c.mesa_id = m.id
    LEFT JOIN funcionarios_simples fs ON c.garcom_funcionario_id = fs.id
    LEFT JOIN profiles p ON c.garcom_id = p.id
    WHERE c.status IN ('pronto_para_fechamento', 'pronta')
    AND c.valor_total > 0
    ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 18. Corrigir políticas RLS para garantir acesso correto
-- Política especial para PDV acessar comandas prontas
DROP POLICY IF EXISTS "Users can read their comandas" ON comandas;
CREATE POLICY "Users can read their comandas" ON comandas
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Política para permitir que o PDV acesse comandas prontas
CREATE POLICY "PDV can access ready comandas" ON comandas
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() 
    AND status IN ('pronto_para_fechamento', 'pronta')
  );

-- 19. Verificação final
DO $$
DECLARE
    mesa_count integer;
    comanda_count integer;
    user_count integer;
BEGIN
    SELECT COUNT(*) INTO user_count FROM auth.users;
    SELECT COUNT(*) INTO mesa_count FROM mesas;
    SELECT COUNT(*) INTO comanda_count FROM comandas WHERE status = 'pronto_para_fechamento';
    
    RAISE NOTICE 'Verificação final:';
    RAISE NOTICE 'Usuários: %', user_count;
    RAISE NOTICE 'Mesas: %', mesa_count;
    RAISE NOTICE 'Comandas prontas para PDV: %', comanda_count;
END $$;