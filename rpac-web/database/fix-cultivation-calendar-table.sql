-- Fix cultivation_calendar table structure
-- This migration drops and recreates the table with the correct columns
-- WARNING: This will delete any existing data in cultivation_calendar or cultivation_calendar_items

-- Drop old tables if they exist
DROP TABLE IF EXISTS cultivation_calendar_items CASCADE;
DROP TABLE IF EXISTS cultivation_calendar CASCADE;

-- Create the correct cultivation_calendar table
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

-- Create indexes for better performance
CREATE INDEX idx_cultivation_calendar_user_id ON cultivation_calendar(user_id);
CREATE INDEX idx_cultivation_calendar_month ON cultivation_calendar(month);
CREATE INDEX idx_cultivation_calendar_activity ON cultivation_calendar(activity);
CREATE INDEX idx_cultivation_calendar_completed ON cultivation_calendar(is_completed);

-- Enable Row Level Security
ALTER TABLE cultivation_calendar ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only access their own calendar
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

-- Trigger for automatic updated_at
CREATE TRIGGER update_cultivation_calendar_updated_at 
  BEFORE UPDATE ON cultivation_calendar 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comment on table
COMMENT ON TABLE cultivation_calendar IS 'Stores cultivation calendar entries for monthly gardening tasks';
COMMENT ON COLUMN cultivation_calendar.month IS 'Month name in Swedish or ISO format';
COMMENT ON COLUMN cultivation_calendar.activity IS 'Type of activity: sowing, planting, harvesting, or maintenance';

