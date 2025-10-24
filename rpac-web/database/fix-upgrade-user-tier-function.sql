-- =============================================
-- FIX UPGRADE_USER_TIER FUNCTION
-- =============================================
-- This fixes the license_type constraint violation
-- when upgrading user tiers
-- Created: 2025-01-27

-- Drop and recreate the function with proper license_type handling
DROP FUNCTION IF EXISTS upgrade_user_tier(uuid, character varying, uuid);

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

  -- Update user tier with safe license_type handling
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

  -- Verify the update worked
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found or update failed';
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

RAISE NOTICE '✅ upgrade_user_tier function fixed successfully!';
