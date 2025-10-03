-- =============================================
-- AVATAR STORAGE BUCKET RLS POLICIES
-- =============================================
-- This migration sets up RLS policies for the avatars storage bucket
-- Created: 2025-10-03
-- Purpose: Allow users to upload and manage their own avatars

-- Note: Storage policies are created via Supabase Storage UI or API
-- This file documents the policies that need to be created

-- =============================================
-- POLICY 1: Allow authenticated users to upload their own avatars
-- =============================================
-- Name: Users can upload own avatar
-- Definition:
-- bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text

-- SQL equivalent (if running via SQL):
-- This is for reference - actual storage policies are set via Supabase Dashboard

-- =============================================
-- POLICY 2: Allow authenticated users to update their own avatars
-- =============================================
-- Name: Users can update own avatar
-- Definition:
-- bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text

-- =============================================
-- POLICY 3: Allow authenticated users to delete their own avatars
-- =============================================
-- Name: Users can delete own avatar
-- Definition:
-- bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text

-- =============================================
-- POLICY 4: Allow anyone to view avatars (public read)
-- =============================================
-- Name: Anyone can view avatars
-- Definition:
-- bucket_id = 'avatars'

-- =============================================
-- MANUAL SETUP INSTRUCTIONS
-- =============================================
-- Since storage policies can't be created via SQL in the same way as table policies,
-- you need to set them up in the Supabase Dashboard:

-- 1. Go to Supabase Dashboard → Storage → avatars bucket
-- 2. Click on "Policies" tab
-- 3. Click "New Policy"

-- FOR INSERT (Upload):
-- Name: Users can upload own avatar
-- Allowed operation: INSERT
-- Policy definition:
--   bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text

-- FOR SELECT (View):
-- Name: Public avatars
-- Allowed operation: SELECT  
-- Policy definition:
--   bucket_id = 'avatars'

-- FOR UPDATE (Update):
-- Name: Users can update own avatar
-- Allowed operation: UPDATE
-- Policy definition:
--   bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text

-- FOR DELETE (Delete):
-- Name: Users can delete own avatar
-- Allowed operation: DELETE
-- Policy definition:
--   bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text

-- =============================================
-- ALTERNATIVE: Create policies via SQL (if supported)
-- =============================================
-- Note: This may not work depending on Supabase version
-- Try this if the UI method doesn't work:

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

-- =============================================
-- VERIFICATION
-- =============================================
-- After setting up policies, verify they work:
-- 1. Try uploading an avatar in the app
-- 2. Check if the file appears in Storage → avatars → {user_id}/
-- 3. Check if the avatar displays in the profile preview
-- 4. Try uploading a different avatar (should replace the old one)

-- =============================================
-- TROUBLESHOOTING
-- =============================================
-- If uploads still fail:
-- 1. Check that the bucket 'avatars' exists
-- 2. Verify RLS is enabled on storage.objects table
-- 3. Check that policies are created and enabled
-- 4. Verify user is authenticated (auth.uid() returns a value)
-- 5. Check browser console for specific error messages

-- To check existing policies:
SELECT * FROM pg_policies WHERE tablename = 'objects';

-- To check if a user can upload (test query):
SELECT 
  auth.uid() as current_user,
  (string_to_array('1def1560-5a92-454c-af4b-f97442c9403e/test.png', '/'))[1] as folder,
  auth.uid()::text = (string_to_array('1def1560-5a92-454c-af4b-f97442c9403e/test.png', '/'))[1] as can_upload;

