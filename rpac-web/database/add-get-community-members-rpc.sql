-- Add RPC function to get community members with emails
-- This function joins community_memberships with user_profiles and auth.users
-- to provide email addresses for contact display fallbacks

-- Create the RPC function
CREATE OR REPLACE FUNCTION get_community_members_with_emails(p_community_id UUID)
RETURNS TABLE (
  user_id UUID,
  role VARCHAR,
  display_name VARCHAR,
  first_name VARCHAR,
  last_name VARCHAR,
  name_display_preference VARCHAR,
  avatar_url TEXT,
  email TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cm.user_id,
    cm.role,
    up.display_name,
    up.first_name,
    up.last_name,
    up.name_display_preference,
    up.avatar_url,
    au.email::TEXT
  FROM community_memberships cm
  LEFT JOIN user_profiles up ON cm.user_id = up.user_id
  LEFT JOIN auth.users au ON cm.user_id = au.id
  WHERE cm.community_id = p_community_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_community_members_with_emails(UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_community_members_with_emails IS 'Gets community members with their profiles and emails for contact display';

