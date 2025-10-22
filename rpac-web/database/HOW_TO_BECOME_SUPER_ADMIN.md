# 🚀 How to Become Super Admin

**Problem**: You're getting "column user_profiles.user_tier does not exist" error.

**Solution**: Follow these steps in order.

---

## ✅ Step 1: Run the Migration (Add user_tier column)

Go to **Supabase Dashboard → SQL Editor**

Run this file: **`add-user-tier-system.sql`**

You should see:
```
✅ Added user_tier column to user_profiles
✅ User tier system migration completed successfully!
```

---

## ✅ Step 2: Find Your User ID (Optional - if you're not sure)

Run this file: **`FIND_MY_USER_ID.sql`**

It will show all users. Find your email and copy the `user_id`.

---

## ✅ Step 3: Make Yourself Super Admin

### **EASIEST METHOD** (Recommended):

1. **Open**: `CREATE_SUPER_ADMIN_PROFILE.sql`
2. **Edit line 15**: Change `'per.karlsson@title.se'` to **YOUR EMAIL**
3. **Save the file**
4. **Copy the entire file contents**
5. **Paste into Supabase SQL Editor**
6. **Click Run**

You should see:
```
✅ Found user: your@email.com (ID: your-user-id)
✅ Created new profile as super_admin (or Updated existing profile)
✅ SUCCESS! You are now a super admin.
```

---

## ✅ Step 4: Refresh Your Browser

1. Go to: `http://localhost:3000/super-admin/login`
2. **Sign in** with your email and password
3. You should be redirected to the Super Admin Dashboard! 🎉

---

## 🔧 Troubleshooting

### "User with email X not found"
→ You haven't signed up yet. Go to `http://localhost:3000` and create an account first.

### "column user_tier does not exist"
→ You skipped Step 1. Run `add-user-tier-system.sql` first.

### "Still getting Access Denied"
→ Clear your browser cache (Ctrl+Shift+R) and try logging in again.

---

## 📝 Quick Copy-Paste (If you prefer manual)

Replace `YOUR_EMAIL_HERE` with your actual email:

```sql
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Find user ID
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'YOUR_EMAIL_HERE';

  -- Create or update profile
  INSERT INTO user_profiles (
    user_id, user_tier, license_type, is_license_active,
    climate_zone, family_size, created_at, updated_at
  ) VALUES (
    v_user_id, 'super_admin', 'free', true,
    'svealand', 1, NOW(), NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    user_tier = 'super_admin',
    license_type = 'free',
    is_license_active = true,
    updated_at = NOW();

  RAISE NOTICE 'SUCCESS! You are now a super admin with ID: %', v_user_id;
END $$;
```

---

**That's it! You're done.** 🎯

