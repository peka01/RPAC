# Demo User - Quick Reference

## 🚀 Quick Commands

### Login Credentials
```
Email: demo@beready.se
Password: demo123
```

### Setup New Demo User
```sql
-- Step 1: Click "Log in as Demo" on login page (auto-creates user)
-- Step 2: Run this in Supabase SQL Editor:
\i setup-demo-user.sql
```

### Reset Demo User
```sql
-- Soft reset (keep user, delete data):
\i reset-demo-user.sql

-- Hard reset (delete everything):
-- Edit reset-demo-user.sql and uncomment OPTION 2
```

### Check Demo User Status
```sql
SELECT 
  u.id,
  u.email,
  u.created_at,
  (SELECT COUNT(*) FROM resources WHERE user_id = u.id) as resources,
  (SELECT COUNT(*) FROM cultivation_plans WHERE user_id = u.id) as plans,
  (SELECT COUNT(*) FROM community_memberships WHERE user_id = u.id) as communities
FROM auth.users u
WHERE u.email = 'demo@beready.se';
```

## 📁 Files

- `setup-demo-user.sql` - Creates demo user with sample data
- `reset-demo-user.sql` - Resets demo user to clean slate
- `DEMO_USER_SETUP.md` - Full setup documentation

## 🎯 What Gets Created

### User Profile
- Name: Demo Användare
- Location: Växjö, Kronoberg (35230)
- Household: 2 people, no children

### Community
- Name: Demo Samhälle
- Location: Växjö
- Role: Admin

### Resources (10 items)
- Food: Ris (5kg), Pasta (3kg), Konserver (10st)
- Water: 18 liters
- Medicine: Förstahjälpen, Alvedon
- Tools: Ficklampa, Batterier, Radio, Tändstickor

### Cultivation Plan
- Title: Min Sommarodling 2025
- Crops: Potatis, Morötter, Lök, Tomater, Gurka, Sallad

## 🔧 Troubleshooting

### "Demo user not found"
→ Click "Log in as Demo" to create it automatically

### "Can't update profile"
→ Check RLS policies: `SELECT * FROM user_profiles WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'demo@beready.se');`

### "Can't share resources"
→ Run setup script to create demo community and membership

### "No data showing"
→ Run `setup-demo-user.sql` to create sample data

## 💡 Tips

- The demo user is a **real user** in Supabase Auth
- All data follows **normal RLS policies**
- Safe to delete and recreate anytime
- Use soft reset between tests to keep the same user ID
- Use hard reset if you need a completely fresh start

