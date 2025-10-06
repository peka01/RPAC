# Favicon & Web Manifest Update

## ✅ Changes Implemented

### 1. **Favicon Updated**
- Now uses the golden RPAC shield (`beready-shield.png`)
- Updated in `src/app/layout.tsx` metadata
- Multiple sizes configured (16x16, 32x32)
- Also created SVG version (`public/favicon.svg`)

### 2. **Web Manifest Files**
Created/Updated:
- ✅ `public/manifest.json` - Main manifest
- ✅ `public/site.webmanifest` - Alternative manifest format
- Both now reference `beready-shield.png` as the icon

### 3. **Theme Colors Updated**
- Changed from green `#2E7D32` to olive green `#3D4A2B`
- Matches RPAC's military-grade olive green color scheme

### 4. **Icon Configuration**
```json
{
  "icons": [
    {
      "src": "/beready-shield.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/beready-shield.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/beready-shield.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

## 📱 Progressive Web App (PWA) Support
The app is now properly configured as a PWA with:
- ✅ Standalone display mode
- ✅ Golden shield icon for home screen
- ✅ Proper theme colors
- ✅ Swedish language support
- ✅ Portrait orientation default

## 🔍 Testing
To see the new favicon:
1. Clear browser cache (Ctrl+Shift+Del)
2. Hard refresh (Ctrl+F5)
3. Check browser tab - should show golden shield
4. Add to home screen on mobile - will use golden shield icon

## 📦 Files Modified
- `rpac-web/src/app/layout.tsx`
- `rpac-web/public/manifest.json`
- `rpac-web/public/site.webmanifest` (new)
- `rpac-web/public/favicon.svg` (new)

---
**Note**: The golden shield is now your app's identity across all platforms! 🛡️✨

