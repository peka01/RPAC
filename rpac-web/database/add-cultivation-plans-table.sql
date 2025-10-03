-- Add cultivation_plans table for enhanced cultivation planner
-- This table stores named cultivation plans with full plan data
-- IDEMPOTENT: Safe to run multiple times

CREATE TABLE IF NOT EXISTS cultivation_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster user lookups
CREATE INDEX IF NOT EXISTS idx_cultivation_plans_user_id ON cultivation_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_cultivation_plans_created_at ON cultivation_plans(created_at DESC);

-- Enable Row Level Security
ALTER TABLE cultivation_plans ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view own cultivation plans" ON cultivation_plans;
DROP POLICY IF EXISTS "Users can insert own cultivation plans" ON cultivation_plans;
DROP POLICY IF EXISTS "Users can update own cultivation plans" ON cultivation_plans;
DROP POLICY IF EXISTS "Users can delete own cultivation plans" ON cultivation_plans;

-- RLS Policies - Users can only access their own plans
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

-- Drop existing trigger if it exists (for idempotency)
DROP TRIGGER IF EXISTS update_cultivation_plans_updated_at ON cultivation_plans;

-- Trigger for automatic updated_at
CREATE TRIGGER update_cultivation_plans_updated_at 
  BEFORE UPDATE ON cultivation_plans 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comment on table
COMMENT ON TABLE cultivation_plans IS 'Stores user cultivation plans with full plan data including crops, nutrition analysis, and recommendations';
COMMENT ON COLUMN cultivation_plans.plan_data IS 'JSONB containing complete plan data: name, profile, gardenPlan, selectedCrops, cropVolumes, realTimeStats, etc.';

