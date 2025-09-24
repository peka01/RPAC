# Create Demo User

## Option 1: Manual Creation in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Users**
3. Click **Add user** → **Create new user**
4. Enter:
   - **Email**: `demo@rpac.se`
   - **Password**: `demo123`
   - **Email Confirm**: ✅ (check this box)
5. Click **Create user**

## Option 2: SQL Script to Create Demo User

Run this in your Supabase SQL Editor:

```sql
-- Create demo user in auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'demo@rpac.se',
  crypt('demo123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Demo Användare"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Create corresponding user profile
INSERT INTO public.users (id, email, name, created_at, updated_at)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'name', 'Demo Användare'),
  created_at,
  updated_at
FROM auth.users 
WHERE email = 'demo@rpac.se';
```

## Option 3: Disable Email Confirmation (Development Only)

1. Go to **Authentication** → **Settings**
2. Find **Email confirmation**
3. **Disable** email confirmation
4. Save settings

This allows users to sign up without email verification during development.

## Test the Login

After creating the user, try logging in with:
- **Email**: `demo@rpac.se`
- **Password**: `demo123`
