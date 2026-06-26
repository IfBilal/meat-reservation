-- Seed first admin user
-- Replace the UUID and email with the actual values from your Supabase Auth dashboard
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  role,
  aud,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@gmail.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  'authenticated',
  'authenticated',
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false
);

INSERT INTO admin_users (id, email)
SELECT id, email FROM auth.users WHERE email = 'admin@gmail.com';
