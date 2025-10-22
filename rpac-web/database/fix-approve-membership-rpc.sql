-- =============================================
-- FIX APPROVE_MEMBERSHIP_REQUEST RPC FUNCTION
-- =============================================
-- This fixes the column names to match the actual notifications table schema
-- Created: 2025-10-22
-- Issue: Function was using 'message' and 'link' columns that don't exist
-- Fix: Use 'content' and 'action_url' instead

CREATE OR REPLACE FUNCTION approve_membership_request(
  p_membership_id UUID,
  p_reviewer_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_community_id UUID;
  v_member_count INTEGER;
  v_user_id UUID;
  v_community_name VARCHAR;
BEGIN
  -- Get community_id and user_id
  SELECT community_id, user_id INTO v_community_id, v_user_id
  FROM community_memberships
  WHERE id = p_membership_id;
  
  -- Get community name
  SELECT community_name INTO v_community_name
  FROM local_communities
  WHERE id = v_community_id;

  -- Check if reviewer is admin or super_admin
  IF NOT EXISTS (
    SELECT 1 FROM community_memberships cm
    WHERE cm.community_id = v_community_id
      AND cm.user_id = p_reviewer_id
      AND cm.role IN ('admin', 'moderator')
      AND (cm.status = 'approved' OR cm.membership_status = 'approved')
  ) AND NOT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = p_reviewer_id
      AND user_tier = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can approve membership requests';
  END IF;

  -- Update membership status (handle both 'status' and 'membership_status' columns)
  -- Try with 'status' column first
  BEGIN
    UPDATE community_memberships
    SET 
      status = 'approved',
      reviewed_at = NOW(),
      reviewed_by = p_reviewer_id,
      joined_at = NOW()
    WHERE id = p_membership_id;
  EXCEPTION WHEN undefined_column THEN
    -- Fall back to 'membership_status' if 'status' doesn't exist
    UPDATE community_memberships
    SET 
      membership_status = 'approved',
      reviewed_at = NOW(),
      reviewed_by = p_reviewer_id,
      joined_at = NOW()
    WHERE id = p_membership_id;
  END;

  -- Update community member count (handle both column names)
  BEGIN
    SELECT COUNT(*) INTO v_member_count
    FROM community_memberships
    WHERE community_id = v_community_id
      AND status = 'approved';
  EXCEPTION WHEN undefined_column THEN
    SELECT COUNT(*) INTO v_member_count
    FROM community_memberships
    WHERE community_id = v_community_id
      AND membership_status = 'approved';
  END;

  UPDATE local_communities
  SET member_count = v_member_count
  WHERE id = v_community_id;

  -- Create notification for approved user with community name
  -- ✅ FIXED: Using 'content' and 'action_url' instead of 'message' and 'link'
  -- ✅ IMPROVED: Including community name and proper link
  -- Try with action_url first (new schema)
  BEGIN
    INSERT INTO notifications (user_id, type, title, content, action_url, created_at)
    VALUES (
      v_user_id,
      'membership_approved',
      'Medlemskap godkänt',
      'Din ansökan om medlemskap i ' || COALESCE(v_community_name, 'samhället') || ' har godkänts! Klicka här för att gå till samhället.',
      '/local?tab=myCommunities&community=' || v_community_id::text,
      NOW()
    );
  EXCEPTION WHEN undefined_column THEN
    -- Fallback for old schema without action_url
    INSERT INTO notifications (user_id, type, title, content, created_at)
    VALUES (
      v_user_id,
      'membership_approved',
      'Medlemskap godkänt',
      'Din ansökan om medlemskap i ' || COALESCE(v_community_name, 'samhället') || ' har godkänts!',
      NOW()
    );
  END;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION approve_membership_request(UUID, UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION approve_membership_request IS 'Approves a pending membership request and creates a notification (FIXED column names)';

-- =============================================
-- FIX REJECT_MEMBERSHIP_REQUEST RPC FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION reject_membership_request(
  p_membership_id UUID,
  p_reviewer_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_community_id UUID;
  v_user_id UUID;
  v_community_name VARCHAR;
BEGIN
  -- Get community_id and user_id
  SELECT community_id, user_id INTO v_community_id, v_user_id
  FROM community_memberships
  WHERE id = p_membership_id;
  
  -- Get community name
  SELECT community_name INTO v_community_name
  FROM local_communities
  WHERE id = v_community_id;

  -- Check if reviewer is admin or super_admin
  IF NOT EXISTS (
    SELECT 1 FROM community_memberships cm
    WHERE cm.community_id = v_community_id
      AND cm.user_id = p_reviewer_id
      AND cm.role IN ('admin', 'moderator')
      AND (cm.status = 'approved' OR cm.membership_status = 'approved')
  ) AND NOT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = p_reviewer_id
      AND user_tier = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can reject membership requests';
  END IF;

  -- Delete the membership request (handle both column names)
  DELETE FROM community_memberships
  WHERE id = p_membership_id;

  -- Create notification for rejected user with community name
  -- ✅ FIXED: Using 'content' and 'action_url' instead of 'message' and 'link'
  -- ✅ IMPROVED: Including community name
  -- Try with action_url first (new schema)
  BEGIN
    INSERT INTO notifications (user_id, type, title, content, action_url, created_at)
    VALUES (
      v_user_id,
      'membership_rejected',
      'Medlemskap avslaget',
      CASE 
        WHEN p_reason IS NOT NULL THEN 'Din ansökan om medlemskap i ' || COALESCE(v_community_name, 'samhället') || ' har avslagits. Orsak: ' || p_reason
        ELSE 'Din ansökan om medlemskap i ' || COALESCE(v_community_name, 'samhället') || ' har avslagits.'
      END,
      '/local/discover',
      NOW()
    );
  EXCEPTION WHEN undefined_column THEN
    -- Fallback for old schema without action_url
    INSERT INTO notifications (user_id, type, title, content, created_at)
    VALUES (
      v_user_id,
      'membership_rejected',
      'Medlemskap avslaget',
      CASE 
        WHEN p_reason IS NOT NULL THEN 'Din ansökan om medlemskap i ' || COALESCE(v_community_name, 'samhället') || ' har avslagits. Orsak: ' || p_reason
        ELSE 'Din ansökan om medlemskap i ' || COALESCE(v_community_name, 'samhället') || ' har avslagits.'
      END,
      NOW()
    );
  END;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION reject_membership_request(UUID, UUID, TEXT) TO authenticated;

-- Add comment
COMMENT ON FUNCTION reject_membership_request IS 'Rejects a pending membership request and creates a notification (FIXED column names)';

-- =============================================
-- SUCCESS MESSAGE
-- =============================================
DO $$
BEGIN
  RAISE NOTICE '✅ approve_membership_request function fixed!';
  RAISE NOTICE '✅ reject_membership_request function fixed!';
  RAISE NOTICE '📋 Changed: message → content, link → action_url';
  RAISE NOTICE '📋 Added: Backwards compatibility for status/membership_status columns';
END $$;

