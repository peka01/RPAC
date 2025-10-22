# Add Membership Status Column Migration

## Purpose
This migration adds a `status` column to the `community_memberships` table to support the pending/approved/rejected membership workflow for closed communities.

## What It Does

1. **Adds `status` column** with default value `'approved'`
2. **Updates existing records** to `'approved'` (backwards compatibility)
3. **Adds check constraint** to ensure only valid values: `'approved'`, `'pending'`, `'rejected'`
4. **Creates indexes** for faster queries on status

## When to Run

Run this migration if you're getting errors like:
- `Error loading user communities`
- `column "status" does not exist`
- Community membership features not working

## How to Run

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `add-membership-status-column.sql`
4. Paste and click **Run**

### Option 2: psql Command Line
```bash
psql -h <your-supabase-host> -U postgres -d postgres -f add-membership-status-column.sql
```

## Verification

After running, verify the migration succeeded:

```sql
-- Check if column exists
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'community_memberships' AND column_name = 'status';

-- Check if all existing memberships have status
SELECT status, COUNT(*) 
FROM community_memberships 
GROUP BY status;

-- Should see something like:
--  status   | count 
-- ----------+-------
--  approved |    15
```

## Rollback (if needed)

If you need to remove this column:

```sql
-- Remove indexes
DROP INDEX IF EXISTS idx_community_memberships_status;
DROP INDEX IF EXISTS idx_community_memberships_community_status;

-- Remove constraint
ALTER TABLE community_memberships 
DROP CONSTRAINT IF EXISTS community_memberships_status_check;

-- Remove column
ALTER TABLE community_memberships 
DROP COLUMN IF EXISTS status;
```

## Related Features

This migration enables:
- ✅ Pending membership requests for closed communities
- ✅ Admin approval workflow
- ✅ Notifications for membership requests
- ✅ "Väntande" status display for users
- ✅ Badge showing pending count for admins

## Migration Order

This should be run **before** using the updated membership features. The code has backwards compatibility, but will work better after migration.

## Notes

- Migration is **idempotent** - safe to run multiple times
- Existing memberships will remain functional (set to 'approved')
- No data loss - only adds new functionality

