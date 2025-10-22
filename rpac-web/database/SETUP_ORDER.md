# 🚀 Database Setup Order - CRITICAL!

**IMPORTANT:** Run these files in the correct order!

---

## ⚠️ Prerequisites

You need a Supabase project set up. If you haven't done that yet:
1. Go to https://supabase.com
2. Create a new project
3. Wait for it to initialize (~2 minutes)

---

## 📋 Step 1: Run Base Schema (FIRST!)

**File:** `supabase-schema-complete.sql`

This creates all the base tables:
- `user_profiles`
- `local_communities`
- `community_memberships`
- `resources`
- `messages`
- `notifications`
- And many more...

**How to run:**
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Click "New Query"
4. Copy/paste the entire `supabase-schema-complete.sql` file
5. Click "Run"
6. ✅ Wait for success message

---

## 📋 Step 2: Run User Management Migrations (IN ORDER!)

Now run these 6 files **in this exact order**:

### 1. User Tier System
**File:** `add-user-tier-system.sql`
- Adds: `user_tier`, `license_type`, `license_expires_at`, etc.

### 2. Community Access Control
**File:** `add-community-access-control.sql`
- Adds: `access_type` (öppet/stängt), `auto_approve_members`, etc.

### 3. Membership Approval Workflow
**File:** `add-membership-approval-workflow.sql`
- Adds: `membership_status`, `reviewed_by`, `rejection_reason`, etc.

### 4. License History Table
**File:** `add-license-history-table.sql`
- Creates: `license_history` table for future business model

### 5. Admin Utility Functions
**File:** `add-admin-utility-functions.sql`
- Creates: 8 database functions for admin operations

### 6. Updated RLS Policies
**File:** `update-rls-policies-for-tiers.sql`
- Updates: Row Level Security policies for tier system

---

## ✅ Verification

After running all files, verify in Supabase:

### Check Tables:
Go to Table Editor, you should see:
- ✅ `user_profiles` (with new columns: user_tier, license_type, etc.)
- ✅ `local_communities` (with new columns: access_type, auto_approve_members, etc.)
- ✅ `community_memberships` (with new columns: membership_status, reviewed_by, etc.)
- ✅ `license_history` (new table)

### Check Functions:
Go to Database → Functions, you should see:
- ✅ `get_pending_membership_requests`
- ✅ `approve_membership_request`
- ✅ `reject_membership_request`
- ✅ `ban_community_member`
- ✅ `upgrade_user_tier`
- ✅ `get_managed_communities`
- ✅ `get_all_users`
- ✅ `get_community_statistics`

---

## 🆘 Troubleshooting

### Error: "relation user_profiles does not exist"
**Solution:** You skipped Step 1! Run `supabase-schema-complete.sql` first.

### Error: "column already exists"
**Solution:** This is OK! The migrations are idempotent (safe to run multiple times).

### Error: "syntax error at or near RAISE"
**Solution:** This should be fixed. Make sure you're using the updated migration files.

### Error: "function does not exist"
**Solution:** Make sure you ran migration #5 (add-admin-utility-functions.sql).

---

## 🎯 Quick Summary

**Complete setup order:**
1. ✅ `supabase-schema-complete.sql` (BASE - RUN FIRST!)
2. ✅ `add-user-tier-system.sql`
3. ✅ `add-community-access-control.sql`
4. ✅ `add-membership-approval-workflow.sql`
5. ✅ `add-license-history-table.sql`
6. ✅ `add-admin-utility-functions.sql`
7. ✅ `update-rls-policies-for-tiers.sql`

**Then:**
8. Create your super admin account (see Quick Start guide)
9. Access `/super-admin` dashboard
10. Test the system!

---

## 📚 Next Steps

After successful database setup:
- Follow: `USER_MANAGEMENT_QUICK_START.md`
- Read: `docs/USER_MANAGEMENT_SYSTEM.md`

---

**Need help?** Check the error message and match it with the troubleshooting section above.

