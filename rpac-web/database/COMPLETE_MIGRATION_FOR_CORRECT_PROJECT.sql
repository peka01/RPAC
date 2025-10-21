-- =============================================
-- COMPLETE USER MANAGEMENT MIGRATION
-- =============================================
-- For project: dsoujjudzrrtkkqwhpge.supabase.co
-- This is a consolidated, safe-to-run migration

-- ===========================================
-- PART 1: USER TIER SYSTEM
-- ===========================================

-- Add user_tier column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'user_tier'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN user_tier VARCHAR(20) DEFAULT 'individual';
    ALTER TABLE user_profiles ADD CONSTRAINT user_tier_check 
      CHECK (user_tier IN ('individual', 'community_manager', 'super_admin'));
    CREATE INDEX IF NOT EXISTS idx_user_profiles_user_tier ON user_profiles(user_tier);
    RAISE NOTICE '✅ Added user_tier column';
  ELSE
    RAISE NOTICE '⏭️  user_tier column already exists';
  END IF;
END $$;

-- Add license_type column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'license_type'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN license_type VARCHAR(20) DEFAULT 'free';
    ALTER TABLE user_profiles ADD CONSTRAINT license_type_check 
      CHECK (license_type IN ('free', 'individual_paid', 'community_paid'));
    RAISE NOTICE '✅ Added license_type column';
  ELSE
    RAISE NOTICE '⏭️  license_type column already exists';
  END IF;
END $$;

-- Add license_expires_at column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'license_expires_at'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN license_expires_at TIMESTAMPTZ;
    RAISE NOTICE '✅ Added license_expires_at column';
  ELSE
    RAISE NOTICE '⏭️  license_expires_at column already exists';
  END IF;
END $$;

-- Add is_license_active column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'is_license_active'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN is_license_active BOOLEAN DEFAULT true;
    RAISE NOTICE '✅ Added is_license_active column';
  ELSE
    RAISE NOTICE '⏭️  is_license_active column already exists';
  END IF;
END $$;

-- Add tier_upgraded_at column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'tier_upgraded_at'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN tier_upgraded_at TIMESTAMPTZ;
    RAISE NOTICE '✅ Added tier_upgraded_at column';
  ELSE
    RAISE NOTICE '⏭️  tier_upgraded_at column already exists';
  END IF;
END $$;

-- Add admin_notes column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'admin_notes'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN admin_notes TEXT;
    RAISE NOTICE '✅ Added admin_notes column';
  ELSE
    RAISE NOTICE '⏭️  admin_notes column already exists';
  END IF;
END $$;

-- ===========================================
-- PART 2: COMMUNITY ACCESS CONTROL
-- ===========================================

-- Add access_type to local_communities
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'local_communities' AND column_name = 'access_type'
  ) THEN
    ALTER TABLE local_communities ADD COLUMN access_type VARCHAR(20) DEFAULT 'open';
    ALTER TABLE local_communities ADD CONSTRAINT access_type_check 
      CHECK (access_type IN ('open', 'closed'));
    CREATE INDEX IF NOT EXISTS idx_local_communities_access_type ON local_communities(access_type);
    RAISE NOTICE '✅ Added access_type to local_communities';
  ELSE
    RAISE NOTICE '⏭️  access_type column already exists';
  END IF;
END $$;

-- Add auto_approve_members to local_communities
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'local_communities' AND column_name = 'auto_approve_members'
  ) THEN
    ALTER TABLE local_communities ADD COLUMN auto_approve_members BOOLEAN DEFAULT true;
    RAISE NOTICE '✅ Added auto_approve_members to local_communities';
  ELSE
    RAISE NOTICE '⏭️  auto_approve_members column already exists';
  END IF;
END $$;

-- Add max_members to local_communities
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'local_communities' AND column_name = 'max_members'
  ) THEN
    ALTER TABLE local_communities ADD COLUMN max_members INTEGER;
    RAISE NOTICE '✅ Added max_members to local_communities';
  ELSE
    RAISE NOTICE '⏭️  max_members column already exists';
  END IF;
END $$;

-- ===========================================
-- PART 3: MEMBERSHIP APPROVAL WORKFLOW
-- ===========================================

-- Add membership_status to community_memberships
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'community_memberships' AND column_name = 'membership_status'
  ) THEN
    ALTER TABLE community_memberships ADD COLUMN membership_status VARCHAR(20) DEFAULT 'approved';
    ALTER TABLE community_memberships ADD CONSTRAINT membership_status_check 
      CHECK (membership_status IN ('pending', 'approved', 'rejected', 'banned'));
    CREATE INDEX IF NOT EXISTS idx_community_memberships_status ON community_memberships(membership_status);
    RAISE NOTICE '✅ Added membership_status to community_memberships';
  ELSE
    RAISE NOTICE '⏭️  membership_status column already exists';
  END IF;
END $$;

