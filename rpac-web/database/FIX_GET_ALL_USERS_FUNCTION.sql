-- =============================================
-- FIX get_all_users FUNCTION
-- =============================================
-- Purpose: Ensure the correct version of get_all_users exists with proper parameters
-- Date: 2025-10-22
-- Issue: Frontend expects parameters but database may have parameter-less version

-- Drop the old version (if exists)
DROP FUNCTION IF EXISTS get_all_users();

-- Create/Replace with the correct version that accepts parameters
CREATE OR REPLACE FUNCTION get_all_users(
  p_admin_user_id UUID,
  p_tier_filter VARCHAR(20) DEFAULT NULL,
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  display_name TEXT,
  user_tier VARCHAR(20),
  license_type VARCHAR(20),
  license_expires_at TIMESTAMP WITH TIME ZONE,
  is_license_active BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  community_count INTEGER
) AS $$
BEGIN
  -- Verify admin is super_admin
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.user_id = p_admin_user_id 
    AND user_tier = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Only super admins can view all users';
  END IF;

  RETURN QUERY
  SELECT 
    au.id as user_id,
    au.email,
    up.display_name,
    up.user_tier,
    up.license_type,
    up.license_expires_at,
    up.is_license_active,
    up.created_at,
    (
      SELECT COUNT(*)::INTEGER
      FROM community_memberships cm
      WHERE cm.user_id = au.id
        AND cm.membership_status = 'approved'
    ) as community_count
  FROM auth.users au
  LEFT JOIN user_profiles up ON up.user_id = au.id
  WHERE p_tier_filter IS NULL OR up.user_tier = p_tier_filter
  ORDER BY up.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ get_all_users function fixed successfully!';
  RAISE NOTICE 'Function now accepts: p_admin_user_id, p_tier_filter, p_limit, p_offset';
END $$;

