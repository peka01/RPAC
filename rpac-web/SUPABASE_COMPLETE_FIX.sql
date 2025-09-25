-- =============================================
-- RPAC SUPABASE COMPLETE DATABASE FIX
-- =============================================
-- This script safely updates your existing Supabase database
-- to work with the RPAC application without breaking anything
-- 
-- Run this ENTIRE script in your Supabase SQL Editor
-- =============================================

-- =============================================
-- STEP 1: ADD ALL MISSING COLUMNS TO EXISTING TABLES
-- =============================================

-- Fix resources table
ALTER TABLE resources 
ADD COLUMN IF NOT EXISTS is_msb_recommended BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS msb_priority VARCHAR(10) CHECK (msb_priority IN ('high', 'medium', 'low')),
ADD COLUMN IF NOT EXISTS is_filled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Fix help_requests table
ALTER TABLE help_requests 
ADD COLUMN IF NOT EXISTS urgency VARCHAR(20) CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add community_id to help_requests (without foreign key constraint for now)
ALTER TABLE help_requests 
ADD COLUMN IF NOT EXISTS community_id UUID;

-- Fix local_communities table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'local_communities') THEN
    ALTER TABLE local_communities 
    ADD COLUMN IF NOT EXISTS postal_code VARCHAR(10),
    ADD COLUMN IF NOT EXISTS county VARCHAR(100),
    ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS member_count INTEGER DEFAULT 1;
  END IF;
END $$;

