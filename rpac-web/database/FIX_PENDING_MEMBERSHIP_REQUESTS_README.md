# Fix get_pending_membership_requests RPC Function

## Problem
When loading the local community page, you get this error:
```
POST https://dsoujjudzrrtkkqwhpge.supabase.co/rest/v1/rpc/get_pending_membership_requests 400 (Bad Request)
```

## Root Cause
The `get_pending_membership_requests` RPC function is trying to access database columns that don't exist:
- `up.family_size` - this column might not exist
- `cm.membership_status` - might be `status` instead
- Missing `requested_at` column handling

## Solution

Run this migration in Supabase SQL Editor:

**File:** `fix-get-pending-membership-requests.sql`

## How to Deploy

### Step 1: Open Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in the left sidebar

### Step 2: Run the Fix
1. Open: `rpac-web/database/fix-get-pending-membership-requests.sql`
2. Copy ALL the contents
3. Paste into Supabase SQL Editor
4. Click "Run"

### Step 3: Verify Success
You should see:
```
✅ get_pending_membership_requests function fixed and deployed successfully!
```

### Step 4: Test in the App
1. Refresh your browser (Ctrl+F5 / Cmd+Shift+R)
2. Go to local community page
3. The 400 error should be gone
4. Pending membership requests should load correctly

## What the Fix Does

### Before (Broken)
```sql
-- Tries to access columns that might not exist
up.family_size as household_size
cm.membership_status = 'pending'
```

### After (Fixed)
```sql
-- Handles missing columns gracefully
COALESCE(up.household_size, up.family_size, 1) as household_size
(cm.membership_status = 'pending' OR cm.status = 'pending')
```

## Key Improvements

1. **Graceful Column Handling:**
   - Uses `household_size` if available, falls back to `family_size`, defaults to 1
   - Handles both `membership_status` and `status` columns

2. **Better Display Name Logic:**
   - `display_name` → `first_name + last_name` → `first_name` → email prefix

3. **Robust Date Handling:**
   - Uses `requested_at` if available, falls back to `created_at`

4. **Security:**
   - Uses `SECURITY DEFINER` for proper permissions
   - Grants execute permission to authenticated users

## Expected Results

### Before Fix
```
❌ 400 Bad Request error
❌ Pending requests don't load
❌ Community admin page broken
```

### After Fix
```
✅ No more 400 errors
✅ Pending requests load correctly
✅ Community admin page works
✅ User names display properly
```

## Files Modified
- ✅ `fix-get-pending-membership-requests.sql` (new)
- ✅ `FIX_PENDING_MEMBERSHIP_REQUESTS_README.md` (new)

---
**Date:** 2025-10-22  
**Status:** Ready to deploy
