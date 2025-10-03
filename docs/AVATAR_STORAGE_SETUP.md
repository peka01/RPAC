# Avatar Storage Setup Guide

**Issue**: Avatar uploads fail with "new row violates row-level security policy"  
**Solution**: Configure RLS policies for the avatars storage bucket

## Quick Fix (5 minutes)

### Option 1: Via Supabase Dashboard (Recommended)

1. **Go to Storage**
   - Open Supabase Dashboard
   - Navigate to Storage → Buckets
   - Click on the `avatars` bucket

2. **Add Policies**
   Click on "Policies" tab, then add these 4 policies:

   #### Policy 1: Upload (INSERT)
   ```
   Name: Users can upload own avatar
   Allowed operation: INSERT
   Target roles: authenticated
   Policy definition:
   (string_to_array(name, '/'))[1] = auth.uid()::text
   ```

   #### Policy 2: View (SELECT)
   ```
   Name: Public avatars  
   Allowed operation: SELECT
   Target roles: public
   Policy definition:
   true
   ```
   (Leave empty for public access or use `true`)

   #### Policy 3: Update (UPDATE)
   ```
   Name: Users can update own avatar
   Allowed operation: UPDATE
   Target roles: authenticated
   Policy definition:
   (string_to_array(name, '/'))[1] = auth.uid()::text
   ```

   #### Policy 4: Delete (DELETE)
   ```
   Name: Users can delete own avatar
   Allowed operation: DELETE
   Target roles: authenticated
   Policy definition:
   (string_to_array(name, '/'))[1] = auth.uid()::text
   ```

3. **Test**
   - Go to Settings → Profile in your app
   - Upload an avatar
   - Should work without errors!

### Option 2: Via SQL Editor

Run this in Supabase Dashboard → SQL Editor:

```sql
-- Run: rpac-web/database/setup-avatar-storage-policies.sql
```

Or copy/paste:

```sql
-- Allow authenticated users to upload avatars to their own folder
CREATE POLICY "Users can upload own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
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
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

## How It Works

### Folder Structure
```
avatars/
└── {user_id}/
    └── {user_id}-{timestamp}.{ext}
```

Example:
```
avatars/
└── 1def1560-5a92-454c-af4b-f97442c9403e/
    └── 1def1560-5a92-454c-af4b-f97442c9403e-1759492106091.png
```

### Security Rules

**Upload/Update/Delete**: Users can only modify files in their own folder  
- Policy checks: `(storage.foldername(name))[1] = auth.uid()::text`
- This means: The first folder in the path must match the user's ID

**View**: Everyone can view all avatars (public read)
- This allows avatars to be displayed throughout the app
- No authentication required to view

## Verification

After setting up policies:

1. ✅ Upload an avatar → Should succeed
2. ✅ Avatar appears in profile preview
3. ✅ No console errors
4. ✅ Avatar displays for other users

## Troubleshooting

### Still Getting RLS Errors?

**Check policies exist:**
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';
```

**Check user is authenticated:**
```sql
SELECT auth.uid();
-- Should return your user ID, not null
```

**Check bucket exists:**
```sql
SELECT * FROM storage.buckets WHERE id = 'avatars';
```

### Common Issues

**Issue**: "Bucket not found"  
**Fix**: Create the `avatars` bucket in Storage

**Issue**: "RLS policy violation"  
**Fix**: Add the policies above

**Issue**: "File too large"  
**Fix**: Files are limited to 2MB in the app code

**Issue**: "Invalid file type"  
**Fix**: Only images (JPG, PNG, GIF, WebP) are allowed

## Current Behavior

**Without policies configured:**
- ⚠️ Avatar upload fails silently
- ✅ Profile still saves successfully
- ✅ Warning in console (not an error)
- ✅ App continues to work

**With policies configured:**
- ✅ Avatar uploads successfully
- ✅ Profile saves with avatar URL
- ✅ Avatar displays immediately
- ✅ No warnings or errors

## Summary

The app works fine without avatar upload, but to enable it:
1. Add 4 RLS policies to the `avatars` bucket
2. Test by uploading an avatar
3. Done!

**Time required**: 5 minutes  
**Difficulty**: Easy (point and click in Supabase Dashboard)

