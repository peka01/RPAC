-- =============================================
-- MESSAGING AND LOCATION ENHANCEMENTS
-- =============================================
-- This migration adds user presence tracking and location fields
-- Created: 2025-10-03
-- Purpose: Enable geographic community discovery and real-time user presence

-- =============================================
-- COMMUNITY TABLES (Create if not exists)
-- =============================================

-- Local communities
CREATE TABLE IF NOT EXISTS local_communities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  community_name VARCHAR(100) NOT NULL,
  location VARCHAR(100) NOT NULL,
  description TEXT,
  postal_code VARCHAR(10),
  county VARCHAR(100),
  is_public BOOLEAN DEFAULT TRUE,
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community memberships
CREATE TABLE IF NOT EXISTS community_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID REFERENCES local_communities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(community_id, user_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  community_id UUID REFERENCES local_communities(id) ON DELETE CASCADE,
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'emergency')),
  content TEXT NOT NULL,
  is_emergency BOOLEAN DEFAULT FALSE,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for local_communities
ALTER TABLE local_communities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view public communities" ON local_communities;
DROP POLICY IF EXISTS "Users can create communities" ON local_communities;
DROP POLICY IF EXISTS "Creators can update their communities" ON local_communities;
DROP POLICY IF EXISTS "Creators can delete their communities" ON local_communities;

CREATE POLICY "Users can view public communities"
  ON local_communities FOR SELECT
  USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create communities"
  ON local_communities FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators can update their communities"
  ON local_communities FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Creators can delete their communities"
  ON local_communities FOR DELETE
  USING (auth.uid() = created_by);

-- RLS for community_memberships
ALTER TABLE community_memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view memberships in their communities" ON community_memberships;
DROP POLICY IF EXISTS "Users can view their own memberships" ON community_memberships;
DROP POLICY IF EXISTS "Users can view all memberships" ON community_memberships;
DROP POLICY IF EXISTS "Users can join communities" ON community_memberships;
DROP POLICY IF EXISTS "Users can leave communities" ON community_memberships;

-- Simple policy: users can see all memberships (needed for community discovery)
CREATE POLICY "Users can view all memberships"
  ON community_memberships FOR SELECT
  USING (true);

CREATE POLICY "Users can join communities"
  ON community_memberships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave communities"
  ON community_memberships FOR DELETE
  USING (auth.uid() = user_id);

-- RLS for messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;