-- Fix resource_sharing table (if exists) - add missing columns
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'resource_sharing') THEN
    ALTER TABLE resource_sharing 
    ADD COLUMN IF NOT EXISTS resource_id UUID,
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'requested', 'shared', 'unavailable')),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- =============================================
-- STEP 2: CREATE NEW TABLES (ONLY IF THEY DON'T EXIST)
-- =============================================

-- Local communities table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS local_communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_name VARCHAR(100) NOT NULL,
  description TEXT,
  location VARCHAR(200),
  postal_code VARCHAR(10),
  county VARCHAR(100),
  is_public BOOLEAN DEFAULT TRUE,
  member_count INTEGER DEFAULT 1,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resource sharing table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS resource_sharing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  community_id UUID REFERENCES local_communities(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
  resource_name VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  quantity INTEGER DEFAULT 1,
  unit VARCHAR(20),
  description TEXT,
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'requested', 'shared', 'unavailable')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  postal_code VARCHAR(10),
  city VARCHAR(100),
  county VARCHAR(100),
  emergency_contact_name VARCHAR(100),
  emergency_contact_phone VARCHAR(20),
  emergency_contact_relation VARCHAR(50),
  medical_conditions TEXT,
  medications TEXT,
  allergies TEXT,
  blood_type VARCHAR(5),
  special_needs TEXT,
  household_size INTEGER DEFAULT 1,
  has_children BOOLEAN DEFAULT FALSE,
  has_elderly BOOLEAN DEFAULT FALSE,
  has_pets BOOLEAN DEFAULT FALSE,
  pet_types TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cultivation data table
CREATE TABLE IF NOT EXISTS cultivation_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plant_name VARCHAR(100) NOT NULL,
  variety VARCHAR(100),
  planting_date DATE,
  expected_harvest_date DATE,
  actual_harvest_date DATE,
  location VARCHAR(100),
  soil_type VARCHAR(50),
  watering_schedule VARCHAR(100),
  fertilizer_schedule VARCHAR(100),
  notes TEXT,
  status VARCHAR(20) DEFAULT 'planted' CHECK (status IN ('planned', 'planted', 'growing', 'harvested', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cultivation reminders table
CREATE TABLE IF NOT EXISTS cultivation_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plant_id UUID REFERENCES cultivation_data(id) ON DELETE CASCADE,
  reminder_type VARCHAR(50) NOT NULL,
  reminder_date DATE NOT NULL,
  reminder_time TIME,
  message TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  community_id UUID REFERENCES local_communities(id) ON DELETE CASCADE,
  subject VARCHAR(200),
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'general' CHECK (message_type IN ('general', 'emergency', 'resource_request', 'help_offer')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- External communication table
CREATE TABLE IF NOT EXISTS external_communication (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_type VARCHAR(50) NOT NULL,
  contact_name VARCHAR(100),
  contact_phone VARCHAR(20),
  contact_email VARCHAR(255),
  organization VARCHAR(100),
  department VARCHAR(100),
  role VARCHAR(100),
  notes TEXT,
  is_emergency_contact BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- STEP 3: ADD FOREIGN KEY CONSTRAINTS (AFTER ALL TABLES EXIST)
-- =============================================

-- Add foreign key constraints
DO $$
BEGIN
  -- Add foreign key constraint to help_requests.community_id
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'local_communities') THEN
    ALTER TABLE help_requests DROP CONSTRAINT IF EXISTS help_requests_community_id_fkey;
    ALTER TABLE help_requests 
    ADD CONSTRAINT help_requests_community_id_fkey 
    FOREIGN KEY (community_id) REFERENCES local_communities(id) ON DELETE CASCADE;
  END IF;
  
  -- Add foreign key constraint to resource_sharing.resource_id
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'resources') THEN
    ALTER TABLE resource_sharing DROP CONSTRAINT IF EXISTS resource_sharing_resource_id_fkey;
    ALTER TABLE resource_sharing 
    ADD CONSTRAINT resource_sharing_resource_id_fkey 
    FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE;
  END IF;
END $$;

-- =============================================
-- STEP 4: CREATE ALL INDEXES SAFELY
-- =============================================

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_postal_code ON user_profiles(postal_code);
CREATE INDEX IF NOT EXISTS idx_user_profiles_county ON user_profiles(county);

-- Resources indexes
CREATE INDEX IF NOT EXISTS idx_resources_user_id ON resources(user_id);
CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category);
CREATE INDEX IF NOT EXISTS idx_resources_msb_recommended ON resources(is_msb_recommended);
CREATE INDEX IF NOT EXISTS idx_resources_updated_at ON resources(updated_at);

-- Plant diagnoses indexes
CREATE INDEX IF NOT EXISTS idx_plant_diagnoses_user_id ON plant_diagnoses(user_id);
CREATE INDEX IF NOT EXISTS idx_plant_diagnoses_plant_name ON plant_diagnoses(plant_name);
CREATE INDEX IF NOT EXISTS idx_plant_diagnoses_created_at ON plant_diagnoses(created_at);

-- Local communities indexes
CREATE INDEX IF NOT EXISTS idx_local_communities_postal_code ON local_communities(postal_code);
CREATE INDEX IF NOT EXISTS idx_local_communities_county ON local_communities(county);
CREATE INDEX IF NOT EXISTS idx_local_communities_is_public ON local_communities(is_public);

-- Resource sharing indexes
CREATE INDEX IF NOT EXISTS idx_resource_sharing_user_id ON resource_sharing(user_id);
CREATE INDEX IF NOT EXISTS idx_resource_sharing_community_id ON resource_sharing(community_id);
CREATE INDEX IF NOT EXISTS idx_resource_sharing_resource_id ON resource_sharing(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_sharing_status ON resource_sharing(status);

-- Help requests indexes
CREATE INDEX IF NOT EXISTS idx_help_requests_user_id ON help_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_help_requests_community_id ON help_requests(community_id);
CREATE INDEX IF NOT EXISTS idx_help_requests_urgency ON help_requests(urgency);
CREATE INDEX IF NOT EXISTS idx_help_requests_status ON help_requests(status);
CREATE INDEX IF NOT EXISTS idx_help_requests_priority ON help_requests(priority);

-- Cultivation data indexes
CREATE INDEX IF NOT EXISTS idx_cultivation_data_user_id ON cultivation_data(user_id);
CREATE INDEX IF NOT EXISTS idx_cultivation_data_plant_name ON cultivation_data(plant_name);
CREATE INDEX IF NOT EXISTS idx_cultivation_data_status ON cultivation_data(status);
CREATE INDEX IF NOT EXISTS idx_cultivation_data_planting_date ON cultivation_data(planting_date);

-- Cultivation reminders indexes
CREATE INDEX IF NOT EXISTS idx_cultivation_reminders_user_id ON cultivation_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_cultivation_reminders_plant_id ON cultivation_reminders(plant_id);
CREATE INDEX IF NOT EXISTS idx_cultivation_reminders_reminder_date ON cultivation_reminders(reminder_date);
CREATE INDEX IF NOT EXISTS idx_cultivation_reminders_is_completed ON cultivation_reminders(is_completed);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_community_id ON messages(community_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- External communication indexes
CREATE INDEX IF NOT EXISTS idx_external_communication_user_id ON external_communication(user_id);
CREATE INDEX IF NOT EXISTS idx_external_communication_contact_type ON external_communication(contact_type);
CREATE INDEX IF NOT EXISTS idx_external_communication_is_emergency ON external_communication(is_emergency_contact);

-- =============================================
-- STEP 5: ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE local_communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_sharing ENABLE ROW LEVEL SECURITY;
ALTER TABLE cultivation_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE cultivation_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_communication ENABLE ROW LEVEL SECURITY;

-- Enable RLS on existing tables
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'resources') THEN
    ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'plant_diagnoses') THEN
    ALTER TABLE plant_diagnoses ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'local_communities') THEN
    ALTER TABLE local_communities ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'resource_sharing') THEN
    ALTER TABLE resource_sharing ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'help_requests') THEN
    ALTER TABLE help_requests ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- =============================================
