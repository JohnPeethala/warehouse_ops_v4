-- Run this in your Supabase SQL Editor to seed test users
-- This will create 3 users with the password: 123 (as you edited)

DO $$
DECLARE
  admin_id uuid := gen_random_uuid();
  super_id uuid := gen_random_uuid();
  gt_id uuid := gen_random_uuid();
BEGIN
  -- Insert Auth Users
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at) 
  VALUES 
    (admin_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '9999999999@warehouse.local', crypt('123', gen_salt('bf')), current_timestamp, '{"provider":"email","providers":["email"]}', '{"name":"Admin Test"}', current_timestamp, current_timestamp),
    (super_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '8888888888@warehouse.local', crypt('123', gen_salt('bf')), current_timestamp, '{"provider":"email","providers":["email"]}', '{"name":"Supervisor Test"}', current_timestamp, current_timestamp),
    (gt_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '7777777777@warehouse.local', crypt('123', gen_salt('bf')), current_timestamp, '{"provider":"email","providers":["email"]}', '{"name":"GT Test"}', current_timestamp, current_timestamp);

  -- Insert Profiles
  INSERT INTO public.core_profiles (id, phone, name, role)
  VALUES
    (admin_id, '9999999999', 'Admin Test', 'admin'),
    (super_id, '8888888888', 'Supervisor Test', 'supervisor'),
    (gt_id, '7777777777', 'GT Test', 'ground');
    
END $$;
