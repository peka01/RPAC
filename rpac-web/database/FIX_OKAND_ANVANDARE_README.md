# Fix "Okänd användare" Error in Pending Members

## Problem
When viewing pending membership requests in the community admin page, all users show as **"Okänd användare"** (Unknown User).

## Root Cause
The `user_profiles` table is missing the `display_name` column. The error in console shows:
```
column user_profiles.family_size does not exist
```

This indicates the database schema is incomplete.

## Solution Applied ✅

The code now uses the **same fallback pattern as the messaging system**:
1. Try to fetch `display_name` from `user_profiles`
2. If missing or empty, use email prefix (e.g., "per" from "per@example.com")
3. If no email, use "Medlem 1", "Medlem 2", etc.

**This works immediately without database migration!** However, for best results, you should still run the migration below.

## Optional: Add display_name Column (Recommended)

### Step 1: Verify Current Schema
Run this in Supabase SQL Editor to see what columns are missing:

```sql
-- Copy and paste from: verify-user-profiles-columns.sql
```

### Step 2: Add Missing Columns
Run this migration in Supabase SQL Editor:

**File:** `add-display-name-to-profiles.sql`

This adds:
- ✅ `display_name` (VARCHAR(100))
- ✅ `first_name` (VARCHAR(50))
- ✅ `last_name` (VARCHAR(50))
- ✅ `avatar_url` (TEXT)
- ✅ `name_display_preference` (VARCHAR(20))

The migration also:
1. Auto-populates `display_name` from email prefix for existing users
2. Creates a trigger to auto-set `display_name` for new users
3. Adds indexes for faster lookups

### Step 3: Verify the Fix
After running the migration:

1. Refresh your browser (Ctrl+F5 / Cmd+Shift+R)
2. Go to community admin page → Pending requests tab
3. User names should now display correctly (e.g., "per" instead of "Okänd användare")

## Technical Details

### Before Migration
```typescript
// Query fails with: column user_profiles.display_name does not exist
const { data } = await supabase
  .from('user_profiles')
  .select('user_id, display_name, postal_code, county')
  .in('user_id', userIds);
```

### After Migration
```typescript
// Query succeeds and returns actual user names
const { data } = await supabase
  .from('user_profiles')
  .select('user_id, display_name, postal_code, county')
  .in('user_id', userIds);

// Result: [{ user_id: '...', display_name: 'per', postal_code: '36334', county: 'kronoberg' }]
```

## Files Modified (Frontend)
- ✅ `rpac-web/src/components/community-admin-section.tsx`
  - Removed `family_size` from query (temporarily, until schema is fixed)
  - Added error handling for missing columns

## Files to Run (Database)
1. ✅ `verify-user-profiles-columns.sql` (diagnostic)
2. ✅ `add-display-name-to-profiles.sql` (migration)

## Expected Result
✅ Pending membership requests show actual user names
✅ No more "Okänd användare" errors
✅ Console errors about missing columns are gone

---
**Date:** 2025-10-22  
**Status:** Ready to deploy migration

