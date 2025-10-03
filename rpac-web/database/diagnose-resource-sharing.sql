-- =============================================
-- DIAGNOSE RESOURCE_SHARING TABLE
-- =============================================
-- Shows exactly what columns exist in your table
-- Created: 2025-10-03

-- Show all columns
SELECT 
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'resource_sharing'
ORDER BY ordinal_position;

-- Show all constraints
SELECT
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'resource_sharing'::regclass
ORDER BY conname;

