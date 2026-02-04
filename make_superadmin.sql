-- 1. First, sign up a new user in your application (e.g., at /sign-up)
-- 2. Find their User ID (UUID) in the Supabase Dashboard (Authentication > Users) or public.profiles table
-- 3. Replace 'YOUR_USER_ID_HERE' below with that UUID
-- 4. Run this script in the Supabase SQL Editor

DO $$
DECLARE
  target_user_id uuid := 'YOUR_USER_ID_HERE'; -- <--- REPLACE THIS
BEGIN
  -- 1. Update the public profile role (used by RLS policies)
  UPDATE public.profiles
  SET role = 'SUPERADMIN'
  WHERE user_id = target_user_id;

  -- 2. Update the auth.users metadata (used by the client-side app/session)
  -- This ensures the UI updates immediately on next login/refresh
  UPDATE auth.users
  SET raw_user_meta_data = 
    jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{role}',
      '"SUPERADMIN"'
    )
  WHERE id = target_user_id;
  
  -- 3. Force a session refresh might be needed, or just sign out and sign in.
END $$;
