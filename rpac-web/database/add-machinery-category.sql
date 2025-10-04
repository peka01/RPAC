-- Migration: Add 'machinery' category to resources and community_resources tables
-- Date: 2025-10-04
-- Description: Adds the new 'machinery' category for equipment and fuel resources

-- Step 1: Drop existing check constraint on resources table
ALTER TABLE resources DROP CONSTRAINT IF EXISTS resources_category_check;

-- Step 2: Add new check constraint with 'machinery' category for resources table
ALTER TABLE resources ADD CONSTRAINT resources_category_check 
  CHECK (category IN ('food', 'water', 'medicine', 'energy', 'tools', 'machinery', 'other'));

-- Step 3: Drop existing check constraint on community_resources table
ALTER TABLE community_resources DROP CONSTRAINT IF EXISTS community_resources_category_check;

-- Step 4: Add new check constraint with 'machinery' category for community_resources table
ALTER TABLE community_resources ADD CONSTRAINT community_resources_category_check 
  CHECK (category IN ('food', 'water', 'medicine', 'energy', 'tools', 'machinery', 'other'));

-- Step 5: Update check constraint on shared_resources table if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'shared_resources_resource_category_check' 
    AND table_name = 'shared_resources'
  ) THEN
    ALTER TABLE shared_resources DROP CONSTRAINT shared_resources_resource_category_check;
    ALTER TABLE shared_resources ADD CONSTRAINT shared_resources_resource_category_check 
      CHECK (resource_category IN ('food', 'water', 'medicine', 'energy', 'tools', 'machinery', 'other'));
  END IF;
END $$;

-- Verify the changes
SELECT 
  tc.table_name, 
  tc.constraint_name, 
  cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.constraint_name LIKE '%category%'
ORDER BY tc.table_name;

