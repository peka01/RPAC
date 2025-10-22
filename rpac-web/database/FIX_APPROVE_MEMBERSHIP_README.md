# Fix Approve & Reject Membership Errors

## Problem
When clicking "Godkänn" (Approve) or "Avslå" (Reject) buttons for pending membership requests:

```
Error: column "message" of relation "notifications" does not exist
```

## Root Cause
Both `approve_membership_request` and `reject_membership_request` RPC functions are trying to insert into columns that don't exist:
- ❌ `message` (should be `content`)
- ❌ `link` (should be `action_url`)

This is a schema mismatch between the old functions and the current notifications table.

## Solution

Run this migration in Supabase SQL Editor:

**File:** `fix-approve-membership-rpc.sql`

## How to Deploy

### Step 1: Open Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor"

### Step 2: Run the Fix
1. Open: `rpac-web/database/fix-approve-membership-rpc.sql`
2. Copy ALL the contents
3. Paste into Supabase SQL Editor
4. Click "Run"

### Step 3: Test
1. Refresh your browser
2. Go to community admin → Pending requests
3. Click "Godkänn" on a pending request
4. Should now work without errors!

## What Changed

### Before (Broken)
```sql
INSERT INTO notifications (user_id, type, title, message, link, created_at)
VALUES (..., 'Din ansökan om medlemskap har godkänts!', '/local?community=...', ...)
--           ^^^^^^^ ^^^^ ← Wrong columns!
--           Generic message, no community name ↑
```

### After (Fixed & Improved)
```sql
INSERT INTO notifications (user_id, type, title, content, action_url, created_at)
VALUES (..., 
  'Din ansökan om medlemskap i Berg har godkänts! Klicka här för att gå till samhället.',
  '/local?tab=myCommunities&community=...', 
  ...)
-- ✅ Correct columns!
-- ✅ Includes community name!
-- ✅ Clear call-to-action!
-- ✅ Opens directly to community!
```

## Improvements Included

### 1. Fixed Column Names
- ✅ `message` → `content`
- ✅ `link` → `action_url`

### 2. Community Name in Notifications
- ✅ **Approval**: "Din ansökan om medlemskap i **Berg** har godkänts!"
- ✅ **Rejection**: "Din ansökan om medlemskap i **Berg** har avslagits."

### 3. Better Action URLs
- ✅ **Approval**: Opens directly to "Mina samhällen" tab with community selected
- ✅ **Rejection**: Opens to discover page to find other communities

### 4. Clear Call-to-Action
- ✅ "Klicka här för att gå till samhället" - encourages engagement

### 5. Backwards Compatibility
- ✅ Handles both `status` and `membership_status` columns
- ✅ Works regardless of which migrations you've run

## Expected Results

### Before Migration
- ❌ Clicking "Godkänn" shows error in console
- ❌ Clicking "Avslå" shows error in console
- ❌ Membership not approved/rejected
- ❌ No notification sent

### After Migration
- ✅ Clicking "Godkänn" approves the membership
- ✅ Clicking "Avslå" rejects the membership
- ✅ Member count incremented (on approval)
- ✅ Notifications sent to requester
- ✅ Admin sees success message
- ✅ Lists refresh automatically

## Related Files

- ✅ `fix-approve-membership-rpc.sql` - The migration to run
- ⚠️ `add-admin-utility-functions.sql` - Original (broken) version
- ⚠️ `DEPLOY_ADMIN_FUNCTIONS_CLEAN.sql` - Also has broken version

---

**Status:** Ready to deploy  
**Required:** Yes, to enable membership approval  
**Breaking Changes:** None

