-- =============================================
-- FIX get_all_users FUNCTION - FINAL VERSION
-- =============================================
-- Fixes ambiguous column reference error
-- Date: 2025-10-22

-- Drop all existing versions
DROP FUNCTION IF EXISTS get_all_users();
DROP FUNCTION IF EXISTS get_all_users(UUID, VARCHAR, INTEGER, INTEGER);

-- Create the correct version with fixed column references
CREATE OR REPLACE FUNCTION get_all_users(
  p_admin_user_id UUID,
  p_tier_filter VARCHAR(20) DEFAULT NULL,
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  display_name VARCHAR(100),
  user_tier VARCHAR(20),
  license_type VARCHAR(20),
  license_expires_at TIMESTAMP WITH TIME ZONE,
  is_license_active BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  community_count INTEGER
) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_tier VARCHAR(20);
BEGIN
  -- Get the admin's tier (use table alias to avoid ambiguity)
  SELECT up.user_tier INTO v_admin_tier
  FROM user_profiles up
  WHERE up.user_id = p_admin_user_id;
  
  -- Check if user exists
  IF v_admin_tier IS NULL THEN
    RAISE EXCEPTION 'User profile not found for user_id: %', p_admin_user_id;
  END IF;
  
  -- Verify admin is super_admin (compare with variable, not column)
  IF v_admin_tier <> 'super_admin' THEN
    RAISE EXCEPTION 'Only super admins can view all users. Your tier: %', v_admin_tier;
  END IF;

  -- Return all users with their profiles
  RETURN QUERY
  SELECT 
    au.id as user_id,
    au.email::TEXT,
    up.display_name,
    COALESCE(up.user_tier, 'individual')::VARCHAR(20) as user_tier,
    COALESCE(up.license_type, 'individual')::VARCHAR(20) as license_type,
    up.license_expires_at,
    COALESCE(up.is_license_active, false) as is_license_active,
    COALESCE(up.created_at, au.created_at) as created_at,
    (
      SELECT COUNT(*)::INTEGER
      FROM community_memberships cm
      WHERE cm.user_id = au.id
        AND cm.membership_status = 'approved'
    ) as community_count
  FROM auth.users au
  LEFT JOIN user_profiles up ON up.user_id = au.id
  WHERE p_tier_filter IS NULL OR up.user_tier = p_tier_filter
  ORDER BY COALESCE(up.created_at, au.created_at) DESC
  LIMIT p_limit
  OFFSET p_offset;
  
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_all_users(UUID, VARCHAR, INTEGER, INTEGER) TO authenticated;

-- Verify creation
DO $$
DECLARE
  v_function_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname = 'get_all_users'
  ) INTO v_function_exists;
  
  IF v_function_exists THEN
    RAISE NOTICE '✅ get_all_users function created successfully!';
    RAISE NOTICE '✅ Fixed ambiguous column reference issue';
  ELSE
    RAISE EXCEPTION '❌ Function creation failed!';
  END IF;
END $$;

