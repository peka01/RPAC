-- =============================================
-- ACTIVITY TRACKING TRIGGERS
-- Automatically log community activities
-- =============================================

-- Function to log community resource additions
CREATE OR REPLACE FUNCTION log_community_resource_added()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
  community_name TEXT;
BEGIN
  -- Get user name
  SELECT COALESCE(up.display_name, CONCAT(up.first_name, ' ', up.last_name), 'Anonym användare')
  INTO user_name
  FROM user_profiles up
  WHERE up.user_id = NEW.created_by;
  
  -- Get community name
  SELECT lc.community_name
  INTO community_name
  FROM local_communities lc
  WHERE lc.id = NEW.community_id;
  
  -- Log the activity
  INSERT INTO homespace_activity_log (
    community_id,
    activity_type,
    title,
    description,
    icon,
    user_id,
    resource_name,
    resource_category,
    visible_public
  ) VALUES (
    NEW.community_id,
    'resource_added',
    'Ny samhällsresurs tillagd',
    user_name || ' lade till "' || NEW.resource_name || '" i ' || NEW.category || '-kategorin',
    '🏛️',
    NEW.created_by,
    NEW.resource_name,
    NEW.category,
    true
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for community resource additions
DROP TRIGGER IF EXISTS trigger_log_community_resource_added ON community_resources;
CREATE TRIGGER trigger_log_community_resource_added
  AFTER INSERT ON community_resources
  FOR EACH ROW
  EXECUTE FUNCTION log_community_resource_added();

-- Function to log individual resource sharing
CREATE OR REPLACE FUNCTION log_resource_shared()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
  community_name TEXT;
BEGIN
  -- Get user name
  SELECT COALESCE(up.display_name, CONCAT(up.first_name, ' ', up.last_name), 'Anonym användare')
  INTO user_name
  FROM user_profiles up
  WHERE up.user_id = NEW.user_id;
  
  -- Get community name
  SELECT lc.community_name
  INTO community_name
  FROM local_communities lc
  WHERE lc.id = NEW.community_id;
  
  -- Log the activity
  INSERT INTO homespace_activity_log (
    community_id,
    activity_type,
    title,
    description,
    icon,
    user_id,
    resource_name,
    resource_category,
    visible_public
  ) VALUES (
    NEW.community_id,
    'resource_shared',
    'Resurs delad med samhället',
    user_name || ' delade "' || NEW.resource_name || '" (' || NEW.shared_quantity || ' st) i ' || NEW.resource_category || '-kategorin',
    '🤝',
    NEW.user_id,
    NEW.resource_name,
    NEW.resource_category,
    true
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for resource sharing
DROP TRIGGER IF EXISTS trigger_log_resource_shared ON resource_sharing;
CREATE TRIGGER trigger_log_resource_shared
  AFTER INSERT ON resource_sharing
  FOR EACH ROW
  EXECUTE FUNCTION log_resource_shared();

-- Function to log help requests
CREATE OR REPLACE FUNCTION log_help_requested()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
  community_name TEXT;
BEGIN
  -- Get user name
  SELECT COALESCE(up.display_name, CONCAT(up.first_name, ' ', up.last_name), 'Anonym användare')
  INTO user_name
  FROM user_profiles up
  WHERE up.user_id = NEW.user_id;
  
  -- Get community name
  SELECT lc.community_name
  INTO community_name
  FROM local_communities lc
  WHERE lc.id = NEW.community_id;
  
  -- Log the activity
  INSERT INTO homespace_activity_log (
    community_id,
    activity_type,
    title,
    description,
    icon,
    user_id,
    resource_name,
    resource_category,
    visible_public
  ) VALUES (
    NEW.community_id,
    'help_requested',
    'Hjälpförfrågan skapad',
    user_name || ' begärde hjälp: "' || NEW.title || '"',
    '🆘',
    NEW.user_id,
    NEW.title,
    NEW.category,
    true
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for help requests
DROP TRIGGER IF EXISTS trigger_log_help_requested ON resource_requests;
CREATE TRIGGER trigger_log_help_requested
  AFTER INSERT ON resource_requests
  FOR EACH ROW
  EXECUTE FUNCTION log_help_requested();

-- Enhanced member join logging (update existing function)
CREATE OR REPLACE FUNCTION log_member_joined()
RETURNS TRIGGER AS $$
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
  
  -- Get user name
  SELECT COALESCE(up.display_name, CONCAT(up.first_name, ' ', up.last_name), 'Anonym användare')
  INTO user_name
  FROM user_profiles up
  WHERE up.user_id = NEW.user_id;
  
  -- Only log if community has homespace and setting is enabled
  IF show_activities IS NOT FALSE THEN
    INSERT INTO homespace_activity_log (
      community_id,
      activity_type,
      title,
      description,
      icon,
      user_id,
      visible_public
    ) VALUES (
      NEW.community_id,
      'member_joined',
      'Ny medlem välkommen',
      user_name || ' gick med i samhället',
      '👥',
      NEW.user_id,
      true
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update the existing trigger
DROP TRIGGER IF EXISTS trigger_log_member_joined ON community_memberships;
CREATE TRIGGER trigger_log_member_joined
  AFTER INSERT ON community_memberships
  FOR EACH ROW
  EXECUTE FUNCTION log_member_joined();

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Index for activity log queries
CREATE INDEX IF NOT EXISTS idx_activity_log_community_recent 
ON homespace_activity_log(community_id, created_at DESC);

-- Index for user activities
CREATE INDEX IF NOT EXISTS idx_activity_log_user 
ON homespace_activity_log(user_id, created_at DESC);

-- =============================================
-- BACKFILL EXISTING ACTIVITIES (Optional)
-- =============================================

-- This could be used to backfill activities for existing communities
-- but we'll skip it for now to avoid performance issues
