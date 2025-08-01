-- Script para limpar dados problemáticos do banco de dados
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar dados órfãos
SELECT 'Verificando dados órfãos...' as status;

-- Comandas sem user_id
SELECT COUNT(*) as comandas_sem_user_id FROM comandas WHERE user_id IS NULL;

-- Mesas sem user_id  
SELECT COUNT(*) as mesas_sem_user_id FROM mesas WHERE user_id IS NULL;

-- Vendas com operador_id inválido
SELECT COUNT(*) as vendas_operador_invalido 
FROM vendas v 
LEFT JOIN profiles p ON v.operador_id = p.id 
WHERE p.id IS NULL;

-- 2. Limpar dados órfãos (CUIDADO: isso remove dados!)
-- Descomente as linhas abaixo apenas se quiser limpar os dados

/*
-- Remover vendas órfãs
DELETE FROM vendas 
WHERE operador_id NOT IN (SELECT id FROM profiles WHERE id IS NOT NULL);

-- Remover comandas órfãs
DELETE FROM comanda_itens WHERE comanda_id IN (
    SELECT id FROM comandas WHERE user_id IS NULL
);
DELETE FROM comandas WHERE user_id IS NULL;

-- Remover mesas órfãs
DELETE FROM mesas WHERE user_id IS NULL;

-- Resetar status das mesas
UPDATE mesas SET status = 'livre', comanda_id = NULL;
*/

-- 3. Verificar comandas prontas para PDV
SELECT 
    c.id,
    c.numero,
    c.status,
    c.valor_total,
    c.user_id,
    m.numero as mesa_numero
FROM comandas c
LEFT JOIN mesas m ON c.mesa_id = m.id
WHERE c.status IN ('pronto_para_fechamento', 'pronta')
AND c.valor_total > 0
ORDER BY c.created_at DESC;

-- 4. Verificar turnos ativos
SELECT 
    t.id,
    t.operador_id,
    t.operador_funcionario_id,
    t.ativo,
    t.data_abertura,
    t.user_id,
    p.nome_completo as operador_nome,
    fs.nome as funcionario_nome
FROM turnos t
LEFT JOIN profiles p ON t.operador_id = p.id
LEFT JOIN funcionarios_simples fs ON t.operador_funcionario_id = fs.id
WHERE t.ativo = true
ORDER BY t.data_abertura DESC;

-- 5. Verificar integridade das foreign keys
SELECT 'Verificando integridade das foreign keys...' as status;

-- Comandas com mesa_id inválido
SELECT COUNT(*) as comandas_mesa_invalida
FROM comandas c
LEFT JOIN mesas m ON c.mesa_id = m.id
WHERE c.mesa_id IS NOT NULL AND m.id IS NULL;

-- Comandas com garcom_id inválido
SELECT COUNT(*) as comandas_garcom_invalido
FROM comandas c
LEFT JOIN profiles p ON c.garcom_id = p.id
WHERE c.garcom_id IS NOT NULL AND p.id IS NULL;

-- 6. Estatísticas gerais
SELECT 'Estatísticas gerais:' as status;
SELECT COUNT(*) as total_mesas FROM mesas;
SELECT COUNT(*) as total_comandas FROM comandas;
SELECT COUNT(*) as total_vendas FROM vendas;
SELECT COUNT(*) as total_usuarios FROM profiles;