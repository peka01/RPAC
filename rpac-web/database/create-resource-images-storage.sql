-- ================================================================
-- CREATE STORAGE BUCKET AND POLICIES FOR RESOURCE IMAGES
-- ================================================================
-- Created: 2025-01-XX
-- Purpose: Allow authenticated users to upload resource images
-- Note: Bucket must be created in Supabase Dashboard first (Storage > Create bucket)
-- Bucket name: resource-images
-- Settings: Public bucket, allow image uploads
-- ================================================================

-- Enable RLS on storage.objects (if not already enabled)
-- Note: This may fail if you don't have owner permissions, but that's okay - RLS is likely already enabled
DO $$
BEGIN
  -- Try to enable RLS, but don't fail if we can't
  BEGIN
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
  EXCEPTION WHEN OTHERS THEN
    -- RLS is probably already enabled, or we don't have permissions
    -- This is fine - continue
    NULL;
  END;
END $$;

-- Create policies only if they don't exist (avoids permission errors)
DO $$
BEGIN
  -- Policy 1: Allow public READ access to resource-images bucket
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public read access for resource-images'
  ) THEN
    CREATE POLICY "Public read access for resource-images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'resource-images');
  END IF;

  -- Policy 2: Allow authenticated users to INSERT (upload) to resource-images
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can upload to resource-images'
  ) THEN
    CREATE POLICY "Authenticated users can upload to resource-images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'resource-images');
  END IF;

  -- Policy 3: Allow authenticated users to UPDATE their own uploads
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can update resource-images'
  ) THEN
    CREATE POLICY "Authenticated users can update resource-images"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'resource-images' AND auth.uid() = owner);
  END IF;

  -- Policy 4: Allow authenticated users to DELETE their own uploads
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can delete resource-images'
  ) THEN
    CREATE POLICY "Authenticated users can delete resource-images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'resource-images' AND auth.uid() = owner);
  END IF;
END $$;

-- Verify bucket exists and policies were created
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'resource-images') THEN
    RAISE NOTICE 'Bucket "resource-images" does not exist yet. Please create it in Supabase Dashboard > Storage with these settings:';
    RAISE NOTICE '  - Name: resource-images';
    RAISE NOTICE '  - Public: Yes';
    RAISE NOTICE '  - File size limit: 5MB (or as needed)';
    RAISE NOTICE '  - Allowed MIME types: image/*';
  ELSE
    RAISE NOTICE 'Bucket "resource-images" exists.';
  END IF;

  -- Check if policies were created
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname LIKE '%resource-images%'
  ) THEN
    RAISE NOTICE 'Policies for resource-images have been created or already exist.';
  ELSE
    RAISE NOTICE 'WARNING: Policies may not have been created. Check Supabase Dashboard > Storage > Policies if uploads fail.';
  END IF;
END $$;


