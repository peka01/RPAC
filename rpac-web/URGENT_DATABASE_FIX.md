# 🚨 URGENT: Database Constraint Fix Required

## Problem
The database has an **OLD constraint** expecting **ENGLISH values** (`'open'`, `'closed'`), but your code is sending **SWEDISH values** (`'öppet'`, `'stängt'`).

**Error:**
```
new row for relation "local_communities" violates check constraint "access_type_check"
```

## Root Cause
An old migration (`COMPLETE_MIGRATION_FOR_CORRECT_PROJECT.sql`) created a constraint with English values that was never updated to Swedish.

## Fix (Run in Supabase SQL Editor)

### Step 1: Go to Supabase
1. Open https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in the left sidebar
4. Click "New query"

### Step 2: Run This SQL
Copy and paste the entire contents of:
```
rpac-web/database/FIX_ACCESS_TYPE_CONSTRAINT.sql
```

Or copy this directly:

```sql
-- Step 1: Drop old constraints
ALTER TABLE local_communities DROP CONSTRAINT IF EXISTS access_type_check;
ALTER TABLE local_communities DROP CONSTRAINT IF EXISTS local_communities_access_type_check;

-- Step 2: Update existing data from English to Swedish (MUST DO BEFORE adding constraint!)
UPDATE local_communities 
SET access_type = CASE 
  WHEN access_type = 'open' THEN 'öppet'
  WHEN access_type = 'closed' THEN 'stängt'
  WHEN access_type IS NULL THEN 'öppet'
  ELSE access_type
END;

-- Step 3: Add correct Swedish constraint
ALTER TABLE local_communities 
ADD CONSTRAINT access_type_check 
CHECK (access_type IN ('öppet', 'stängt'));
```

**IMPORTANT:** The UPDATE must happen BEFORE adding the constraint, otherwise you'll get a constraint violation error!

### Step 3: Verify
Run this to check:
```sql
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%access_type%';
```

You should see:
```
access_type_check | ((access_type)::text = ANY ((ARRAY['öppet'::character varying, 'stängt'::character varying])::text[]))
```

## After Running the SQL

1. **Refresh your browser** (hard refresh: Ctrl+Shift+R or Cmd+Shift+R)
2. **Go to** `/local/discover`
3. **Click Edit** on a community
4. **Change Öppet/Stängt** toggle
5. **Click Save** - should work now! ✅

## What This Does
- ✅ Removes the old English constraint (`'open'`, `'closed'`)
- ✅ Adds the correct Swedish constraint (`'öppet'`, `'stängt'`)
- ✅ Updates any existing data from English to Swedish
- ✅ Fixes the save error you're experiencing

---
**IMPORTANT:** You MUST run this SQL in Supabase before you can save community access type changes!

