# Messaging Display Names Fix
**Date**: 2025-10-03  
**Status**: ✅ COMPLETED

## 🐛 Problem

In the Direktmeddelanden (Direct Messages) list, all users showed as "Medlem" instead of their actual names.

## 🔍 Root Cause (Discovered via Debug Logs)

```
📊 Fetched profiles: [{…}]
👤 Processing user: 34645cf8-7ee5-4a3c-ab06-d1ac8f2ab721 Profile: {display_name: '', ...}
👤 Processing user: 1def1560-5a92-454c-af4b-f97442c9403e Profile: undefined
```

**Two issues found:**

1. **Empty display_name**: User had a profile but `display_name` was empty string `''`
2. **Missing profile**: User had no `user_profiles` row at all

## ✅ Solution

### Part 1: Fix Empty Display Names

**SQL Script**: `rpac-web/database/fix-empty-display-names.sql`

- Finds all profiles with NULL or empty `display_name`
- Fetches email from `auth.users`
- Sets `display_name` to email prefix (before @)
- Example: `per.karlsson@example.com` → `per.karlsson`

**Result**: ✅ User now shows as "per.karlsson" instead of "Medlem"

### Part 2: Create Missing Profiles

**SQL Script**: `rpac-web/database/create-missing-user-profiles.sql`

- Finds all users in `community_memberships` without profiles
- Creates `user_profiles` rows for them
- Populates `display_name` from their email

**Result**: ✅ All community members now have profiles and display names

## 📝 Code Changes

### `rpac-web/src/lib/messaging-service.ts`

**Changed from server-side joins to client-side joins:**

```typescript
// OLD (broken): Tried to use Supabase !inner join
.select('*, user_profiles!inner(display_name, ...)')

// NEW (working): Fetch separately, join in code
const memberships = await supabase.from('community_memberships').select('user_id, role');
const profiles = await supabase.from('user_profiles').select('user_id, display_name, ...');
// Join them in JavaScript
```

**Added fallback for missing/empty names:**

```typescript
if (!profile || !profile.display_name || profile.display_name.trim() === '') {
  userName = `Medlem ${index + 1}`;
} else {
  userName = profile.display_name.trim();
}
```

## 🎯 How to Apply

### Step 1: Fix Empty Display Names
```sql
-- Run in Supabase SQL Editor:
-- File: rpac-web/database/fix-empty-display-names.sql
```

### Step 2: Create Missing Profiles
```sql
-- Run in Supabase SQL Editor:
-- File: rpac-web/database/create-missing-user-profiles.sql
```

### Step 3: Verify
```sql
-- Check all profiles have display_name:
SELECT user_id, display_name, email
FROM user_profiles up
JOIN auth.users au ON up.user_id = au.id
WHERE display_name IS NULL OR display_name = '';
-- Should return 0 rows
```

### Step 4: Restart & Test
1. Restart dev server (if code was updated)
2. Hard refresh browser (Ctrl+Shift+R)
3. Go to Meddelanden → Direktmeddelanden
4. Should now see actual names instead of "Medlem"

## 🧪 Testing Results

**Before:**
- ❌ All users showed as "Medlem"
- ❌ Console error: PGRST200

**After:**
- ✅ Users show as "per.karlsson", "johndoe", etc.
- ✅ No console errors
- ✅ Fallback to "Medlem 1", "Medlem 2" for edge cases

## 📚 Related Files

**SQL Migrations:**
- `rpac-web/database/fix-empty-display-names.sql` - Fix empty/NULL display names
- `rpac-web/database/create-missing-user-profiles.sql` - Create missing profiles
- `rpac-web/database/add-display-name-to-profiles.sql` - Original migration (adds columns)

**Code:**
- `rpac-web/src/lib/messaging-service.ts` - Updated `getOnlineUsers()` method
- `rpac-web/src/lib/resource-sharing-service.ts` - Updated to use client-side joins
- `rpac-web/src/components/messaging-system-v2.tsx` - Displays contact names

## 🔄 Ongoing Maintenance

**When a new user signs up:**
- The trigger `set_default_display_name()` should auto-populate `display_name` from email
- If it doesn't, run `create-missing-user-profiles.sql` again

**When a user changes their display name:**
- They can update it in Settings → Profile
- Changes will appear immediately in messaging

## 💡 Lessons Learned

1. **Client-side joins are more reliable** than Supabase's `!inner` syntax when there's no direct FK
2. **Always check for NULL AND empty strings** when validating text fields
3. **Users can join communities before completing their profile** - need to handle this gracefully
4. **Debug logging is essential** for database relationship issues

---

**Status**: ✅ Fixed and tested  
**Breaking Changes**: None  
**Database Changes**: Adds profiles, populates display_name

