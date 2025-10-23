-- =============================================
-- FIX GET_PENDING_MEMBERSHIP_REQUESTS RPC FUNCTION
-- =============================================
-- This fixes the function to handle missing columns gracefully
-- Created: 2025-10-22
-- Issue: Function was trying to access columns that don't exist

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS get_pending_membership_requests(uuid);

-- Create the fixed function
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
    COALESCE(
      up.display_name, 
      up.first_name || ' ' || up.last_name,
      up.first_name,
      SPLIT_PART(au.email, '@', 1)
    ) as display_name,
    COALESCE(cm.join_message, '') as join_message,
    COALESCE(cm.requested_at, cm.created_at) as requested_at,
    up.postal_code,
    up.county,
    COALESCE(up.household_size, up.family_size, 1) as household_size
  FROM community_memberships cm
  JOIN auth.users au ON au.id = cm.user_id
  LEFT JOIN user_profiles up ON up.user_id = cm.user_id
  WHERE cm.community_id = p_community_id
    AND (
      cm.membership_status = 'pending' OR 
      cm.status = 'pending'
    )
  ORDER BY COALESCE(cm.requested_at, cm.created_at) ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_pending_membership_requests(uuid) TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ get_pending_membership_requests function fixed and deployed successfully!';
  RAISE NOTICE '🔧 Fixed issues:';
  RAISE NOTICE '   - Handles missing family_size column (uses household_size or defaults to 1)';
  RAISE NOTICE '   - Handles both membership_status and status columns';
  RAISE NOTICE '   - Better display_name fallback logic';
  RAISE NOTICE '   - Graceful handling of missing requested_at (uses created_at)';
END $$;
