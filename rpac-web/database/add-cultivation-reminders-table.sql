-- Add cultivation_reminders table for cultivation reminders
-- IDEMPOTENT: Safe to run multiple times

-- Drop existing table if needed (BE CAREFUL - this deletes data!)
-- Uncomment only if you want to recreate the table
-- DROP TABLE IF EXISTS cultivation_reminders CASCADE;

CREATE TABLE IF NOT EXISTS cultivation_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reminder_type VARCHAR(50) NOT NULL CHECK (reminder_type IN ('sowing', 'planting', 'watering', 'harvesting', 'maintenance', 'fertilizing', 'pruning')),
  crop_name VARCHAR(100) NOT NULL,
  reminder_date DATE NOT NULL,
  reminder_time TIME,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern VARCHAR(50), -- 'daily', 'weekly', 'monthly', 'seasonal', 'yearly'
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cultivation_reminders_user_id ON cultivation_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_cultivation_reminders_date ON cultivation_reminders(reminder_date);
CREATE INDEX IF NOT EXISTS idx_cultivation_reminders_type ON cultivation_reminders(reminder_type);
CREATE INDEX IF NOT EXISTS idx_cultivation_reminders_completed ON cultivation_reminders(is_completed);
CREATE INDEX IF NOT EXISTS idx_cultivation_reminders_crop ON cultivation_reminders(crop_name);

-- Enable Row Level Security
ALTER TABLE cultivation_reminders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view own reminders" ON cultivation_reminders;
DROP POLICY IF EXISTS "Users can insert own reminders" ON cultivation_reminders;
DROP POLICY IF EXISTS "Users can update own reminders" ON cultivation_reminders;
DROP POLICY IF EXISTS "Users can delete own reminders" ON cultivation_reminders;

-- RLS Policies - Users can only access their own reminders
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

-- Drop existing trigger if it exists (for idempotency)
DROP TRIGGER IF EXISTS update_cultivation_reminders_updated_at ON cultivation_reminders;

-- Trigger for automatic updated_at
CREATE TRIGGER update_cultivation_reminders_updated_at 
  BEFORE UPDATE ON cultivation_reminders 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comment on table
COMMENT ON TABLE cultivation_reminders IS 'Stores cultivation reminders for users to track planting, watering, harvesting, and maintenance tasks';
COMMENT ON COLUMN cultivation_reminders.reminder_type IS 'Type of reminder: sowing, planting, watering, harvesting, maintenance, fertilizing, or pruning';
COMMENT ON COLUMN cultivation_reminders.is_recurring IS 'Whether this reminder repeats (true) or is one-time (false)';
COMMENT ON COLUMN cultivation_reminders.recurrence_pattern IS 'How often the reminder repeats: daily, weekly, monthly, seasonal, or yearly';

