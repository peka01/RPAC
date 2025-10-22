-- ================================================================
-- ADD MISSING HOMESPACE VISIBILITY TOGGLES AND INVITATION SYSTEM
-- ================================================================
-- Created: 2024-10-22
-- Purpose: Add columns for controlling all homepage sections + invitation links
-- ================================================================

-- Add missing visibility columns to community_homespaces
ALTER TABLE community_homespaces 
ADD COLUMN IF NOT EXISTS show_member_activities BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS latest_updates_text TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS show_latest_updates BOOLEAN DEFAULT true;

-- Create community_invitations table
CREATE TABLE IF NOT EXISTS community_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES local_communities(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Invitation details
  invitation_code VARCHAR(50) UNIQUE NOT NULL,
  max_uses INTEGER DEFAULT NULL, -- NULL = unlimited
  current_uses INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL, -- NULL = never expires
  
  -- Metadata
  description TEXT DEFAULT NULL, -- e.g. "Höstmötet 2024"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  
  -- Usage tracking
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  
  CONSTRAINT valid_uses CHECK (current_uses <= max_uses OR max_uses IS NULL)
);

-- Create index for fast lookup by code
CREATE INDEX IF NOT EXISTS idx_invitations_code ON community_invitations(invitation_code) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_invitations_community ON community_invitations(community_id);

-- Create invitation_uses table (track who used which invite)
CREATE TABLE IF NOT EXISTS community_invitation_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID NOT NULL REFERENCES community_invitations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate uses
  UNIQUE(invitation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_invitation_uses_invitation ON community_invitation_uses(invitation_id);
CREATE INDEX IF NOT EXISTS idx_invitation_uses_user ON community_invitation_uses(user_id);

-- ================================================================
-- RLS POLICIES
-- ================================================================

-- Enable RLS
ALTER TABLE community_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_invitation_uses ENABLE ROW LEVEL SECURITY;

-- Invitations: Admins can view and manage their community invitations
DROP POLICY IF EXISTS "Community admins can view their invitations" ON community_invitations;
CREATE POLICY "Community admins can view their invitations"
  ON community_invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM community_memberships
      WHERE community_memberships.community_id = community_invitations.community_id
        AND community_memberships.user_id = auth.uid()
        AND community_memberships.role IN ('admin', 'moderator')
        AND community_memberships.membership_status = 'approved'
    )
  );

-- Invitations: Admins can create invitations
DROP POLICY IF EXISTS "Community admins can create invitations" ON community_invitations;
CREATE POLICY "Community admins can create invitations"
  ON community_invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM community_memberships
      WHERE community_memberships.community_id = community_invitations.community_id
        AND community_memberships.user_id = auth.uid()
        AND community_memberships.role IN ('admin', 'moderator')
        AND community_memberships.membership_status = 'approved'
    )
  );

-- Invitations: Admins can update their invitations
DROP POLICY IF EXISTS "Community admins can update their invitations" ON community_invitations;
CREATE POLICY "Community admins can update their invitations"
  ON community_invitations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM community_memberships
      WHERE community_memberships.community_id = community_invitations.community_id
        AND community_memberships.user_id = auth.uid()
        AND community_memberships.role IN ('admin', 'moderator')
        AND community_memberships.membership_status = 'approved'
    )
  );

-- Invitations: Admins can delete their invitations
DROP POLICY IF EXISTS "Community admins can delete their invitations" ON community_invitations;
CREATE POLICY "Community admins can delete their invitations"
  ON community_invitations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM community_memberships
      WHERE community_memberships.community_id = community_invitations.community_id
        AND community_memberships.user_id = auth.uid()
        AND community_memberships.role IN ('admin', 'moderator')
        AND community_memberships.membership_status = 'approved'
    )
  );

-- Invitation uses: Users can view their own uses
DROP POLICY IF EXISTS "Users can view their invitation uses" ON community_invitation_uses;
CREATE POLICY "Users can view their invitation uses"
  ON community_invitation_uses FOR SELECT
  USING (user_id = auth.uid());

-- Invitation uses: System can insert (handled by function)
DROP POLICY IF EXISTS "System can insert invitation uses" ON community_invitation_uses;
CREATE POLICY "System can insert invitation uses"
  ON community_invitation_uses FOR INSERT
  WITH CHECK (true);

-- ================================================================
-- HELPER FUNCTIONS
-- ================================================================

