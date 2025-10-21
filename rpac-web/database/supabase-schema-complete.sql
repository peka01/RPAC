-- RPAC Complete Supabase Database Schema
-- This schema includes all features: user profiles, resources, cultivation, communities, and messaging

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- USER PROFILES & AUTHENTICATION
-- =============================================

-- User profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  county VARCHAR(100),
  municipality VARCHAR(100),
  postal_code VARCHAR(10),
  climate_zone VARCHAR(20) DEFAULT 'svealand' CHECK (climate_zone IN ('gotaland', 'svealand', 'norrland')),
  experience_level VARCHAR(20) DEFAULT 'beginner' CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  garden_size VARCHAR(20) DEFAULT 'none' CHECK (garden_size IN ('none', 'balcony', 'small', 'medium', 'large', 'farm')),
  growing_preferences TEXT[] DEFAULT '{}',
  location_privacy VARCHAR(20) DEFAULT 'county_only' CHECK (location_privacy IN ('public', 'county_only', 'private')),
  family_size INTEGER DEFAULT 1 CHECK (family_size > 0),
  pets TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- RESOURCE INVENTORY
-- =============================================

-- Resources table for individual inventory
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(20) NOT NULL CHECK (category IN ('food', 'water', 'medicine', 'energy', 'tools')),
  quantity DECIMAL(10,2) DEFAULT 0,
  unit VARCHAR(50) NOT NULL,
  days_remaining INTEGER DEFAULT 0,
  is_msb_recommended BOOLEAN DEFAULT FALSE,
  msb_priority VARCHAR(10) CHECK (msb_priority IN ('high', 'medium', 'low')),
  is_filled BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- CULTIVATION & PLANNING SYSTEM
-- =============================================

-- Cultivation calendar entries
CREATE TABLE IF NOT EXISTS cultivation_calendar (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  crop_name VARCHAR(100) NOT NULL,
  crop_type VARCHAR(50) NOT NULL,
  month VARCHAR(20) NOT NULL,
  activity VARCHAR(50) NOT NULL CHECK (activity IN ('sowing', 'planting', 'harvesting', 'maintenance')),
  climate_zone VARCHAR(20) NOT NULL,
  garden_size VARCHAR(20) NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Garden planning layouts
CREATE TABLE IF NOT EXISTS garden_layouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  layout_name VARCHAR(100) NOT NULL,
  layout_data JSONB NOT NULL, -- Stores the visual layout configuration
  garden_size VARCHAR(20) NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cultivation reminders
CREATE TABLE IF NOT EXISTS cultivation_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_type VARCHAR(50) NOT NULL CHECK (reminder_type IN ('sowing', 'planting', 'watering', 'harvesting', 'maintenance')),
  crop_name VARCHAR(100) NOT NULL,
  reminder_date DATE NOT NULL,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern VARCHAR(50), -- 'weekly', 'monthly', 'seasonal'
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crisis cultivation plans
CREATE TABLE IF NOT EXISTS crisis_cultivation_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_name VARCHAR(100) NOT NULL,
  urgency_level VARCHAR(20) NOT NULL CHECK (urgency_level IN ('low', 'medium', 'high', 'extreme')),
  available_space VARCHAR(20) NOT NULL CHECK (available_space IN ('indoor', 'outdoor', 'both')),
  timeframe_days INTEGER NOT NULL,
  selected_crops TEXT[] NOT NULL,
  target_calories INTEGER DEFAULT 500,
  start_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  progress_data JSONB, -- Stores progress tracking data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Nutrition calculations
CREATE TABLE IF NOT EXISTS nutrition_calculations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  calculation_name VARCHAR(100) NOT NULL,
  garden_size VARCHAR(20) NOT NULL,
  selected_crops JSONB NOT NULL, -- Array of crop data with quantities
  total_calories INTEGER,
  total_protein DECIMAL(10,2),
  total_carbs DECIMAL(10,2),
  total_fat DECIMAL(10,2),
  self_sufficiency_percentage DECIMAL(5,2),
  calculation_data JSONB, -- Full calculation details
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- PLANT DIAGNOSIS & AI
-- =============================================

-- Plant diagnoses
CREATE TABLE IF NOT EXISTS plant_diagnoses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plant_name VARCHAR(100) NOT NULL,
  health_status VARCHAR(20) NOT NULL CHECK (health_status IN ('healthy', 'disease', 'pest', 'nutrient')),
  confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  description TEXT NOT NULL,
  recommendations TEXT[] NOT NULL,
  severity VARCHAR(10) NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  image_url TEXT,
  diagnosis_data JSONB, -- AI analysis details
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- COMMUNITY & MESSAGING
-- =============================================

-- Local communities
CREATE TABLE IF NOT EXISTS local_communities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  community_name VARCHAR(100) NOT NULL,
  location VARCHAR(100) NOT NULL,
  description TEXT,
  postal_code VARCHAR(10),
  county VARCHAR(100),
  is_public BOOLEAN DEFAULT TRUE,
  member_count INTEGER DEFAULT 1,
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

-- Messages
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

-- =============================================
-- RESOURCE SHARING & HELP REQUESTS
-- =============================================

-- Resource sharing
CREATE TABLE IF NOT EXISTS resource_sharing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
  shared_quantity DECIMAL(10,2) NOT NULL,
  available_until TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'requested', 'taken')),
  location VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Help requests
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
  priority INTEGER DEFAULT 0, -- Calculated based on urgency and other factors
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- EXTERNAL COMMUNICATION
-- =============================================

