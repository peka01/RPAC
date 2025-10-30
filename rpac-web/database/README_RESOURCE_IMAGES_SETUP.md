# Resource Images Storage Setup

## Quick Setup Guide

To enable image uploads for resources, you need to:

### 1. Create the Storage Bucket

1. Go to **Supabase Dashboard** > **Storage**
2. Click **"New bucket"**
3. Configure with these settings:
   - **Name**: `resource-images`
   - **Public bucket**: ✅ **Yes** (check this!)
   - **File size limit**: `5MB` (or your preferred limit)
   - **Allowed MIME types**: `image/*` (or leave empty for all)

### 2. Set Up RLS Policies

Run the SQL migration file in Supabase SQL Editor:

```bash
rpac-web/database/create-resource-images-storage.sql
```

This will create the necessary RLS policies:
- Public read access (anyone can view images)
- Authenticated users can upload
- Authenticated users can update/delete their own uploads

### 3. Verify Setup

After running the SQL, check that:
- ✅ Bucket exists: `resource-images`
- ✅ Bucket is public
- ✅ RLS policies are created (4 policies should exist)

### Common Issues

**Error: "Lagringsutrymme resource-images finns inte"**
- Solution: Create the bucket in Supabase Dashboard (step 1)

**Error: "Behörighet saknas" or "permission denied"**
- Solution: Run the SQL migration file (step 2) to create RLS policies

**Error: Images not accessible**
- Solution: Make sure bucket is set to **Public** in Dashboard settings

### Folder Structure

Images will be stored in:
- `resource-images/community-resources/` - Community resource images
- `resource-images/individual-resources/` - Individual resource images

Folders are created automatically when you upload images, no manual setup needed.

### Testing

After setup, try uploading an image when adding/editing a resource. If you see a clear error message, it will tell you exactly what's missing.

