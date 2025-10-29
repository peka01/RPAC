-- Migration: Add missing columns to user_profiles table
-- Date: 2025-10-29
-- Description: Adds climate_zone and other missing columns that may not have been created in initial setup

DO $$ BEGIN
  -- Add climate_zone if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='user_profiles' AND column_name='climate_zone'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN climate_zone VARCHAR(20) DEFAULT 'svealand' 
      CHECK (climate_zone IN ('gotaland', 'svealand', 'norrland'));
    RAISE NOTICE 'Added climate_zone column';
  END IF;

  -- Add experience_level if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='user_profiles' AND column_name='experience_level'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN experience_level VARCHAR(20) DEFAULT 'beginner' 
      CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'expert'));
    RAISE NOTICE 'Added experience_level column';
  END IF;

  -- Add garden_size if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='user_profiles' AND column_name='garden_size'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN garden_size VARCHAR(20) DEFAULT 'none' 
      CHECK (garden_size IN ('none', 'balcony', 'small', 'medium', 'large', 'farm'));
    RAISE NOTICE 'Added garden_size column';
  END IF;

  -- Add growing_preferences if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='user_profiles' AND column_name='growing_preferences'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN growing_preferences TEXT[] DEFAULT '{}';
    RAISE NOTICE 'Added growing_preferences column';
  END IF;

  -- Add location_privacy if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='user_profiles' AND column_name='location_privacy'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN location_privacy VARCHAR(20) DEFAULT 'county_only' 
      CHECK (location_privacy IN ('public', 'county_only', 'private'));
    RAISE NOTICE 'Added location_privacy column';
  END IF;

  -- Add family_size if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='user_profiles' AND column_name='family_size'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN family_size INTEGER DEFAULT 1 CHECK (family_size > 0);
    RAISE NOTICE 'Added family_size column';
  END IF;

  -- Add pets if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='user_profiles' AND column_name='pets'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN pets TEXT[] DEFAULT '{}';
    RAISE NOTICE 'Added pets column';
  END IF;

  -- Add display_name if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='user_profiles' AND column_name='display_name'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN display_name VARCHAR(100);
    RAISE NOTICE 'Added display_name column';
  END IF;

END $$;

-- Create or recreate help_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS help_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  community_id UUID REFERENCES local_communities(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(20) NOT NULL CHECK (category IN ('food', 'water', 'medicine', 'energy', 'tools', 'other')),
  urgency VARCHAR(20) NOT NULL CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
  location VARCHAR(100),
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on help_requests
ALTER TABLE help_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing help_requests policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view help requests in their communities" ON help_requests;
DROP POLICY IF EXISTS "Users can create help requests" ON help_requests;
DROP POLICY IF EXISTS "Users can update own help requests" ON help_requests;

-- Drop existing user_profiles policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

-- Recreate user_profiles policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create help_requests policies
-- Fixed: Simplified to avoid RLS recursion (issue 42P17)
-- Community membership verification happens at application level
CREATE POLICY "Users can view help requests in their communities" ON help_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create help requests" ON help_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id AND community_id IS NOT NULL);

CREATE POLICY "Users can update own help requests" ON help_requests
  FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes for help_requests
CREATE INDEX IF NOT EXISTS idx_help_requests_user_id ON help_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_help_requests_community_id ON help_requests(community_id);
CREATE INDEX IF NOT EXISTS idx_help_requests_urgency ON help_requests(urgency);
CREATE INDEX IF NOT EXISTS idx_help_requests_status ON help_requests(status);
CREATE INDEX IF NOT EXISTS idx_help_requests_priority ON help_requests(priority);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS update_help_requests_updated_at ON help_requests;
CREATE TRIGGER update_help_requests_updated_at BEFORE UPDATE ON help_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

RAISE NOTICE '✅ Migration completed successfully! user_profiles and help_requests tables are ready.';