-- Function to generate unique invitation code
CREATE OR REPLACE FUNCTION generate_invitation_code()
RETURNS VARCHAR(50) AS $$
DECLARE
  new_code VARCHAR(50);
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 8-character alphanumeric code
    new_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM community_invitations WHERE invitation_code = new_code) INTO code_exists;
    
    -- Exit loop if unique
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate and use invitation
CREATE OR REPLACE FUNCTION use_community_invitation(
  p_invitation_code VARCHAR(50),
  p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_invitation RECORD;
  v_community RECORD;
  v_membership_status VARCHAR(20);
  v_message TEXT;
BEGIN
  -- Get invitation details with community info
  SELECT ci.*, lc.access_type, lc.auto_approve_members, lc.community_name
  INTO v_invitation
  FROM community_invitations ci
  JOIN local_communities lc ON lc.id = ci.community_id
  WHERE ci.invitation_code = p_invitation_code
    AND ci.is_active = true
    AND (ci.expires_at IS NULL OR ci.expires_at > NOW())
    AND (ci.max_uses IS NULL OR ci.current_uses < ci.max_uses);
  
  -- Check if invitation exists and is valid
  IF v_invitation.id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid or expired invitation code'
    );
  END IF;
  
  -- Check if user already used this invitation
  IF EXISTS (
    SELECT 1 FROM community_invitation_uses
    WHERE invitation_id = v_invitation.id AND user_id = p_user_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'You have already used this invitation'
    );
  END IF;
  
  -- Check if user is already a member
  IF EXISTS (
    SELECT 1 FROM community_memberships
    WHERE community_id = v_invitation.community_id 
      AND user_id = p_user_id
      AND membership_status IN ('approved', 'pending')
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'You are already a member or have a pending request'
    );
  END IF;
  
  -- Determine membership status based on community settings
  -- If access_type is 'open' OR auto_approve_members is true, auto-approve
  -- Otherwise, create pending membership for closed communities
  IF v_invitation.access_type = 'open' OR v_invitation.auto_approve_members = true THEN
    v_membership_status := 'approved';
    v_message := 'Successfully joined community!';
  ELSE
    v_membership_status := 'pending';
    v_message := 'Membership request sent! Waiting for admin approval.';
  END IF;
  
  -- Create membership request
  INSERT INTO community_memberships (
    community_id,
    user_id,
    membership_status,
    role,
    joined_at,
    requested_at,
    join_message
  ) VALUES (
    v_invitation.community_id,
    p_user_id,
    v_membership_status,
    'member',
    CASE WHEN v_membership_status = 'approved' THEN NOW() ELSE NULL END,
    NOW(),
    'Joined via invitation code: ' || p_invitation_code
  );
  
  -- Record invitation use
  INSERT INTO community_invitation_uses (invitation_id, user_id)
  VALUES (v_invitation.id, p_user_id);
  
  -- Update invitation usage count
  UPDATE community_invitations
  SET current_uses = current_uses + 1,
      last_used_at = NOW()
  WHERE id = v_invitation.id;
  
  -- Return success with appropriate message
  RETURN json_build_object(
    'success', true,
    'community_id', v_invitation.community_id,
    'community_name', v_invitation.community_name,
    'membership_status', v_membership_status,
    'message', v_message,
    'requires_approval', (v_membership_status = 'pending')
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'An error occurred: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get invitation stats
CREATE OR REPLACE FUNCTION get_invitation_stats(p_invitation_id UUID)
RETURNS JSON AS $$
DECLARE
  v_stats JSON;
BEGIN
  SELECT json_build_object(
    'invitation_id', i.id,
    'code', i.invitation_code,
    'current_uses', i.current_uses,
    'max_uses', i.max_uses,
    'is_active', i.is_active,
    'expires_at', i.expires_at,
    'created_at', i.created_at,
    'last_used_at', i.last_used_at,
    'recent_users', (
      SELECT json_agg(json_build_object(
        'user_id', iu.user_id,
        'display_name', up.display_name,
        'used_at', iu.used_at
      ))
      FROM community_invitation_uses iu
      LEFT JOIN user_profiles up ON up.user_id = iu.user_id
      WHERE iu.invitation_id = i.id
      ORDER BY iu.used_at DESC
      LIMIT 10
    )
  ) INTO v_stats
  FROM community_invitations i
  WHERE i.id = p_invitation_id;
  
  RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- COMMENTS
-- ================================================================

COMMENT ON TABLE community_invitations IS 'Invitation links for communities - admins can create shareable links';
COMMENT ON TABLE community_invitation_uses IS 'Track who used which invitation link';
COMMENT ON FUNCTION generate_invitation_code() IS 'Generate unique 8-character invitation code';
COMMENT ON FUNCTION use_community_invitation(VARCHAR, UUID) IS 'Validate and use an invitation code to join a community';
COMMENT ON FUNCTION get_invitation_stats(UUID) IS 'Get detailed statistics for an invitation link';

-- ================================================================
-- DEPLOYMENT COMPLETE
-- ================================================================

