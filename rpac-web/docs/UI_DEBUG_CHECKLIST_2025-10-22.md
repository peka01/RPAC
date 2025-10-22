# UI Debug Checklist - Access Type Toggles Missing

## Problem Statement
User reports that "Öppet/Stängt" toggles are NOT showing in:
1. Create Community modal
2. Edit Community modal

## ✅ Verification: Code IS Correct

### Create Modal (`community-discovery.tsx` lines 746-791)
```tsx
{/* Access Type */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-3">
    {t('community.access_type') || 'Åtkomsttyp'} <span className="text-red-500">*</span>
  </label>
  <div className="space-y-3">
    <label className="flex items-start gap-3 p-3 border-2...">
      <input type="radio" name="accessType" value="öppet".../>
      🌍 Öppet samhälle
    </label>
    <label className="flex items-start gap-3 p-3 border-2...">
      <input type="radio" name="accessType" value="stängt".../>
      🔒 Stängt samhälle
    </label>
  </div>
</div>
```

### Edit Modal (`community-discovery.tsx` lines 888-959)
```tsx
{/* Access Type (Öppet/Stängt) */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-3">
    {t('community.access_type')} <span className="text-red-500">*</span>
  </label>
  [Same radio button UI as create modal]
</div>
```

## 🔍 Debug Steps

### Step 1: Verify Build Success
```bash
cd C:\GITHUB\RPAC\rpac-web
Remove-Item -Recurse -Force .next
npm run build
```

**Expected Output:**
```
✓ Compiled successfully
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization
```

**Current Status:** Build completes but need to verify no TypeScript errors

### Step 2: Check Browser Cache
After successful build:
1. Open browser DevTools (F12)
2. Go to Application tab → Clear storage
3. Check "Clear site data"
4. Hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)

### Step 3: Verify Translation Keys

Check if these exist in `src/lib/locales/sv.json`:
```json
{
  "community": {
    "access_type": "Åtkomsttyp",
    "open_community": "Öppet samhälle",
    "closed_community": "Stängt samhälle",
    "open_community_description": "Alla kan gå med direkt utan godkännande",
    "closed_community_description": "Medlemsansökningar kräver godkännande från administratör",
    "auto_approve": "Automatiskt godkännande"
  }
}
```

**Fallback Values:** Code uses `||` fallbacks, so even if translations are missing, it should show Swedish text.

### Step 4: Console Debug

Add debug logging to verify modal is rendering:

**In `community-discovery.tsx` line ~703:**
```tsx
<form onSubmit={handleCreateCommunity} className="space-y-4">
  {/* Add debug log */}
  {console.log('CREATE MODAL RENDERING', { createForm })}
  
  {/* Community Name */}
  <div>...
```

**Expected Console Output:**
```
CREATE MODAL RENDERING { name: '', description: '', isPublic: true, accessType: 'öppet' }
```

### Step 5: Check Element Visibility

In browser DevTools Console, run:
```javascript
// Check if access type div exists
document.querySelectorAll('input[name="accessType"]').length
// Should return: 2 (two radio buttons)

// Check if labels are visible
document.querySelectorAll('label').forEach(el => {
  if (el.textContent.includes('Öppet') || el.textContent.includes('Stängt')) {
    console.log('Found:', el.textContent, 'Visible:', el.offsetParent !== null);
  }
});
```

### Step 6: Check Modal State

Add state logging:
```tsx
// In community-discovery.tsx around line 690
{showCreateModal && (
  <div className="fixed inset-0...">
    {console.log('MODAL OPEN', { showCreateModal, createForm })}
    ...
  </div>
)}
```

## 🐛 Possible Causes & Solutions

### Cause 1: CSS Display None
**Symptom:** Elements exist in DOM but not visible

**Check:**
```javascript
// In browser console
document.querySelector('input[name="accessType"]').closest('div').style.display
```

**Solution:** Remove any `display: none` or `hidden` classes

### Cause 2: Modal Rendering Old Version
**Symptom:** Old modal without toggles

**Solution:**
1. Check if there are multiple versions of component
2. Verify import path: `import { ... } from './community-discovery'`
3. Check if mobile vs desktop components are different

### Cause 3: Conditional Rendering
**Symptom:** Code has a condition hiding the toggles

**Check:** Look for any `if` statements around lines 746-791

### Cause 4: Z-Index Issues
**Symptom:** Toggles rendered but covered by another element

**Solution:**
```css
/* Check z-index in DevTools */
.modal { z-index: 50 }
```

### Cause 5: Translation Keys Breaking Render
**Symptom:** Missing translation breaks component

**Test:**
```tsx
// Temporarily hardcode text
<label>
  Åtkomsttyp <span className="text-red-500">*</span>
</label>
```

## 📝 Verification Checklist

After fixes, verify:

- [ ] Build completes successfully (no errors)
- [ ] Browser cache cleared
- [ ] Hard refresh done (Ctrl+Shift+R)
- [ ] Modal opens when clicking "Skapa samhälle"
- [ ] See "Åtkomsttyp" label with red asterisk
- [ ] See two radio buttons: Öppet and Stängt
- [ ] Can select each option
- [ ] Descriptions show under each option
- [ ] Same UI in Edit modal

## 🎯 Expected Final UI

**Create/Edit Modal should show:**
```
┌─────────────────────────────────────────┐
│ Namn*                                    │
│ [Samhällets namn____________]            │
│                                          │
│ Beskrivning                              │
│ [Beskrivning av samhället____]           │
│ [______________________________]         │
│                                          │
│ 📍 Plats: [Your Location]                │
│                                          │
│ Åtkomsttyp *                             │
│ ┌─────────────────────────────────────┐ │
│ │ ⚪ 🌍 Öppet samhälle               │ │
│ │   Alla kan gå med direkt...        │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ ⚪ 🔒 Stängt samhälle              │ │
│ │   Medlemsansökningar kräver...     │ │
│ └─────────────────────────────────────┘ │
│                                          │
│ ☑ Synligt i sökningar                   │
│                                          │
│ [Avbryt]  [Skapa]                        │
└─────────────────────────────────────────┘
```

## 🔧 Quick Fix Commands

```powershell
# Full clean rebuild
cd C:\GITHUB\RPAC\rpac-web
Remove-Item -Recurse -Force .next, node_modules\.cache
npm run build

# If still not showing, check Git status
git status
git diff src/components/community-discovery.tsx

# Verify file content
Get-Content src/components/community-discovery.tsx | Select-String -Pattern "access_type|accessType" -Context 2
```

## 📞 Support Info

If toggles still don't show after all checks:

1. **Take screenshot** of:
   - Full modal
   - Browser DevTools Console (F12)
   - Browser DevTools Elements tab showing modal HTML

2. **Run these and share output:**
```javascript
// In browser console when modal is open
console.log('Inputs:', document.querySelectorAll('input[name="accessType"]').length);
console.log('Form data:', document.querySelector('form').innerHTML.substring(0, 500));
```

3. **Check file hash** to verify latest version:
```powershell
Get-FileHash C:\GITHUB\RPAC\rpac-web\src\components\community-discovery.tsx
```

## ✅ Success Indicators

You'll know it's working when:
1. Modal opens smoothly
2. Two prominent radio button cards visible
3. Can click each option
4. Selected option has olive green border
5. Can create/edit community with chosen access type
6. Settings save without 400 error

---
**Last Updated:** 2025-10-22  
**Files Modified:** `community-discovery.tsx`  
**Lines:** 746-791 (Create), 888-959 (Edit)

