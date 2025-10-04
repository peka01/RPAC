# 🔐 Admin Setup Guide for RPAC Community Management

## Overview
This guide explains how to become an admin in a community and access admin-only features like managing community-owned resources.

---

## 🎯 Admin Roles in RPAC

### Role Hierarchy
1. **Admin** - Full control over community resources and settings
2. **Moderator** - Can manage resources but limited admin access
3. **Member** - Standard member with read-only access

---

## 📋 How to Become an Admin

### Option 1: Create a Community (Automatic Admin)
When you **create a community**, you automatically become its admin:

1. Go to **Lokal → Hitta fler**
2. Click **"Skapa nytt samhälle"**
3. Fill in community details
4. Click **"Skapa samhälle"**
5. ✅ You're now the admin of this community!

### Option 2: Manual Admin Assignment via Database

If you need to make someone admin of an existing community, use Supabase SQL Editor:

#### Step 1: Find User ID
```sql
-- Find user by email
SELECT id, email FROM auth.users WHERE email = 'user@example.com';
```

#### Step 2: Find Community ID
```sql
-- Find community by name
SELECT id, community_name FROM local_communities 
WHERE community_name LIKE '%YourCommunityName%';
```

#### Step 3: Update Role to Admin
```sql
-- Make user admin
UPDATE community_memberships
SET role = 'admin'
WHERE user_id = 'PASTE_USER_ID_HERE'
  AND community_id = 'PASTE_COMMUNITY_ID_HERE';
```

#### Step 4: Verify
```sql
-- Check admin status
SELECT 
  lc.community_name,
  up.display_name,
  cm.role
FROM community_memberships cm
JOIN local_communities lc ON cm.community_id = lc.id
JOIN user_profiles up ON cm.user_id = up.user_id
WHERE cm.user_id = 'YOUR_USER_ID'
  AND cm.role = 'admin';
```

---

## 🛠️ Admin Features

### What Admins Can Do:

#### 1. **Manage Community-Owned Resources** (Tier 2)
- ✅ **Add** community equipment, facilities, skills, information
- ✅ **Edit** existing community resources
- ✅ **Delete** community resources
- ✅ Assign responsible users
- ✅ Mark resources as "booking required"
- ✅ Set resource status (available, in use, maintenance, broken)

#### 2. **Community Settings** (Future)
- Community description and settings
- Member management
- Community visibility (public/private)

### What Non-Admins See:
- ❌ No "Lägg till samhällsresurs" button
- ❌ No edit/delete buttons on community resources
- ✅ Can view all community resources
- ✅ Can share their own resources (Tier 1)
- ✅ Can create help requests (Tier 3)
- ✅ Can book resources (if enabled)

---

## 🧪 Testing Admin Features

### Quick Test Scenario:

1. **Create a test community:**
   ```
   Name: Test Samhälle
   Description: För testning av admin-funktioner
   ```

2. **You're now admin! Navigate to:**
   ```
   Lokal → Samhällets resurser (tab)
   ```

3. **You should see:**
   - ✅ **"Lägg till resurs"** button (green, top right)
   - ✅ When resources exist: **"Redigera"** and delete buttons

4. **Add a test resource:**
   - Click "Lägg till resurs"
   - Type: Equipment (Utrustning)
   - Name: Generator
   - Category: Energi ⚡
   - Quantity: 1 st
   - Location: Samlingshuset
   - Bokning krävs: ✓
   - Click "Lägg till"

5. **Verify admin controls:**
   - You should see "Redigera" button (olive green)
   - You should see trash icon (red)
   - Click "Redigera" to test edit modal

---

## 🔍 Troubleshooting

### "I don't see the admin buttons"
**Check:**
1. Are you in the correct community?
2. Use browser console to check: `await communityService.getUserRole('COMMUNITY_ID', 'USER_ID')`
3. Verify in database:
   ```sql
   SELECT role FROM community_memberships 
   WHERE user_id = 'YOUR_USER_ID' 
     AND community_id = 'YOUR_COMMUNITY_ID';
   ```

### "I created a community but I'm not admin"
**Fix:**
Run this SQL to make creators admins automatically:
```sql
UPDATE community_memberships cm
SET role = 'admin'
FROM local_communities lc
WHERE cm.community_id = lc.id
  AND cm.user_id = lc.created_by
  AND cm.role != 'admin';
```

### "Role shows 'admin' but features don't work"
**Solution:**
1. Refresh the page (admin status is checked on mount)
2. Check browser console for errors
3. Verify RLS policies in Supabase

---

## 📊 Admin Status in Code

### How it Works:
```typescript
// Check if user is admin
const isAdmin = await communityService.isUserAdmin(communityId, userId);

// Returns true if role is 'admin' or 'moderator'
// Returns false for 'member' or no role
```

### Where Admin Check Happens:
- **Component:** `community-hub-enhanced.tsx`
- **Effect:** Runs when `activeCommunityId` changes
- **Service:** `communityService.isUserAdmin()`
- **Database:** Queries `community_memberships.role`

---

## 📝 Database Schema

### `community_memberships` Table:
```sql
CREATE TABLE community_memberships (
  id UUID PRIMARY KEY,
  community_id UUID REFERENCES local_communities(id),
  user_id UUID REFERENCES auth.users(id),
  role VARCHAR(20) DEFAULT 'member' 
    CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(community_id, user_id)
);
```

---

## 🎨 Visual Indicators

### Admin sees:
- 🟢 **"Lägg till resurs"** button (olive green gradient)
- 🟢 **"Redigera"** button on each resource
- 🔴 **Delete icon** (trash) on each resource
- 📋 Empty state with "Lägg till första resursen" button

### Non-admin sees:
- 👁️ Resources (read-only)
- 📅 "Boka resurs" button (if booking required)
- 📋 Empty state: "Samhället har inte registrerat några resurser ännu"

---

## 🚀 Next Steps

After becoming admin, you can:
1. ✅ Add community equipment and facilities
2. ✅ Manage resource bookings (when implemented)
3. ✅ Assign responsible users for resources
4. ✅ Track maintenance schedules
5. 🔄 Moderate help requests
6. 🔄 Manage community settings (coming soon)

---

## 💡 Pro Tips

1. **Make multiple admins** for redundancy
2. **Use moderator role** for trusted members
3. **Assign responsible users** to specific resources
4. **Enable booking** for high-demand equipment
5. **Add usage instructions** to prevent misuse

---

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Verify database roles in Supabase
3. Ensure RLS policies are correctly set
4. Refresh the page after role changes

**Remember:** Admin changes require a page refresh to take effect!

