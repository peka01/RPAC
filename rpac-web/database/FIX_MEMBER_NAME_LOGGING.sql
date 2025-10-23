-- =============================================
-- FIX: Member Name Logging in Activity Feed
-- =============================================
-- This fixes the issue where member names aren't being displayed
-- in the activity feed for member_joined activities

-- First, let's check what's currently in the database
SELECT 
  'Current member activities:' as status,
  COUNT(*) as count
FROM homespace_activity_log 
WHERE activity_type = 'member_joined';

-- Update existing member_joined activities to include proper user names
-- This will fix any existing activities that don't have proper names
UPDATE homespace_activity_log 
SET user_name = COALESCE(
  (SELECT COALESCE(up.display_name, CONCAT(up.first_name, ' ', up.last_name), 'Ny medlem')
   FROM user_profiles up 
   WHERE up.user_id = homespace_activity_log.user_id),
  'Ny medlem'
)
WHERE activity_type = 'member_joined' 
  AND (user_name IS NULL OR user_name = 'Anonym användare' OR user_name = '');

-- Update the description to include the user name properly
UPDATE homespace_activity_log 
SET description = user_name || ' gick med i samhället'
WHERE activity_type = 'member_joined' 
  AND user_name IS NOT NULL 
  AND user_name != 'Anonym användare'
  AND user_name != '';

-- Recreate the trigger function to ensure it works properly
CREATE OR REPLACE FUNCTION log_member_joined()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  community_name TEXT;
  user_name TEXT;
  show_activities BOOLEAN;
BEGIN
  -- Get community name and settings
  SELECT lc.community_name, ch.show_member_activities
  INTO community_name, show_activities
  FROM local_communities lc
  LEFT JOIN community_homespaces ch ON ch.community_id = lc.id
  WHERE lc.id = NEW.community_id;
  
  -- Get user name with better fallback logic
  SELECT COALESCE(
    up.display_name, 
    CASE 
      WHEN up.first_name IS NOT NULL AND up.last_name IS NOT NULL 
      THEN CONCAT(up.first_name, ' ', up.last_name)
      WHEN up.first_name IS NOT NULL 
      THEN up.first_name
      ELSE 'Ny medlem'
    END
  )
  INTO user_name
  FROM user_profiles up
  WHERE up.user_id = NEW.user_id;
  
  -- If no user profile found, use a default
  IF user_name IS NULL THEN
    user_name := 'Ny medlem';
  END IF;
  
  -- Only log if community has homespace and setting is enabled
  IF show_activities IS NOT FALSE THEN
    INSERT INTO homespace_activity_log (
      community_id,
      activity_type,
      title,
      description,
      icon,
      user_id,
      user_name,
      visible_public
    ) VALUES (
      NEW.community_id,
      'member_joined',
      'Ny medlem välkommen',
      user_name || ' gick med i samhället',
      '👥',
      NEW.user_id,
      user_name,
      true
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS trigger_log_member_joined ON community_memberships;
CREATE TRIGGER trigger_log_member_joined
  AFTER INSERT ON community_memberships
  FOR EACH ROW
  EXECUTE FUNCTION log_member_joined();

-- Test the fix by checking updated activities
SELECT 
  'Updated member activities:' as status,
  user_name,
  description
FROM homespace_activity_log 
WHERE activity_type = 'member_joined'
ORDER BY id DESC 
LIMIT 5;

-- Summary
SELECT 
  'Fix applied successfully!' as status,
  COUNT(*) as total_member_activities,
  COUNT(CASE WHEN user_name IS NOT NULL AND user_name != 'Anonym användare' THEN 1 END) as activities_with_names
FROM homespace_activity_log 
WHERE activity_type = 'member_joined';
