# 🧪 RPAC Resource Sharing Testing Guide

## 🎯 **Quick Test Checklist**

### **Phase 1: Basic Functionality (5 minutes)**
- [ ] **Login** with demo user (`demo@beready.se` / `demo123`)
- [ ] **Navigate to Individual** → Resources section
- [ ] **Check console** - should see NO 400 errors
- [ ] **Share a resource** - status should stay "Tillgänglig" (not "Ej tillgänglig")

### **Phase 2: Resource Sharing Flow (10 minutes)**
- [ ] **Share a resource** with community
- [ ] **Verify status** shows as "Tillgänglig" 
- [ ] **Check community hub** - resource should appear
- [ ] **Request the resource** from another user's perspective
- [ ] **Check request management** - owner should see request

### **Phase 3: Request Management (10 minutes)**
- [ ] **Approve a request** - status should change to "Hämtad"
- [ ] **Deny a request** - status should reset to "Tillgänglig"
- [ ] **Complete a request** - workflow should finish properly

---

## 🚀 **Efficient Testing Strategy**

### **1. Console Monitoring (Most Important)**
```javascript
// Open browser dev tools → Console
// Look for these patterns:

✅ GOOD:
- No 400 errors from resource_requests
- No "relation does not exist" errors
- Clean resource sharing operations

❌ BAD:
- Failed to load resource: 400
- Error loading requests: Object
- Relation "resource_requests" does not exist
```

### **2. Database Verification**
```sql
-- Check if table exists
SELECT * FROM resource_requests LIMIT 1;

-- Check if policies work
SELECT * FROM resource_sharing WHERE status = 'available';
```

### **3. User Flow Testing**

#### **Test User A (Resource Owner):**
1. Login → Individual → Resources
2. Share a resource (e.g., "Potatis 5kg")
3. Check status shows "Tillgänglig" ✅
4. Go to Community Hub → see shared resource
5. Click "Hantera" → should see request management

#### **Test User B (Requester):**
1. Login with different account
2. Go to Community Hub
3. See shared resource from User A
4. Click "Be om" → should create request
5. Check if User A sees the request

### **4. Status Flow Testing**
```
Available → Requested → Approved → Completed
    ↓           ↓          ↓
  Taken      Denied    Available
```

---

## 🔧 **Quick Fixes if Issues Found**

### **Issue: Still getting 400 errors**
```sql
-- Run this in Supabase SQL Editor:
\i fix-resource-requests-table.sql
```

### **Issue: Status shows "Ej tillgänglig"**
- Check if `handleToggleAvailability` is using 'taken' not 'reserved'
- Verify status mapping in components

### **Issue: Requests not loading**
- Check RLS policies are correct
- Verify user permissions
- Check console for specific error messages

---

## 📱 **Mobile Testing**
- [ ] Test on mobile viewport (F12 → Device toolbar)
- [ ] Check touch targets (min 44px)
- [ ] Verify bottom sheet modals work
- [ ] Test request management on mobile

---

## 🎯 **Success Criteria**

### **✅ All Good If:**
- No console errors
- Resources share with "Tillgänglig" status
- Request workflow works end-to-end
- Mobile experience is smooth
- Database queries return data

### **❌ Needs Fix If:**
- 400 errors in console
- Status immediately shows "Ej tillgänglig"
- Request management doesn't load
- Mobile interactions don't work

---

## 🚀 **Pro Tips for Efficient Testing**

1. **Use Demo User**: `demo@beready.se` / `demo123`
2. **Open Multiple Tabs**: Test different user perspectives
3. **Monitor Console**: Keep dev tools open during testing
4. **Test Edge Cases**: Empty states, network errors, etc.
5. **Mobile First**: Always test mobile viewport first

---

## 🐛 **Common Issues & Solutions**

| Issue | Symptom | Solution |
|-------|---------|----------|
| 400 Errors | Console shows failed requests | Run `fix-resource-requests-table.sql` |
| "Ej tillgänglig" | Status wrong immediately | Check toggle logic uses 'taken' |
| No Requests | Request management empty | Check RLS policies |
| Mobile Issues | Touch targets too small | Verify 44px minimum |

---

**🎯 Start with Phase 1 - if that works, you're 90% there!**
