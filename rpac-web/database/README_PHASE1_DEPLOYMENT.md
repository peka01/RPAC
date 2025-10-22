# 📋 Homepage Phase 1 Features - Deployment Guide

## 🎯 Overview
This guide covers the deployment of Phase 1 homepage features:
- ✅ Contact Information (email, phone, address, social media)
- ✅ Logo Upload (separate from banner)
- ✅ Photo Gallery (multiple images with captions)
- ✅ Events Calendar (with date/time, location, recurring events)
- ✅ Preview Button (view before publishing)
- 🔄 Section Ordering (drag & drop - coming soon)

## 📦 What's Included

### Database Changes
- **New columns** in `community_homespaces` table
- **New tables**: `community_gallery_images`, `community_events`
- **RLS policies** for new tables
- **Storage setup** for logos and gallery images

### Frontend Changes
- **3 new components**:
  - `homepage-contact-section.tsx`
  - `homepage-gallery-section.tsx`
  - `homepage-events-section.tsx`
- **Updated**: `homespace-editor-live.tsx` (integrated all features)
- **New translations** in `sv.json`

---

## 🚀 Deployment Steps

### Step 1: Run Database Migration

```bash
# Navigate to database folder
cd rpac-web/database

# Run the Phase 1 migration
psql -h YOUR_SUPABASE_HOST -U postgres -d postgres -f add-homepage-phase1-features.sql
```

**What this does:**
- Adds new columns to `community_homespaces`
- Creates `community_gallery_images` table
- Creates `community_events` table
- Sets up RLS policies
- Creates indexes for performance

### Step 2: Create Storage Buckets

**IMPORTANT**: This must be done manually in Supabase Dashboard.

1. Go to **Supabase Dashboard** → **Storage**
2. Click **"New bucket"**
3. Create bucket named: `public-assets` (if not exists)
4. Set to **Public bucket**: ✅ YES
5. Inside `public-assets`, create folders:
   - `community-logos/`
   - `community-gallery/`

### Step 3: Configure Storage Policies

In **Supabase Dashboard** → **Storage** → **public-assets** → **Policies**:

#### Policy 1: Public Read Access
```sql
-- Name: Public read access
-- Operation: SELECT
-- Policy:
CREATE POLICY "Public can view all files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'public-assets');
```

#### Policy 2: Authenticated Upload
```sql
-- Name: Authenticated users can upload
-- Operation: INSERT
-- Policy:
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'public-assets');
```

#### Policy 3: Authenticated Update
```sql
-- Name: Authenticated users can update their uploads
-- Operation: UPDATE
-- Policy:
CREATE POLICY "Authenticated users can update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'public-assets');
```

#### Policy 4: Authenticated Delete
```sql
-- Name: Authenticated users can delete their uploads
-- Operation: DELETE
-- Policy:
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'public-assets');
```

### Step 4: Deploy Frontend

```bash
# Install any new dependencies (if needed)
npm install

# Build and deploy
npm run build
npm run deploy
```

---

## ✅ Verification Checklist

After deployment, verify:

### Database
- [ ] `community_homespaces` has new columns: `logo_url`, `contact_email`, `contact_phone`, etc.
- [ ] `community_gallery_images` table exists
- [ ] `community_events` table exists
- [ ] RLS policies are active on new tables

### Storage
- [ ] `public-assets` bucket exists and is public
- [ ] `community-logos/` folder exists
- [ ] `community-gallery/` folder exists
- [ ] Upload test: Try uploading a logo
- [ ] Upload test: Try uploading a gallery image

### Frontend
- [ ] Preview button appears in editor toolbar
- [ ] Logo upload button appears in toolbar
- [ ] Can upload and see logo
- [ ] Contact section appears on homepage
- [ ] Gallery section appears (when images added)
- [ ] Events section appears (when events added)
- [ ] Can add/edit contact information
- [ ] Can add/remove gallery images
- [ ] Can create/edit/delete events

---

## 🧪 Testing Steps

### 1. Logo Upload
1. Open homepage editor
2. Click upload icon in top toolbar
3. Select an image file
4. Logo should appear in toolbar
5. Check that it saves to database

### 2. Contact Information
1. Scroll to "Kontakta oss" section
2. Hover and click edit icon
3. Fill in email, phone, address
4. Add social media links
5. Click "Klar"
6. Verify information displays correctly

