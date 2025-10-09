# Database Cleanup Plan - Cultivation System

## 🎯 **OBJECTIVE**
Clean up obsolete cultivation-related database files and migrations after the cultivation system restoration.

## ✅ **KEEP THESE FILES (ACTIVE SYSTEM)**

### **Core Cultivation System**
- `add-cultivation-plans-table.sql` - ✅ **ACTIVE** - Main cultivation plans table
- `add-cultivation-reminders-table.sql` - ✅ **ACTIVE** - Reminder system
- `add-crops-column.sql` - ✅ **ACTIVE** - Crops column for cultivation_plans
- `add-is-primary-column.sql` - ✅ **ACTIVE** - Primary plan flag
- `add-primary-plan-flag.sql` - ✅ **ACTIVE** - Primary plan functionality

### **User Profile System**
- `add-experience-level-column.sql` - ✅ **ACTIVE** - User experience level
- `add-display-name-to-profiles.sql` - ✅ **ACTIVE** - User display names

### **Community & Messaging System**
- `add-community-resources-table.sql` - ✅ **ACTIVE** - Community resources
- `add-messaging-and-location.sql` - ✅ **ACTIVE** - Messaging system
- `add-notifications-table.sql` - ✅ **ACTIVE** - Notification system
- `add-resource-requests-table.sql` - ✅ **ACTIVE** - Resource requests
- `add-resource-requests-table-simple.sql` - ✅ **ACTIVE** - Simple resource requests
- `add-resource-sharing-community.sql` - ✅ **ACTIVE** - Resource sharing
- `add-resource-sharing-denormalized-columns.sql` - ✅ **ACTIVE** - Resource sharing optimization

### **Core Infrastructure**
- `supabase-schema-complete.sql` - ✅ **ACTIVE** - Complete schema (needs cleanup)
- `create-missing-user-profiles.sql` - ✅ **ACTIVE** - User profile creation
- `setup-avatar-storage-policies.sql` - ✅ **ACTIVE** - Avatar storage
- `update-avatar-storage-policies.sql` - ✅ **ACTIVE** - Avatar policy updates
- `make-user-admin.sql` - ✅ **ACTIVE** - Admin setup
- `setup-demo-user.sql` - ✅ **ACTIVE** - Demo user setup

## ❌ **REMOVE THESE FILES (OBSOLETE)**

### **Obsolete Migration Files**
- `COMPLETE_MIGRATION.sql` - ❌ **OBSOLETE** - Contains old cultivation_calendar setup
- `nutrition-data-schema.sql` - ❌ **OBSOLETE** - Nutrition calculations moved to cultivation_plans
- `final-resource-sharing-fix.sql` - ❌ **OBSOLETE** - Temporary fix file

### **Obsolete Column Additions**
- `add-reminder-fields.sql` - ❌ **OBSOLETE** - Reminder fields moved to cultivation_reminders table

### **Obsolete Category Additions**
- `add-machinery-category.sql` - ❌ **OBSOLETE** - Machinery category not used
- `add-message-type-constraint.sql` - ❌ **OBSOLETE** - Message constraints handled elsewhere

## 🔧 **CLEANUP ACTIONS**

### **1. Remove Obsolete Files**
```bash
# Remove obsolete migration files
rm rpac-web/database/COMPLETE_MIGRATION.sql
rm rpac-web/database/nutrition-data-schema.sql
rm rpac-web/database/final-resource-sharing-fix.sql
rm rpac-web/database/add-reminder-fields.sql
rm rpac-web/database/add-machinery-category.sql
rm rpac-web/database/add-message-type-constraint.sql
```

### **2. Clean Up supabase-schema-complete.sql**
- Remove obsolete table definitions:
  - `cultivation_calendar`
  - `crisis_cultivation_plans`
  - `garden_layouts`
  - `nutrition_calculations`
  - `plant_diagnoses`
- Remove obsolete functions:
  - `get_user_cultivation_calendar()`
  - `get_user_stats()` (references removed tables)
- Remove obsolete indexes and policies

### **3. Run Database Cleanup Script**
- Execute `CULTIVATION_DATABASE_CLEANUP.sql` in Supabase
- This removes obsolete tables from the live database

## 📊 **IMPACT ASSESSMENT**

### **Files to Remove: 6 files**
- `COMPLETE_MIGRATION.sql` (~163 lines)
- `nutrition-data-schema.sql` (~50 lines)
- `final-resource-sharing-fix.sql` (~30 lines)
- `add-reminder-fields.sql` (~25 lines)
- `add-machinery-category.sql` (~20 lines)
- `add-message-type-constraint.sql` (~15 lines)

### **Total Cleanup: ~303 lines of obsolete SQL**

### **Database Tables to Remove: 5 tables**
- `cultivation_calendar`
- `crisis_cultivation_plans`
- `garden_layouts`
- `nutrition_calculations`
- `plant_diagnoses`

## ✅ **VERIFICATION CHECKLIST**

After cleanup, verify:
- [ ] `cultivation_plans` table still exists and works
- [ ] `cultivation_reminders` table still exists and works
- [ ] SimpleCultivationManager can create/read/update/delete plans
- [ ] Reminder system still functions
- [ ] No broken imports or references to removed tables
- [ ] Application builds and runs successfully

## 🎯 **BENEFITS**

1. **Reduced Confusion** - No more obsolete migration files
2. **Cleaner Database** - Removed unused tables and columns
3. **Faster Queries** - Fewer tables to scan
4. **Better Maintenance** - Clear separation between active and obsolete code
5. **Reduced Storage** - Less database storage used

---

**Created:** 2025-10-09  
**Status:** Ready for execution  
**Risk Level:** Low (only removes confirmed obsolete files)
