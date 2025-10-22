 need to run the entire 

**Ready to use in 5 minutes!**

---

## Step 1: Run Database Migrations

**IMPORTANT:** Run these files in Supabase SQL Editor **in this exact order**:

```
1. supabase-schema-complete.sql       (Base tables - RUN FIRST!)
2. add-user-tier-system.sql           (User tiers)
3. add-community-access-control.sql   (Community access)
4. add-membership-approval-workflow.sql (Membership workflow)
5. add-license-history-table.sql      (License tracking)
6. add-admin-utility-functions.sql    (Admin functions)
7. update-rls-policies-for-tiers.sql  (Security policies)
```

**See:** `database/RUN_ME_FIRST.md` for detailed instructions

✅ **All migrations are safe to run multiple times**  
✅ **All syntax errors have been fixed**

---

## Step 2: Create Your Super Admin Account

Find your user_id in Supabase:
1. Go to Authentication → Users
2. Copy your user UUID

Then run:

```sql
UPDATE user_profiles 
SET user_tier = 'super_admin',
    license_type = 'free',
    is_license_active = true,
    tier_upgraded_at = NOW()
WHERE user_id = 'YOUR_USER_ID_HERE';
```

---

## Step 3: Access Admin Panel

1. **Navigate to**: `http://localhost:3000/super-admin/login`
2. **Login with your super admin credentials** (email + password)
3. If your `user_tier` is `super_admin`, you'll be redirected to the dashboard

You should see:
- ✅ System statistics dashboard
- ✅ User management
- ✅ Community management
- ✅ License management (future)
- ✅ Sign Out button (top right)

**Note**: The super admin section has its own dedicated login page to prevent accidentally accessing it with the wrong user account.

---

## Step 4: Create a Test Community Manager

1. Go to `/super-admin/users`
2. Find a test user
3. Click "Redigera"
4. Select "Samhällesansvarig"
5. Click "Spara ändringar"

---

## Step 5: Test the Workflow

### As Community Manager:
1. Go to `/local` → "Upptäck samhällen"
2. Click "Skapa samhälle"
3. Choose "Stängt samhälle" (closed)
4. Create the community

### As Regular User:
1. Go to the community
2. Click "Ansök om medlemskap"
3. Wait for approval

### As Community Manager:
1. See pending request counter
2. Click "Godkänn" to approve
3. User gets instant notification

---

## 🎯 Key Features

### Three User Tiers

| Tier | Can Do |
|------|--------|
| **Privatperson** | Join communities, manage own resources |
| **Samhällesansvarig** | Everything above + Create and manage communities |
| **Superadministratör** | Everything above + Manage all users and communities |

### Two Community Types

| Type | Behavior |
|------|----------|
| **Öppet** 🌐 | Anyone can join instantly |
| **Stängt** 🔒 | Requires admin approval |

---

## 🔧 Troubleshooting

### Can't access /super-admin
**Problem:** "Du har inte behörighet"  
**Solution:** Ensure your user_tier is 'super_admin' in database

### Can't create community
**Problem:** No "Skapa samhälle" button  
**Solution:** Upgrade user to 'community_manager' tier

### Migrations fail
**Problem:** "column already exists"  
**Solution:** This is OK! Migrations are idempotent (safe to run multiple times)

---

## 📚 Full Documentation

For complete details, see: `rpac-web/docs/USER_MANAGEMENT_SYSTEM.md`

---

## ✨ What's Next?

1. **Customize** access types for your communities
2. **Test** the approval workflow
3. **Invite** team members and assign tiers
4. **When ready for business model:** Add Stripe/Swish integration

---

**Questions?** Check `docs/dev_notes.md` for implementation history

**Need help?** All code follows RPAC conventions (olive green colors, Swedish localization, mobile-first)

