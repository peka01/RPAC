-- Cultivation Profiles Table
CREATE TABLE IF NOT EXISTS cultivation_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  household_size INTEGER DEFAULT 3,
  age_groups JSONB DEFAULT '{"children": 0, "adults": 2, "elderly": 0}',
  activity_level TEXT DEFAULT 'moderate' CHECK (activity_level IN ('sedentary', 'moderate', 'active')),
  special_needs TEXT[] DEFAULT '{}',
  crisis_mode BOOLEAN DEFAULT false,
  target_self_sufficiency INTEGER DEFAULT 30,
  climate_zone TEXT DEFAULT 'svealand' CHECK (climate_zone IN ('gotaland', 'svealand', 'norrland')),
  garden_size TEXT DEFAULT 'medium' CHECK (garden_size IN ('small', 'medium', 'large')),
  garden_type TEXT DEFAULT 'outdoor' CHECK (garden_type IN ('indoor', 'outdoor', 'greenhouse', 'mixed')),
  soil_type TEXT DEFAULT 'unknown' CHECK (soil_type IN ('clay', 'sandy', 'loamy', 'unknown')),
  sun_exposure TEXT DEFAULT 'partial' CHECK (sun_exposure IN ('full', 'partial', 'shade')),
  water_access TEXT DEFAULT 'good' CHECK (water_access IN ('excellent', 'good', 'limited')),
  experience_level TEXT DEFAULT 'beginner' CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
  time_available TEXT DEFAULT 'moderate' CHECK (time_available IN ('limited', 'moderate', 'extensive')),
  budget TEXT DEFAULT 'medium' CHECK (budget IN ('low', 'medium', 'high')),
  goals TEXT[] DEFAULT '{}',
  preferences TEXT[] DEFAULT '{}',
  challenges TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Cultivation Plans Table
CREATE TABLE IF NOT EXISTS cultivation_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  timeline TEXT,
  crops JSONB DEFAULT '[]',
  nutrition_contribution JSONB DEFAULT '{}',
  gap_analysis JSONB DEFAULT '{}',
  estimated_cost DECIMAL(10,2) DEFAULT 0,
  self_sufficiency_percent INTEGER DEFAULT 0,
  next_steps TEXT[] DEFAULT '{}',
  recommendations TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cultivation Calendar Items Table
CREATE TABLE IF NOT EXISTS cultivation_calendar_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  period TEXT,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE,
  type TEXT DEFAULT 'cultivation_task',
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  completed BOOLEAN DEFAULT false,
  source TEXT DEFAULT 'ai_plan',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cultivation_profiles_user_id ON cultivation_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_cultivation_plans_user_id ON cultivation_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_cultivation_plans_plan_id ON cultivation_plans(plan_id);
CREATE INDEX IF NOT EXISTS idx_cultivation_calendar_user_id ON cultivation_calendar_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cultivation_calendar_date ON cultivation_calendar_items(date);

-- Row Level Security (RLS) policies
ALTER TABLE cultivation_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cultivation_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE cultivation_calendar_items ENABLE ROW LEVEL SECURITY;

-- Policies for cultivation_profiles
CREATE POLICY "Users can view own cultivation profiles" ON cultivation_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cultivation profiles" ON cultivation_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cultivation profiles" ON cultivation_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cultivation profiles" ON cultivation_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for cultivation_plans
CREATE POLICY "Users can view own cultivation plans" ON cultivation_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cultivation plans" ON cultivation_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cultivation plans" ON cultivation_plans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cultivation plans" ON cultivation_plans
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for cultivation_calendar_items
CREATE POLICY "Users can view own calendar items" ON cultivation_calendar_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calendar items" ON cultivation_calendar_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar items" ON cultivation_calendar_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own calendar items" ON cultivation_calendar_items
  FOR DELETE USING (auth.uid() = user_id);

-- Functions for automatic updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_cultivation_profiles_updated_at 
  BEFORE UPDATE ON cultivation_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cultivation_plans_updated_at 
  BEFORE UPDATE ON cultivation_plans 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cultivation_calendar_items_updated_at 
  BEFORE UPDATE ON cultivation_calendar_items 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
