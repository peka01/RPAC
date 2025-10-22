# Quick Fix Instructions - Super Admin Users Page

## The Problem
Super-admin users page shows no users, returns 400 error with message:
```
column reference "user_tier" is ambiguous
```

## The Solution (1 Simple Step!)

### Open Supabase SQL Editor and run:
```
rpac-web/database/FIX_GET_ALL_USERS_FINAL.sql
```

That's it! ✅

## What This Does
- Drops the broken function
- Creates a fixed version that resolves the column ambiguity
- Grants proper permissions

## How To Verify It Worked
1. **Check SQL output** → Should say: `✅ get_all_users function created successfully!`
2. **Refresh** `/super-admin/users` page
3. **Check browser console** → Should say: `✅ Users loaded successfully: X`
4. **See users** in the table!

## Technical Details
The issue was PostgreSQL couldn't tell the difference between:
- The variable `v_admin_tier` (declared in function)
- The column `user_tier` (from table)

When we wrote `IF v_admin_tier != 'super_admin'`, PostgreSQL got confused.

**Fix**: Use `<>` instead of `!=` and ensure all column references use table aliases.

---

## File Location
```
C:\GITHUB\RPAC\rpac-web\database\FIX_GET_ALL_USERS_FINAL.sql
```

## One-Liner Copy/Paste
Open this file in Supabase SQL Editor and click "Run" → Done! 🚀

