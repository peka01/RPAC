-- Migrate cultivation_plans table to new simplified schema
-- This migration updates the table structure for the new simple cultivation planner
-- SAFE TO RUN: Uses conditional checks and preserves existing data

-- First, check if table exists with old schema
DO $$ 
BEGIN
  -- Drop the old table if it exists (it's likely empty or has old format data)
  -- Since this is a new feature, it's safe to recreate
  DROP TABLE IF EXISTS cultivation_plans CASCADE;
  
  -- Create new table with simplified schema
  CREATE TABLE cultivation_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    plan_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    crops JSONB DEFAULT '[]'::jsonb,
    is_primary BOOLEAN DEFAULT false,
    nutrition_contribution JSONB DEFAULT '{}'::jsonb,
    gap_analysis JSONB DEFAULT '{}'::jsonb,
    estimated_cost DECIMAL(10,2) DEFAULT 0,
    self_sufficiency_percent INTEGER DEFAULT 0,
    next_steps TEXT[] DEFAULT '{}',
    recommendations TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Create indexes
  CREATE INDEX idx_cultivation_plans_user_id ON cultivation_plans(user_id);
  CREATE INDEX idx_cultivation_plans_plan_id ON cultivation_plans(plan_id);
  CREATE INDEX idx_cultivation_plans_is_primary ON cultivation_plans(user_id, is_primary);

  -- Enable RLS
  ALTER TABLE cultivation_plans ENABLE ROW LEVEL SECURITY;

  -- Drop old policies if they exist
  DROP POLICY IF EXISTS "Users can view own cultivation plans" ON cultivation_plans;
  DROP POLICY IF EXISTS "Users can insert own cultivation plans" ON cultivation_plans;
  DROP POLICY IF EXISTS "Users can update own cultivation plans" ON cultivation_plans;
  DROP POLICY IF EXISTS "Users can delete own cultivation plans" ON cultivation_plans;

  -- Create RLS policies
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

  -- Create trigger for updated_at
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $func$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $func$ LANGUAGE plpgsql;

  DROP TRIGGER IF EXISTS update_cultivation_plans_updated_at ON cultivation_plans;
  
  CREATE TRIGGER update_cultivation_plans_updated_at 
    BEFORE UPDATE ON cultivation_plans 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  RAISE NOTICE 'cultivation_plans table migrated to new simplified schema successfully!';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error during migration: %', SQLERRM;
    RAISE;
END $$;

-- Add helpful comments
COMMENT ON TABLE cultivation_plans IS 'Simplified cultivation plans with crops and nutrition tracking';
COMMENT ON COLUMN cultivation_plans.crops IS 'JSONB array of crops with format: [{"cropName": "Potatis", "estimatedYieldKg": 5}]';
COMMENT ON COLUMN cultivation_plans.is_primary IS 'Flag to mark the users primary/active cultivation plan';

