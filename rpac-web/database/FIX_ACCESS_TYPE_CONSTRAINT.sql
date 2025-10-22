-- =============================================
-- FIX: Replace English access_type constraint with Swedish values
-- =============================================
-- Date: 2025-10-22
-- Issue: Old constraint expects 'open'/'closed' but code uses 'öppet'/'stängt'

-- Step 1: Drop the old English constraint
DO $$ 
BEGIN
  -- Drop old constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'access_type_check' 
    AND table_name = 'local_communities'
  ) THEN
    ALTER TABLE local_communities DROP CONSTRAINT access_type_check;
    RAISE NOTICE '✅ Dropped old English access_type_check constraint';
  ELSE
    RAISE NOTICE '⏭️  Old access_type_check constraint does not exist';
  END IF;
END $$;

-- Step 2: Drop the duplicate Swedish constraint if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'local_communities_access_type_check' 
    AND table_name = 'local_communities'
  ) THEN
    ALTER TABLE local_communities DROP CONSTRAINT local_communities_access_type_check;
    RAISE NOTICE '✅ Dropped duplicate local_communities_access_type_check constraint';
  END IF;
END $$;

-- Step 3: Update any existing English values to Swedish FIRST
UPDATE local_communities 
SET access_type = CASE 
  WHEN access_type = 'open' THEN 'öppet'
  WHEN access_type = 'closed' THEN 'stängt'
  WHEN access_type IS NULL THEN 'öppet'
  ELSE access_type
END;

-- Verify the update
DO $$
DECLARE
  english_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO english_count
  FROM local_communities
  WHERE access_type IN ('open', 'closed');
  
  IF english_count > 0 THEN
    RAISE EXCEPTION '❌ Still have % rows with English values!', english_count;
  ELSE
    RAISE NOTICE '✅ All rows updated to Swedish values';
  END IF;
END $$;

-- Step 4: Add the correct Swedish constraint
DO $$ 
BEGIN
  ALTER TABLE local_communities 
  ADD CONSTRAINT access_type_check 
  CHECK (access_type IN ('öppet', 'stängt'));
  
  RAISE NOTICE '✅ Added new Swedish access_type_check constraint (öppet/stängt)';
END $$;

-- Success message
DO $$
DECLARE
  constraint_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO constraint_count
  FROM information_schema.table_constraints 
  WHERE table_name = 'local_communities' 
  AND constraint_name LIKE '%access_type%';
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ Access type constraint fix complete!';
  RAISE NOTICE '';
  RAISE NOTICE 'Constraint status:';
  RAISE NOTICE '  - Old English constraint (open/closed): REMOVED';
  RAISE NOTICE '  - New Swedish constraint (öppet/stängt): ACTIVE';
  RAISE NOTICE '  - Total access_type constraints: %', constraint_count;
  RAISE NOTICE '';
  RAISE NOTICE '💡 You can now update communities with öppet/stängt values!';
END $$;

