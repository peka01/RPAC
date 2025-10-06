# Cultivation Plans Migration Guide

## ⚠️ Important: Run This Migration

The new simplified cultivation planning system requires an updated database schema.

## What Changed?

**Old Schema** (complex AI-driven):
- Single `plan_data` JSONB column containing everything
- Designed for AI-generated multi-step plans

**New Schema** (simplified):
- Individual columns: `title`, `description`, `crops`, `is_primary`
- Designed for user-driven simple plan creation
- Much easier to query and maintain

## How to Run the Migration

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the contents of `migrate-cultivation-plans-to-simple-schema.sql`
5. Paste into the editor
6. Click **Run** (or press Ctrl/Cmd + Enter)
7. You should see: ✅ `cultivation_plans table migrated to new simplified schema successfully!`

### Option 2: Supabase CLI

```bash
# From the rpac-web directory
supabase db reset  # If you want a clean slate

# Or apply just this migration
psql $DATABASE_URL -f database/migrate-cultivation-plans-to-simple-schema.sql
```

## What the Migration Does

✅ **Safely drops old table** (it's a new feature, so no user data will be lost)
✅ **Creates new schema** with proper columns
✅ **Sets up indexes** for fast queries
✅ **Enables RLS** (Row Level Security) 
✅ **Creates policies** (users can only access their own plans)
✅ **Adds triggers** (automatic `updated_at` timestamp)

## Verify the Migration

After running, verify it worked:

```sql
-- Check table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'cultivation_plans';

-- Should show columns:
-- id, user_id, plan_id, title, description, crops, is_primary, created_at, updated_at
```

## New Table Schema

```sql
CREATE TABLE cultivation_plans (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  plan_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  crops JSONB DEFAULT '[]',  -- [{"cropName": "Potatis", "estimatedYieldKg": 5}, ...]
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Example Data

After users create plans, data will look like:

```json
{
  "id": "uuid-here",
  "user_id": "user-uuid",
  "plan_id": "plan_1234567890",
  "title": "Sommarodling 2025",
  "description": "Min första odlingsplan för sommaren",
  "crops": [
    {
      "cropName": "Potatis",
      "estimatedYieldKg": 10
    },
    {
      "cropName": "Morötter",
      "estimatedYieldKg": 5
    }
  ],
  "is_primary": true,
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z"
}
```

## Troubleshooting

### Error: "relation cultivation_plans already exists"
- The migration is idempotent and will drop/recreate the table
- Make sure you're running the full migration script

### Error: "permission denied"
- Make sure you're logged in as a superuser or have the necessary permissions
- In Supabase dashboard, this should work automatically

### Error: "function update_updated_at_column already exists"
- This is normal - the migration handles this
- The function is reused across multiple tables

## Need Help?

Check the Supabase logs:
1. Go to Supabase Dashboard → Database → Logs
2. Look for any error messages
3. The migration script includes helpful NOTICE messages

## After Migration

The cultivation planning system should now work! Users can:
1. ✅ Create new cultivation plans
2. ✅ Add crops to plans
3. ✅ See nutrition calculations
4. ✅ View monthly activity overview
5. ✅ Set primary plan
6. ✅ Delete plans