-- STEP 6: CREATE RLS POLICIES
-- =============================================

-- User profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Local communities policies
DROP POLICY IF EXISTS "Anyone can view public communities" ON local_communities;
DROP POLICY IF EXISTS "Users can create communities" ON local_communities;
DROP POLICY IF EXISTS "Users can update own communities" ON local_communities;

CREATE POLICY "Anyone can view public communities" ON local_communities
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can create communities" ON local_communities
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own communities" ON local_communities
  FOR UPDATE USING (auth.uid() = created_by);

-- Resource sharing policies
DROP POLICY IF EXISTS "Users can view shared resources" ON resource_sharing;
DROP POLICY IF EXISTS "Users can manage own shared resources" ON resource_sharing;

CREATE POLICY "Users can view shared resources" ON resource_sharing
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own shared resources" ON resource_sharing
  FOR ALL USING (auth.uid() = user_id);

-- Resources policies (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'resources') THEN
    DROP POLICY IF EXISTS "Users can view own resources" ON resources;
    DROP POLICY IF EXISTS "Users can manage own resources" ON resources;
    
    CREATE POLICY "Users can view own resources" ON resources
      FOR SELECT USING (auth.uid() = user_id);

    CREATE POLICY "Users can manage own resources" ON resources
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- Plant diagnoses policies (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'plant_diagnoses') THEN
    DROP POLICY IF EXISTS "Users can view own plant diagnoses" ON plant_diagnoses;
    DROP POLICY IF EXISTS "Users can manage own plant diagnoses" ON plant_diagnoses;
    
    CREATE POLICY "Users can view own plant diagnoses" ON plant_diagnoses
      FOR SELECT USING (auth.uid() = user_id);

    CREATE POLICY "Users can manage own plant diagnoses" ON plant_diagnoses
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;



-- Help requests policies (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'help_requests') THEN
    DROP POLICY IF EXISTS "Users can view help requests" ON help_requests;
    DROP POLICY IF EXISTS "Users can manage own help requests" ON help_requests;
    
    CREATE POLICY "Users can view help requests" ON help_requests
      FOR SELECT USING (true);

    CREATE POLICY "Users can manage own help requests" ON help_requests
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- Cultivation data policies
DROP POLICY IF EXISTS "Users can view own cultivation data" ON cultivation_data;
DROP POLICY IF EXISTS "Users can manage own cultivation data" ON cultivation_data;

