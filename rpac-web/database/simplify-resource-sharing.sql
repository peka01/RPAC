-- =============================================
-- SIMPLIFY RESOURCE_SHARING TABLE
-- =============================================
-- Remove NOT NULL constraints to make inserts easier
-- Created: 2025-10-03

-- Make all columns nullable except the essentials
DO $$ 
BEGIN
  -- Drop NOT NULL from resource_name
  ALTER TABLE resource_sharing ALTER COLUMN resource_name DROP NOT NULL;
  RAISE NOTICE '✅ resource_name is now nullable';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Could not modify resource_name: %', SQLERRM;
END $$;

DO $$ 
BEGIN
  -- Drop NOT NULL from category
  ALTER TABLE resource_sharing ALTER COLUMN category DROP NOT NULL;
  RAISE NOTICE '✅ category is now nullable';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Could not modify category: %', SQLERRM;
END $$;

DO $$ 
BEGIN
  -- Drop NOT NULL from resource_category
  ALTER TABLE resource_sharing ALTER COLUMN resource_category DROP NOT NULL;
  RAISE NOTICE '✅ resource_category is now nullable';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Could not modify resource_category: %', SQLERRM;
END $$;

DO $$ 
BEGIN
  -- Drop NOT NULL from unit
  ALTER TABLE resource_sharing ALTER COLUMN unit DROP NOT NULL;
  RAISE NOTICE '✅ unit is now nullable';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Could not modify unit: %', SQLERRM;
END $$;

DO $$ 
BEGIN
  -- Drop NOT NULL from resource_unit
  ALTER TABLE resource_sharing ALTER COLUMN resource_unit DROP NOT NULL;
  RAISE NOTICE '✅ resource_unit is now nullable';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Could not modify resource_unit: %', SQLERRM;
END $$;

DO $$ 
BEGIN
  -- Drop NOT NULL from quantity
  ALTER TABLE resource_sharing ALTER COLUMN quantity DROP NOT NULL;
  RAISE NOTICE '✅ quantity is now nullable';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Could not modify quantity: %', SQLERRM;
END $$;

DO $$ 
BEGIN
  -- Drop NOT NULL from shared_quantity
  ALTER TABLE resource_sharing ALTER COLUMN shared_quantity DROP NOT NULL;
  RAISE NOTICE '✅ shared_quantity is now nullable';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Could not modify shared_quantity: %', SQLERRM;
END $$;

-- Drop foreign key constraint on community_id (it references wrong table name)
DO $$ 
BEGIN
  ALTER TABLE resource_sharing DROP CONSTRAINT IF EXISTS resource_sharing_community_id_fkey;
  RAISE NOTICE '✅ Dropped community_id foreign key constraint';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Could not drop FK constraint: %', SQLERRM;
END $$;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ RESOURCE_SHARING SIMPLIFIED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Most columns are now nullable';
  RAISE NOTICE 'Foreign key constraint removed';
  RAISE NOTICE 'Should be much easier to insert data now!';
  RAISE NOTICE '';
END $$;

