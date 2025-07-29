/*
  # Inserir dados de exemplo

  1. Dados de Exemplo
    - Algumas mesas básicas
    - Categorias padrão
    - Produtos de exemplo
    - Insumos básicos

  2. Observações
    - Dados apenas para demonstração
    - Podem ser removidos em produção
*/

-- Inserir mesas de exemplo
INSERT INTO mesas (numero, nome, capacidade, status) VALUES
  (1, 'Mesa da Janela', 4, 'livre'),
  (2, 'Mesa Central', 6, 'livre'),
  (3, 'Mesa VIP', 2, 'livre'),
  (4, 'Mesa do Canto', 4, 'livre'),
  (5, 'Mesa Grande', 8, 'livre')
ON CONFLICT (numero) DO NOTHING;

-- Inserir insumos básicos
INSERT INTO insumos (nome, unidade, preco_unitario, quantidade_estoque, estoque_minimo, fornecedor) VALUES
  ('Arroz', 'kg', 5.50, 50, 10, 'Fornecedor ABC'),
  ('Feijão', 'kg', 8.00, 30, 5, 'Fornecedor ABC'),
  ('Carne Bovina', 'kg', 35.00, 20, 5, 'Açougue Central'),
  ('Frango', 'kg', 12.00, 25, 8, 'Avícola Silva'),
  ('Óleo de Soja', 'l', 6.50, 15, 3, 'Distribuidora XYZ'),
  ('Sal', 'kg', 2.00, 10, 2, 'Fornecedor ABC'),
  ('Açúcar', 'kg', 4.50, 20, 5, 'Fornecedor ABC'),
  ('Farinha de Trigo', 'kg', 4.00, 25, 5, 'Moinho São João'),
  ('Tomate', 'kg', 8.50, 15, 3, 'Hortifruti Verde'),
  ('Cebola', 'kg', 3.50, 20, 5, 'Hortifruti Verde')
ON CONFLICT DO NOTHING;

-- Inserir produtos de exemplo usando as categorias existentes
DO $$
DECLARE
  cat_pratos_id uuid;
  cat_bebidas_id uuid;
  cat_sobremesas_id uuid;
BEGIN
  -- Buscar IDs das categorias
  SELECT id INTO cat_pratos_id FROM categorias WHERE nome = 'Pratos Principais' LIMIT 1;
  SELECT id INTO cat_bebidas_id FROM categorias WHERE nome = 'Bebidas' LIMIT 1;
  SELECT id INTO cat_sobremesas_id FROM categorias WHERE nome = 'Sobremesas' LIMIT 1;
  
  -- Inserir produtos se as categorias existirem
  IF cat_pratos_id IS NOT NULL THEN
    INSERT INTO produtos (nome, descricao, preco, categoria_id, tempo_preparo) VALUES
      ('Arroz com Feijão', 'Arroz branco com feijão carioca', 15.90, cat_pratos_id, 20),
      ('Bife Acebolado', 'Bife grelhado com cebolas refogadas', 28.50, cat_pratos_id, 25),
      ('Frango Grelhado', 'Peito de frango grelhado com temperos', 22.00, cat_pratos_id, 20)
    ON CONFLICT DO NOTHING;
  END IF;
  
  IF cat_bebidas_id IS NOT NULL THEN
    INSERT INTO produtos (nome, descricao, preco, categoria_id, tempo_preparo) VALUES
      ('Refrigerante Lata', 'Refrigerante gelado 350ml', 5.50, cat_bebidas_id, 2),
      ('Suco Natural', 'Suco de frutas naturais 300ml', 8.00, cat_bebidas_id, 5),
      ('Água Mineral', 'Água mineral sem gás 500ml', 3.50, cat_bebidas_id, 1)
    ON CONFLICT DO NOTHING;
  END IF;
  
  IF cat_sobremesas_id IS NOT NULL THEN
    INSERT INTO produtos (nome, descricao, preco, categoria_id, tempo_preparo) VALUES
      ('Pudim de Leite', 'Pudim caseiro com calda de caramelo', 12.00, cat_sobremesas_id, 5),
      ('Sorvete', 'Sorvete artesanal - 2 bolas', 8.50, cat_sobremesas_id, 3)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;