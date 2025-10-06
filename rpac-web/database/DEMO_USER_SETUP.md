# Demo User Setup Guide

## 🎯 Quick Setup

The demo user is automatically created when someone clicks **"Log in as Demo"** on the login page!

### Demo User Credentials
- **Email**: `demo@beready.se`
- **Password**: `demo123`

## 📋 Full Demo Setup (Database Data)

To set up a fully functional demo user with sample data:

### Option 1: Automatic (Easiest)
1. Click **"Log in as Demo"** on the login page
2. The user will be created automatically if it doesn't exist
3. Run the SQL script below to add sample data

### Option 2: Manual Setup
1. Go to Supabase Dashboard → Authentication → Add User
2. Create user with:
   - Email: `demo@beready.se`
   - Password: `demo123`
3. Run the SQL script below

### Running the Setup Script

1. Open Supabase SQL Editor
2. Copy and paste the contents of `setup-demo-user.sql`
3. Click **Run**

The script will create:
- ✅ User profile (Demo Användare from Växjö)
- ✅ Demo community ("Demo Samhälle" in Växjö)
- ✅ Community membership (demo user as admin)
- ✅ 10 sample resources (food, water, medicine, tools)
- ✅ Sample cultivation plan with 6 crops

### Verification

After running the script, you should see output like:
```
✅ User profile created/updated for demo user
✅ Demo community created/updated: [UUID]
✅ Demo user added as community member
✅ Sample resources created (10 items)
✅ Sample cultivation plan created
🎉 DEMO USER FULLY SET UP AND READY!
```

## 🔄 Re-running the Script

The script is **idempotent** - safe to run multiple times:
- Existing data will be updated, not duplicated
- Resources will be deleted and recreated (fresh start)
- Cultivation plans will be deleted and recreated

## 🔃 Resetting Demo User

To reset the demo user to a clean slate, use `reset-demo-user.sql`:

### Soft Reset (Recommended)
Keeps the user account, deletes all data:
```sql
-- Run the default version of reset-demo-user.sql
-- This deletes: cultivation plans, resources, memberships, messages
-- Keeps: user account, user profile (reset to defaults)
```

### Hard Reset (Nuclear Option)
Deletes the user account completely:
```sql
-- Uncomment the OPTION 2 section in reset-demo-user.sql
-- This deletes EVERYTHING including the auth user
-- Requires recreating the user by clicking "Log in as Demo"
```

### Community Reset
Deletes just the Demo Samhälle community:
```sql
-- Uncomment the OPTION 3 section in reset-demo-user.sql
-- Deletes the Demo Samhälle community and all its data
```

### Workflow for Fresh Demo
1. Run `reset-demo-user.sql` (soft reset)
2. Run `setup-demo-user.sql` (add fresh sample data)
3. Demo user is ready with fresh data!

## 🧪 Testing Demo Features

After setup, the demo user can:
- ✅ View and edit profile
- ✅ See 10 sample resources in "Resurser"
- ✅ View cultivation plan with 6 crops
- ✅ Join and participate in "Demo Samhälle" community
- ✅ Share resources with the community
- ✅ Use KRISter AI assistant with real context
- ✅ Get personalized tips based on crops and resources

## 🐛 Troubleshooting

### "Demo user not found"
- Run the setup script to create the user profile and data
- Or click "Log in as Demo" to auto-create the user

### "Can't share resources to community"
- Make sure the setup script ran successfully
- Check that demo user is a member of "Demo Samhälle"

### "Profile update fails"
- Check RLS policies allow user to update their own profile
- Verify the demo user exists in auth.users

## 📝 Notes

- The demo user is a real authenticated user in Supabase
- All data is stored in the regular database tables
- Demo user follows the same RLS policies as regular users
- Safe to delete and recreate anytime for testing

