-- =============================================
-- FINAL FIX FOR get_all_users FUNCTION
-- =============================================
-- This fixes the type mismatch by matching the actual database schema
-- Created: 2025-01-27

-- Drop ALL existing versions of the function
DROP FUNCTION IF EXISTS get_all_users(UUID, VARCHAR, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS get_all_users(UUID, VARCHAR(20), INTEGER, INTEGER);
DROP FUNCTION IF EXISTS get_all_users(UUID, TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS get_all_users(UUID);
DROP FUNCTION IF EXISTS get_all_users;

-- Create the corrected function that matches actual database schema
CREATE OR REPLACE FUNCTION get_all_users(
  p_admin_user_id UUID,
  p_tier_filter VARCHAR(20) DEFAULT NULL,
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  user_id UUID,
  email VARCHAR(255),  -- Changed from TEXT to match auth.users.email
  display_name VARCHAR(100),  -- Matches user_profiles.display_name
  user_tier VARCHAR(20),  -- Matches user_profiles.user_tier
  license_type VARCHAR(20),  -- Matches user_profiles.license_type
  license_expires_at TIMESTAMP WITH TIME ZONE,
  is_license_active BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  community_count INTEGER,
  community_names TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_tier VARCHAR(20);
BEGIN
  -- Verify admin is super_admin
  SELECT up.user_tier INTO v_admin_tier
  FROM public.user_profiles up
  WHERE up.user_id = p_admin_user_id;

  IF v_admin_tier IS NULL OR v_admin_tier <> 'super_admin' THEN
    RAISE EXCEPTION 'Only super admins can view all users. Current user tier: %', COALESCE(v_admin_tier, 'NULL');
  END IF;

  RETURN QUERY
  SELECT
    au.id as user_id,
    au.email,  -- This is VARCHAR(255) in auth.users
    up.display_name,  -- This is VARCHAR(100) in user_profiles
    up.user_tier,  -- This is VARCHAR(20) in user_profiles
    up.license_type,  -- This is VARCHAR(20) in user_profiles
    up.license_expires_at,
    up.is_license_active,
    up.created_at,
    (
      SELECT COUNT(*)::INTEGER
      FROM public.community_memberships cm
      WHERE cm.user_id = au.id
        AND (cm.membership_status = 'approved' OR cm.status = 'approved' OR cm.status IS NULL)
    ) as community_count,
    (
      SELECT STRING_AGG(lc.community_name, ', ' ORDER BY lc.community_name)
      FROM public.community_memberships cm
      JOIN public.local_communities lc ON lc.id = cm.community_id
      WHERE cm.user_id = au.id
        AND (cm.membership_status = 'approved' OR cm.status = 'approved' OR cm.status IS NULL)
    ) as community_names
  FROM auth.users au
  LEFT JOIN public.user_profiles up ON up.user_id = au.id
  WHERE (p_tier_filter IS NULL OR up.user_tier = p_tier_filter)
  ORDER BY up.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_all_users(UUID, VARCHAR, INTEGER, INTEGER) TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ get_all_users function fixed with correct types!';
  RAISE NOTICE '✅ email: VARCHAR(255) to match auth.users.email';
  RAISE NOTICE '✅ display_name: VARCHAR(100) to match user_profiles.display_name';
  RAISE NOTICE '✅ user_tier: VARCHAR(20) to match user_profiles.user_tier';
  RAISE NOTICE '✅ license_type: VARCHAR(20) to match user_profiles.license_type';
END $$;
