-- ============================================
-- COMPLETE RPAC CULTIVATION MIGRATION
-- ============================================
-- This file combines all required migrations in the correct order
-- Run this ONCE in Supabase SQL Editor
-- WARNING: Drops existing cultivation_calendar and cultivation_reminders tables!

-- ============================================
-- STEP 1: Create cultivation_plans table
-- ============================================

CREATE TABLE IF NOT EXISTS cultivation_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cultivation_plans_user_id ON cultivation_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_cultivation_plans_created_at ON cultivation_plans(created_at DESC);

ALTER TABLE cultivation_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own cultivation plans" ON cultivation_plans;
DROP POLICY IF EXISTS "Users can insert own cultivation plans" ON cultivation_plans;
DROP POLICY IF EXISTS "Users can update own cultivation plans" ON cultivation_plans;
DROP POLICY IF EXISTS "Users can delete own cultivation plans" ON cultivation_plans;

CREATE POLICY "Users can view own cultivation plans" 
  ON cultivation_plans FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cultivation plans" 
  ON cultivation_plans FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cultivation plans" 
  ON cultivation_plans FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cultivation plans" 
  ON cultivation_plans FOR DELETE 
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_cultivation_plans_updated_at ON cultivation_plans;

CREATE TRIGGER update_cultivation_plans_updated_at 
  BEFORE UPDATE ON cultivation_plans 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 2: Fix cultivation_calendar table
-- ============================================

DROP TABLE IF EXISTS cultivation_calendar_items CASCADE;
DROP TABLE IF EXISTS cultivation_calendar CASCADE;

CREATE TABLE cultivation_calendar (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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

CREATE INDEX idx_cultivation_calendar_user_id ON cultivation_calendar(user_id);
CREATE INDEX idx_cultivation_calendar_month ON cultivation_calendar(month);
CREATE INDEX idx_cultivation_calendar_activity ON cultivation_calendar(activity);
CREATE INDEX idx_cultivation_calendar_completed ON cultivation_calendar(is_completed);

ALTER TABLE cultivation_calendar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own calendar entries" 
  ON cultivation_calendar FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calendar entries" 
  ON cultivation_calendar FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar entries" 
  ON cultivation_calendar FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own calendar entries" 
  ON cultivation_calendar FOR DELETE 
  USING (auth.uid() = user_id);

CREATE TRIGGER update_cultivation_calendar_updated_at 
  BEFORE UPDATE ON cultivation_calendar 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 3: Fix cultivation_reminders table
-- ============================================

DROP TABLE IF EXISTS cultivation_reminders CASCADE;

CREATE TABLE cultivation_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reminder_type VARCHAR(50) NOT NULL CHECK (reminder_type IN ('sowing', 'planting', 'watering', 'harvesting', 'maintenance', 'fertilizing', 'pruning')),
  crop_name VARCHAR(100) NOT NULL,
  reminder_date DATE NOT NULL,
  reminder_time TIME,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern VARCHAR(50),
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_cultivation_reminders_user_id ON cultivation_reminders(user_id);
CREATE INDEX idx_cultivation_reminders_date ON cultivation_reminders(reminder_date);
CREATE INDEX idx_cultivation_reminders_type ON cultivation_reminders(reminder_type);
CREATE INDEX idx_cultivation_reminders_completed ON cultivation_reminders(is_completed);
CREATE INDEX idx_cultivation_reminders_crop ON cultivation_reminders(crop_name);

ALTER TABLE cultivation_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reminders" 
  ON cultivation_reminders FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reminders" 
  ON cultivation_reminders FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders" 
  ON cultivation_reminders FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminders" 
  ON cultivation_reminders FOR DELETE 
  USING (auth.uid() = user_id);

CREATE TRIGGER update_cultivation_reminders_updated_at 
  BEFORE UPDATE ON cultivation_reminders 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DONE! All tables created successfully
-- ============================================

-- Verify tables exist
SELECT 'cultivation_plans' as table_name, count(*) as row_count FROM cultivation_plans
UNION ALL
SELECT 'cultivation_calendar' as table_name, count(*) as row_count FROM cultivation_calendar
UNION ALL
SELECT 'cultivation_reminders' as table_name, count(*) as row_count FROM cultivation_reminders;

