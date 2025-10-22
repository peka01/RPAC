-- =============================================
-- ADMIN UTILITY FUNCTIONS
-- =============================================
-- Purpose: Functions for managing users, communities, and memberships
-- Date: 2025-10-21

-- =============================================
-- MEMBERSHIP MANAGEMENT FUNCTIONS
-- =============================================

-- Function: Get pending membership requests for a community
CREATE OR REPLACE FUNCTION get_pending_membership_requests(
  p_community_id UUID
)
RETURNS TABLE (
  membership_id UUID,
  user_id UUID,
  user_email TEXT,
  display_name TEXT,
  join_message TEXT,
  requested_at TIMESTAMP WITH TIME ZONE,
  postal_code VARCHAR(10),
  county VARCHAR(100),
  household_size INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cm.id as membership_id,
    cm.user_id,
    au.email as user_email,
    COALESCE(up.display_name, au.email) as display_name,
    cm.join_message,
    cm.requested_at,
    up.postal_code,
    up.county,
    up.family_size as household_size
  FROM community_memberships cm
  JOIN auth.users au ON au.id = cm.user_id
  LEFT JOIN user_profiles up ON up.user_id = cm.user_id
  WHERE cm.community_id = p_community_id
    AND cm.membership_status = 'pending'
  ORDER BY cm.requested_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Approve membership request
CREATE OR REPLACE FUNCTION approve_membership_request(
  p_membership_id UUID,
  p_reviewer_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_community_id UUID;
  v_member_count INTEGER;
  v_user_id UUID;
BEGIN
  -- Get community_id and user_id
  SELECT community_id, user_id INTO v_community_id, v_user_id
  FROM community_memberships
  WHERE id = p_membership_id;

  -- Check if reviewer is admin or super_admin
  IF NOT EXISTS (
    SELECT 1 FROM community_memberships cm
    WHERE cm.community_id = v_community_id
      AND cm.user_id = p_reviewer_id
      AND cm.role IN ('admin', 'moderator')
      AND cm.membership_status = 'approved'
  ) AND NOT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = p_reviewer_id
      AND user_tier = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can approve membership requests';
  END IF;

  -- Update membership status
  UPDATE community_memberships
  SET 
    membership_status = 'approved',
    reviewed_at = NOW(),
    reviewed_by = p_reviewer_id,
    joined_at = NOW()
  WHERE id = p_membership_id;

  -- Update community member count
  SELECT COUNT(*) INTO v_member_count
  FROM community_memberships
  WHERE community_id = v_community_id
    AND membership_status = 'approved';

  UPDATE local_communities
  SET member_count = v_member_count
  WHERE id = v_community_id;

  -- Create notification for approved user
  INSERT INTO notifications (user_id, type, title, message, link, created_at)
  VALUES (
    v_user_id,
    'membership_approved',
    'Medlemskap godkänt',
    'Din ansökan om medlemskap har godkänts!',
    '/local?community=' || v_community_id::text,
    NOW()
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Reject membership request
CREATE OR REPLACE FUNCTION reject_membership_request(
  p_membership_id UUID,
  p_reviewer_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_community_id UUID;
  v_user_id UUID;
BEGIN
  -- Get community_id and user_id
  SELECT community_id, user_id INTO v_community_id, v_user_id
  FROM community_memberships
  WHERE id = p_membership_id;

  -- Check if reviewer is admin or super_admin
  IF NOT EXISTS (
    SELECT 1 FROM community_memberships cm
    WHERE cm.community_id = v_community_id
      AND cm.user_id = p_reviewer_id
      AND cm.role IN ('admin', 'moderator')
      AND cm.membership_status = 'approved'
  ) AND NOT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = p_reviewer_id
      AND user_tier = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can reject membership requests';
  END IF;

  -- Update membership status
  UPDATE community_memberships
  SET 
    membership_status = 'rejected',
    reviewed_at = NOW(),
    reviewed_by = p_reviewer_id,
    rejection_reason = p_reason
  WHERE id = p_membership_id;

  -- Create notification for rejected user
  INSERT INTO notifications (user_id, type, title, message, link, created_at)
  VALUES (
    v_user_id,
    'membership_rejected',
    'Medlemskap avslaget',
    COALESCE('Din ansökan om medlemskap har avslagits. ' || p_reason, 'Din ansökan om medlemskap har avslagits.'),
    '/local',
    NOW()
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Ban member from community
CREATE OR REPLACE FUNCTION ban_community_member(
  p_membership_id UUID,
  p_admin_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_community_id UUID;
  v_member_count INTEGER;
BEGIN
  -- Get community_id
  SELECT community_id INTO v_community_id
  FROM community_memberships
  WHERE id = p_membership_id;

  -- Check if admin has permission
  IF NOT EXISTS (
    SELECT 1 FROM community_memberships cm
    WHERE cm.community_id = v_community_id
      AND cm.user_id = p_admin_id
      AND cm.role IN ('admin', 'moderator')
      AND cm.membership_status = 'approved'
  ) AND NOT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = p_admin_id
      AND user_tier = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can ban members';
  END IF;

  -- Update membership status to banned
  UPDATE community_memberships
  SET 
    membership_status = 'banned',
    banned_at = NOW(),
    banned_by = p_admin_id,
    ban_reason = p_reason
  WHERE id = p_membership_id;

  -- Update community member count
  SELECT COUNT(*) INTO v_member_count
  FROM community_memberships
  WHERE community_id = v_community_id
    AND membership_status = 'approved';

  UPDATE local_communities
  SET member_count = v_member_count
  WHERE id = v_community_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- USER TIER MANAGEMENT FUNCTIONS
-- =============================================

-- Function: Upgrade user tier (Super admin only)
CREATE OR REPLACE FUNCTION upgrade_user_tier(
  p_target_user_id UUID,
  p_new_tier VARCHAR(20),
  p_admin_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verify admin is super_admin
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = p_admin_user_id 
    AND user_tier = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Only super admins can upgrade user tiers';
  END IF;

  -- Validate tier value
  IF p_new_tier NOT IN ('individual', 'community_manager', 'super_admin') THEN
    RAISE EXCEPTION 'Invalid tier value: %', p_new_tier;
  END IF;

  -- Cannot downgrade super_admin (safety measure)
  IF EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = p_target_user_id 
    AND user_tier = 'super_admin'
  ) AND p_new_tier != 'super_admin' THEN
    RAISE EXCEPTION 'Cannot downgrade super admin';
  END IF;

  -- Update user tier
  UPDATE user_profiles
  SET 
    user_tier = p_new_tier,
    tier_upgraded_at = NOW(),
    license_type = CASE 
      WHEN p_new_tier = 'super_admin' THEN 'free'
      WHEN p_new_tier = 'community_manager' THEN 'community_manager'
      ELSE 'individual'
    END
  WHERE user_id = p_target_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- COMMUNITY MANAGEMENT FUNCTIONS
-- =============================================

-- Function: Get all communities managed by user
CREATE OR REPLACE FUNCTION get_managed_communities(
  p_user_id UUID
)
RETURNS TABLE (
  community_id UUID,
  community_name VARCHAR(100),
  member_count INTEGER,
  access_type VARCHAR(20),
  pending_requests INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lc.id as community_id,
    lc.community_name,
    lc.member_count,
    lc.access_type,
    (
      SELECT COUNT(*)::INTEGER 
      FROM community_memberships cm 
      WHERE cm.community_id = lc.id 
      AND cm.membership_status = 'pending'
    ) as pending_requests,
    lc.created_at
  FROM local_communities lc
  JOIN community_memberships cm ON cm.community_id = lc.id
  WHERE cm.user_id = p_user_id
    AND cm.role IN ('admin', 'moderator')
    AND cm.membership_status = 'approved'
  ORDER BY lc.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get all users (Super admin only)
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

-- Function: Get community statistics
CREATE OR REPLACE FUNCTION get_community_statistics(
  p_community_id UUID
)
RETURNS TABLE (
  total_members INTEGER,
  pending_requests INTEGER,
  active_resources INTEGER,
  active_help_requests INTEGER,
  messages_last_week INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM community_memberships WHERE community_id = p_community_id AND membership_status = 'approved'),
    (SELECT COUNT(*)::INTEGER FROM community_memberships WHERE community_id = p_community_id AND membership_status = 'pending'),
    (SELECT COUNT(*)::INTEGER FROM community_resources WHERE community_id = p_community_id AND status = 'available'),
    (SELECT COUNT(*)::INTEGER FROM help_requests WHERE community_id = p_community_id AND status = 'open'),
    (SELECT COUNT(*)::INTEGER FROM messages WHERE community_id = p_community_id AND created_at > NOW() - INTERVAL '7 days');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Admin utility functions created successfully!';
END $$;

