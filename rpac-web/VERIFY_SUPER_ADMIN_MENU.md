# 🔍 Verify Super Admin Menu - Critical Steps

**Date:** 2025-10-22

## Issue
User cannot see the "Super Admin" menu option in either desktop or mobile navigation.

## What Was Changed
The following files have been updated with the Super Admin menu option:

### ✅ Files Updated:
1. **`src/components/top-menu.tsx`** (Desktop Navigation)
   - Added `Shield` icon import
   - Added Super Admin menu option at line 239-253
   - Only visible when `userProfile?.user_tier === 'super_admin'`

2. **`src/components/mobile-navigation-v2.tsx`** (Mobile Navigation)
   - Added `Shield` icon import
   - Added `userProfile` state and `loadUserProfile()` function
   - Added Super Admin menu option at line 353-373
   - Only visible when `userProfile?.user_tier === 'super_admin'`

## ✅ Code Verification
Run these commands to verify the code is in place:

```powershell
# Verify desktop menu
Select-String -Pattern "Super Admin" -Path "C:\GITHUB\RPAC\rpac-web\src\components\top-menu.tsx" -Context 2

# Verify mobile menu
Select-String -Pattern "Super Admin" -Path "C:\GITHUB\RPAC\rpac-web\src\components\mobile-navigation-v2.tsx" -Context 2
```

## 🔄 CRITICAL: Dev Server Restart

**The dev server MUST be restarted to pick up these changes!**

### Option 1: Hard Restart (Recommended)
```powershell
cd C:\GITHUB\RPAC\rpac-web
taskkill /F /IM node.exe
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run dev
```

### Option 2: Browser Hard Refresh
1. **Stop the dev server** (Ctrl+C in terminal)
2. **Delete `.next` folder**
3. **Start dev server** (`npm run dev`)
4. **Hard refresh browser** (Ctrl+Shift+R or Ctrl+F5)
5. **Clear browser cache** (Ctrl+Shift+Delete)

## 🧪 Testing Steps

### Desktop:
1. Go to `http://localhost:3000/dashboard`
2. Click on your **user avatar/name** in the top right
3. Look for **"Super Admin"** option with purple Shield icon
4. It should appear **between Settings and Logout**

### Mobile:
1. Go to `http://localhost:3000/dashboard` on mobile/small screen
2. Tap the **user icon** (person icon in top right)
3. Look for **"Super Admin"** option with purple background
4. It should show:
   - Purple shield icon
   - "Super Admin" title
   - "Systemadministration" subtitle

## ❓ If Menu Still Not Visible

### Check 1: User Profile
The menu only shows for users with `user_tier = 'super_admin'` in the `user_profiles` table.

**Verify in Supabase:**
```sql
SELECT id, email, user_tier 
FROM user_profiles 
WHERE id = 'YOUR_USER_ID';
```

If `user_tier` is NOT `'super_admin'`, update it:
```sql
UPDATE user_profiles 
SET user_tier = 'super_admin' 
WHERE id = 'YOUR_USER_ID';
```

### Check 2: Browser Console
Open browser DevTools (F12) and check Console for errors loading user profile.

### Check 3: Network Tab
1. Open DevTools → Network tab
2. Filter for `user_profiles`
3. Verify the API call is returning `user_tier: 'super_admin'`

### Check 4: React DevTools
1. Install React DevTools extension
2. Find `TopMenu` or `MobileNavigationV2` component
3. Check if `userProfile.user_tier` equals `'super_admin'`

## 📝 Components Being Used

The app uses these navigation components:

### Desktop:
- **Layout:** `src/components/responsive-layout-wrapper.tsx`
  - Renders `SideMenuResponsive`
- **Top Nav:** `src/components/top-menu.tsx` ← **This has Super Admin menu**
- **Side Nav:** `src/components/side-menu-clean.tsx`

### Mobile:
- **Layout:** `src/components/responsive-layout-wrapper.tsx`
  - Renders `SideMenuResponsive`
- **Mobile Nav:** `src/components/mobile-navigation-v2.tsx` ← **This has Super Admin menu**

## 🚨 Most Likely Issue

**The dev server is serving cached code!**

1. **Kill ALL Node processes**
2. **Delete `.next` folder**
3. **Restart dev server**
4. **Hard refresh browser multiple times**
5. **Clear browser cache completely**

## 📞 Final Check

If after all this you still don't see it:
1. Share a screenshot of the user menu
2. Share the browser console output
3. Share the output of: `SELECT user_tier FROM user_profiles WHERE id = 'YOUR_USER_ID'`

