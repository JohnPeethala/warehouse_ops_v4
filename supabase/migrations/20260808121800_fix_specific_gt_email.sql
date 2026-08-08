UPDATE auth.users 
SET 
  email = '8265055463@warehouse.com',
  raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{email}',
    '"8265055463@warehouse.com"'
  )
WHERE email = '8265055463@gt.warehouse.com';
