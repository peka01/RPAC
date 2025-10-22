-- =============================================
-- USER TIER SYSTEM MIGRATION
-- =============================================
-- Purpose: Add user tier system for future business model
-- Tiers: individual (basic), community_manager (premium), super_admin (system admin)
-- Date: 2025-10-21

-- Add user tier and license tracking to user_profiles
DO $$ 
BEGIN
  -- Add user_tier column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'user_tier'
  ) THEN
    ALTER TABLE user_profiles 
    ADD COLUMN user_tier VARCHAR(20) DEFAULT 'individual' 
    CHECK (user_tier IN ('individual', 'community_manager', 'super_admin'));
    
    RAISE NOTICE 'Added user_tier column to user_profiles';
  ELSE
    RAISE NOTICE 'user_tier column already exists, skipping...';
  END IF;

  -- Add license tracking columns (for future business model)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'license_type'
  ) THEN
    ALTER TABLE user_profiles 
    ADD COLUMN license_type VARCHAR(20) DEFAULT 'free' 
    CHECK (license_type IN ('free', 'individual', 'community_manager'));
    
    RAISE NOTICE 'Added license_type column to user_profiles';
  ELSE
    RAISE NOTICE 'license_type column already exists, skipping...';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'license_expires_at'
  ) THEN
    ALTER TABLE user_profiles 
    ADD COLUMN license_expires_at TIMESTAMP WITH TIME ZONE;
    
    RAISE NOTICE 'Added license_expires_at column to user_profiles';
  ELSE
    RAISE NOTICE 'license_expires_at column already exists, skipping...';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'is_license_active'
  ) THEN
    ALTER TABLE user_profiles 
    ADD COLUMN is_license_active BOOLEAN DEFAULT true;
    
    RAISE NOTICE 'Added is_license_active column to user_profiles';
  ELSE
    RAISE NOTICE 'is_license_active column already exists, skipping...';
  END IF;

  -- Add tier upgrade history
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'tier_upgraded_at'
  ) THEN
    ALTER TABLE user_profiles 
    ADD COLUMN tier_upgraded_at TIMESTAMP WITH TIME ZONE;
    
    RAISE NOTICE 'Added tier_upgraded_at column to user_profiles';
  ELSE
    RAISE NOTICE 'tier_upgraded_at column already exists, skipping...';
  END IF;

  -- Add notes field for admin tracking
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'admin_notes'
  ) THEN
    ALTER TABLE user_profiles 
    ADD COLUMN admin_notes TEXT;
    
    RAISE NOTICE 'Added admin_notes column to user_profiles';
  ELSE
    RAISE NOTICE 'admin_notes column already exists, skipping...';
  END IF;
END $$;

-- Create index for fast tier lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_tier 
  ON user_profiles(user_tier);

-- Create index for license expiration checks
CREATE INDEX IF NOT EXISTS idx_user_profiles_license_active 
  ON user_profiles(license_expires_at, is_license_active) 
  WHERE license_expires_at IS NOT NULL;

-- Create index for community manager lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_community_managers 
  ON user_profiles(user_tier, is_license_active) 
  WHERE user_tier = 'community_manager';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ User tier system migration completed successfully!';
END $$;

