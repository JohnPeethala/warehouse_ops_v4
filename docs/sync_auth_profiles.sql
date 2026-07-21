
-- 1. Create a function to automatically sync new auth.users to public.core_profiles
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS \$\$
DECLARE
  extracted_phone text;
BEGIN
  -- Extract phone from email (e.g., '9999999999@warehouse.com' -> '9999999999')
  extracted_phone := split_part(NEW.email, '@', 1);

  INSERT INTO public.core_profiles (id, phone, name, role)
  VALUES (
    NEW.id,
    extracted_phone,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Warehouse User'),
    -- Default to 'ground' role if none provided
    COALESCE((NEW.raw_user_meta_data->>'role')::profile_role, 'ground'::profile_role)
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
\$\$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Attach the trigger to the auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Backfill any existing users that were created manually before the trigger existed
INSERT INTO public.core_profiles (id, phone, name, role)
SELECT 
  id,
  split_part(email, '@', 1),
  COALESCE(raw_user_meta_data->>'name', 'Warehouse User'),
  COALESCE((raw_user_meta_data->>'role')::profile_role, 'ground'::profile_role)
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.core_profiles)
  AND email LIKE '%@warehouse.com';

