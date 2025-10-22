# Deploy RPC Function to Get User Emails

## Why This Is Needed

The pending membership requests currently show:
- ✅ Display names work (if `display_name` column exists)
- ❌ Emails show as "unknown"

**Emails can't be fetched directly** because the `auth.users` table is not accessible from client queries. The solution is an RPC function with `SECURITY DEFINER` privilege.

## Solution

Run this migration in Supabase SQL Editor:

**File:** `add-get-community-members-rpc.sql`

This creates a function that:
1. Joins `community_memberships` with `user_profiles`
2. Joins with `auth.users` to get emails
3. Returns everything in one query

## How to Deploy

### Step 1: Open Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in the left sidebar

### Step 2: Run the Migration
1. Open the file: `rpac-web/database/add-get-community-members-rpc.sql`
2. Copy ALL the contents
3. Paste into Supabase SQL Editor
4. Click "Run" or press Ctrl+Enter

### Step 3: Verify Success
You should see:
```
Success. No rows returned.
```

### Step 4: Test in the App
1. Refresh your browser (Ctrl+F5 / Cmd+Shift+R)
2. Go to community admin → Pending requests
3. Check console logs - should say: `✅ Fetched members with emails: 3`
4. User emails should now be visible (not "unknown")

## What the RPC Function Does

```sql
CREATE OR REPLACE FUNCTION get_community_members_with_emails(p_community_id UUID)
RETURNS TABLE (
  user_id UUID,
  role VARCHAR,
  display_name VARCHAR,
  first_name VARCHAR,
  last_name VARCHAR,
  name_display_preference VARCHAR,
  avatar_url TEXT,
  email TEXT  -- ← This is the key addition!
)
```

The function uses `SECURITY DEFINER` which means:
- It runs with the privileges of the function creator (admin)
- It CAN access `auth.users` even from client code
- It's safe because it only returns data for community members

## Expected Results

### Before Migration
```typescript
{
  user_id: "2c94f0e7-adc0-4c15-8bef-d4d593131325",
  user_email: "unknown",  // ❌ Can't access auth.users
  display_name: "Medlem 1"
}
```

### After Migration
```typescript
{
  user_id: "2c94f0e7-adc0-4c15-8bef-d4d593131325",
  user_email: "per@example.com",  // ✅ Retrieved via RPC
  display_name: "per"  // ✅ Fallback to email prefix works
}
```

## Console Log Messages

### Without RPC (Current State)
```
⚠️ RPC function not available, using fallback query: Could not find the function...
✅ Fetched profiles (no emails): 3
⚠️ No name found, using fallback: Medlem 1 for user: 2c94...
⚠️ No name found, using fallback: Medlem 2 for user: 34645...
⚠️ No name found, using fallback: Medlem 3 for user: 1def...
```

### With RPC (After Migration)
```
✅ Fetched members with emails: 3
✅ Using email prefix: per for user: 2c94...
✅ Using email prefix: erik for user: 34645...
✅ Using email prefix: anna for user: 1def...
```

## Troubleshooting

### Error: "function does not exist"
- ✅ **Normal** - Just means the migration hasn't been run yet
- ✅ The code handles this gracefully with a fallback

### Error: "permission denied"
- Check that you're running the SQL in the correct project
- Make sure you're logged in as project owner

### Still showing "unknown" after migration
1. Check console logs for error messages
2. Verify the RPC function was created: `SELECT * FROM pg_proc WHERE proname = 'get_community_members_with_emails';`
3. Clear browser cache and hard refresh (Ctrl+Shift+R)

## Related Files

- ✅ `add-get-community-members-rpc.sql` - The migration to run
- ✅ `rpac-web/src/components/community-admin-section.tsx` - Updated to use RPC
- ✅ `rpac-web/src/lib/messaging-service.ts` - Already uses this RPC function

---

**Status:** Ready to deploy  
**Required:** Yes, to show actual user emails  
**Breaking Changes:** None (graceful fallback exists)

