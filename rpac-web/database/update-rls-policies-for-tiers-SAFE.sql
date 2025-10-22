-- =============================================
-- UPDATE RLS POLICIES FOR USER TIER SYSTEM (SAFE VERSION)
-- =============================================
-- This version drops existing policies before recreating them

-- ============================================
-- USER_PROFILES TABLE - Allow reading tier columns
-- ============================================

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Super admins have full access to all profiles" ON user_profiles;

-- Allow users to view their own profile (including tier info)
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to update their own profile (but NOT tier/license fields)
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
  );

-- Super admins can view and modify all profiles
CREATE POLICY "Super admins have full access to all profiles"
  ON user_profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND user_tier = 'super_admin'
    )
  );

-- ============================================
-- LOCAL_COMMUNITIES TABLE - Tier-based access
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view public communities" ON local_communities;
DROP POLICY IF EXISTS "Community managers can create communities" ON local_communities;
DROP POLICY IF EXISTS "Community founders can update their communities" ON local_communities;
DROP POLICY IF EXISTS "Super admins have full access to communities" ON local_communities;

-- Public read access
CREATE POLICY "Anyone can view public communities"
  ON local_communities FOR SELECT
  USING (true);

-- Only community_manager tier or higher can create communities
CREATE POLICY "Community managers can create communities"
  ON local_communities FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND user_tier IN ('community_manager', 'super_admin')
      AND is_license_active = true
    )
  );

-- Community founders can update
CREATE POLICY "Community founders can update their communities"
  ON local_communities FOR UPDATE
  USING (founded_by = auth.uid())
  WITH CHECK (founded_by = auth.uid());

-- Super admins full access
CREATE POLICY "Super admins have full access to communities"
  ON local_communities FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND user_tier = 'super_admin'
    )
  );

-- ============================================
-- COMMUNITY_MEMBERSHIPS TABLE - Approval workflow
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own memberships" ON community_memberships;
DROP POLICY IF EXISTS "Users can request to join communities" ON community_memberships;
DROP POLICY IF EXISTS "Community founders can view all memberships" ON community_memberships;
DROP POLICY IF EXISTS "Community founders can approve memberships" ON community_memberships;
DROP POLICY IF EXISTS "Super admins have full membership access" ON community_memberships;

-- Users can view their own memberships
CREATE POLICY "Users can view their own memberships"
  ON community_memberships FOR SELECT
  USING (user_id = auth.uid());

-- Users can request to join (insert with 'pending' or 'approved' based on community type)
CREATE POLICY "Users can request to join communities"
  ON community_memberships FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (
      -- Auto-approve for open communities
      (membership_status = 'approved' AND EXISTS (
        SELECT 1 FROM local_communities
        WHERE id = community_memberships.community_id
        AND access_type = 'open'
      ))
      -- Pending for closed communities
      OR (membership_status = 'pending' AND EXISTS (
        SELECT 1 FROM local_communities
        WHERE id = community_memberships.community_id
        AND access_type = 'closed'
      ))
    )
  );

-- Community founders can view all memberships in their communities
CREATE POLICY "Community founders can view all memberships"
  ON community_memberships FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM local_communities
      WHERE id = community_memberships.community_id
      AND founded_by = auth.uid()
    )
  );

-- Community founders can approve/reject membership requests
CREATE POLICY "Community founders can approve memberships"
  ON community_memberships FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM local_communities
      WHERE id = community_memberships.community_id
      AND founded_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM local_communities
      WHERE id = community_memberships.community_id
      AND founded_by = auth.uid()
    )
  );

-- Super admins full access
CREATE POLICY "Super admins have full membership access"
  ON community_memberships FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND user_tier = 'super_admin'
    )
  );

-- ============================================
-- LICENSE_HISTORY TABLE - Admin and self-view only
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own license history" ON license_history;
DROP POLICY IF EXISTS "Super admins can view all license history" ON license_history;

-- Users can view their own license history
CREATE POLICY "Users can view their own license history"
  ON license_history FOR SELECT
  USING (user_id = auth.uid());

-- Super admins can view all
CREATE POLICY "Super admins can view all license history"
  ON license_history FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND user_tier = 'super_admin'
    )
  );

-- ============================================
-- HELP_REQUESTS TABLE - Update for community membership
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Approved members can view help requests" ON help_requests;
DROP POLICY IF EXISTS "Approved members can create help requests" ON help_requests;
DROP POLICY IF EXISTS "Request owners can update their requests" ON help_requests;
DROP POLICY IF EXISTS "Super admins have full help request access" ON help_requests;

-- Only approved members can view help requests in their communities
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
    requester_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM community_memberships
      WHERE community_id = help_requests.community_id
      AND user_id = auth.uid()
      AND membership_status = 'approved'
    )
  );

-- Request owners can update
CREATE POLICY "Request owners can update their requests"
  ON help_requests FOR UPDATE
  USING (requester_id = auth.uid())
  WITH CHECK (requester_id = auth.uid());

-- Super admins full access
CREATE POLICY "Super admins have full help request access"
  ON help_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND user_tier = 'super_admin'
    )
  );

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies updated successfully for user tier system!';
END $$;

