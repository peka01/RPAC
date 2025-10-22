-- =============================================
-- MINIMAL SUPER ADMIN SETUP
-- =============================================
-- Only adds the essential columns and makes you super admin

-- 1. Add user_tier column
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

-- 2. Add license_type column
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

-- 3. Add is_license_active column
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

-- 4. Fix RLS policies (allow reading user_tier)
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
  RAISE NOTICE '✅ RLS policies updated';
END $$;

-- 5. Make user 34645cf8 super admin (only update existing columns)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM user_profiles WHERE user_id = '34645cf8-7ee5-4a3c-ab06-d1ac8f2ab721') THEN
    UPDATE user_profiles
    SET 
      user_tier = 'super_admin',
      license_type = 'free',
      is_license_active = true,
      updated_at = NOW()
    WHERE user_id = '34645cf8-7ee5-4a3c-ab06-d1ac8f2ab721';
    RAISE NOTICE '✅ Updated user 34645cf8 to super_admin';
  ELSE
    -- Insert with only the columns that definitely exist
    INSERT INTO user_profiles (user_id, user_tier, license_type, is_license_active)
    VALUES ('34645cf8-7ee5-4a3c-ab06-d1ac8f2ab721', 'super_admin', 'free', true);
    RAISE NOTICE '✅ Created super_admin profile for user 34645cf8';
  END IF;
END $$;

-- 6. Verify
SELECT 
  up.user_id,
  au.email,
  up.user_tier,
  up.license_type,
  up.is_license_active
FROM user_profiles up
LEFT JOIN auth.users au ON up.user_id = au.id
WHERE up.user_id = '34645cf8-7ee5-4a3c-ab06-d1ac8f2ab721';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ SETUP COMPLETE!';
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'Now:';
  RAISE NOTICE '1. Clear browser cache (Ctrl+Shift+R)';
  RAISE NOTICE '2. Go to /super-admin/login';
  RAISE NOTICE '3. Sign in with per.karlsson@title.se';
  RAISE NOTICE '4. You are in! 🎉';
END $$;

