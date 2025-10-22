-- =============================================
-- SHOW ALL USERS (bypassing RLS by running as admin)
-- =============================================

-- List all users from auth.users
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;

