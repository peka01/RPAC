-- =============================================
-- MINIMAL ADMIN UTILITY FUNCTIONS
-- =============================================
-- Only the essential functions for super admin operations

-- 1. Function to delete a community (used by super admin)
CREATE OR REPLACE FUNCTION delete_community_admin(p_community_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_tier VARCHAR(20);
BEGIN
  -- Check if the current user is a super admin
  SELECT user_tier INTO v_user_tier
  FROM user_profiles
  WHERE user_id = auth.uid();
  
  IF v_user_tier != 'super_admin' THEN
    RAISE EXCEPTION 'Only super admins can delete communities';
  END IF;
  
  -- Delete related records first (to avoid foreign key constraints)
  DELETE FROM community_memberships WHERE community_id = p_community_id;
  
  -- Delete the community
  DELETE FROM local_communities WHERE id = p_community_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to delete community: %', SQLERRM;
END;
$$;

-- 2. Function to get all users (for admin dashboard)
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  user_tier VARCHAR(20),
  license_type VARCHAR(20),
  is_license_active BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_tier VARCHAR(20);
BEGIN
  -- Check if the current user is a super admin
  SELECT up.user_tier INTO v_user_tier
  FROM user_profiles up
  WHERE up.user_id = auth.uid();
  
  IF v_user_tier != 'super_admin' THEN
    RAISE EXCEPTION 'Only super admins can view all users';
  END IF;
  
  -- Return all users with their profiles
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    up.user_tier,
    up.license_type,
    up.is_license_active,
    au.created_at
  FROM auth.users au
  LEFT JOIN user_profiles up ON au.id = up.user_id
  ORDER BY au.created_at DESC;
END;
$$;

-- 3. Function to get all communities (for admin dashboard)
CREATE OR REPLACE FUNCTION get_all_communities_admin()
RETURNS TABLE (
  id UUID,
  community_name VARCHAR(100),
  description TEXT,
  location VARCHAR(200),
  postal_code VARCHAR(10),
  county VARCHAR(50),
  access_type VARCHAR(20),
  member_count INTEGER,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_tier VARCHAR(20);
BEGIN
  -- Check if the current user is a super admin
  SELECT up.user_tier INTO v_user_tier
  FROM user_profiles up
  WHERE up.user_id = auth.uid();
  
  IF v_user_tier != 'super_admin' THEN
    RAISE EXCEPTION 'Only super admins can view all communities';
  END IF;
  
  -- Return all communities
  RETURN QUERY
  SELECT 
    lc.id,
    lc.community_name,
    lc.description,
    lc.location,
    lc.postal_code,
    lc.county,
    lc.access_type,
    lc.member_count,
    lc.created_at
  FROM local_communities lc
  ORDER BY lc.created_at DESC;
END;
$$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Admin utility functions created successfully!';
  RAISE NOTICE 'Available functions:';
  RAISE NOTICE '  - delete_community_admin(community_id)';
  RAISE NOTICE '  - get_all_users()';
  RAISE NOTICE '  - get_all_communities_admin()';
END $$;

