# 🔄 Logo Image Caching Issue - Troubleshooting Guide

## Problem
You uploaded a new logo in the homepage editor and saved it, but the old logo still shows on the published page.

---

## ⚠️ **CRITICAL BUG FOUND AND FIXED**

### **The Real Issue: `logo_url` Was Not Being Saved!**

The desktop `homespace-editor.tsx` had a bug where the `handleSave()` function was **missing `logo_url`** (and several other fields) from the database update.

**Status**: ✅ **FIXED** (2025-10-30)

**What was wrong:**
- Logo upload worked correctly ✅
- Logo displayed in editor ✅  
- **But `logo_url` was never saved to database** ❌

**Files fixed:**
- `rpac-web/src/components/homespace-editor.tsx` - Added missing fields to `updateData`

---

## Root Causes (After Fix)

### 1. **Database Not Updating (BUG - NOW FIXED)**
- The `handleSave()` function was missing `logo_url` in the update statement
- Logo was uploaded to storage, but URL never saved to `community_homespaces` table
- **Solution**: ✅ Fixed in code (see above)

### 2. **Next.js ISR Cache (60 seconds)**
- The public page (`/[samhalle]/page.tsx`) has `export const revalidate = 60`
- This means Next.js only refreshes the page every 60 seconds
- **Solution**: Wait 60 seconds, then hard-refresh (`Ctrl+Shift+R`)

### 3. **Browser Cache**
- Your browser may have cached the old image
- **Solution**: Hard refresh the page (`Ctrl+F5` or `Ctrl+Shift+R`)

### 4. **Cloudflare CDN Cache**
- Cloudflare caches images aggressively by default
- Even though we use unique filenames, the HTML page might be cached
- **Solution**: Wait for ISR revalidation (60 sec) + clear browser cache

### 5. **Preview vs. Published Page**
- The editor preview may show the new logo correctly
- But the published page shows the old one until cache expires

---

## Quick Fixes (In Order of Likelihood)

### ✅ **Solution 1: Wait + Hard Refresh** (Most Common)
```
1. Wait 60 seconds after saving the logo
2. Go to your published page: https://rpac.se/[your-slug]
3. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
4. Check if new logo appears
```

### ✅ **Solution 2: Clear Browser Cache**
```
1. Open DevTools (F12)
2. Right-click the Refresh button
3. Select "Empty Cache and Hard Reload"
4. Or use Incognito/Private window
```

### ✅ **Solution 3: Force Revalidation** (Developer)
If you need immediate update, you can manually trigger revalidation:

**Option A - Purge Cloudflare Cache:**
1. Go to Cloudflare Dashboard
2. Caching → Purge Cache → Purge Everything

**Option B - Lower Revalidate Time (Temporary):**
Edit `rpac-web/src/app/[samhalle]/page.tsx`:
```typescript
// Change from:
export const revalidate = 60;

// To:
export const revalidate = 10; // Faster updates (10 seconds)
```
⚠️ **Note**: Lower values increase server load

---

## Technical Details

### How Logo Upload Works
```typescript
// 1. Generate unique filename with timestamp
const fileName = `${communityId}-logo-${Date.now()}.${fileExt}`;
// Example: "abc123-logo-1698765432123.jpg"

// 2. Upload to Supabase Storage
await supabase.storage.from('public-assets').upload(filePath, file);

// 3. Get public URL
const { data: { publicUrl } } = supabase.storage.from('public-assets').getPublicUrl(filePath);
// Returns: "https://[project].supabase.co/storage/v1/object/public/public-assets/community-logos/abc123-logo-1698765432123.jpg"

// 4. Save to database
setHomespace({ ...homespace, logo_url: publicUrl });
await handleSave(true);
```

### Why Unique Filenames Help (But Don't Solve Everything)
- ✅ **Good**: Each upload creates a new file, so the URL changes
- ✅ **Good**: New URLs bypass image-level cache
- ❌ **Problem**: The HTML page itself is cached (contains the old URL)
- ❌ **Problem**: ISR revalidation delay means page doesn't update instantly

---

## Recommended Improvements

### 1. **Add Cache-Busting Query Parameter** ✨
Force browsers to fetch fresh images by adding a timestamp:

**File**: `rpac-web/src/components/community-homespace.tsx` (Line ~268)

**Current**:
```tsx
<img 
  src={(homespace as any).logo_url} 
  alt={`${homespace.communities.community_name} logotyp`}
  className="w-28 h-28 md:w-40 md:h-40 object-contain filter drop-shadow-2xl"
/>
```

**Improved**:
```tsx
<img 
  src={`${(homespace as any).logo_url}?v=${Date.now()}`} 
  alt={`${homespace.communities.community_name} logotyp`}
  className="w-28 h-28 md:w-40 md:h-40 object-contain filter drop-shadow-2xl"
/>
```

