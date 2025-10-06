-- =============================================
-- SETUP DEMO USER - COMPLETE WORKING DEMO
-- =============================================
-- Run this script to create or update a fully functional demo user
-- with profile, community membership, resources, and cultivation plan
-- =============================================

-- Variables (update these if needed)
-- Demo user email: demo@beready.se
-- Demo user password: demo123
-- Demo user ID will be fetched from auth.users
-- Demo community: "Demo Samhälle"

-- =============================================
-- STEP 1: Get demo user ID from auth.users
-- =============================================
-- First, you need to create the demo user in Supabase Auth Dashboard
-- Email: demo@beready.se
-- Password: demo123
-- OR just click "Log in as Demo" on the login page!

-- Check if demo user exists:
SELECT id, email FROM auth.users WHERE email = 'demo@beready.se';

-- If not, create via Supabase Dashboard → Authentication → Add User

-- =============================================
-- STEP 2: Create or Update User Profile
-- =============================================

-- Replace 'DEMO_USER_ID' with actual UUID from Step 1
DO $$ 
DECLARE
  demo_user_id UUID;
BEGIN
  -- Get demo user ID
  SELECT id INTO demo_user_id FROM auth.users WHERE email = 'demo@beready.se';
  
  IF demo_user_id IS NULL THEN
    RAISE NOTICE '❌ Demo user not found! Create user in Supabase Auth first.';
    RETURN;
  END IF;

  -- Create or update user profile
  INSERT INTO user_profiles (
    user_id,
    display_name,
    first_name,
    last_name,
    city,
    county,
    postal_code,
    household_size,
    has_children,
    has_elderly,
    has_pets,
    pet_types
  ) VALUES (
    demo_user_id,
    'Demo Användare',
    'Demo',
    'Användare',
    'Växjö',
    'kronoberg',
    '35230',
    2,
    false,
    false,
    false,
    null
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    display_name = EXCLUDED.display_name,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    city = EXCLUDED.city,
    county = EXCLUDED.county,
    postal_code = EXCLUDED.postal_code,
    household_size = EXCLUDED.household_size,
    has_children = EXCLUDED.has_children,
    has_elderly = EXCLUDED.has_elderly,
    has_pets = EXCLUDED.has_pets,
    updated_at = NOW();

  RAISE NOTICE '✅ User profile created/updated for demo user';

END $$;

-- =============================================
-- STEP 3: Create Demo Community (if not exists)
-- =============================================

DO $$ 
DECLARE
  demo_user_id UUID;
  demo_community_id UUID;
BEGIN
  -- Get demo user ID
  SELECT id INTO demo_user_id FROM auth.users WHERE email = 'demo@beready.se';
  
  IF demo_user_id IS NULL THEN
    RAISE NOTICE '❌ Demo user not found!';
    RETURN;
  END IF;

  -- Check if demo community already exists
  SELECT id INTO demo_community_id 
  FROM local_communities 
  WHERE community_name = 'Demo Samhälle' AND postal_code = '35230';

  -- Create demo community if it doesn't exist
  IF demo_community_id IS NULL THEN
    INSERT INTO local_communities (
      community_name,
      description,
      postal_code,
      county,
      location,
      created_by,
      is_public
    ) VALUES (
      'Demo Samhälle',
      'Ett demonstrationssamhälle för att testa Beready-appens funktioner',
      '35230',
      'Kronoberg',
      'Växjö',
      demo_user_id,
      true
    )
    RETURNING id INTO demo_community_id;
  ELSE
    -- Update existing community
    UPDATE local_communities
    SET 
      description = 'Ett demonstrationssamhälle för att testa Beready-appens funktioner',
      updated_at = NOW()
    WHERE id = demo_community_id;
  END IF;

  RAISE NOTICE '✅ Demo community created/updated: %', demo_community_id;

  -- Add demo user as member (admin role)
  -- First check if membership exists
  IF NOT EXISTS (
    SELECT 1 FROM community_memberships 
    WHERE community_id = demo_community_id AND user_id = demo_user_id
  ) THEN
    INSERT INTO community_memberships (
      community_id,
      user_id,
      role
    ) VALUES (
      demo_community_id,
      demo_user_id,
      'admin'
    );
  ELSE
    -- Update existing membership to ensure admin role
    UPDATE community_memberships
    SET role = 'admin'
    WHERE community_id = demo_community_id AND user_id = demo_user_id;
  END IF;

  RAISE NOTICE '✅ Demo user added as community member';

END $$;

-- =============================================
-- STEP 4: Create Sample Resources
-- =============================================

DO $$ 
DECLARE
  demo_user_id UUID;
BEGIN
  -- Get demo user ID
  SELECT id INTO demo_user_id FROM auth.users WHERE email = 'demo@beready.se';
  
  IF demo_user_id IS NULL THEN
    RAISE NOTICE '❌ Demo user not found!';
    RETURN;
  END IF;

  -- Delete old demo resources to start fresh
  DELETE FROM resources WHERE user_id = demo_user_id;

  -- Create sample resources
  INSERT INTO resources (user_id, name, category, quantity, unit, days_remaining, is_filled, is_msb_recommended, msb_priority) VALUES
    (demo_user_id, 'Ris', 'food', 5, 'kg', 30, true, true, 'high'),
    (demo_user_id, 'Pasta', 'food', 3, 'kg', 45, true, true, 'high'),
    (demo_user_id, 'Konserver', 'food', 10, 'st', 90, true, true, 'high'),
    (demo_user_id, 'Vatten', 'water', 18, 'liter', 7, true, true, 'high'),
    (demo_user_id, 'Ficklampa', 'tools', 2, 'st', 365, true, true, 'medium'),
    (demo_user_id, 'Batterier AA', 'tools', 20, 'st', 180, true, true, 'medium'),
    (demo_user_id, 'Förstahjälpen-låda', 'medicine', 1, 'st', 120, true, true, 'high'),
    (demo_user_id, 'Alvedon', 'medicine', 2, 'förpackningar', 60, true, true, 'medium'),
    (demo_user_id, 'Radio (batteridiven)', 'tools', 1, 'st', 0, false, true, 'medium'),
    (demo_user_id, 'Tändstickor', 'tools', 5, 'askar', 0, false, true, 'low');

  RAISE NOTICE '✅ Sample resources created (10 items)';

END $$;

-- =============================================
-- STEP 5: Create Sample Cultivation Plan
-- =============================================

DO $$ 
DECLARE
  demo_user_id UUID;
BEGIN
  -- Get demo user ID
  SELECT id INTO demo_user_id FROM auth.users WHERE email = 'demo@beready.se';
  
  IF demo_user_id IS NULL THEN
    RAISE NOTICE '❌ Demo user not found!';
    RETURN;
  END IF;

  -- Delete old demo cultivation plans
  DELETE FROM cultivation_plans WHERE user_id = demo_user_id;

  -- Create a sample cultivation plan
  INSERT INTO cultivation_plans (
    user_id,
    plan_id,
    title,
    description,
    crops,
    is_primary,
    self_sufficiency_percent
  ) VALUES (
    demo_user_id,
    'demo_plan_' || EXTRACT(EPOCH FROM NOW())::TEXT,
    'Min Sommarodling 2025',
    'En demonstrationsplan med vanliga svenska grödor',
    '[
      {"cropName": "Potatis", "estimatedYieldKg": 15},
      {"cropName": "Morötter", "estimatedYieldKg": 8},
      {"cropName": "Lök", "estimatedYieldKg": 5},
      {"cropName": "Tomater", "estimatedYieldKg": 12},
      {"cropName": "Gurka", "estimatedYieldKg": 6},
      {"cropName": "Sallad", "estimatedYieldKg": 3}
    ]'::jsonb,
    true,
    15
  );

  RAISE NOTICE '✅ Sample cultivation plan created';

