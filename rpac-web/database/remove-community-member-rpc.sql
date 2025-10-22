-- =============================================
-- REMOVE COMMUNITY MEMBER RPC FUNCTION
-- =============================================
-- Purpose: Allow community admins to remove members
-- Date: 2025-10-22

-- Function to remove a member from a community
CREATE OR REPLACE FUNCTION remove_community_member(
  p_membership_id UUID,
  p_remover_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_community_id UUID;
  v_member_id UUID;
  v_remover_role VARCHAR(20);
  v_is_admin BOOLEAN := FALSE;
  v_is_super_admin BOOLEAN := FALSE;
BEGIN
  -- Get membership details
  SELECT cm.community_id, cm.user_id
  INTO v_community_id, v_member_id
  FROM community_memberships cm
  WHERE cm.id = p_membership_id;

  -- Check if membership exists
  IF v_community_id IS NULL THEN
    RAISE EXCEPTION 'Membership not found';
  END IF;

  -- Check if remover is super admin
  SELECT user_tier = 'super_admin'
  INTO v_is_super_admin
  FROM user_profiles
  WHERE user_id = p_remover_id;

  -- Check if remover is community admin
  SELECT EXISTS (
    SELECT 1 FROM community_memberships
    WHERE community_id = v_community_id
      AND user_id = p_remover_id
      AND role IN ('admin', 'moderator')
      AND status = 'approved'
  ) INTO v_is_admin;

  -- Only super admins or community admins can remove members
  IF NOT v_is_super_admin AND NOT v_is_admin THEN
    RAISE EXCEPTION 'Insufficient permissions to remove member';
  END IF;

  -- Prevent admins from removing other admins (only super admins can do this)
  IF NOT v_is_super_admin THEN
    SELECT role INTO v_remover_role
    FROM community_memberships
    WHERE community_id = v_community_id
      AND user_id = p_remover_id
      AND status = 'approved';

    -- Check if target member is also an admin/moderator
    IF EXISTS (
      SELECT 1 FROM community_memberships
      WHERE community_id = v_community_id
        AND user_id = v_member_id
        AND role IN ('admin', 'moderator')
        AND status = 'approved'
    ) THEN
      -- Only allow if remover is admin and target is moderator
      IF v_remover_role = 'moderator' OR (
        v_remover_role = 'admin' AND EXISTS (
          SELECT 1 FROM community_memberships
          WHERE community_id = v_community_id
            AND user_id = v_member_id
            AND role = 'admin'
            AND status = 'approved'
        )
      ) THEN
        RAISE EXCEPTION 'Cannot remove other administrators. Only super admins can remove admins.';
      END IF;
    END IF;
  END IF;

  -- Delete the membership (this will cascade to related records)
  DELETE FROM community_memberships
  WHERE id = p_membership_id;

  -- Log the removal (optional - could create a separate table for this)
  -- For now, we'll just return success

  RETURN TRUE;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to remove member: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION remove_community_member(UUID, UUID, TEXT) TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Remove community member RPC function created successfully!';
  RAISE NOTICE 'Usage: SELECT remove_community_member(membership_id, remover_user_id, reason);';
END $$;
