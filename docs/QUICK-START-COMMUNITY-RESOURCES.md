# 🚀 Quick Start: Community Resources

## ✅ Current Status
- ✅ You are admin (role: 'admin')
- ✅ Buttons are working (click handlers fire)
- ⏳ Need to create database tables

## 📋 Next Steps

### **Step 1: Create Database Tables**

**Go to Supabase Dashboard:**
1. Open **SQL Editor** (left sidebar)
2. Create **New Query**
3. Copy and paste the entire content of:
   ```
   rpac-web/database/SETUP-COMMUNITY-RESOURCES.sql
   ```
4. Click **Run** (or Ctrl/Cmd + Enter)

**You should see:**
```
✅ SETUP COMPLETE!
Table exists: ✅ YES
RLS policies created: 4 policies

🎉 You can now add community resources!
```

### **Step 2: Refresh Browser**

After running the SQL:
1. Go back to your app
2. **Hard refresh:** Ctrl + Shift + R
3. Navigate to: **Lokal → Samhällets resurser**
4. Click: **"Lägg till första resursen"**

### **Step 3: Add Your First Resource**

The modal should now open with a form. Try adding:

**Example Resource:**
- **Typ av resurs:** Equipment (Utrustning) 🔧
- **Namn på resursen:** Generator
- **Kategori:** Energi ⚡
- **Antal:** 1
- **Enhet:** st
- **Plats:** Samlingshuset
- **Användningsinstruktioner:** "Använd bara utomhus. Finns tankning i förrådet."
- **Bokning krävs:** ✓ (checked)
- **Anteckningar:** "Kontakta ansvarig innan användning"
- Click **"Lägg till"**

---

## 🔍 Troubleshooting

### If modal still doesn't open after SQL:
Check browser console for errors related to:
- `CommunityResourceModal`
- `relation "community_resources" does not exist`

### If you get permission errors:
Run this in Supabase to verify your admin status:
```sql
SELECT role FROM community_memberships 
WHERE user_id = auth.uid() 
AND community_id = (SELECT id FROM local_communities LIMIT 1);
```

Should return: `admin`

---

## 📸 Expected Result

After adding your first resource, you should see:
- ✅ Resource card appears in grid
- ✅ Button changes to "Lägg till resurs" (top right)
- ✅ You can **Redigera** (edit) or delete the resource
- ✅ Members can see but not edit

---

**Status: Buttons work, now just need to create tables!** 🎯

