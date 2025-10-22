# Postal Code Focus Fix

**Date:** October 22, 2025  
**Issue:** Postal code field was not receiving focus when directed from location prompts  
**Status:** ✅ FIXED

## Problem

When users clicked "Ange postnummer" button from location prompts and were directed to `/settings?highlight=postal_code`, the postal code field was:
- ✅ Highlighting correctly
- ✅ Scrolling into view
- ❌ **NOT receiving focus** (keyboard not ready)

## Root Cause

The focus logic was running in the same useEffect as the profile loading, causing a race condition:
1. Component mounts
2. useEffect triggers immediately
3. Focus attempt happens while component is still in `loading` state
4. Input field doesn't exist yet → focus fails silently
5. Component finishes loading and renders the field
6. But focus has already been attempted and won't retry

## Solution

Split the logic into two separate useEffects:

### Before (Not Working):
```tsx
useEffect(() => {
  loadProfile();
  
  // This runs immediately, before loading completes
  if (params.get('highlight') === 'postal_code') {
    setTimeout(() => {
      postalCodeRef.current?.focus(); // Field doesn't exist yet!
    }, 500);
  }
}, []); // Only runs on mount
```

### After (Working):
```tsx
// Effect 1: Load profile
useEffect(() => {
  loadProfile();
}, []);

// Effect 2: Focus field AFTER loading completes
useEffect(() => {
  if (loading) return; // ← KEY: Wait for loading to finish
  
  const params = new URLSearchParams(window.location.search);
  if (params.get('highlight') === 'postal_code') {
    setHighlightPostalCode(true);
    
    const scrollAndFocus = () => {
      if (postalCodeRef.current) {
        // Field exists! Now we can focus it
        postalCodeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          postalCodeRef.current?.focus();
          postalCodeRef.current?.select(); // Bonus: select existing text
        }, 500);
      } else {
        // Field not ready yet, retry
        setTimeout(scrollAndFocus, 100);
      }
    };
    
    setTimeout(scrollAndFocus, 300);
    setTimeout(() => setHighlightPostalCode(false), 4300);
  }
}, [loading]); // ← KEY: Runs when loading state changes
```

## Key Improvements

1. **Separate Effects**: Loading and highlighting are now independent
2. **Loading Guard**: `if (loading) return;` prevents premature execution
3. **Retry Logic**: If field not ready, retry after 100ms
4. **Text Selection**: `select()` highlights existing text for easy replacement
5. **Proper Timing**: 
   - Wait 300ms after loading completes
   - Wait 500ms after scroll for smooth animation
   - Total highlight duration: 4 seconds

## Testing

Now when users click the location prompt button:
1. ✅ Settings page loads
2. ✅ Component waits for loading to complete
3. ✅ Postal code field scrolls into view (smooth)
4. ✅ **Field receives focus** (keyboard ready)
5. ✅ Existing text selected (if any)
6. ✅ Highlight shows for 4 seconds
7. ✅ User can immediately start typing

## Files Modified

- `rpac-web/src/components/unified-profile-settings.tsx`
- `rpac-web/PROFILE_SETTINGS_IMPROVEMENTS.md` (updated documentation)

## Verification Steps

1. Open any location prompt (e.g., Community Hub without postal code)
2. Click "Ange postnummer" button
3. Observe:
   - Settings page loads
   - Postal code field scrolls into view
   - Field has **visible focus ring**
   - **Cursor is blinking** in the field
   - Can immediately type without clicking

---

**Fix Complete** ✅  
Postal code field now receives focus correctly after page load!

