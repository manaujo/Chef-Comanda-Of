-- Corrigir política RLS da tabela funcionarios para evitar recursão infinita
-- A política estava referenciando a própria tabela funcionarios, causando recursão

-- Remover política problemática
DROP POLICY IF EXISTS "Administrators can manage funcionarios" ON funcionarios;

-- Criar nova política que referencia a tabela profiles em vez da própria tabela funcionarios
CREATE POLICY "Administrators can manage funcionarios"
  ON funcionarios
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.tipo = 'administrador' AND p.ativo = true
    )
  );

-- Atualizar função is_admin_funcionario para usar a tabela profiles
CREATE OR REPLACE FUNCTION is_admin_funcionario()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND tipo = 'administrador' AND ativo = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