-- External communication sources
CREATE TABLE IF NOT EXISTS external_communication_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_name VARCHAR(100) NOT NULL,
  source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('radio', 'web', 'official', 'emergency')),
  frequency VARCHAR(20), -- For radio sources
  url TEXT, -- For web sources
  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- External alerts and warnings
CREATE TABLE IF NOT EXISTS external_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id UUID REFERENCES external_communication_sources(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  affected_areas TEXT[], -- Array of affected areas
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_county ON user_profiles(county);
CREATE INDEX IF NOT EXISTS idx_user_profiles_climate_zone ON user_profiles(climate_zone);

-- Resources indexes
CREATE INDEX IF NOT EXISTS idx_resources_user_id ON resources(user_id);
CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category);
CREATE INDEX IF NOT EXISTS idx_resources_msb_recommended ON resources(is_msb_recommended);

-- Cultivation indexes
CREATE INDEX IF NOT EXISTS idx_cultivation_calendar_user_id ON cultivation_calendar(user_id);
CREATE INDEX IF NOT EXISTS idx_cultivation_calendar_month ON cultivation_calendar(month);
CREATE INDEX IF NOT EXISTS idx_garden_layouts_user_id ON garden_layouts(user_id);
CREATE INDEX IF NOT EXISTS idx_cultivation_reminders_user_id ON cultivation_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_cultivation_reminders_date ON cultivation_reminders(reminder_date);
CREATE INDEX IF NOT EXISTS idx_crisis_plans_user_id ON crisis_cultivation_plans(user_id);

-- Community indexes
CREATE INDEX IF NOT EXISTS idx_local_communities_location ON local_communities(location);
CREATE INDEX IF NOT EXISTS idx_community_memberships_community_id ON community_memberships(community_id);
CREATE INDEX IF NOT EXISTS idx_community_memberships_user_id ON community_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_community_id ON messages(community_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Help requests indexes
CREATE INDEX IF NOT EXISTS idx_help_requests_user_id ON help_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_help_requests_community_id ON help_requests(community_id);
CREATE INDEX IF NOT EXISTS idx_help_requests_urgency ON help_requests(urgency);
CREATE INDEX IF NOT EXISTS idx_help_requests_status ON help_requests(status);
CREATE INDEX IF NOT EXISTS idx_help_requests_priority ON help_requests(priority);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE cultivation_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE garden_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cultivation_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE crisis_cultivation_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE plant_diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE local_communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_sharing ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_requests ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Resources policies
CREATE POLICY "Users can view own resources" ON resources
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own resources" ON resources
  FOR ALL USING (auth.uid() = user_id);

-- Cultivation policies
CREATE POLICY "Users can manage own cultivation data" ON cultivation_calendar
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own garden layouts" ON garden_layouts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own reminders" ON cultivation_reminders
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own crisis plans" ON crisis_cultivation_plans
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own nutrition calculations" ON nutrition_calculations
  FOR ALL USING (auth.uid() = user_id);

-- Plant diagnoses policies
CREATE POLICY "Users can manage own plant diagnoses" ON plant_diagnoses
  FOR ALL USING (auth.uid() = user_id);

-- Community policies (public read, members can write)
CREATE POLICY "Anyone can view public communities" ON local_communities
  FOR SELECT USING (is_public = true);

CREATE POLICY "Community admins can manage communities" ON local_communities
  FOR ALL USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM community_memberships 
      WHERE community_id = local_communities.id 
      AND user_id = auth.uid() 
      AND role IN ('admin', 'moderator')
    )
  );

-- Community memberships policies
CREATE POLICY "Users can view community memberships" ON community_memberships
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM community_memberships cm 
      WHERE cm.community_id = community_memberships.community_id 
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join communities" ON community_memberships
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave communities" ON community_memberships
  FOR DELETE USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can view messages they sent or received" ON messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update messages they sent" ON messages
  FOR UPDATE USING (auth.uid() = sender_id);

-- Resource sharing policies
CREATE POLICY "Users can view shared resources" ON resource_sharing
  FOR SELECT USING (true); -- Public for community sharing

CREATE POLICY "Users can manage own shared resources" ON resource_sharing
  FOR ALL USING (auth.uid() = user_id);

