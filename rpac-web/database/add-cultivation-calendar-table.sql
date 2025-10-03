-- Add cultivation_calendar table for monthly tasks
-- IDEMPOTENT: Safe to run multiple times

-- Drop existing table if needed (BE CAREFUL - this deletes data!)
-- Uncomment only if you want to recreate the table
-- DROP TABLE IF EXISTS cultivation_calendar CASCADE;

CREATE TABLE IF NOT EXISTS cultivation_calendar (
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
CREATE INDEX IF NOT EXISTS idx_cultivation_calendar_user_id ON cultivation_calendar(user_id);
CREATE INDEX IF NOT EXISTS idx_cultivation_calendar_month ON cultivation_calendar(month);
CREATE INDEX IF NOT EXISTS idx_cultivation_calendar_activity ON cultivation_calendar(activity);
CREATE INDEX IF NOT EXISTS idx_cultivation_calendar_completed ON cultivation_calendar(is_completed);

-- Enable Row Level Security
ALTER TABLE cultivation_calendar ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view own calendar entries" ON cultivation_calendar;
DROP POLICY IF EXISTS "Users can insert own calendar entries" ON cultivation_calendar;
DROP POLICY IF EXISTS "Users can update own calendar entries" ON cultivation_calendar;
DROP POLICY IF EXISTS "Users can delete own calendar entries" ON cultivation_calendar;

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

-- Drop existing trigger if it exists (for idempotency)
DROP TRIGGER IF EXISTS update_cultivation_calendar_updated_at ON cultivation_calendar;

-- Trigger for automatic updated_at
CREATE TRIGGER update_cultivation_calendar_updated_at 
  BEFORE UPDATE ON cultivation_calendar 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comment on table
COMMENT ON TABLE cultivation_calendar IS 'Stores cultivation calendar entries for monthly gardening tasks';
COMMENT ON COLUMN cultivation_calendar.activity IS 'Type of activity: sowing, planting, harvesting, or maintenance';
COMMENT ON COLUMN cultivation_calendar.month IS 'Month name in Swedish or ISO format';

