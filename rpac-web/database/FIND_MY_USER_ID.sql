-- =============================================
-- FIND YOUR USER ID
-- =============================================
-- Run this to find your authenticated user ID

-- Option 1: List all users from auth.users (Supabase Auth)
SELECT 
  id as user_id,
  email,
  created_at,
  last_sign_in_at,
  email_confirmed_at
FROM auth.users
ORDER BY created_at DESC;

-- Option 2: List all user profiles (if any exist)
SELECT 
  user_id,
  county,
  postal_code,
  climate_zone,
  created_at
FROM user_profiles
ORDER BY created_at DESC;

-- Option 3: Check if your email exists
-- Replace 'your.email@example.com' with your actual email
SELECT 
  id as user_id,
  email,
  created_at
FROM auth.users
WHERE email = 'per.karlsson@title.se';  -- Change this to your email

