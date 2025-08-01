/*
  # Dados de exemplo para demonstração

  1. Produtos básicos para restaurante
  2. Funcionários de exemplo
  3. Mesas iniciais

  Nota: Estes dados serão inseridos automaticamente para empresas criadas
*/

-- Função para inserir dados de exemplo para uma nova empresa
CREATE OR REPLACE FUNCTION insert_sample_data_for_empresa(empresa_uuid uuid)
RETURNS void AS $$
BEGIN
  -- Inserir produtos básicos
  INSERT INTO produtos (nome, preco, categoria, empresa_id) VALUES
    ('Hambúrguer Clássico', 25.90, 'Lanches', empresa_uuid),
    ('Cheeseburger', 28.90, 'Lanches', empresa_uuid),
    ('Batata Frita', 12.90, 'Acompanhamentos', empresa_uuid),
    ('Refrigerante Lata', 5.90, 'Bebidas', empresa_uuid),
    ('Suco Natural', 8.90, 'Bebidas', empresa_uuid),
    ('Água Mineral', 3.90, 'Bebidas', empresa_uuid),
    ('Cerveja Long Neck', 7.90, 'Bebidas', empresa_uuid),
    ('Salada Caesar', 18.90, 'Saladas', empresa_uuid),
    ('Prato Feito', 22.90, 'Pratos Principais', empresa_uuid),
    ('Sobremesa do Dia', 12.90, 'Sobremesas', empresa_uuid);

  -- Inserir funcionários básicos
  INSERT INTO funcionarios (nome, funcao, empresa_id) VALUES
    ('João Silva', 'garcom', empresa_uuid),
    ('Maria Santos', 'garcom', empresa_uuid),
    ('Pedro Oliveira', 'cozinheiro', empresa_uuid),
    ('Ana Costa', 'caixa', empresa_uuid);

  -- Inserir mesas básicas (1 a 10)
  INSERT INTO mesas (numero, empresa_id)
  SELECT generate_series(1, 10), empresa_uuid;

  -- Inserir itens básicos de estoque
  INSERT INTO estoque (nome, quantidade, minimo, unidade, empresa_id) VALUES
    ('Carne Bovina (kg)', 50.0, 10.0, 'kg', empresa_uuid),
    ('Pão de Hambúrguer', 100.0, 20.0, 'unidade', empresa_uuid),
    ('Queijo Cheddar (kg)', 5.0, 1.0, 'kg', empresa_uuid),
    ('Batata (kg)', 25.0, 5.0, 'kg', empresa_uuid),
    ('Alface', 10.0, 2.0, 'maço', empresa_uuid),
    ('Tomate (kg)', 8.0, 2.0, 'kg', empresa_uuid),
    ('Refrigerante (L)', 20.0, 5.0, 'litro', empresa_uuid),
    ('Cerveja Long Neck', 48.0, 12.0, 'unidade', empresa_uuid);
END;
$$ LANGUAGE plpgsql;

-- Trigger para inserir dados de exemplo quando uma nova empresa é criada
CREATE OR REPLACE FUNCTION trigger_insert_sample_data()
RETURNS trigger AS $$
BEGIN
  -- Inserir dados de exemplo para a nova empresa
  PERFORM insert_sample_data_for_empresa(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS on_empresa_created ON empresas;
CREATE TRIGGER on_empresa_created
  AFTER INSERT ON empresas
  FOR EACH ROW
  EXECUTE FUNCTION trigger_insert_sample_data();