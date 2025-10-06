-- =============================================
-- RESET DEMO USER - CLEAN SLATE
-- =============================================
-- Run this script to completely reset the demo user
-- This will delete ALL demo user data and allow fresh setup
-- =============================================

-- Demo user email: demo@beready.se

-- =============================================
-- OPTION 1: SOFT RESET (Keep user, reset data)
-- =============================================
-- Use this to keep the demo user account but reset all their data

DO $$ 
DECLARE
  demo_user_id UUID;
BEGIN
  -- Get demo user ID
  SELECT id INTO demo_user_id FROM auth.users WHERE email = 'demo@beready.se';
  
  IF demo_user_id IS NULL THEN
    RAISE NOTICE '❌ Demo user not found (email: demo@beready.se)';
    RAISE NOTICE '   Nothing to reset.';
    RETURN;
  END IF;

  RAISE NOTICE '🔄 Resetting demo user data...';
  RAISE NOTICE 'User ID: %', demo_user_id;

  -- Delete cultivation plans
  DELETE FROM cultivation_plans WHERE user_id = demo_user_id;
  RAISE NOTICE '✅ Deleted cultivation plans';

  -- Delete cultivation calendar entries
  DELETE FROM cultivation_calendar WHERE user_id = demo_user_id;
  RAISE NOTICE '✅ Deleted cultivation calendar entries';

  -- Delete cultivation reminders
  DELETE FROM cultivation_reminders WHERE user_id = demo_user_id;
  RAISE NOTICE '✅ Deleted cultivation reminders';

  -- Delete resources
  DELETE FROM resources WHERE user_id = demo_user_id;
  RAISE NOTICE '✅ Deleted resources';

  -- Delete community memberships (but not the demo community itself)
  DELETE FROM community_memberships WHERE user_id = demo_user_id;
  RAISE NOTICE '✅ Deleted community memberships';

  -- Delete messages sent by demo user
  DELETE FROM messages WHERE sender_id = demo_user_id;
  RAISE NOTICE '✅ Deleted messages';

  -- Delete resource sharing posts
  DELETE FROM resource_sharing WHERE user_id = demo_user_id;
  RAISE NOTICE '✅ Deleted resource sharing posts';

  -- Reset user profile to defaults (keep the profile, just reset data)
  UPDATE user_profiles 
  SET 
    display_name = 'Demo Användare',
    first_name = 'Demo',
    last_name = 'Användare',
    city = 'Växjö',
    county = 'Kronoberg',
    postal_code = '35230',
    household_size = 2,
    has_children = false,
    has_pets = false,
    pet_types = null,
    updated_at = NOW()
  WHERE user_id = demo_user_id;
  RAISE NOTICE '✅ Reset user profile to defaults';

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🎉 DEMO USER DATA RESET COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Next step: Run setup-demo-user.sql to add fresh sample data';
  RAISE NOTICE '';

END $$;

-- =============================================
-- OPTION 2: HARD RESET (Delete everything including user)
-- =============================================
-- ⚠️ WARNING: This will DELETE the user account from auth.users
-- ⚠️ Use only if you want to completely remove and recreate the demo user

/*
DO $$ 
DECLARE
  demo_user_id UUID;
BEGIN
  -- Get demo user ID
  SELECT id INTO demo_user_id FROM auth.users WHERE email = 'demo@beready.se';
  
  IF demo_user_id IS NULL THEN
    RAISE NOTICE '❌ Demo user not found (email: demo@beready.se)';
    RAISE NOTICE '   Nothing to delete.';
    RETURN;
  END IF;

  RAISE NOTICE '⚠️  HARD RESET: Deleting demo user and ALL data...';
  RAISE NOTICE 'User ID: %', demo_user_id;

  -- Delete from auth.users (this will CASCADE to all related tables)
  DELETE FROM auth.users WHERE id = demo_user_id;
  
  RAISE NOTICE '✅ Demo user completely deleted';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🗑️  HARD RESET COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Next step: Click "Log in as Demo" to recreate the user,';
  RAISE NOTICE 'then run setup-demo-user.sql to add sample data';
  RAISE NOTICE '';

END $$;
*/

-- =============================================
-- OPTION 3: RESET DEMO COMMUNITY
-- =============================================
-- Delete the Demo Samhälle community and all its data

/*
DO $$ 
DECLARE
  demo_community_id UUID;
BEGIN
  -- Get demo community ID
  SELECT id INTO demo_community_id 
  FROM local_communities 
  WHERE community_name = 'Demo Samhälle' AND postal_code = '35230';
  
  IF demo_community_id IS NULL THEN
    RAISE NOTICE '❌ Demo community not found';
    RAISE NOTICE '   Nothing to delete.';
    RETURN;
  END IF;

  RAISE NOTICE '🔄 Deleting demo community and all its data...';
  RAISE NOTICE 'Community ID: %', demo_community_id;

  -- Delete community (CASCADE will handle memberships, messages, resources, etc.)
  DELETE FROM local_communities WHERE id = demo_community_id;
  
  RAISE NOTICE '✅ Demo community deleted';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🗑️  DEMO COMMUNITY RESET COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Next step: Run setup-demo-user.sql to recreate the community';
  RAISE NOTICE '';

END $$;
*/

-- =============================================
-- VERIFICATION: Check what's left
-- =============================================

DO $$ 
DECLARE
  demo_user_id UUID;
  profile_count INT;
  resource_count INT;
  plan_count INT;
  membership_count INT;
  message_count INT;
BEGIN
  -- Get demo user ID
  SELECT id INTO demo_user_id FROM auth.users WHERE email = 'demo@beready.se';
  
  IF demo_user_id IS NULL THEN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DEMO USER STATUS';
    RAISE NOTICE '========================================';
    RAISE NOTICE '❌ Demo user does not exist';
    RAISE NOTICE '   Click "Log in as Demo" to create it';
    RAISE NOTICE '========================================';
    RETURN;
  END IF;

  -- Count remaining data
  SELECT COUNT(*) INTO profile_count FROM user_profiles WHERE user_id = demo_user_id;
  SELECT COUNT(*) INTO resource_count FROM resources WHERE user_id = demo_user_id;
  SELECT COUNT(*) INTO plan_count FROM cultivation_plans WHERE user_id = demo_user_id;
  SELECT COUNT(*) INTO membership_count FROM community_memberships WHERE user_id = demo_user_id;
  SELECT COUNT(*) INTO message_count FROM messages WHERE sender_id = demo_user_id;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'DEMO USER STATUS AFTER RESET';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'User ID: %', demo_user_id;
  RAISE NOTICE 'Profile: % record(s)', profile_count;
  RAISE NOTICE 'Resources: % item(s)', resource_count;
  RAISE NOTICE 'Cultivation Plans: % plan(s)', plan_count;
  RAISE NOTICE 'Community Memberships: % community(ies)', membership_count;
  RAISE NOTICE 'Messages: % message(s)', message_count;
  RAISE NOTICE '========================================';
  
  IF resource_count = 0 AND plan_count = 0 AND membership_count = 0 THEN
    RAISE NOTICE '✅ Demo user data successfully reset';
    RAISE NOTICE '   Ready for fresh setup!';
  ELSE
    RAISE NOTICE '⚠️  Some data still exists';
  END IF;
  
  RAISE NOTICE '========================================';

END $$;

