-- Fix help_requests UPDATE policy to allow users to update their own requests
-- This fixes the error when trying to update a help request

-- Drop existing UPDATE policy
DROP POLICY IF EXISTS "Users can update own help requests" ON help_requests;

-- Create a simple, non-recursive UPDATE policy
-- Users can update their own help requests without any joins to user_profiles
CREATE POLICY "Users can update own help requests" ON help_requests
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Verify the policy was created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'help_requests'
  AND policyname = 'Users can update own help requests';
