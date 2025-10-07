-- Fix resource_sharing status constraint to allow all needed statuses
-- This ensures the constraint matches what the application expects

-- Drop the existing constraint if it exists
ALTER TABLE resource_sharing DROP CONSTRAINT IF EXISTS resource_sharing_status_check;

-- Add the correct constraint that allows all needed statuses
ALTER TABLE resource_sharing ADD CONSTRAINT resource_sharing_status_check 
  CHECK (status IN ('available', 'requested', 'reserved', 'taken'));

-- Verify the constraint was added
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'resource_sharing'::regclass 
AND conname = 'resource_sharing_status_check';