### 2. **Delete Old Logo Files** ♻️
Clean up old logos when uploading new ones:

**File**: `rpac-web/src/components/homespace-editor.tsx`

**Current** (Line ~154):
```typescript
const handleLogoUpload = async (file: File) => {
  setUploadingImage(true);
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${communityId}-logo-${Date.now()}.${fileExt}`;
    const filePath = `community-logos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('public-assets')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('public-assets')
      .getPublicUrl(filePath);

    setHomespace({ ...homespace, logo_url: publicUrl });
    await handleSave(true);
  } catch (error) {
    console.error('Logo upload error:', error);
    alert('Kunde inte ladda upp logotypen. Försök igen.');
  } finally {
    setUploadingImage(false);
  }
};
```

**Improved**:
```typescript
const handleLogoUpload = async (file: File) => {
  setUploadingImage(true);
  try {
    // Delete old logo if exists
    if (homespace.logo_url) {
      try {
        const oldPath = homespace.logo_url.split('/public-assets/')[1];
        if (oldPath) {
          await supabase.storage.from('public-assets').remove([oldPath]);
        }
      } catch (deleteError) {
        console.warn('Could not delete old logo:', deleteError);
        // Continue with upload even if deletion fails
      }
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${communityId}-logo-${Date.now()}.${fileExt}`;
    const filePath = `community-logos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('public-assets')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('public-assets')
      .getPublicUrl(filePath);

    setHomespace({ ...homespace, logo_url: publicUrl });
    await handleSave(true);
  } catch (error) {
    console.error('Logo upload error:', error);
    alert('Kunde inte ladda upp logotypen. Försök igen.');
  } finally {
    setUploadingImage(false);
  }
};
```

### 3. **Lower ISR Revalidation Time** ⏱️
For faster updates, reduce the revalidation time:

**File**: `rpac-web/src/app/[samhalle]/page.tsx`

```typescript
// Current: Revalidate every 60 seconds
export const revalidate = 60;

// Recommended: Revalidate every 10 seconds (balance between freshness and performance)
export const revalidate = 10;

// Or for instant updates (higher server load):
export const revalidate = 1;
```

### 4. **Add On-Demand Revalidation** 🚀
Trigger revalidation immediately after logo upload:

**File**: `rpac-web/src/components/homespace-editor.tsx`

Add after saving logo:
```typescript
const handleLogoUpload = async (file: File) => {
  // ... existing upload logic ...
  
  setHomespace({ ...homespace, logo_url: publicUrl });
  await handleSave(true);
  
  // Trigger on-demand revalidation
  try {
    await fetch(`/api/revalidate?path=/${homespace.slug}`, { method: 'POST' });
  } catch (revalidateError) {
    console.warn('Could not trigger revalidation:', revalidateError);
  }
};
```

Then create the API route:

**File**: `rpac-web/src/app/api/revalidate/route.ts`
```typescript
import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const path = searchParams.get('path');

  if (!path) {
    return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 });
  }

  try {
    revalidatePath(path);
    return NextResponse.json({ revalidated: true, path });
  } catch (err) {
    return NextResponse.json({ error: 'Error revalidating' }, { status: 500 });
  }
}
```

---

## Summary

### Immediate User Actions:
1. ✅ **Wait 60 seconds** after saving
2. ✅ **Hard refresh** the page (`Ctrl+Shift+R`)
3. ✅ **Try Incognito mode** if still showing old logo

### Developer Improvements (Recommended):
1. ✨ Add cache-busting query parameter to image URLs
2. ♻️ Delete old logo files when uploading new ones
3. ⏱️ Lower ISR revalidation time (60s → 10s)
4. 🚀 Add on-demand revalidation API

---

## Testing Checklist

After implementing improvements:

- [ ] Upload new logo in editor
- [ ] Verify thumbnail updates in toolbar
- [ ] Preview page shows new logo immediately
- [ ] Published page shows new logo within 10 seconds (not 60)
- [ ] Hard refresh confirms new logo is live
- [ ] Old logo file is deleted from storage
- [ ] Multiple uploads work correctly
- [ ] No broken images if upload fails

---

## Related Files

- `rpac-web/src/app/[samhalle]/page.tsx` - Public homepage (ISR config)
- `rpac-web/src/components/homespace-editor.tsx` - Logo upload logic
- `rpac-web/src/components/homespace-editor-mobile.tsx` - Mobile logo upload
- `rpac-web/src/components/community-homespace.tsx` - Public logo display
- `rpac-web/_headers` - HTTP cache headers (Cloudflare)

---

**Last Updated**: 2025-10-30
