# Add Membership Notification Types Migration

## Error This Fixes

If you see this error when joining a closed community:
```
Error creating notification: {code: '23514', message: 'new row for relation "notifications" violates check constraint "notifications_type_check"'}
```

## Purpose
This migration updates the `notifications` table to support new notification types for the membership request workflow:
- `membership_request` - Sent to admins when someone requests to join
- `membership_approved` - Sent to user when their request is approved
- `membership_rejected` - Sent to user when their request is rejected

## What It Does

1. **Drops old check constraint** that only allowed: `'message'`, `'resource_request'`, `'emergency'`, `'system'`
2. **Adds new check constraint** that includes the 3 new membership types

## How to Run

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `add-membership-notification-types.sql`
4. Paste and click **Run**

### Option 2: psql Command Line
```bash
psql -h <your-supabase-host> -U postgres -d postgres -f add-membership-notification-types.sql
```

## Verification

After running, verify it worked:

```sql
-- Check the constraint
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE conname = 'notifications_type_check';

-- Should show:
-- CHECK (type IN ('message', 'resource_request', 'emergency', 'system', 
--                 'membership_request', 'membership_approved', 'membership_rejected'))
```

## Test After Migration

1. Create a closed community
2. Log in as another user
3. Click "Gå med"
4. **Should see**: "Ansökan skickad! Väntar på godkännande från administratör."
5. **Admin should receive notification** 🔔
6. **No errors in console**

## Migration Order

Run these migrations in order:
1. ✅ `add-membership-status-column.sql` (adds status column)
2. ✅ **`add-membership-notification-types.sql`** (this file - adds notification types)

## Notes

- Migration is **idempotent** - safe to run multiple times
- No data loss - only updates constraint
- Existing notifications remain unchanged

