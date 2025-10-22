# Deploy Admin Functions to Supabase

## ⚠️ REQUIRED: Database Functions Missing

The community admin features require database functions that need to be deployed to Supabase.

## 🚀 Quick Deploy

### Option 1: Via Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard/project/dsoujjudzrrtkkqwhpge
   - Navigate to **SQL Editor**

2. **Run the CLEAN deployment script**
   - ⚠️ **USE THIS FILE**: `DEPLOY_ADMIN_FUNCTIONS_CLEAN.sql` (NOT add-admin-utility-functions.sql)
   - Copy the entire contents of `DEPLOY_ADMIN_FUNCTIONS_CLEAN.sql`
   - Paste into SQL Editor
   - Click **RUN**

   **Why use the CLEAN version?**
   - It safely drops existing functions first (prevents signature conflicts)
   - Includes the corrected `get_all_users` function
   - All-in-one deployment script

3. **Verify deployment**
   ```sql
   -- Check if functions exist
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_schema = 'public' 
   AND routine_name IN (
     'get_pending_membership_requests',
     'approve_membership_request',
     'reject_membership_request',
     'ban_community_member',
     'get_managed_communities'
   );
   ```

### Option 2: Via Supabase CLI

```bash
cd rpac-web
supabase db push database/add-admin-utility-functions.sql
```

## 📋 Functions Being Deployed

1. **`get_pending_membership_requests(p_community_id UUID)`**
   - Returns list of pending membership requests with user details
   - Used by: Medlemmar tab (pending filter)

2. **`approve_membership_request(p_membership_id UUID, p_reviewer_id UUID)`**
   - Approves a pending membership request
   - Sends notification to user
   - Updates member count

3. **`reject_membership_request(p_membership_id UUID, p_reviewer_id UUID, p_reason TEXT)`**
   - Rejects a membership request with optional reason
   - Sends notification to user

4. **`ban_community_member(p_membership_id UUID, p_admin_id UUID, p_reason TEXT)`**
   - Bans a member from community (future use)

5. **`get_managed_communities(p_user_id UUID)`**
   - Gets all communities a user is admin/moderator of

6. **`upgrade_user_tier(...)` and `get_all_users(...)`**
   - Super-admin functions for user management

## ✅ After Deployment

1. **Refresh the page** in your browser
2. **Go to Mitt samhälle → Administratörsverktyg → Medlemmar**
3. **Check console** - should see:
   ```
   ✅ Loaded pending requests: X
   ✅ Loaded members: Y
   ```

## 🐛 If Still Getting 400 Error

1. Check Supabase logs for function errors
2. Verify RLS policies allow admins to call these functions
3. Check that `community_memberships` table has `requested_at` column

## 📞 Troubleshooting

**Error: "function does not exist"**
→ Functions not deployed. Run SQL script in Supabase Dashboard.

**Error: "permission denied"**
→ RLS policies blocking. Check that admin check in functions is working.

**Error: "column does not exist"**
→ Schema mismatch. Check `community_memberships` table has all required columns.

---

## 🎯 Quick Summary

**File to deploy**: `rpac-web/database/DEPLOY_ADMIN_FUNCTIONS_CLEAN.sql` ⭐
**Alternative file**: `rpac-web/database/add-admin-utility-functions.sql` (if clean deployment fails)
**Required for**: Community Admin Dashboard (Medlemmar, Settings, Homepage tabs)

**The CLEAN script includes:**
- DROP statements to remove old function signatures
- All 8 admin utility functions
- Success confirmation message

