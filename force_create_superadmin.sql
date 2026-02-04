-- Script to create a user directly in the database, bypassing API rate limits and email verification.
-- This user will be created as a SUPERADMIN immediately.

DO $$
DECLARE
  new_user_id uuid := gen_random_uuid();
  user_email text := 'admin@example.com';      -- <--- CHANGE THIS EMAIL
  user_password text := 'password123';         -- <--- CHANGE THIS PASSWORD
  user_name text := 'Super Admin';
BEGIN
  -- 1. Insert into auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', -- Default instance_id
    new_user_id,
    'authenticated',
    'authenticated',
    user_email,
    crypt(user_password, gen_salt('bf')), -- Requires pgcrypto extension
    now(), -- Auto-confirm email
    '{"provider": "email", "providers": ["email"]}',
    jsonb_build_object('full_name', user_name, 'role', 'SUPERADMIN'),
    now(),
    now(),
    '',
    ''
  );

  -- 2. Insert into public.profiles (trigger might handle this, but safe to do explicit if not)
  INSERT INTO public.profiles (
    user_id,
    name,
    role,
    email -- Note: email column might not exist in profiles based on schema, removing if not needed
  ) VALUES (
    new_user_id,
    user_name,
    'SUPERADMIN',
    user_email
  )
  ON CONFLICT (user_id) DO UPDATE
  SET role = 'SUPERADMIN';

  RAISE NOTICE 'User created successfully with ID: %', new_user_id;
END $$;
