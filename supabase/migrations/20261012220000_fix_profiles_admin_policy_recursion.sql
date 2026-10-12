-- The "Admins can read all profiles" policy checked admin status by
-- querying profiles from within a policy ON profiles, which re-triggers
-- RLS on profiles and recurses infinitely (Postgres error 42P17).
-- Move the check into a SECURITY DEFINER function, which bypasses RLS,
-- matching the existing is_conversation_participant() pattern.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
CREATE POLICY "Admins can read all profiles" ON profiles FOR SELECT USING (public.is_admin());
