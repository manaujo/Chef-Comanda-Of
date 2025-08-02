/*
  # Criar função para dados de exemplo

  1. Functions
    - `create_sample_data_for_user()` - Creates sample data for new users
    - Automatically called when a new profile is created

  2. Sample Data
    - Default categories
    - Sample products
    - Sample tables
    - Sample employees
*/

-- Function to create sample data for new users
CREATE OR REPLACE FUNCTION create_sample_data_for_user(target_user_id uuid)
RETURNS void AS $$
DECLARE
  categoria_pratos_id uuid;
  categoria_bebidas_id uuid;
  categoria_sobremesas_id uuid;
  categoria_petiscos_id uuid;
BEGIN
  -- Create sample categories
  INSERT INTO categorias (user_id, nome, descricao, cor) VALUES
    (target_user_id, 'Pratos Principais', 'Pratos principais do cardápio', '#dc2626'),
    (target_user_id, 'Bebidas', 'Bebidas em geral', '#2563eb'),
    (target_user_id, 'Sobremesas', 'Doces e sobremesas', '#7c3aed'),
    (target_user_id, 'Petiscos', 'Aperitivos e petiscos', '#ea580c')
  RETURNING id INTO categoria_pratos_id;

  -- Get category IDs
  SELECT id INTO categoria_pratos_id FROM categorias WHERE user_id = target_user_id AND nome = 'Pratos Principais';
  SELECT id INTO categoria_bebidas_id FROM categorias WHERE user_id = target_user_id AND nome = 'Bebidas';
  SELECT id INTO categoria_sobremesas_id FROM categorias WHERE user_id = target_user_id AND nome = 'Sobremesas';
  SELECT id INTO categoria_petiscos_id FROM categorias WHERE user_id = target_user_id AND nome = 'Petiscos';

  -- Create sample products
  INSERT INTO produtos (user_id, nome, descricao, preco, categoria_id, categoria_produto, tempo_preparo) VALUES
    (target_user_id, 'Hambúrguer Artesanal', 'Hambúrguer com carne 180g, queijo, alface e tomate', 25.90, categoria_pratos_id, 'prato', 20),
    (target_user_id, 'Pizza Margherita', 'Pizza tradicional com molho de tomate, mussarela e manjericão', 32.90, categoria_pratos_id, 'prato', 25),
    (target_user_id, 'Refrigerante Lata', 'Refrigerante gelado 350ml', 5.90, categoria_bebidas_id, 'bebida', 2),
    (target_user_id, 'Suco Natural', 'Suco natural de frutas 400ml', 8.90, categoria_bebidas_id, 'bebida', 5),
    (target_user_id, 'Pudim de Leite', 'Pudim caseiro com calda de caramelo', 12.90, categoria_sobremesas_id, 'sobremesa', 5),
    (target_user_id, 'Batata Frita', 'Porção de batata frita crocante', 15.90, categoria_petiscos_id, 'entrada', 15),
    (target_user_id, 'Pastel de Queijo', 'Pastel frito recheado com queijo', 8.90, categoria_petiscos_id, 'entrada', 10);

  -- Create sample tables
  INSERT INTO mesas (user_id, numero, nome, capacidade, status) VALUES
    (target_user_id, 1, 'Mesa 01', 4, 'livre'),
    (target_user_id, 2, 'Mesa 02', 4, 'livre'),
    (target_user_id, 3, 'Mesa 03', 2, 'livre'),
    (target_user_id, 4, 'Mesa 04', 6, 'livre'),
    (target_user_id, 5, 'Mesa 05', 4, 'livre'),
    (target_user_id, 6, 'Mesa 06', 8, 'livre'),
    (target_user_id, 7, 'Mesa 07', 2, 'livre'),
    (target_user_id, 8, 'Mesa 08', 4, 'livre');

  -- Create sample employees
  INSERT INTO funcionarios_simples (user_id, nome, tipo) VALUES
    (target_user_id, 'João Silva', 'garcom'),
    (target_user_id, 'Maria Santos', 'garcom'),
    (target_user_id, 'Pedro Costa', 'caixa'),
    (target_user_id, 'Ana Oliveira', 'caixa'),
    (target_user_id, 'Carlos Lima', 'cozinha'),
    (target_user_id, 'Lucia Ferreira', 'estoque');

  -- Create sample inventory items
  INSERT INTO insumos (user_id, nome, unidade, preco_unitario, quantidade_estoque, estoque_minimo, fornecedor) VALUES
    (target_user_id, 'Carne Bovina', 'kg', 35.00, 10.0, 2.0, 'Açougue Central'),
    (target_user_id, 'Queijo Mussarela', 'kg', 28.00, 5.0, 1.0, 'Laticínios Silva'),
    (target_user_id, 'Farinha de Trigo', 'kg', 4.50, 20.0, 5.0, 'Moinho Dourado'),
    (target_user_id, 'Óleo de Soja', 'l', 8.90, 15.0, 3.0, 'Supermercado ABC'),
    (target_user_id, 'Tomate', 'kg', 6.50, 8.0, 2.0, 'Hortifruti Verde'),
    (target_user_id, 'Alface', 'un', 2.50, 12.0, 3.0, 'Hortifruti Verde'),
    (target_user_id, 'Refrigerante', 'un', 3.20, 50.0, 10.0, 'Distribuidora Bebidas');

END;
$$ LANGUAGE plpgsql;

-- Function to automatically create sample data when profile is created
CREATE OR REPLACE FUNCTION create_sample_data_on_profile_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Create sample data for the new user
  PERFORM create_sample_data_for_user(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-create sample data
DROP TRIGGER IF EXISTS create_sample_data_trigger ON profiles;
CREATE TRIGGER create_sample_data_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_sample_data_on_profile_insert();