END $$;

-- =============================================
-- VERIFICATION: Check Demo User Setup
-- =============================================

DO $$ 
DECLARE
  demo_user_id UUID;
  profile_count INT;
  resource_count INT;
  plan_count INT;
  membership_count INT;
BEGIN
  -- Get demo user ID
  SELECT id INTO demo_user_id FROM auth.users WHERE email = 'demo@beready.se';
  
  IF demo_user_id IS NULL THEN
    RAISE NOTICE '❌ Demo user not found in auth.users!';
    RAISE NOTICE '   → Create user at: Supabase Dashboard → Authentication → Add User';
    RAISE NOTICE '   → Email: demo@beready.se';
    RETURN;
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'DEMO USER VERIFICATION';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'User ID: %', demo_user_id;

  -- Check profile
  SELECT COUNT(*) INTO profile_count FROM user_profiles WHERE user_id = demo_user_id;
  RAISE NOTICE '✅ User Profile: % record(s)', profile_count;

  -- Check resources
  SELECT COUNT(*) INTO resource_count FROM resources WHERE user_id = demo_user_id;
  RAISE NOTICE '✅ Resources: % item(s)', resource_count;

  -- Check cultivation plans
  SELECT COUNT(*) INTO plan_count FROM cultivation_plans WHERE user_id = demo_user_id;
  RAISE NOTICE '✅ Cultivation Plans: % plan(s)', plan_count;

  -- Check community memberships
  SELECT COUNT(*) INTO membership_count FROM community_memberships WHERE user_id = demo_user_id;
  RAISE NOTICE '✅ Community Memberships: % community(ies)', membership_count;

  RAISE NOTICE '========================================';
  
  IF profile_count > 0 AND resource_count > 0 AND plan_count > 0 AND membership_count > 0 THEN
    RAISE NOTICE '🎉 DEMO USER FULLY SET UP AND READY!';
  ELSE
    RAISE NOTICE '⚠️  Some data is missing - check above';
  END IF;
  
  RAISE NOTICE '========================================';

END $$;

-- =============================================
-- MANUAL VERIFICATION QUERIES
-- =============================================

-- View demo user profile:
-- SELECT * FROM user_profiles WHERE user_id = (SELECT id FROM auth.users WHERE email = 'demo@beready.se');

-- View demo user resources:
-- SELECT * FROM resources WHERE user_id = (SELECT id FROM auth.users WHERE email = 'demo@beready.se');

-- View demo user cultivation plan:
-- SELECT * FROM cultivation_plans WHERE user_id = (SELECT id FROM auth.users WHERE email = 'demo@beready.se');

-- View demo user community memberships:
-- SELECT cm.*, lc.community_name 
-- FROM community_memberships cm
-- JOIN local_communities lc ON lc.id = cm.community_id
-- WHERE cm.user_id = (SELECT id FROM auth.users WHERE email = 'demo@beready.se');

