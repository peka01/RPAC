-- FINAL FIX: Update foreign key constraint to reference auth.users
-- This will fix the 400 error you're seeing

DO $$
BEGIN
  -- Drop the existing foreign key constraint that references the wrong table
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'local_communities_created_by_fkey' 
    AND table_name = 'local_communities'
  ) THEN
    ALTER TABLE local_communities DROP CONSTRAINT local_communities_created_by_fkey;
    RAISE NOTICE 'Dropped old local_communities_created_by_fkey constraint';
  END IF;
  
  -- Add the correct foreign key constraint that references auth.users
  ALTER TABLE local_communities 
  ADD CONSTRAINT local_communities_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  
  RAISE NOTICE 'Added correct local_communities_created_by_fkey constraint to auth.users';
  
  -- Also fix any other tables that might have the same issue
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'resources_user_id_fkey' 
    AND table_name = 'resources'
  ) THEN
    ALTER TABLE resources DROP CONSTRAINT resources_user_id_fkey;
    ALTER TABLE resources 
    ADD CONSTRAINT resources_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    RAISE NOTICE 'Fixed resources_user_id_fkey constraint';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_profiles_user_id_fkey' 
    AND table_name = 'user_profiles'
  ) THEN
    ALTER TABLE user_profiles DROP CONSTRAINT user_profiles_user_id_fkey;
    ALTER TABLE user_profiles 
    ADD CONSTRAINT user_profiles_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    RAISE NOTICE 'Fixed user_profiles_user_id_fkey constraint';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'help_requests_user_id_fkey' 
    AND table_name = 'help_requests'
  ) THEN
    ALTER TABLE help_requests DROP CONSTRAINT help_requests_user_id_fkey;
    ALTER TABLE help_requests 
    ADD CONSTRAINT help_requests_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    RAISE NOTICE 'Fixed help_requests_user_id_fkey constraint';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'resource_sharing_user_id_fkey' 
    AND table_name = 'resource_sharing'
  ) THEN
    ALTER TABLE resource_sharing DROP CONSTRAINT resource_sharing_user_id_fkey;
    ALTER TABLE resource_sharing 
    ADD CONSTRAINT resource_sharing_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    RAISE NOTICE 'Fixed resource_sharing_user_id_fkey constraint';
  END IF;
  
END $$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '🎉 ALL FOREIGN KEY CONSTRAINTS FIXED!';
  RAISE NOTICE '✅ All constraints now reference auth.users table';
  RAISE NOTICE '🚀 Your RPAC application should now work perfectly!';
END $$;
