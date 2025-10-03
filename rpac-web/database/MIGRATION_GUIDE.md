# Database Migration Guide - RPAC Cultivation Features

## Overview
This guide will help you set up the required database tables for the RPAC cultivation planning and reminders features.

## Prerequisites
- Access to your Supabase project SQL Editor
- Administrative access to run SQL commands

## Migration Files to Run (in order)

### Step 1: Cultivation Plans Table
**File**: `add-cultivation-plans-table.sql`

This creates the main table for storing cultivation plans with all plan data in JSONB format.

**Run this first!**

### Step 2: Cultivation Calendar Table
**File**: `add-cultivation-calendar-table.sql`

This creates the table for storing monthly cultivation tasks (sowing, planting, harvesting, maintenance).

**Run this second!**

### Step 3: Cultivation Reminders Table
**File**: `add-cultivation-reminders-table.sql`

This creates the table for storing cultivation reminders with dates and recurrence patterns.

**Run this third!**

## How to Run Migrations

1. **Open Supabase SQL Editor**
   - Go to your Supabase project dashboard
   - Navigate to "SQL Editor" in the left sidebar
   - Click "New Query"

2. **Run Each Migration**
   - Copy the entire contents of `add-cultivation-plans-table.sql`
   - Paste into the SQL Editor
   - Click "Run" or press Ctrl+Enter
   - Wait for success message
   - Repeat for the other two files in order

3. **Verify Tables Were Created**
   ```sql
   -- Run this query to check if tables exist:
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('cultivation_plans', 'cultivation_calendar', 'cultivation_reminders');
   ```
   
   You should see all 3 tables listed.

4. **Verify RLS Policies**
   ```sql
   -- Check RLS policies:
   SELECT schemaname, tablename, policyname 
   FROM pg_policies 
   WHERE tablename IN ('cultivation_plans', 'cultivation_calendar', 'cultivation_reminders');
   ```

## What Each Table Does

### `cultivation_plans`
- Stores complete cultivation plans
- Includes crops, nutrition analysis, self-sufficiency calculations
- Uses JSONB for flexible data structure
- **Used by**: Odlingsplanerare (Cultivation Planner)

### `cultivation_calendar`
- Stores monthly cultivation tasks
- Links tasks to specific months and activities
- Tracks completion status
- **Used by**: "Spara till Odlingskalender" checkbox

### `cultivation_reminders`
- Stores cultivation reminders with dates
- Supports recurring reminders (daily, weekly, monthly, yearly)
- Links to specific crops
- **Used by**: "Spara påminnelser" checkbox

## Expected Results After Migration

After running all migrations, users should be able to:

✅ Save cultivation plans to database  
✅ Check "Spara till Odlingskalender" and see tasks in calendar  
✅ Check "Spara påminnelser" and see reminders created  
✅ Load previously saved cultivation plans  
✅ Edit and update cultivation plans  

## Troubleshooting

### Error: "relation already exists"
This is fine! The migrations are idempotent and will skip creating tables that already exist.

### Error: "trigger already exists"
The migrations drop existing triggers before creating them. Just re-run the migration.

### Error: "policy already exists"
The migrations drop existing policies before creating them. Just re-run the migration.

### Error: "column does not exist"
This means the table structure is different than expected. You may need to drop and recreate the table:
```sql
-- WARNING: This deletes all data in the table!
DROP TABLE IF EXISTS cultivation_calendar CASCADE;
-- Then re-run the migration
```

### Error: "function update_updated_at_column() does not exist"
You need to create this trigger function first:
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';
```

## Verification Queries

### Check Table Structure
```sql
-- Cultivation plans table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'cultivation_plans';

-- Cultivation calendar table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'cultivation_calendar';

-- Cultivation reminders table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'cultivation_reminders';
```

### Check Your Data
```sql
-- See your cultivation plans
SELECT id, created_at, plan_data->>'name' as plan_name 
FROM cultivation_plans 
WHERE user_id = auth.uid();

-- See your calendar entries
SELECT crop_name, month, activity, notes 
FROM cultivation_calendar 
WHERE user_id = auth.uid();

-- See your reminders
SELECT crop_name, reminder_type, reminder_date, notes 
FROM cultivation_reminders 
WHERE user_id = auth.uid();
```

## Support

If you encounter issues:
1. Check the Supabase logs for detailed error messages
2. Verify RLS policies are enabled
3. Ensure your user has proper permissions
4. Check that the `auth.users` table exists

---

**Last Updated**: October 2, 2025  
**Migration Files Version**: 1.0  
**Compatible with**: RPAC Cultivation Planner v2.0+

