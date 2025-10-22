# 🔍 Debug Super Admin Menu

**Date:** 2025-10-22

## Issue
User can access `/super-admin` directly but doesn't see the "Super Admin" menu option in the user dropdown.

## Changes Made
Added debug logging to both navigation components to track the `userProfile` state:

### 1. Desktop Navigation (`top-menu.tsx`)
- Added console.log at line 228 to log `userProfile` and `user_tier` when menu opens

### 2. Mobile Navigation (`mobile-navigation-v2.tsx`)
- Added console.log at line 353 to log `userProfile` and `user_tier` when menu opens

## Steps to Debug

1. **Hard refresh your browser** (Ctrl+Shift+R or Ctrl+F5) to clear any cached JavaScript

2. **Go to any page** (e.g., `http://localhost:3000/dashboard`)

3. **Open browser DevTools Console** (F12)

4. **Click on your user menu** (top right, your name/email)

5. **Look for the debug logs** in the console:
   - `🔍 TopMenu - userProfile:` (desktop)
   - `🔍 MobileNav - userProfile:` (mobile)

## What to Check

The console log will show:
- The full `userProfile` object
- The `user_tier` value specifically

### Expected Output (for super admin):
```
🔍 TopMenu - userProfile: {id: "...", user_tier: "super_admin", ...} user_tier: "super_admin"
```

### Problem Scenarios:

#### Scenario 1: `userProfile` is `null` or `undefined`
**Problem:** User profile not loading  
**Solution:** Check if `loadUserProfile()` function is being called

#### Scenario 2: `user_tier` is `null`, `undefined`, or different value
**Problem:** User doesn't have super_admin tier in database  
**Solution:** Check database `user_profiles` table:
```sql
SELECT id, email, user_tier FROM auth.users 
JOIN user_profiles ON auth.users.id = user_profiles.id 
WHERE auth.users.id = 'YOUR_USER_ID';
```

#### Scenario 3: `user_tier` is `"super_admin"` but menu still doesn't show
**Problem:** React not re-rendering  
**Solution:** Clear `.next` cache and restart dev server

## Quick Database Check

Run this in Supabase SQL Editor to verify your user tier:

```sql
-- Find your user
SELECT 
  au.id,
  au.email,
  up.user_tier,
  up.display_name
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE au.email = 'YOUR_EMAIL_HERE';
```

## If user_tier is NOT 'super_admin', run this:

```sql
-- Update your user to super_admin
UPDATE user_profiles 
SET user_tier = 'super_admin' 
WHERE id = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL_HERE');
```

## After Fixing

1. **Log out and log back in** (this ensures fresh session data)
2. **Hard refresh** (Ctrl+Shift+R)
3. **Click user menu** again
4. **Super Admin option should now appear** (with purple Shield icon)

---

## Current Status
- ✅ Code is correct in both files
- ✅ No linter errors
- ✅ Dev server is running on port 3000
- ⏳ Waiting for debug output to diagnose the issue

