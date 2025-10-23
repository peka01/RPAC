-- =============================================
-- FIX HOMESPACE ACTIVITY LOG SCHEMA
-- Add missing columns for activity tracking
-- =============================================

-- Add missing columns to homespace_activity_log table
ALTER TABLE homespace_activity_log 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS user_name TEXT,
ADD COLUMN IF NOT EXISTS user_avatar_url TEXT,
ADD COLUMN IF NOT EXISTS resource_name TEXT,
ADD COLUMN IF NOT EXISTS resource_category TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update activity_type constraint to include new types
ALTER TABLE homespace_activity_log 
DROP CONSTRAINT IF EXISTS homespace_activity_log_activity_type_check;

ALTER TABLE homespace_activity_log 
ADD CONSTRAINT homespace_activity_log_activity_type_check 
CHECK (activity_type IN ('member_joined', 'resource_added', 'resource_shared', 'help_requested', 'milestone', 'exercise', 'custom'));

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON homespace_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_by ON homespace_activity_log(created_by);
CREATE INDEX IF NOT EXISTS idx_activity_log_resource ON homespace_activity_log(resource_name) WHERE resource_name IS NOT NULL;

-- Update RLS policies to include new columns
DROP POLICY IF EXISTS "Public can view public activities" ON homespace_activity_log;
CREATE POLICY "Public can view public activities"
  ON homespace_activity_log FOR SELECT
  USING (
    visible_public = true AND
    community_id IN (
      SELECT community_id FROM community_homespaces WHERE published = true
    )
  );

-- Community members can view activities for their communities
DROP POLICY IF EXISTS "Members can view community activities" ON homespace_activity_log;
CREATE POLICY "Members can view community activities"
  ON homespace_activity_log FOR SELECT
  USING (
    community_id IN (
      SELECT community_id FROM community_memberships 
      WHERE user_id = auth.uid()
    )
  );

-- Community admins can manage activity log
DROP POLICY IF EXISTS "Admins can manage activity log" ON homespace_activity_log;
CREATE POLICY "Admins can manage activity log"
  ON homespace_activity_log FOR ALL
  USING (
    community_id IN (
      SELECT id FROM local_communities
      WHERE created_by = auth.uid()
    )
  );

-- Users can view their own activities
DROP POLICY IF EXISTS "Users can view own activities" ON homespace_activity_log;
CREATE POLICY "Users can view own activities"
  ON homespace_activity_log FOR SELECT
  USING (
    user_id = auth.uid() OR created_by = auth.uid()
  );
