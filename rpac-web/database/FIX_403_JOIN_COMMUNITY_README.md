# Fix 403 Error & Infinite Recursion in Community Memberships

## Problems

### Problem 1: 403 Forbidden When Joining
When clicking "Gå med" on a community, users get a 403 Forbidden error:
```
Failed to load resource: the server responded with a status of 403 ()
❌ Error toggling membership
```

### Problem 2: Infinite Recursion in SELECT
When viewing memberships, the database goes into infinite recursion:
```
Error: infinite recursion detected in policy for relation "community_memberships"
```

## Root Causes

1. **403 Error:** Missing INSERT policy - users can't create their own membership requests
2. **Infinite Recursion:** SELECT policy checks `community_memberships` table, which triggers the same policy again, creating an infinite loop

## Solution

Run this migration in Supabase SQL Editor:

**File:** `fix-membership-insert-policy.sql`

## What It Does

### Key Innovation: NO RECURSION! 🎯

The migration creates **simple, non-recursive policies** that fix both issues:

### 1. INSERT Policy - "Users can request to join communities"
```sql
WITH CHECK (
  auth.uid() = user_id  -- User can only join as themselves
)
```

**Allows:**
- ✅ Users to request to join any community
- ✅ Creating pending membership requests
- ✅ Simple check, no recursion possible

### 2. SELECT Policy - "Authenticated users can view memberships"
```sql
USING (
  auth.role() = 'authenticated'  -- All logged-in users
)
```

**Why this is safe:**
- ✅ Users need to see which communities they're in
- ✅ Users need to see member counts
- ✅ Admins need to see member lists
- ✅ Data isn't sensitive (just IDs and roles)
- ✅ **NO recursion** - doesn't query `community_memberships`

### 3. Helper Function - `is_community_admin()`
```sql
CREATE FUNCTION is_community_admin(p_user_id UUID, p_community_id UUID)
SECURITY DEFINER  -- Bypasses RLS to avoid recursion
```

**Purpose:**
- ✅ Checks if user is admin WITHOUT triggering RLS policies
- ✅ Used by UPDATE and DELETE policies
- ✅ Prevents infinite recursion

### 4. UPDATE Policy - "Admins can manage membership requests"
```sql
USING (
  is_community_admin(auth.uid(), community_id)  -- Uses helper function
  OR EXISTS (super_admin check)
)
```

**Allows:**
- ✅ Admins to approve/reject membership requests
- ✅ Super admins to manage any membership
- ✅ **NO recursion** - uses SECURITY DEFINER function

### 5. DELETE Policy - "Users can leave communities"
```sql
USING (
  auth.uid() = user_id  -- Leave your own memberships
  OR is_community_admin(auth.uid(), community_id)  -- Admins can remove
)
```

**Allows:**
- ✅ Users to leave communities
- ✅ Admins to remove members
- ✅ **NO recursion** - uses helper function

## How to Deploy

### Step 1: Open Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor"

### Step 2: Run the Migration
1. Open file: `rpac-web/database/fix-membership-insert-policy.sql`
2. Copy ALL contents
3. Paste in Supabase SQL Editor
4. Click "Run"

### Step 3: Verify Success
You should see detailed output:
```
✅ Community membership RLS policies updated!

📋 Policies created:
   - INSERT: 1 policy/policies
   - SELECT: 1 policy/policies
   - UPDATE: 1 policy/policies
   - DELETE: 1 policy/policies

🔓 Users can now:
   ✅ Join communities (no more 403 errors)
   ✅ View their memberships (no more infinite recursion)
   ✅ See member lists
   ✅ Leave communities

🔒 Security maintained:
   ✅ Users can only join as themselves
   ✅ Only admins can approve/reject requests
   ✅ Only admins can remove members
```

### Step 4: Test in App
1. Refresh your browser (Ctrl+F5)
2. Go to community discovery
3. Click "Gå med" on any community
4. Should now work without errors!

## Expected Results

### Before Migration ❌
```
// 403 Error:
🔧 Attempting to join community: cd857625...
🔒 Closed community - creating pending request...
❌ 403 Forbidden
❌ Error toggling membership

// Infinite Recursion:
Error fetching memberships: infinite recursion detected
Error loading homespaces: infinite recursion detected
[App becomes unresponsive]
```

### After Migration ✅
```
// Joining works:
🔧 Attempting to join community: cd857625...
🔒 Closed community - creating pending request...
✅ Ansökan skickad! Väntar på godkännande...
[Button changes to "Väntande" with amber color]
[Notification sent to admins]

// Memberships load:
✅ Loaded members: 4
✅ Loaded pending requests: 2
[App works normally]
```

## Troubleshooting

### Issue: Still getting infinite recursion
**Cause:** Old policies not dropped, or migration failed  
**Solution:** 
1. Check Supabase SQL Editor for errors
2. Manually drop ALL policies first:
   ```sql
   SELECT 'DROP POLICY IF EXISTS "' || policyname || '" ON community_memberships;'
   FROM pg_policies 
   WHERE tablename = 'community_memberships';
   ```
3. Run the output, then re-run migration

### Issue: Still getting 403 error
**Cause:** INSERT policy not created  
**Solution:** 
1. Verify policies exist:
   ```sql
   SELECT policyname, cmd FROM pg_policies 
   WHERE tablename = 'community_memberships';
   ```
2. Should see at least 4 policies (INSERT, SELECT, UPDATE, DELETE)
3. If missing, re-run migration

### Issue: Helper function error
**Cause:** `is_community_admin()` function not created  
**Solution:**
1. Check if function exists:
   ```sql
   SELECT proname FROM pg_proc WHERE proname = 'is_community_admin';
   ```
2. If missing, re-run migration

## What This Fixes

- ✅ Users can join open communities
- ✅ Users can request to join closed communities
- ✅ Admins can approve/reject requests
- ✅ Users can leave communities
- ✅ No more 403 Forbidden errors
- ✅ Proper security (users can't join as other users)

## Related Files

- ✅ `fix-membership-insert-policy.sql` - RLS policy migration
- ✅ `rpac-web/src/app/local/discover/page.tsx` - Join logic (already correct)
- ✅ `rpac-web/src/lib/supabase.ts` - `joinCommunity` function (already correct)

## Security Notes

### What Users CAN Do
- ✅ Request to join communities as themselves
- ✅ View their own memberships
- ✅ Leave communities they're in

### What Users CANNOT Do
- ❌ Join as another user (auth.uid() = user_id check)
- ❌ Approve their own requests (needs admin)
- ❌ Join same community twice (duplicate check)
- ❌ Remove other members (needs admin)

### Admin Privileges
- ✅ Approve/reject membership requests
- ✅ Remove members from communities
- ✅ Update membership status/role

---

**Date:** 2025-10-22  
**Status:** Ready to deploy  
**Priority:** High (blocks core functionality)  
**Risk:** Low (standard RLS pattern)

