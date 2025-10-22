# How to Restart Dev Server & See Your Changes

## The Problem
`npm run dev` with Hot Module Replacement (HMR) isn't picking up the new code changes.

## Solution - Full Restart

### Step 1: Stop Dev Server
In your terminal where `npm run dev` is running:
- Press `Ctrl + C` (Windows/Linux)
- Or `Cmd + C` (Mac)

### Step 2: Clear Cache
```powershell
cd C:\GITHUB\RPAC\rpac-web
Remove-Item -Recurse -Force .next
```

### Step 3: Restart Dev Server
```powershell
npm run dev
```

### Step 4: Hard Refresh Browser
- Press `Ctrl + Shift + R` (Windows)
- Or `Cmd + Shift + R` (Mac)
- Or Clear browser cache completely

## You Should Now See:
1. **Console logs:**
   - `🐛 CREATE MODAL DEBUG: ...`
   - `🎯 RENDERING ACCESS TYPE SECTION`

2. **Red border box** around access type section

3. **Two radio buttons:**
   - 🌍 Öppet samhälle
   - 🔒 Stängt samhälle

## If Still Not Working
Open browser console and run:
```javascript
// Count how many community-discovery files are loaded
performance.getEntriesByType('resource')
  .filter(r => r.name.includes('community-discovery'))
  .forEach(r => console.log(r.name));
```

This will show if the old file is still being cached.

