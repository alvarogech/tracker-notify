-- Corrige recursão infinita nas policies RLS de profiles.
-- As policies profiles_coordinator_read e profiles_admin_write faziam subquery
-- em profiles dentro de uma policy de profiles → recursão 42P17.
-- Solução: função SECURITY DEFINER no schema public que lê o role sem acionar RLS.

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- Recria policies sem recursão
DROP POLICY IF EXISTS "profiles_coordinator_read" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_write" ON profiles;

CREATE POLICY "profiles_coordinator_read"
  ON profiles FOR SELECT
  USING (public.current_user_role() IN ('coordinator', 'admin'));

CREATE POLICY "profiles_admin_write"
  ON profiles FOR ALL
  USING (public.current_user_role() = 'admin');
