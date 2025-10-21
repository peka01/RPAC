# ⚡ QUICK SETUP - Run This First!

**Copy/paste this entire file into Supabase SQL Editor and run once.**

This will set up everything you need in one go, error-free.

---

## 🎯 What This Does

1. ✅ Creates all base tables
2. ✅ Adds user tier system (individual, community_manager, super_admin)
3. ✅ Adds community access control (öppet/stängt)
4. ✅ Adds membership approval workflow
5. ✅ Adds license history table (for future business model)
6. ✅ Creates 8 admin utility functions
7. ✅ Updates all RLS policies

---

## 🚀 How to Use

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase project
2. Click "SQL Editor" in the sidebar
3. Click "New Query"

### Step 2: Choose Your Setup Method

#### Option A: All-in-One (Recommended) ⭐
Run the files in this order, one at a time:

```
1. supabase-schema-complete.sql       (Base schema)
2. add-user-tier-system.sql           (User tiers)
3. add-community-access-control.sql   (Community access)
4. add-membership-approval-workflow.sql (Membership workflow)
5. add-license-history-table.sql      (License tracking)
6. add-admin-utility-functions.sql    (Admin functions)
7. update-rls-policies-for-tiers.sql  (Security policies)
```

**After each file:**
- ✅ Check for "Success!" message
- ✅ Look for green checkmark
- ✅ No red errors

#### Option B: Already Have Base Tables?
If you've already run `supabase-schema-complete.sql` before:

**Skip file #1** and start with file #2

---

## ✅ Verification

After running all files, check:

### 1. Tables Exist
Go to **Table Editor**, you should see:
- ✅ `user_profiles` (with columns: user_tier, license_type, is_license_active)
- ✅ `local_communities` (with columns: access_type, auto_approve_members)
- ✅ `community_memberships` (with columns: membership_status, reviewed_by)
- ✅ `license_history` (new table)

### 2. Functions Exist
Go to **Database → Functions**, you should see:
- ✅ `get_pending_membership_requests`
- ✅ `approve_membership_request`
- ✅ `reject_membership_request`
- ✅ `upgrade_user_tier`
- ✅ And 4 more...

### 3. No Errors
All files should show success messages like:
```
✅ User tier system migration completed successfully!
✅ Community access control migration completed successfully!
✅ Membership approval workflow migration completed successfully!
```

---

## 🆘 Common Issues & Fixes

### Error: "relation user_profiles does not exist"
**Fix:** You skipped file #1. Run `supabase-schema-complete.sql` first.

### Error: "column already exists"
**Fix:** This is OK! The migration is idempotent. It skips existing columns automatically.

### Error: "syntax error at or near RAISE"
**Fix:** Make sure you're using the updated files. All RAISE statements should be in DO blocks.

### Success message shows but nothing happened
**Fix:** This is normal! If the table/column already exists, it just skips creating it.

---

## 🎯 Next Steps

After successful setup:

### 1. Create Your Super Admin Account
```sql
-- Replace YOUR_USER_ID with your actual user_id from auth.users
UPDATE user_profiles 
SET user_tier = 'super_admin',
    license_type = 'free',
    is_license_active = true
WHERE user_id = 'YOUR_USER_ID_HERE';
```

**How to find YOUR_USER_ID:**
- Go to **Authentication → Users** in Supabase
- Find your email
- Copy the UUID (looks like: `abc-123-def-456`)

### 2. Test the Admin Dashboard
Navigate to: `http://localhost:3000/super-admin`

You should see:
- ✅ Statistics dashboard
- ✅ User management
- ✅ Community management
- ✅ License management

### 3. Test the Workflow
1. Upgrade a test user to "Samhällesansvarig"
2. As that user, create a "Stängt" community
3. As another user, request to join
4. As admin, approve the request

---

## 📊 What Gets Created

### New Database Columns
- `user_profiles`: +6 columns (user_tier, license_type, etc.)
- `local_communities`: +5 columns (access_type, auto_approve_members, etc.)
- `community_memberships`: +9 columns (membership_status, reviewed_by, etc.)

### New Database Tables
- `license_history` (for future paid subscriptions)

### New Database Functions
- 8 utility functions for admin operations

### Updated Security
- 15+ RLS policies updated for tier-based permissions

---

## 💾 Safe to Run Multiple Times

All migrations are **idempotent**, meaning:
- ✅ Safe to run multiple times
- ✅ Won't duplicate data
- ✅ Won't break existing data
- ✅ Only adds what's missing

---

## 🎉 Success Checklist

After completing setup:
- [ ] All 7 files ran without errors
- [ ] Tables show new columns in Supabase
- [ ] Functions appear in Database → Functions
- [ ] Created super admin account
- [ ] Can access `/super-admin` dashboard
- [ ] Dashboard shows statistics
- [ ] Can view users and communities

---

## 📚 Documentation

- **Quick Start:** `USER_MANAGEMENT_QUICK_START.md`
- **Full Guide:** `docs/USER_MANAGEMENT_SYSTEM.md`
- **Setup Order:** `SETUP_ORDER.md` (detailed explanation)

---

## 🚀 You're Ready!

Once you see all green checkmarks, your user management system is live!

**Questions?** Check the troubleshooting section above or the full documentation.

---

**Last Updated:** October 21, 2025  
**Status:** ✅ Tested and working

