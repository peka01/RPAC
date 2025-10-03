-- =============================================
-- UPDATE AVATAR STORAGE BUCKET RLS POLICIES
-- =============================================
-- This script updates existing RLS policies for the avatars storage bucket
-- Run this if you need to fix or update existing policies
-- Created: 2025-10-03

-- Drop existing policies (if they exist)
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Public avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;

-- Allow authenticated users to upload avatars to their own folder
CREATE POLICY "Users can upload own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- Allow anyone to view avatars (public read)
CREATE POLICY "Public avatars"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'avatars'
);

-- Allow users to update their own avatars
CREATE POLICY "Users can update own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (string_to_array(name, '/'))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars' AND
  (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- Verify policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as operation,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%avatar%'
ORDER BY policyname;

