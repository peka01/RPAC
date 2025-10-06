-- =============================================
-- FIX DEMO USER PASSWORD
-- =============================================
-- This script resets the demo user password to 'demo123'
-- Use this if the demo user exists but has the wrong password
-- =============================================

-- OPTION 1: Reset password via Supabase Dashboard (RECOMMENDED)
-- Go to: Supabase Dashboard → Authentication → Users
-- Find: demo@beready.se
-- Click: ... menu → Reset Password → Set New Password: demo123

-- OPTION 2: Delete and recreate (if password reset doesn't work)
-- This will delete the existing demo user and all their data

DO $$ 
DECLARE
  demo_user_id UUID;
BEGIN
  -- Get demo user ID
  SELECT id INTO demo_user_id FROM auth.users WHERE email = 'demo@beready.se';
  
  IF demo_user_id IS NULL THEN
    RAISE NOTICE '✅ Demo user does not exist';
    RAISE NOTICE '   Click "Log in as Demo" to create it with correct password';
    RETURN;
  END IF;

  RAISE NOTICE '⚠️  Demo user exists with ID: %', demo_user_id;
  RAISE NOTICE '   Deleting user and all data...';
  RAISE NOTICE '   (User will be recreated with correct password when clicking "Log in as Demo")';

  -- Delete the user (CASCADE will handle all related data)
  DELETE FROM auth.users WHERE id = demo_user_id;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ DEMO USER DELETED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Click "Log in as Demo" on login page';
  RAISE NOTICE '2. User will be created with password: demo123';
  RAISE NOTICE '3. Run setup-demo-user.sql to add sample data';
  RAISE NOTICE '========================================';

END $$;

