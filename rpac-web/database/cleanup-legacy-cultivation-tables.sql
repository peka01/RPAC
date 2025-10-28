-- Cleanup script for legacy cultivation tables
-- This script safely removes unused tables while preserving the main cultivation_plans table

-- First, verify cultivation_plans exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'cultivation_plans'
  ) THEN
    -- Create cultivation_plans if it doesn't exist
    CREATE TABLE cultivation_plans (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      title VARCHAR(100) NOT NULL,
      description TEXT,
      crops JSONB DEFAULT '[]'::jsonb,
      is_primary BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Add indexes
    CREATE INDEX IF NOT EXISTS idx_cultivation_plans_user_id ON cultivation_plans(user_id);
    CREATE INDEX IF NOT EXISTS idx_cultivation_plans_is_primary ON cultivation_plans(is_primary);
  END IF;
END $$;

-- Function to safely drop tables if they exist
DROP FUNCTION IF EXISTS safe_drop_table(text);
CREATE FUNCTION safe_drop_table(target_table text)
RETURNS text AS $$
DECLARE
    result text;
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = current_schema()
        AND table_name = target_table
    ) THEN
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(target_table) || ' CASCADE';
        result := 'Dropped table: ' || target_table;
    ELSE
        result := 'Table not found: ' || target_table;
    END IF;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Drop legacy tables and report results
SELECT safe_drop_table('crisis_cultivation_plans') as drop_result;
SELECT safe_drop_table('cultivation_calendar') as drop_result;

-- Drop any related functions that might reference these tables
DROP FUNCTION IF EXISTS get_user_cultivation_calendar(UUID, VARCHAR);

-- Drop unused indexes
DROP INDEX IF EXISTS idx_crisis_plans_user_id;

-- Drop unused types
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cultivation_activity_type') THEN
        DROP TYPE cultivation_activity_type;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- Type might be in use, safe to ignore
        NULL;
END $$;

-- Update or create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp ON cultivation_plans;
CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON cultivation_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies if they don't exist
DO $$ 
BEGIN
    -- Drop existing policies to avoid conflicts
    DROP POLICY IF EXISTS "Users can view their own cultivation plans" ON cultivation_plans;
    DROP POLICY IF EXISTS "Users can insert their own cultivation plans" ON cultivation_plans;
    DROP POLICY IF EXISTS "Users can update their own cultivation plans" ON cultivation_plans;
    DROP POLICY IF EXISTS "Users can delete their own cultivation plans" ON cultivation_plans;

    -- Create new policies
    CREATE POLICY "Users can view their own cultivation plans" 
        ON cultivation_plans FOR SELECT 
        USING (auth.uid() = user_id);

    CREATE POLICY "Users can insert their own cultivation plans" 
        ON cultivation_plans FOR INSERT 
        WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update their own cultivation plans" 
        ON cultivation_plans FOR UPDATE 
        USING (auth.uid() = user_id);

    CREATE POLICY "Users can delete their own cultivation plans" 
        ON cultivation_plans FOR DELETE 
        USING (auth.uid() = user_id);

    -- Enable RLS
    ALTER TABLE cultivation_plans ENABLE ROW LEVEL SECURITY;
END $$;