### 3. Photo Gallery
1. Scroll to "Bildgalleri" section (or it will appear after first image)
2. Click edit icon
3. Click "Lägg till bilder"
4. Select multiple images
5. Wait for upload
6. Add captions by clicking on text area
7. Drag images to reorder
8. Click "Klar"

### 4. Events Calendar
1. Scroll to "Event & Möten" section
2. Click edit icon
3. Click "Lägg till event"
4. Fill in event details:
   - Title (required)
   - Description
   - Date & time (required)
   - Location
   - Recurring checkbox
   - Show on homepage checkbox
5. Click "Spara event"
6. Verify event appears in list
7. Test edit and delete functions

### 5. Preview Feature
1. Click "Förhandsgranska hemsida" button in toolbar
2. New tab should open showing homepage as visitor would see it
3. Verify all sections display correctly
4. Close preview tab

---

## 🐛 Troubleshooting

### Issue: "Some new columns not available yet" in console
**Solution**: Database migration not run. Run Step 1 again.

### Issue: Logo upload fails with "Bucket not found"
**Solution**: Create `public-assets` bucket in Supabase Dashboard (Step 2).

### Issue: Logo upload fails with "new row violates row-level security policy"
**Solution**: Configure storage policies (Step 3).

### Issue: Gallery images not loading
**Solution**: 
1. Check browser console for errors
2. Verify `community_gallery_images` table exists
3. Check RLS policies allow SELECT for public

### Issue: Events not appearing
**Solution**:
1. Check `community_events` table exists
2. Verify `show_on_homepage` is TRUE
3. Check event date is in the future
4. Verify RLS policies allow SELECT

### Issue: Contact section not visible
**Solution**: Check `show_contact_section` is TRUE in database.

---

## 🔄 Rollback Plan

If you need to rollback:

### Remove new columns (CAREFUL!)
```sql
-- Only if absolutely necessary
ALTER TABLE community_homespaces
DROP COLUMN IF EXISTS logo_url,
DROP COLUMN IF EXISTS contact_email,
DROP COLUMN IF EXISTS contact_phone,
DROP COLUMN IF EXISTS contact_address,
DROP COLUMN IF EXISTS social_facebook,
DROP COLUMN IF EXISTS social_instagram,
DROP COLUMN IF EXISTS show_contact_section,
DROP COLUMN IF EXISTS section_order;

-- Drop new tables
DROP TABLE IF EXISTS community_gallery_images CASCADE;
DROP TABLE IF EXISTS community_events CASCADE;
```

### Revert frontend
```bash
git revert <commit-hash>
npm run build
npm run deploy
```

---

## 📊 Database Schema Reference

### community_homespaces (New Columns)
```sql
logo_url TEXT                    -- Community logo URL
contact_email VARCHAR(255)       -- Public contact email
contact_phone VARCHAR(50)        -- Public phone number
contact_address TEXT             -- Meeting location/address
social_facebook VARCHAR(255)     -- Facebook URL
social_instagram VARCHAR(255)    -- Instagram URL
show_contact_section BOOLEAN     -- Show/hide contact section
section_order JSONB              -- Array defining section display order
```

### community_gallery_images (New Table)
```sql
id UUID PRIMARY KEY
community_id UUID (FK to local_communities)
image_url TEXT
caption TEXT
display_order INTEGER
uploaded_by UUID (FK to auth.users)
created_at TIMESTAMP
```

### community_events (New Table)
```sql
id UUID PRIMARY KEY
community_id UUID (FK to local_communities)
title VARCHAR(255)
description TEXT
event_date TIMESTAMP
event_end_date TIMESTAMP
location TEXT
is_recurring BOOLEAN
recurrence_pattern VARCHAR(50)
show_on_homepage BOOLEAN
created_by UUID (FK to auth.users)
created_at TIMESTAMP
updated_at TIMESTAMP
```

---

## 📞 Support

If you encounter issues:
1. Check console errors in browser
2. Check Supabase logs
3. Verify all deployment steps completed
4. Review troubleshooting section above
5. Check that storage buckets and policies are correctly configured

---

## 🎉 Success Criteria

Deployment is successful when:
- ✅ All verification checklist items pass
- ✅ All testing steps complete successfully
- ✅ No console errors in browser
- ✅ No errors in Supabase logs
- ✅ Images upload successfully
- ✅ Events can be created and displayed
- ✅ Contact information saves and displays
- ✅ Preview button works

---

**Created**: 2024-10-22
**Version**: 1.0
**Status**: Ready for deployment

