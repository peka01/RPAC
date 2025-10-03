# 🚨 QUICK FIX: Messaging System Errors

## The Problem
When you click "Meddelanden" in a community, you see errors:
```
Error loading messaging data: Could not find a relationship between 
'community_memberships' and 'user_profiles' in the schema cache
```

## The Solution (2 Steps)

### Step 1: Fix Avatar Storage Policies
**File**: `rpac-web/database/update-avatar-storage-policies.sql`

Run this in Supabase SQL Editor.

### Step 2: Fix Database Relationships  
**File**: `rpac-web/database/fix-user-profiles-relationships.sql`

Run this in Supabase SQL Editor.

## That's It!

After running both scripts:
1. ✅ Restart your dev server
2. ✅ Refresh the browser
3. ✅ Messaging should now work!

---

**See full details**: `docs/DATABASE_RELATIONSHIP_FIX_2025-10-03.md`