CREATE POLICY "Users can view own cultivation data" ON cultivation_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own cultivation data" ON cultivation_data
  FOR ALL USING (auth.uid() = user_id);

-- Cultivation reminders policies
DROP POLICY IF EXISTS "Users can view own cultivation reminders" ON cultivation_reminders;
DROP POLICY IF EXISTS "Users can manage own cultivation reminders" ON cultivation_reminders;

CREATE POLICY "Users can view own cultivation reminders" ON cultivation_reminders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own cultivation reminders" ON cultivation_reminders
  FOR ALL USING (auth.uid() = user_id);

-- Messages policies
DROP POLICY IF EXISTS "Users can view own messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;

CREATE POLICY "Users can view own messages" ON messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- External communication policies
DROP POLICY IF EXISTS "Users can view own external contacts" ON external_communication;
DROP POLICY IF EXISTS "Users can manage own external contacts" ON external_communication;

CREATE POLICY "Users can view own external contacts" ON external_communication
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own external contacts" ON external_communication
  FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- STEP 7: CREATE VIEWS SAFELY
-- =============================================

-- Community overview view (only if local_communities table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'local_communities') THEN
    DROP VIEW IF EXISTS community_overview;
    CREATE VIEW community_overview AS
    SELECT 
      lc.id,
      lc.community_name,
      lc.location,
      lc.member_count,
      COUNT(hr.id) as active_help_requests,
      COUNT(CASE WHEN hr.urgency = 'critical' THEN 1 END) as critical_requests,
      COUNT(rs.id) as shared_resources
    FROM local_communities lc
    LEFT JOIN help_requests hr ON lc.id = hr.community_id AND hr.status = 'open'
    LEFT JOIN resource_sharing rs ON lc.id = rs.community_id AND rs.status = 'available'
    GROUP BY lc.id, lc.community_name, lc.location, lc.member_count;
  END IF;
END $$;

-- =============================================
-- STEP 8: UPDATE EXISTING RECORDS
-- =============================================

-- Update resources table
UPDATE resources 
SET updated_at = NOW() 
WHERE updated_at IS NULL;

-- Update help_requests table
UPDATE help_requests 
SET updated_at = NOW() 
WHERE updated_at IS NULL;

-- Update resource_sharing table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'resource_sharing') THEN
    UPDATE resource_sharing 
    SET updated_at = NOW() 
    WHERE updated_at IS NULL;
    
    UPDATE resource_sharing 
    SET status = 'available' 
    WHERE status IS NULL;
  END IF;
END $$;

-- Set default values for new columns
UPDATE resources 
SET is_msb_recommended = FALSE 
WHERE is_msb_recommended IS NULL;

UPDATE resources 
SET is_filled = FALSE 
WHERE is_filled IS NULL;

UPDATE help_requests 
SET status = 'open' 
WHERE status IS NULL;

UPDATE help_requests 
SET priority = 0 
WHERE priority IS NULL;

-- =============================================
-- SUCCESS MESSAGE
-- =============================================
DO $$
BEGIN
  RAISE NOTICE '===============================================';
  RAISE NOTICE '🎉 RPAC DATABASE UPDATE COMPLETED SUCCESSFULLY!';
  RAISE NOTICE '===============================================';
  RAISE NOTICE '✅ All missing columns added to existing tables';
  RAISE NOTICE '✅ All new tables created (local_communities, resource_sharing, etc.)';
  RAISE NOTICE '✅ All foreign key constraints added safely';
  RAISE NOTICE '✅ All indexes created safely';
  RAISE NOTICE '✅ Row Level Security enabled on all tables';
  RAISE NOTICE '✅ All RLS policies created';
  RAISE NOTICE '✅ Views created safely';
  RAISE NOTICE '✅ Existing data updated with defaults';
  RAISE NOTICE '===============================================';
  RAISE NOTICE 'Your database is now ready for RPAC! 🚀';
  RAISE NOTICE '===============================================';
END $$;
