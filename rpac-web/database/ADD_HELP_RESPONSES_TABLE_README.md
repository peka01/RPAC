# Help Responses Table Migration

## Purpose
This migration creates the `help_responses` table to store responses from helpers to help requests, replacing the previous private messaging system.

## What This Enables
- Helpers can respond directly to help requests
- Responses are visible to:
  - The requestor (owner of the help request)
  - The responder (person who wrote the response)
  - Community admins
- Community admins can edit and delete any response
- All conversations stay within help requests (no separate private messages)

## To Apply This Migration

### Option 1: Supabase Dashboard (Recommended)
1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Create a new query
4. Copy and paste the contents of `add-help-responses-table.sql`
5. Click **Run**

### Option 2: Command Line
```bash
psql "postgresql://postgres.dsoujjudzrrtkkqwhpge:Cykel240!@aws-0-eu-central-1.pooler.supabase.com:6543/postgres" -f database/add-help-responses-table.sql
```

## What Gets Created

### Table: `help_responses`
- `id` - UUID primary key
- `help_request_id` - Foreign key to help_requests
- `responder_id` - Foreign key to user_profiles(user_id)
- `message` - The response text
- `can_help` - Boolean flag
- `created_at` - Timestamp
- `updated_at` - Timestamp

### Indexes
- On `help_request_id` (for fast lookup of all responses to a request)
- On `responder_id` (for user's response history)
- On `created_at` (for chronological sorting)

### Row Level Security Policies
1. **View**: Users can see responses if they are the requestor, responder, or community admin
2. **Create**: Approved community members can create responses
3. **Update**: Users can update their own responses, admins can update any
4. **Delete**: Only community admins can delete responses

## Verification

After running the migration, verify it worked:

```sql
-- Check table exists
SELECT * FROM information_schema.tables WHERE table_name = 'help_responses';

-- Check indexes
SELECT indexname FROM pg_indexes WHERE tablename = 'help_responses';

-- Check RLS policies
SELECT policyname FROM pg_policies WHERE tablename = 'help_responses';
```

## Dependencies
This migration requires:
- ✅ `help_requests` table (already exists)
- ✅ `user_profiles` table (already exists)
- ✅ `community_memberships` table (already exists)
- ✅ `update_updated_at_column()` function (already exists)

## Status
🔴 **NOT YET APPLIED** - Run this migration to enable the help response feature.
