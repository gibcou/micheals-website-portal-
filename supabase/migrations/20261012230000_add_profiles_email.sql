-- profiles had no email column, so the frontend (restricted to the anon
-- key, which cannot read auth.users) had no way to show admins a usable
-- list of clients by name/email - only raw UUIDs.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

UPDATE profiles p SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, email)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', COALESCE(new.raw_user_meta_data->>'role', 'client'), new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