-- Add requested_at to community_memberships
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'community_memberships' AND column_name = 'requested_at'
  ) THEN
    ALTER TABLE community_memberships ADD COLUMN requested_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE '✅ Added requested_at to community_memberships';
  ELSE
    RAISE NOTICE '⏭️  requested_at column already exists';
  END IF;
END $$;

-- Add reviewed_at, reviewed_by, rejection_reason, join_message
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'community_memberships' AND column_name = 'reviewed_at') THEN
    ALTER TABLE community_memberships ADD COLUMN reviewed_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'community_memberships' AND column_name = 'reviewed_by') THEN
    ALTER TABLE community_memberships ADD COLUMN reviewed_by UUID REFERENCES auth.users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'community_memberships' AND column_name = 'rejection_reason') THEN
    ALTER TABLE community_memberships ADD COLUMN rejection_reason TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'community_memberships' AND column_name = 'join_message') THEN
    ALTER TABLE community_memberships ADD COLUMN join_message TEXT;
  END IF;
  RAISE NOTICE '✅ Added membership workflow columns';
END $$;

-- ===========================================
-- PART 4: RLS POLICIES
-- ===========================================

-- Update user_profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Super admins have full access to all profiles" ON user_profiles;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Super admins have full access to all profiles"
  ON user_profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND up.user_tier = 'super_admin'
    )
  );

DO $$
BEGIN
  RAISE NOTICE '✅ user_profiles RLS policies updated';
END $$;

-- ===========================================
-- PART 5: MAKE USER SUPER ADMIN
-- ===========================================

-- Try to make user 039b542f super admin (preferred)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = '039b542f-570a-48a2-bc22-ec09f8990ace') THEN
    IF EXISTS (SELECT 1 FROM user_profiles WHERE user_id = '039b542f-570a-48a2-bc22-ec09f8990ace') THEN
      UPDATE user_profiles
      SET 
        user_tier = 'super_admin',
        license_type = 'free',
        is_license_active = true,
        tier_upgraded_at = NOW(),
        updated_at = NOW()
      WHERE user_id = '039b542f-570a-48a2-bc22-ec09f8990ace';
      RAISE NOTICE '✅ Updated user 039b542f to super_admin';
    ELSE
      INSERT INTO user_profiles (user_id, user_tier, license_type, is_license_active)
      VALUES ('039b542f-570a-48a2-bc22-ec09f8990ace', 'super_admin', 'free', true);
      RAISE NOTICE '✅ Created super_admin profile for user 039b542f';
    END IF;
  ELSE
    RAISE NOTICE '⚠️  User 039b542f does not exist in auth.users';
  END IF;
END $$;

-- Try to make user 34645cf8 super admin (fallback)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = '34645cf8-7ee5-4a3c-ab06-d1ac8f2ab721') THEN
    IF EXISTS (SELECT 1 FROM user_profiles WHERE user_id = '34645cf8-7ee5-4a3c-ab06-d1ac8f2ab721') THEN
      UPDATE user_profiles
      SET 
        user_tier = 'super_admin',
        license_type = 'free',
        is_license_active = true,
        tier_upgraded_at = NOW(),
        updated_at = NOW()
      WHERE user_id = '34645cf8-7ee5-4a3c-ab06-d1ac8f2ab721';
      RAISE NOTICE '✅ Updated user 34645cf8 to super_admin';
    ELSE
      INSERT INTO user_profiles (user_id, user_tier, license_type, is_license_active)
      VALUES ('34645cf8-7ee5-4a3c-ab06-d1ac8f2ab721', 'super_admin', 'free', true);
      RAISE NOTICE '✅ Created super_admin profile for user 34645cf8';
    END IF;
  ELSE
    RAISE NOTICE '⚠️  User 34645cf8 does not exist in auth.users';
  END IF;
END $$;

-- ===========================================
-- VERIFICATION
-- ===========================================

SELECT 
  up.user_id,
  au.email,
  up.user_tier,
  up.license_type,
  up.is_license_active
FROM user_profiles up
LEFT JOIN auth.users au ON up.user_id = au.id
WHERE up.user_id = '34645cf8-7ee5-4a3c-ab06-d1ac8f2ab721';

-- ===========================================
-- SUCCESS MESSAGE
-- ===========================================

DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅✅✅ MIGRATION COMPLETE! ✅✅✅';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'What was done:';
  RAISE NOTICE '1. ✅ Added user tier system columns';
  RAISE NOTICE '2. ✅ Added community access control';
  RAISE NOTICE '3. ✅ Added membership approval workflow';
  RAISE NOTICE '4. ✅ Updated RLS policies';
  RAISE NOTICE '5. ✅ Made user 34645cf8 super admin';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Clear browser cache (Ctrl+Shift+R)';
  RAISE NOTICE '2. Go to http://localhost:3000/super-admin/login';
  RAISE NOTICE '3. Sign in with per.karlsson@title.se';
  RAISE NOTICE '4. Access granted! 🎉';
  RAISE NOTICE '';
  RAISE NOTICE '=================================================';
END $$;

