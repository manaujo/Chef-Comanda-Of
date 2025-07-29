/*
  # Atualizar schema para sistema de pedidos por mesa

  1. Modificações nas tabelas existentes
    - Atualizar enum de status das mesas
    - Atualizar enum de status das comandas
    - Atualizar enum de status dos itens
    - Adicionar categoria aos produtos se não existir

  2. Novas funcionalidades
    - Status de mesa: aguardando_pagamento
    - Status de comanda: em_preparo, pronta
    - Status de item: enviado, preparando, pronto
    - Categoria obrigatória nos produtos

  3. Triggers e Functions
    - Atualizar status da mesa automaticamente
    - Notificações em tempo real
*/

-- Atualizar enum de status das mesas
DO $$ BEGIN
  ALTER TYPE mesa_status ADD VALUE IF NOT EXISTS 'aguardando_pagamento';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Atualizar enum de status das comandas
DO $$ BEGIN
  ALTER TYPE comanda_status ADD VALUE IF NOT EXISTS 'em_preparo';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TYPE comanda_status ADD VALUE IF NOT EXISTS 'pronta';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Atualizar enum de status dos itens
DO $$ BEGIN
  ALTER TYPE item_status ADD VALUE IF NOT EXISTS 'enviado';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TYPE item_status ADD VALUE IF NOT EXISTS 'preparando';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Adicionar categoria aos produtos se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'produtos' AND column_name = 'categoria_produto'
  ) THEN
    ALTER TABLE produtos ADD COLUMN categoria_produto text DEFAULT 'prato';
  END IF;
END $$;

-- Adicionar campo foto se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'produtos' AND column_name = 'foto'
  ) THEN
    ALTER TABLE produtos ADD COLUMN foto text;
  END IF;
END $$;

-- Função para atualizar status da mesa automaticamente
CREATE OR REPLACE FUNCTION update_mesa_status_on_comanda_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando uma comanda é criada, marcar mesa como ocupada
  IF TG_OP = 'INSERT' AND NEW.mesa_id IS NOT NULL THEN
    UPDATE mesas 
    SET status = 'ocupada' 
    WHERE id = NEW.mesa_id AND status = 'livre';
  END IF;
  
  -- Quando uma comanda é fechada, verificar se deve liberar a mesa
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    IF NEW.status = 'fechada' AND NEW.mesa_id IS NOT NULL THEN
      UPDATE mesas 
      SET status = 'livre' 
      WHERE id = NEW.mesa_id;
    ELSIF NEW.status = 'pronta' AND NEW.mesa_id IS NOT NULL THEN
      UPDATE mesas 
      SET status = 'aguardando_pagamento' 
      WHERE id = NEW.mesa_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar status da mesa
DO $$ BEGIN
  CREATE TRIGGER update_mesa_status_trigger
    AFTER INSERT OR UPDATE ON comandas
    FOR EACH ROW
    EXECUTE FUNCTION update_mesa_status_on_comanda_change();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Função para atualizar status da comanda baseado nos itens
CREATE OR REPLACE FUNCTION update_comanda_status_on_item_change()
RETURNS TRIGGER AS $$
DECLARE
  comanda_id_to_update uuid;
  total_itens integer;
  itens_prontos integer;
  itens_preparando integer;
BEGIN
  comanda_id_to_update := COALESCE(NEW.comanda_id, OLD.comanda_id);
  
  -- Contar itens da comanda
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'pronto') as prontos,
    COUNT(*) FILTER (WHERE status IN ('preparando', 'enviado')) as preparando
  INTO total_itens, itens_prontos, itens_preparando
  FROM comanda_itens 
  WHERE comanda_id = comanda_id_to_update 
  AND status != 'cancelado';
  
  -- Atualizar status da comanda
  IF total_itens > 0 THEN
    IF itens_prontos = total_itens THEN
      UPDATE comandas SET status = 'pronta' WHERE id = comanda_id_to_update;
    ELSIF itens_preparando > 0 THEN
      UPDATE comandas SET status = 'em_preparo' WHERE id = comanda_id_to_update;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar status da comanda
DO $$ BEGIN
  CREATE TRIGGER update_comanda_status_trigger
    AFTER INSERT OR UPDATE OR DELETE ON comanda_itens
    FOR EACH ROW
    EXECUTE FUNCTION update_comanda_status_on_item_change();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Atualizar produtos existentes com categoria padrão
UPDATE produtos 
SET categoria_produto = CASE 
  WHEN nome ILIKE '%bebida%' OR nome ILIKE '%suco%' OR nome ILIKE '%refrigerante%' OR nome ILIKE '%água%' THEN 'bebida'
  WHEN nome ILIKE '%sobremesa%' OR nome ILIKE '%pudim%' OR nome ILIKE '%sorvete%' OR nome ILIKE '%doce%' THEN 'sobremesa'
  WHEN nome ILIKE '%entrada%' OR nome ILIKE '%petisco%' OR nome ILIKE '%aperitivo%' THEN 'entrada'
  ELSE 'prato'
END
WHERE categoria_produto IS NULL OR categoria_produto = 'prato';