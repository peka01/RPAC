-- =============================================
-- UPDATE RLS POLICIES FOR TIER SYSTEM
-- =============================================
-- Purpose: Enforce tier-based permissions at database level
-- Date: 2025-10-21

-- =============================================
-- USER PROFILES POLICIES
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

-- Recreate with tier support
CREATE POLICY "Users can view own profile" 
  ON user_profiles FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" 
  ON user_profiles FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" 
  ON user_profiles FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Super admin can view and manage all profiles
DROP POLICY IF EXISTS "Super admins can view all profiles" ON user_profiles;
CREATE POLICY "Super admins can view all profiles" 
  ON user_profiles FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() 
      AND up.user_tier = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "Super admins can update all profiles" ON user_profiles;
CREATE POLICY "Super admins can update all profiles" 
  ON user_profiles FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() 
      AND up.user_tier = 'super_admin'
    )
  );

-- =============================================
-- COMMUNITY CREATION POLICIES
-- =============================================

-- Drop existing policy
DROP POLICY IF EXISTS "Community admins can manage communities" ON local_communities;

-- Only community_manager and super_admin can create communities
DROP POLICY IF EXISTS "Community managers can create communities" ON local_communities;
CREATE POLICY "Community managers can create communities" 
  ON local_communities FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND user_tier IN ('community_manager', 'super_admin')
      AND is_license_active = true
    )
  );

-- Community creators and admins can manage their communities
DROP POLICY IF EXISTS "Community creators can manage their communities" ON local_communities;
CREATE POLICY "Community creators can manage their communities" 
  ON local_communities FOR ALL 
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM community_memberships 
      WHERE community_id = local_communities.id 
      AND user_id = auth.uid() 
      AND role IN ('admin', 'moderator')
      AND membership_status = 'approved'
    ) OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND user_tier = 'super_admin'
    )
  );

-- =============================================
-- MEMBERSHIP REQUEST POLICIES
-- =============================================

-- Drop existing membership policies
DROP POLICY IF EXISTS "Users can view community memberships" ON community_memberships;
DROP POLICY IF EXISTS "Users can join communities" ON community_memberships;
DROP POLICY IF EXISTS "Users can leave communities" ON community_memberships;

-- Users can request community membership (respects access_type)
DROP POLICY IF EXISTS "Users can request community membership" ON community_memberships;
CREATE POLICY "Users can request community membership" 
  ON community_memberships FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id AND
    -- Check if user is not already a member or banned
    NOT EXISTS (
      SELECT 1 FROM community_memberships existing
      WHERE existing.community_id = community_memberships.community_id
        AND existing.user_id = auth.uid()
        AND existing.membership_status IN ('approved', 'pending', 'banned')
    )
  );

-- Users can view their own membership requests and approved members can view other approved members
DROP POLICY IF EXISTS "Users can view relevant memberships" ON community_memberships;
CREATE POLICY "Users can view relevant memberships" 
  ON community_memberships FOR SELECT 
  USING (
    auth.uid() = user_id OR
    -- Approved members can see other approved members
    (
      membership_status = 'approved' AND
      EXISTS (
        SELECT 1 FROM community_memberships cm
        WHERE cm.community_id = community_memberships.community_id
          AND cm.user_id = auth.uid()
          AND cm.membership_status = 'approved'
      )
    ) OR
    -- Admins can see all membership requests
    EXISTS (
      SELECT 1 FROM community_memberships cm
      WHERE cm.community_id = community_memberships.community_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('admin', 'moderator')
        AND cm.membership_status = 'approved'
    ) OR
    -- Super admins can see everything
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
        AND user_tier = 'super_admin'
    )
  );

-- Admins and super admins can approve/reject membership requests
DROP POLICY IF EXISTS "Admins can manage membership requests" ON community_memberships;
CREATE POLICY "Admins can manage membership requests" 
  ON community_memberships FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM community_memberships cm
      WHERE cm.community_id = community_memberships.community_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('admin', 'moderator')
        AND cm.membership_status = 'approved'
    ) OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
        AND user_tier = 'super_admin'
    )
  );

-- Users can leave communities (delete their own membership)
DROP POLICY IF EXISTS "Users can leave communities" ON community_memberships;
CREATE POLICY "Users can leave communities" 
  ON community_memberships FOR DELETE 
  USING (
    auth.uid() = user_id OR
    -- Admins can remove members
    EXISTS (
      SELECT 1 FROM community_memberships cm
      WHERE cm.community_id = community_memberships.community_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('admin', 'moderator')
        AND cm.membership_status = 'approved'
    )
  );

-- =============================================
-- HELP REQUESTS POLICIES (Updated)
-- =============================================

-- Drop existing policy
DROP POLICY IF EXISTS "Users can view help requests in their communities" ON help_requests;
DROP POLICY IF EXISTS "Users can create help requests" ON help_requests;
DROP POLICY IF EXISTS "Users can update own help requests" ON help_requests;

-- Only approved members can view help requests
CREATE POLICY "Approved members can view help requests" 
  ON help_requests FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM community_memberships 
      WHERE community_id = help_requests.community_id 
      AND user_id = auth.uid()
      AND membership_status = 'approved'
    )
  );

-- Only approved members can create help requests
CREATE POLICY "Approved members can create help requests" 
  ON help_requests FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM community_memberships
      WHERE community_id = help_requests.community_id
        AND user_id = auth.uid()
        AND membership_status = 'approved'
    )
  );

-- Users can update their own help requests, admins can update all
CREATE POLICY "Users and admins can update help requests" 
  ON help_requests FOR UPDATE 
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM community_memberships
      WHERE community_id = help_requests.community_id
        AND user_id = auth.uid()
        AND role IN ('admin', 'moderator')
        AND membership_status = 'approved'
    )
  );

-- =============================================
-- MESSAGES POLICIES (Updated)
-- =============================================

-- Drop existing message policies
DROP POLICY IF EXISTS "Users can view messages they sent or received" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can update messages they sent" ON messages;

-- Only approved community members can view community messages
CREATE POLICY "Approved members can view community messages" 
  ON messages FOR SELECT 
  USING (
    auth.uid() = sender_id OR 
    auth.uid() = receiver_id OR
    (
      community_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM community_memberships
        WHERE community_id = messages.community_id
          AND user_id = auth.uid()
          AND membership_status = 'approved'
      )
    )
  );

-- Only approved members can send community messages
CREATE POLICY "Approved members can send messages" 
  ON messages FOR INSERT 
  WITH CHECK (
    auth.uid() = sender_id AND
    (
      community_id IS NULL OR
      EXISTS (
        SELECT 1 FROM community_memberships
        WHERE community_id = messages.community_id
          AND user_id = auth.uid()
          AND membership_status = 'approved'
      )
    )
  );

-- Users can update their own messages
CREATE POLICY "Users can update own messages" 
  ON messages FOR UPDATE 
  USING (auth.uid() = sender_id);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies updated successfully for tier system!';
END $$;

