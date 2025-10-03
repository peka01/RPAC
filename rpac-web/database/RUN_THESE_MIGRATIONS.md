# 🚀 Quick Start: Run These Migrations

## The Problem You're Experiencing

```
Error saving calendar entries: Could not find the 'activity' column of 'cultivation_calendar'
Error saving reminders: Could not find the 'is_recurring' column of 'cultivation_reminders'
column "month" does not exist
```

## ⭐ EASIEST SOLUTION: Run One File

**Copy and paste the entire contents of:**
```
rpac-web/database/COMPLETE_MIGRATION.sql
```

This single file contains all 3 migrations in the correct order!

---

## Alternative: Run Individual Files

If you prefer to run migrations separately, use these 3 SQL files in Supabase SQL Editor **in this exact order**:

## Step-by-Step Instructions

### 1️⃣ Open Supabase SQL Editor
- Go to your Supabase project
- Click "SQL Editor" in the sidebar
- Click "New Query"

### 2️⃣ Run Migration 1: Cultivation Plans
**Copy and paste this file's contents:**
```
rpac-web/database/add-cultivation-plans-table.sql
```
Click "Run" ✅

### 3️⃣ Run Migration 2: Fix Cultivation Calendar (IMPORTANT!)
**⚠️ Use the FIX version if you get "column does not exist" errors:**
```
rpac-web/database/fix-cultivation-calendar-table.sql
```
Click "Run" ✅

**Note**: This drops and recreates the table with correct columns. Any existing data will be deleted.

### 4️⃣ Run Migration 3: Fix Cultivation Reminders (IMPORTANT!)
**⚠️ Use the FIX version if you get "column does not exist" errors:**
```
rpac-web/database/fix-cultivation-reminders-table.sql
```
Click "Run" ✅

**Note**: This drops and recreates the table with correct columns. Any existing data will be deleted.

## Done! ✅

Now try saving your cultivation plan again with the checkboxes enabled:
- ☑️ Spara till Odlingskalender
- ☑️ Spara påminnelser

You should see in the console:
```
Plan saved successfully
Saving to calendar entries...
Successfully saved XX calendar entries
Saving reminders to calendar...
Successfully saved XX reminders
```

## Troubleshooting

**If you see "trigger already exists":**
- This is fine! The migrations handle this automatically.
- Just re-run the migration file.

**If you see "table already exists":**
- This is fine! The migrations use `CREATE TABLE IF NOT EXISTS`.
- The migration will skip creating the table.

**If you still get errors after running migrations:**
1. Check you ran all 3 files in order
2. Refresh your browser (clear cache with Ctrl+Shift+R)
3. Check the Supabase logs for detailed errors
4. Verify tables were created:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_name IN ('cultivation_plans', 'cultivation_calendar', 'cultivation_reminders');
   ```

## What These Tables Do

**cultivation_plans** 📋
- Stores your complete cultivation plans
- Includes crops, nutrition data, self-sufficiency calculations

**cultivation_calendar** 📅
- Stores monthly cultivation tasks
- Tracks what to do each month (sowing, planting, harvesting)

**cultivation_reminders** ⏰
- Stores reminders with specific dates
- Supports recurring reminders (yearly)
- Helps you remember when to plant/harvest each crop

---

**Need Help?** See `MIGRATION_GUIDE.md` for detailed troubleshooting.

