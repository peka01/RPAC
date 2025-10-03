# Database Migration Order - 2025-10-03

## Required Migrations for Community Messaging & Resource Sharing

Run these migrations in **this exact order** to set up the complete system:

---

## ✅ Already Applied (Initial Setup)
If you've been following along, these should already be in your database:

1. `add-messaging-and-location.sql` - Core messaging tables and location features
2. `fix-messages-table.sql` - Add missing columns (is_emergency, metadata)
3. `add-display-name-to-profiles.sql` - User profile enhancements (display_name, avatar_url, etc.)
4. `fix-user-profiles-rls.sql` - RLS policies to allow viewing community member profiles
5. `fix-empty-display-names.sql` - Backfill display names from email
6. `create-missing-user-profiles.sql` - Create profiles for community members

---

## 🚨 CRITICAL: Run These Now

### 1. Clear Messages and Add Constraint
**File**: `clear-all-messages.sql`

**Purpose**: 
- Delete all existing messages (fresh start)
- Add CHECK constraint to prevent mixed message types
- Ensures proper separation between direct and community messages

**What it does**:
```sql
DELETE FROM messages;
ALTER TABLE messages ADD CONSTRAINT messages_type_integrity
  CHECK (
    (receiver_id IS NOT NULL AND community_id IS NULL) OR
    (receiver_id IS NULL AND community_id IS NOT NULL)
  );
```

**Run this**: ✅ **REQUIRED**

---

### 2. Simplify Resource Sharing
**File**: `simplify-resource-sharing.sql`

**Purpose**:
- Make resource_sharing columns nullable for easier insertion
- Remove broken foreign key constraints
- Allow flexible resource data entry

**What it does**:
```sql
ALTER TABLE resource_sharing ALTER COLUMN resource_name DROP NOT NULL;
ALTER TABLE resource_sharing ALTER COLUMN category DROP NOT NULL;
-- ... etc for other columns
ALTER TABLE resource_sharing DROP CONSTRAINT resource_sharing_community_id_fkey;
```

**Run this**: ✅ **REQUIRED** (if using resource sharing)

---

## 📋 Optional/Diagnostic Scripts

These scripts are for debugging or specific issues:

### Diagnostic Scripts (DO NOT RUN unless troubleshooting)
- `diagnose-resource-sharing.sql` - Inspect resource_sharing table structure
- `verify-and-fix-relationships.sql` - Check database relationships
- `debug-user-ids.sql` - Debug user ID issues

### Deprecated/Obsolete Scripts (DO NOT RUN)
- `clean-mixed-messages.sql` - Superseded by `clear-all-messages.sql`
- `add-message-type-constraint.sql` - Included in `clear-all-messages.sql`
- `fix-resource-sharing-schema.sql` - Superseded by `simplify-resource-sharing.sql`
- `rebuild-resource-sharing-table.sql` - Obsolete approach
- `add-resource-sharing-denormalized-columns.sql` - Obsolete approach
- `final-resource-sharing-fix.sql` - Obsolete approach

---

## ✅ Verification

After running the required migrations, verify everything is working:

### Check Messages Constraint
```sql
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conname = 'messages_type_integrity';
```

**Expected output**: Should show the CHECK constraint

### Check Resource Sharing
```sql
SELECT column_name, is_nullable, data_type
FROM information_schema.columns
WHERE table_name = 'resource_sharing'
ORDER BY ordinal_position;
```

**Expected output**: Most columns should show `is_nullable = 'YES'`

### Test Inserting Messages
```sql
-- This should SUCCEED (direct message)
INSERT INTO messages (sender_id, receiver_id, content, message_type)
VALUES ('your-user-id', 'recipient-user-id', 'Test', 'text');

-- This should SUCCEED (community message)
INSERT INTO messages (sender_id, community_id, content, message_type)
VALUES ('your-user-id', 'community-id', 'Test', 'text');

-- This should FAIL (mixed - has both)
INSERT INTO messages (sender_id, receiver_id, community_id, content, message_type)
VALUES ('your-user-id', 'recipient-id', 'community-id', 'Test', 'text');
-- ERROR: new row violates check constraint "messages_type_integrity"
```

---

## 🎯 Quick Migration Checklist

Run these in Supabase SQL Editor:

- [ ] `clear-all-messages.sql` 
- [ ] `simplify-resource-sharing.sql` (if using resource sharing)
- [ ] Verify constraint exists
- [ ] Test message insertion
- [ ] Refresh browser and test UI

---

## 📝 Notes

### Why Clear Messages?
The old messages may have mixed `receiver_id` and `community_id`, which violates the new constraint. Starting fresh ensures data integrity.

### What About My Data?
If you have important production messages, you can:
1. Export messages first
2. Run the migration
3. Re-import cleaned data

Or modify `clear-all-messages.sql` to only delete mixed messages instead of all messages.

### Safe to Run Multiple Times?
- `clear-all-messages.sql`: Will delete all messages each time (⚠️)
- `simplify-resource-sharing.sql`: Safe to run multiple times (idempotent)

---

## 🆘 Troubleshooting

### Error: "constraint already exists"
**Solution**: The constraint is already applied, skip that migration.

### Error: "violates check constraint"
**Problem**: Existing data violates the new constraint.
**Solution**: Run `clear-all-messages.sql` to start fresh.

### Error: "column does not exist"
**Problem**: Missing a prerequisite migration.
**Solution**: Check the "Already Applied" section and run missing migrations.

### Resource sharing errors
**Problem**: Schema mismatch.
**Solution**: Run `simplify-resource-sharing.sql` to fix.

---

## 📚 Related Documentation

- `COMMUNITY_MESSAGING_COMPLETE_2025-10-03.md` - Full feature documentation
- `MESSAGING_SEPARATION_FIX_2025-10-03.md` - Technical details on message separation
- `dev_notes.md` - Development history

---

**Last Updated**: 2025-10-03  
**Status**: ✅ Stable  
**Required**: Clear messages + Simplify resources

