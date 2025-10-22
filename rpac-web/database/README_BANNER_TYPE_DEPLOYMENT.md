# 🚀 Banner Type Feature - Deployment Instructions

**Created:** 2024-10-22  
**Status:** Ready for deployment  
**Priority:** Required for new homepage editor features

---

## ⚠️ Important: Database Migration Required

The new banner editing features require a database migration to add the `banner_type` column to the `community_homespaces` table.

**If you're seeing this error:**
```
Save error: {}
```

**It means the database migration hasn't been run yet.**

---

## 📋 Deployment Steps

### Step 1: Apply Database Migration

Run this SQL migration in your Supabase SQL Editor:

**File:** `rpac-web/database/add-banner-type-homespace.sql`

```sql
-- Add banner_type column
ALTER TABLE community_homespaces 
ADD COLUMN IF NOT EXISTS banner_type VARCHAR(20) DEFAULT 'gradient' 
CHECK (banner_type IN ('gradient', 'image', 'shield'));

-- Update banner_pattern constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'community_homespaces_banner_pattern_check'
  ) THEN
    ALTER TABLE community_homespaces DROP CONSTRAINT community_homespaces_banner_pattern_check;
  END IF;

  ALTER TABLE community_homespaces 
  ADD CONSTRAINT community_homespaces_banner_pattern_check 
  CHECK (banner_pattern IN ('olive-gradient', 'dark-olive', 'warm-olive', 'olive-mesh', 'olive-waves'));
END $$;

COMMENT ON COLUMN community_homespaces.banner_type IS 'Type of banner: gradient (color patterns), image (custom uploaded), or shield (BeReady logo)';
```

### Step 2: Verify Migration

Check that the column exists:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'community_homespaces' 
AND column_name = 'banner_type';
```

**Expected result:**
```
column_name  | data_type        | column_default
banner_type  | character varying| 'gradient'::character varying
```

### Step 3: Configure Supabase Storage

Ensure the storage bucket is set up correctly:

1. **Go to Supabase Dashboard** → Storage
2. **Check if `public-assets` bucket exists**
   - If not, create it with these settings:
     - Name: `public-assets`
     - Public: ✅ Yes
     - File size limit: 5MB
     - Allowed MIME types: `image/*`

3. **Create folder:** `community-banners/`
4. **Set permissions:**
   - Public read: ✅ Enabled
   - Authenticated write: ✅ Enabled

### Step 4: Test the Feature

1. Log in as a community admin
2. Go to your community's homepage editor
3. Hover over the banner (should see overlay)
4. Click to open customization modal
5. Try all three options:
   - Select a gradient
   - Upload an image (drag & drop)
   - Choose BeReady shield
6. Save and verify it persists

---

## 🔧 Troubleshooting

### Error: "Save error: {}"

**Cause:** Database migration not applied  
**Solution:** Run Step 1 above

### Error: "Column 'banner_type' does not exist"

**Cause:** Same as above  
**Solution:** Run the migration SQL

### Image Upload Fails

**Possible causes:**

1. **Storage bucket doesn't exist**
   - Solution: Create `public-assets` bucket in Supabase

2. **Folder doesn't exist**
   - Solution: Create `community-banners/` folder

3. **Permissions wrong**
   - Solution: Set bucket to public read, authenticated write

4. **File too large**
   - Solution: Compress image or increase bucket limit

### Banner Doesn't Update After Save

1. **Clear browser cache:** Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. **Check browser console** for errors
3. **Verify database** has the new value:
   ```sql
   SELECT banner_type, banner_pattern, custom_banner_url
   FROM community_homespaces
   WHERE community_id = 'YOUR_COMMUNITY_ID';
   ```

### Modal Doesn't Open on Click

1. **Check JavaScript errors** in browser console
2. **Verify React version** is compatible (should be 18+)
3. **Clear browser cache** and reload

---

## 📊 Verification Checklist

After deployment, verify:

- [ ] Migration applied successfully
- [ ] Column `banner_type` exists in database
- [ ] Storage bucket `public-assets` exists
- [ ] Folder `community-banners/` created
- [ ] Can open banner editor modal
- [ ] Can select gradient patterns
- [ ] Can upload custom image
- [ ] Can select BeReady shield
- [ ] Changes save correctly
- [ ] Changes persist after reload
- [ ] No console errors

---

## 🔄 Rollback Plan

If you need to rollback this feature:

```sql
-- Remove the column (optional, won't break anything if kept)
ALTER TABLE community_homespaces 
DROP COLUMN IF EXISTS banner_type;

-- Revert banner_pattern constraint to old values
ALTER TABLE community_homespaces 
DROP CONSTRAINT IF EXISTS community_homespaces_banner_pattern_check;

ALTER TABLE community_homespaces 
ADD CONSTRAINT community_homespaces_banner_pattern_check 
CHECK (banner_pattern IN ('olive-gradient', 'olive-mesh', 'olive-waves', 'olive-geometric'));
```

**Note:** The code is backward compatible - if the `banner_type` column doesn't exist, it will gracefully fall back to just using `banner_pattern`.

---

## 📚 Related Documentation

- **Feature Documentation:** `docs/HOMESPACE_INLINE_EDITING.md`
- **User Guide:** `docs/HOMEPAGE_EDITOR_QUICK_GUIDE.md`
- **Summary:** `docs/INLINE_EDITING_FEATURE_SUMMARY.md`
- **Migration SQL:** `database/add-banner-type-homespace.sql`

---

## 🆘 Support

If you encounter issues:

1. Check browser console for detailed error messages
2. Verify all deployment steps completed
3. Check Supabase logs for database errors
4. Review storage bucket configuration
5. Test with a different browser
6. Contact technical support with:
   - Error message from console
   - Screenshot of issue
   - Community ID
   - Steps to reproduce

---

## ✅ Success Criteria

Feature is successfully deployed when:

✅ No errors in browser console  
✅ Banner customization modal opens  
✅ All three banner types work  
✅ Images upload successfully  
✅ Changes save and persist  
✅ No performance issues  
✅ Works on mobile devices

---

**Last Updated:** October 22, 2024  
**Status:** Ready for Production Deployment