CREATE POLICY "Users can view their messages"
  ON messages FOR SELECT
  USING (
    sender_id = auth.uid() OR 
    receiver_id = auth.uid() OR
    community_id IN (SELECT community_id FROM community_memberships WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- =============================================
-- USER PRESENCE TRACKING
-- =============================================

-- User presence table for tracking online/offline status
CREATE TABLE IF NOT EXISTS user_presence (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'away')),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast presence lookups
CREATE INDEX IF NOT EXISTS idx_user_presence_status ON user_presence(status, last_seen);

-- RLS policies for user presence
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all presence data" ON user_presence;
DROP POLICY IF EXISTS "Users can update own presence" ON user_presence;
DROP POLICY IF EXISTS "Users can update own presence status" ON user_presence;

-- Users can read all presence data (for seeing who's online)
CREATE POLICY "Users can view all presence data"
  ON user_presence FOR SELECT
  USING (true);

-- Users can only update their own presence
CREATE POLICY "Users can update own presence"
  ON user_presence FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own presence status"
  ON user_presence FOR UPDATE
  USING (auth.uid() = user_id);

-- =============================================
-- USER LOCATION FIELDS
-- =============================================

-- Add location fields to user_profiles if not exists
DO $$ 
BEGIN
  -- Add postal_code if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'postal_code'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN postal_code VARCHAR(10);
  END IF;
  
  -- Add municipality if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'municipality'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN municipality VARCHAR(100);
  END IF;
  
  -- Add county if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'county'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN county VARCHAR(100);
  END IF;
END $$;

-- Index for location-based queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_postal_code ON user_profiles(postal_code);
CREATE INDEX IF NOT EXISTS idx_user_profiles_county ON user_profiles(county);
CREATE INDEX IF NOT EXISTS idx_user_profiles_municipality ON user_profiles(municipality);

-- =============================================
-- MESSAGE ENHANCEMENTS
-- =============================================

-- Add metadata field to messages if not exists (JSONB for flexible metadata)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE messages ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Add priority field to messages if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'priority'
  ) THEN
    ALTER TABLE messages ADD COLUMN priority VARCHAR(20) DEFAULT 'medium' 
      CHECK (priority IN ('low', 'medium', 'high', 'emergency'));
  END IF;
END $$;

-- Index for message queries
CREATE INDEX IF NOT EXISTS idx_messages_community_created ON messages(community_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_created ON messages(receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_created ON messages(sender_id, created_at DESC);

-- Only create emergency index if the column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'is_emergency'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_messages_emergency ON messages(is_emergency) WHERE is_emergency = true;
  END IF;
END $$;

-- =============================================
-- COMMUNITY MEMBERSHIPS INDEX
-- =============================================

-- Optimize community member lookups
CREATE INDEX IF NOT EXISTS idx_community_memberships_community ON community_memberships(community_id, role);
CREATE INDEX IF NOT EXISTS idx_community_memberships_user ON community_memberships(user_id, community_id);

-- =============================================
-- LOCAL COMMUNITIES LOCATION INDEX
-- =============================================

-- Optimize location-based community discovery
CREATE INDEX IF NOT EXISTS idx_local_communities_postal_code ON local_communities(postal_code) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_local_communities_county ON local_communities(county) WHERE is_public = true;

-- =============================================
-- FUNCTIONS FOR AUTOMATIC UPDATES
-- =============================================

-- Function to automatically update user presence timestamp
CREATE OR REPLACE FUNCTION update_user_presence_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_seen = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user presence updates
DROP TRIGGER IF EXISTS trigger_update_user_presence_timestamp ON user_presence;
CREATE TRIGGER trigger_update_user_presence_timestamp
  BEFORE UPDATE ON user_presence
  FOR EACH ROW
  EXECUTE FUNCTION update_user_presence_timestamp();

-- =============================================
-- HELPER VIEWS
-- =============================================

-- View for online users (last active within 5 minutes)
CREATE OR REPLACE VIEW online_users AS
SELECT 
  up.id,
  up.user_id,
  up.postal_code,
  up.county,
  p.status,
  p.last_seen
FROM user_profiles up
LEFT JOIN user_presence p ON up.user_id = p.user_id
WHERE p.status = 'online' 
  AND p.last_seen > NOW() - INTERVAL '5 minutes';

-- View for community members with presence
CREATE OR REPLACE VIEW community_members_with_presence AS
SELECT 
  cm.community_id,
  cm.user_id,
  cm.role,
  up.postal_code,
  up.county,
  COALESCE(p.status, 'offline') as status,
  p.last_seen
FROM community_memberships cm
JOIN user_profiles up ON cm.user_id = up.user_id
LEFT JOIN user_presence p ON up.user_id = p.user_id;

-- =============================================
-- FUNCTIONS FOR MEMBER COUNT
-- =============================================

-- Function to increment community member count
CREATE OR REPLACE FUNCTION increment_community_members(community_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE local_communities
  SET member_count = COALESCE(member_count, 0) + 1,
      updated_at = NOW()
  WHERE id = community_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement community member count
CREATE OR REPLACE FUNCTION decrement_community_members(community_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE local_communities
  SET member_count = GREATEST(COALESCE(member_count, 1) - 1, 0),
      updated_at = NOW()
  WHERE id = community_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE ON user_presence TO authenticated;
GRANT SELECT ON online_users TO authenticated;
GRANT SELECT ON community_members_with_presence TO authenticated;
GRANT EXECUTE ON FUNCTION increment_community_members(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_community_members(UUID) TO authenticated;

-- =============================================
-- MIGRATION COMPLETE
-- =============================================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: Messaging and location enhancements added successfully';
END $$;

