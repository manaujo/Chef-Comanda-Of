/*
  # Fix RLS policies for profiles table

  1. Changes
    - Drop existing conflicting policies
    - Create clear, unambiguous policies for profiles table
    - Ensure only administrators can create new employee profiles
    - Allow users to view and update their own profiles
    - Allow administrators full access to all profiles

  2. Security
    - Remove ambiguous INSERT policy
    - Ensure proper role-based access control
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Usuários podem ver seus próprios dados" ON profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios dados" ON profiles;
DROP POLICY IF EXISTS "Administradores podem ver todos os perfis" ON profiles;
DROP POLICY IF EXISTS "Administradores podem criar perfis" ON profiles;
DROP POLICY IF EXISTS "Administradores podem atualizar perfis" ON profiles;
DROP POLICY IF EXISTS "Usuários podem inserir seus próprios dados" ON profiles;

-- Create new, clear policies

-- SELECT policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Administrators can view all profiles" ON profiles
  FOR SELECT USING (is_admin());

-- INSERT policies (only administrators can create new profiles)
CREATE POLICY "Only administrators can create profiles" ON profiles
  FOR INSERT WITH CHECK (is_admin());

-- UPDATE policies
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Administrators can update any profile" ON profiles
  FOR UPDATE USING (is_admin());

-- DELETE policies (only administrators can delete profiles)
CREATE POLICY "Only administrators can delete profiles" ON profiles
  FOR DELETE USING (is_admin());