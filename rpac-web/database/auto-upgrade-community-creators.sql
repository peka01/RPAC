-- =============================================
-- AUTO-UPGRADE COMMUNITY CREATORS
-- =============================================
-- Function to automatically upgrade community creators to community_manager tier
-- Created: 2025-01-27

-- Function to upgrade community creators (bypasses super admin requirement)
CREATE OR REPLACE FUNCTION upgrade_community_creator(
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update user tier to community_manager
  UPDATE user_profiles
  SET 
    user_tier = 'community_manager',
    tier_upgraded_at = NOW(),
    license_type = 'community_manager'
  WHERE user_id = p_user_id;

  -- Verify the update worked
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION upgrade_community_creator(uuid) TO authenticated;

RAISE NOTICE '✅ Function upgrade_community_creator created successfully!';
