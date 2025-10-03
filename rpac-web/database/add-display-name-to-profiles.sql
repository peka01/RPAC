-- =============================================
-- ADD DISPLAY NAME TO USER PROFILES
-- =============================================
-- This migration adds display_name to user_profiles for messaging
-- Created: 2025-10-03
-- Purpose: Enable user name display in messaging and community features

-- Add display_name column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'display_name'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN display_name VARCHAR(100);
  END IF;
END $$;

-- Add first_name column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN first_name VARCHAR(50);
  END IF;
END $$;

-- Add last_name column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN last_name VARCHAR(50);
  END IF;
END $$;

-- Add avatar_url column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN avatar_url TEXT;
  END IF;
END $$;

-- Add name_display_preference column if not exists (what to show: email, display_name, first_last, initials)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'name_display_preference'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN name_display_preference VARCHAR(20) DEFAULT 'display_name' 
      CHECK (name_display_preference IN ('email', 'display_name', 'first_last', 'initials'));
  END IF;
END $$;

-- Create function to auto-populate display_name from auth.users email
CREATE OR REPLACE FUNCTION set_default_display_name()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Get user email from auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.user_id;
  
  -- Set display_name to email prefix if not provided
  IF NEW.display_name IS NULL AND user_email IS NOT NULL THEN
    NEW.display_name := split_part(user_email, '@', 1);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new profiles
DROP TRIGGER IF EXISTS trigger_set_default_display_name ON user_profiles;
CREATE TRIGGER trigger_set_default_display_name
  BEFORE INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_default_display_name();

-- Update existing profiles with display names based on email
DO $$
DECLARE
  profile_record RECORD;
  user_email TEXT;
BEGIN
  FOR profile_record IN 
    SELECT id, user_id, display_name 
    FROM user_profiles 
    WHERE display_name IS NULL
  LOOP
    -- Get email for this user
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = profile_record.user_id;
    
    -- Update with email prefix
    IF user_email IS NOT NULL THEN
      UPDATE user_profiles
      SET display_name = split_part(user_email, '@', 1)
      WHERE id = profile_record.id;
    END IF;
  END LOOP;
END $$;

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_display_name ON user_profiles(display_name);
CREATE INDEX IF NOT EXISTS idx_user_profiles_first_name ON user_profiles(first_name);
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_name ON user_profiles(last_name);

-- Create storage bucket for avatars if not exists (requires Supabase Storage)
-- This needs to be run manually in Supabase Dashboard or via API
-- Storage bucket: 'avatars' with public read access

-- Create RLS policies for avatar storage
-- Run this in Supabase Dashboard → Storage → avatars bucket:
-- 1. Allow authenticated users to upload their own avatars
-- 2. Allow public read access to all avatars

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: display_name, first_name, last_name, avatar_url, and name_display_preference added to user_profiles';
  RAISE NOTICE 'Remember to create storage bucket named "avatars" in Supabase Dashboard with public read access';
END $$;

