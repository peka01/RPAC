-- ================================================================
-- FIX STORAGE BUCKET POLICIES FOR public-assets
-- ================================================================
-- Created: 2024-10-22
-- Purpose: Allow authenticated users to upload images to community-banners folder
-- ================================================================

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public Access for public-assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to public-assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their uploads" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their uploads" ON storage.objects;

-- Policy 1: Allow public READ access to public-assets bucket
CREATE POLICY "Public Access for public-assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'public-assets');

-- Policy 2: Allow authenticated users to INSERT (upload) to public-assets
CREATE POLICY "Authenticated users can upload to public-assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'public-assets');

-- Policy 3: Allow authenticated users to UPDATE their own uploads
CREATE POLICY "Authenticated users can update their uploads"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'public-assets' AND auth.uid() = owner);

-- Policy 4: Allow authenticated users to DELETE their own uploads
CREATE POLICY "Authenticated users can delete their uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'public-assets' AND auth.uid() = owner);

-- Verify bucket exists and is public
-- Note: This won't create the bucket, just verify settings
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'public-assets') THEN
    RAISE NOTICE 'WARNING: Bucket "public-assets" does not exist. Please create it via Supabase Dashboard.';
  ELSE
    RAISE NOTICE 'SUCCESS: Bucket "public-assets" exists.';
    
    -- Check if bucket is public
    IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'public-assets' AND public = true) THEN
      RAISE NOTICE 'SUCCESS: Bucket is configured as public.';
    ELSE
      RAISE NOTICE 'WARNING: Bucket exists but is NOT public. Please make it public in Supabase Dashboard.';
    END IF;
  END IF;
END $$;

