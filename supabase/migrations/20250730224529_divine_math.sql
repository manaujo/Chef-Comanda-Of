/*
  # Atualizar schema para fluxo completo do restaurante

  1. Modificações nas tabelas existentes
    - Atualizar enum de status das mesas para incluir 'fechada'
    - Atualizar enum de status dos itens para incluir 'aguardando'
    - Adicionar campo 'enviado_cozinha' na tabela comanda_itens
    - Atualizar enum de status das comandas para incluir 'pronto_para_fechamento'

  2. Novos campos
    - comanda_id nas mesas para vincular mesa à comanda ativa
    - enviado_cozinha boolean nos itens da comanda

  3. Triggers atualizados
    - Atualizar status da comanda baseado no status dos itens
    - Atualizar status da mesa baseado no status da comanda
*/

-- Atualizar enum de status das mesas para incluir 'fechada'
DO $$ BEGIN
  ALTER TYPE mesa_status ADD VALUE IF NOT EXISTS 'fechada';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Atualizar enum de status das comandas para incluir 'pronto_para_fechamento'
DO $$ BEGIN
  ALTER TYPE comanda_status ADD VALUE IF NOT EXISTS 'pronto_para_fechamento';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Atualizar enum de status dos itens para incluir 'aguardando'
DO $$ BEGIN
  ALTER TYPE item_status ADD VALUE IF NOT EXISTS 'aguardando';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Adicionar campo comanda_id nas mesas se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mesas' AND column_name = 'comanda_id'
  ) THEN
    ALTER TABLE mesas ADD COLUMN comanda_id uuid REFERENCES comandas(id);
  END IF;
END $$;

-- Adicionar campo enviado_cozinha nos itens da comanda se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'comanda_itens' AND column_name = 'enviado_cozinha'
  ) THEN
    ALTER TABLE comanda_itens ADD COLUMN enviado_cozinha boolean DEFAULT false;
  END IF;
END $$;

-- Criar índices para os novos campos
CREATE INDEX IF NOT EXISTS idx_mesas_comanda_id ON mesas(comanda_id);
CREATE INDEX IF NOT EXISTS idx_comanda_itens_enviado_cozinha ON comanda_itens(enviado_cozinha);

-- Função atualizada para gerenciar status da mesa e comanda
CREATE OR REPLACE FUNCTION update_mesa_comanda_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando uma comanda é criada, vincular à mesa e marcar como ocupada
  IF TG_OP = 'INSERT' AND NEW.mesa_id IS NOT NULL THEN
    UPDATE mesas 
    SET status = 'ocupada', comanda_id = NEW.id
    WHERE id = NEW.mesa_id AND status = 'livre';
  END IF;
  
  -- Quando uma comanda é fechada, liberar a mesa
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    IF NEW.status = 'fechada' AND NEW.mesa_id IS NOT NULL THEN
      UPDATE mesas 
      SET status = 'livre', comanda_id = NULL
      WHERE id = NEW.mesa_id;
    ELSIF NEW.status = 'pronto_para_fechamento' AND NEW.mesa_id IS NOT NULL THEN
      UPDATE mesas 
      SET status = 'fechada'
      WHERE id = NEW.mesa_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS update_mesa_status_trigger ON comandas;

-- Criar novo trigger
CREATE TRIGGER update_mesa_comanda_status_trigger
  AFTER INSERT OR UPDATE ON comandas
  FOR EACH ROW
  EXECUTE FUNCTION update_mesa_comanda_status();

-- Função atualizada para gerenciar status da comanda baseado nos itens
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
  AND status != 'cancelado'
  AND enviado_cozinha = true;
  
  -- Atualizar status da comanda baseado nos itens
  IF total_itens > 0 THEN
    IF itens_prontos = total_itens THEN
      -- Todos os itens estão prontos
      UPDATE comandas SET status = 'pronto_para_fechamento' WHERE id = comanda_id_to_update;
    ELSIF itens_preparando > 0 OR itens_aguardando > 0 THEN
      -- Há itens sendo preparados ou aguardando
      UPDATE comandas SET status = 'em_preparo' WHERE id = comanda_id_to_update;
    END IF;
  ELSE
    -- Não há itens enviados para cozinha ainda
    UPDATE comandas SET status = 'aberta' WHERE id = comanda_id_to_update;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS update_comanda_status_trigger ON comanda_itens;

-- Criar novo trigger
CREATE TRIGGER update_comanda_status_based_on_items_trigger
  AFTER INSERT OR UPDATE OR DELETE ON comanda_itens
  FOR EACH ROW
  EXECUTE FUNCTION update_comanda_status_based_on_items();