-- Help requests policies
CREATE POLICY "Users can view help requests in their communities" ON help_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM community_memberships 
      WHERE community_id = help_requests.community_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create help requests" ON help_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own help requests" ON help_requests
  FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all relevant tables
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON resources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cultivation_calendar_updated_at BEFORE UPDATE ON cultivation_calendar
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_garden_layouts_updated_at BEFORE UPDATE ON garden_layouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cultivation_reminders_updated_at BEFORE UPDATE ON cultivation_reminders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crisis_plans_updated_at BEFORE UPDATE ON crisis_cultivation_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nutrition_calculations_updated_at BEFORE UPDATE ON nutrition_calculations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_local_communities_updated_at BEFORE UPDATE ON local_communities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resource_sharing_updated_at BEFORE UPDATE ON resource_sharing
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_help_requests_updated_at BEFORE UPDATE ON help_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- INITIAL DATA SETUP
-- =============================================

-- Insert default external communication sources
INSERT INTO external_communication_sources (source_name, source_type, frequency, url, priority) VALUES
('Sveriges Radio P1', 'radio', 'FM 89.6 MHz', 'https://sverigesradio.se/p1', 1),
('Krisinformation.se', 'web', NULL, 'https://www.krisinformation.se', 1),
('SMHI Varningar', 'web', NULL, 'https://www.smhi.se/vadret/varningar', 2),
('MSB Beredskap', 'official', NULL, 'https://www.msb.se', 1),
('SOS Alarm', 'emergency', NULL, 'https://www.sosalarm.se', 1)
ON CONFLICT DO NOTHING;

-- =============================================
-- FUNCTIONS FOR CULTIVATION FEATURES
-- =============================================

-- Function to get cultivation calendar for user
CREATE OR REPLACE FUNCTION get_user_cultivation_calendar(
  p_user_id UUID,
  p_month VARCHAR(20) DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  crop_name VARCHAR(100),
  crop_type VARCHAR(50),
  month VARCHAR(20),
  activity VARCHAR(50),
  is_completed BOOLEAN,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cc.id,
    cc.crop_name,
    cc.crop_type,
    cc.month,
    cc.activity,
    cc.is_completed,
    cc.completed_at,
    cc.notes
  FROM cultivation_calendar cc
  WHERE cc.user_id = p_user_id
    AND (p_month IS NULL OR cc.month = p_month)
  ORDER BY cc.month, cc.crop_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate nutrition from garden
CREATE OR REPLACE FUNCTION calculate_garden_nutrition(
  p_user_id UUID,
  p_garden_size VARCHAR(20)
)
RETURNS TABLE (
  total_calories INTEGER,
  total_protein DECIMAL(10,2),
  total_carbs DECIMAL(10,2),
  total_fat DECIMAL(10,2),
  self_sufficiency_percentage DECIMAL(5,2)
) AS $$
DECLARE
  v_calories INTEGER := 0;
  v_protein DECIMAL(10,2) := 0;
  v_carbs DECIMAL(10,2) := 0;
  v_fat DECIMAL(10,2) := 0;
  v_percentage DECIMAL(5,2) := 0;
BEGIN
  -- This would contain the actual nutrition calculation logic
  -- For now, returning placeholder values
  RETURN QUERY SELECT v_calories, v_protein, v_carbs, v_fat, v_percentage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- VIEWS FOR COMMON QUERIES
-- =============================================

-- View for user dashboard data
CREATE OR REPLACE VIEW user_dashboard_data AS
SELECT 
  up.user_id,
  up.county,
  up.climate_zone,
  up.garden_size,
  up.experience_level,
  COUNT(r.id) as resource_count,
  COUNT(CASE WHEN r.is_msb_recommended = true THEN 1 END) as msb_resources_count,
  COUNT(CASE WHEN r.is_filled = true THEN 1 END) as filled_resources_count,
  COUNT(cc.id) as cultivation_entries_count,
  COUNT(CASE WHEN cc.is_completed = true THEN 1 END) as completed_cultivation_count
FROM user_profiles up
LEFT JOIN resources r ON up.user_id = r.user_id
LEFT JOIN cultivation_calendar cc ON up.user_id = cc.user_id
GROUP BY up.user_id, up.county, up.climate_zone, up.garden_size, up.experience_level;

-- View for community overview
CREATE OR REPLACE VIEW community_overview AS
SELECT 
  lc.id,
  lc.community_name,
  lc.location,
  lc.member_count,
  COUNT(hr.id) as active_help_requests,
  COUNT(CASE WHEN hr.urgency = 'critical' THEN 1 END) as critical_requests
FROM local_communities lc
LEFT JOIN help_requests hr ON lc.id = hr.community_id AND hr.status = 'open'
GROUP BY lc.id, lc.community_name, lc.location, lc.member_count;

-- =============================================
-- COMPLETION MESSAGE
-- =============================================

DO $$
BEGIN
  RAISE NOTICE '✅ RPAC Complete Database Schema Created Successfully!';
  RAISE NOTICE '📊 Core tables created and ready for use';
  RAISE NOTICE '🔒 RLS policies, indexes, triggers, and functions configured';
  RAISE NOTICE '🚀 Ready for RPAC application deployment!';
END $$;
