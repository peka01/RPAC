# AI Assistant Guidelines for RPAC Development

## 🤖 Instructions for AI/LLM Assistants

This document contains specific guidelines for AI assistants working on the RPAC codebase.

## ⚠️ CRITICAL: Directory & Build Rules

### Rule 1: Always Use Correct Directory
```bash
# ✅ ALWAYS do this
cd rpac-web
npm run dev

# ❌ NEVER do this
cd C:\Users\Per Karlsson\code\RPAC  # Wrong directory!
npm run dev  # Will fail!
```

### Rule 2: Do NOT Build Unnecessarily

**IMPORTANT**: Running `npm run build` is SLOW and NOT needed during development!

#### ✅ When to run `npm run build`:
- User explicitly asks to test production build
- Before committing/pushing (to verify build passes)
- When troubleshooting production-specific issues
- Final testing before deployment

#### 🚫 Do NOT run `npm run build` after:
- Making code changes to components
- Adding new features
- Fixing bugs
- Updating styles
- Modifying documentation
- Any regular development task

#### ⚡ Correct Workflow:
```bash
# 1. Start dev server ONCE
cd rpac-web
npm run dev

# 2. Make code changes
# ... edit files ...

# 3. Check browser - changes auto-reload!
# NO BUILD NEEDED!

# 4. Only build if explicitly testing production
npm run build  # Only when necessary!
```

### Rule 3: Inform User About Server Status

When making code changes, inform the user:
- ✅ "Changes made. If dev server is running, refresh your browser to see updates."
- ✅ "Feature implemented. The dev server will hot-reload these changes automatically."
- ❌ "Running build to test changes..." (unnecessary!)

## 📋 Task Completion Checklist

When implementing features, check:

1. **Code Quality**
   - [ ] TypeScript types are correct
   - [ ] No console errors expected
   - [ ] Follows existing patterns

2. **Documentation** (if needed)
   - [ ] Update relevant docs
   - [ ] Add comments for complex logic

3. **Build Check** (ONLY if necessary)
   - [ ] User explicitly requested production testing
   - [ ] Making significant architectural changes
   - [ ] Before recommending deployment

## 🎯 Common Scenarios

### Scenario: User reports a bug
```bash
# 1. Read the file with the bug
# 2. Make the fix
# 3. Tell user to check browser (dev server will reload)
# 4. NO BUILD NEEDED
```

### Scenario: User wants new feature
```bash
# 1. Implement the feature
# 2. Test logic/types
# 3. Tell user feature is ready
# 4. NO BUILD NEEDED (unless user asks for production test)
```

### Scenario: User asks "does it build?"
```bash
# This is the ONLY time to run build
cd rpac-web
npm run build
```

### Scenario: Major architectural changes
```bash
# Good practice to verify build after big changes
cd rpac-web
npm run build  # Verify no build errors
```

## 📝 Response Templates

### After implementing a feature:
```
✅ Feature implemented! If your dev server is running (npm run dev), 
refresh your browser to see the changes. The updates will hot-reload 
automatically.

[Explain what was changed]
```

### When user needs production testing:
```
Let me verify the production build works correctly.
[Run npm run build]
✅ Build successful! [Report results]
```

### When starting fresh:
```
To start the development server:

cd rpac-web
npm run dev

Then open http://localhost:3000 in your browser.
```

## 🚀 Performance Guidelines

- **Dev server startup**: ~5-10 seconds (acceptable)
- **Production build**: ~30-60 seconds (AVOID unless necessary!)
- **Hot reload**: ~1-2 seconds (automatic)

**Key Insight**: Development workflow should be FAST. Building slows things down unnecessarily!

## 🔧 When Things Go Wrong

### Error: "Cannot find package.json"
**Cause**: Wrong directory  
**Fix**: `cd rpac-web`

### Error: Stale build artifacts
**Fix**: 
```bash
cd rpac-web
rm -rf .next out
npm run dev  # Restart dev server
```

### Error: Port 3000 in use
**Fix**: Kill the process or use different port
```bash
npm run dev -- -p 3001
```

## 📚 Related Documentation

- `../docs/DEVELOPMENT_SETUP.md` - Complete setup guide
- `../docs/llm_instructions.md` - LLM integration guidelines
- `./conventions.md` - Code conventions

---

**Remember**: Fast development workflow = happy developers! 
Only build when truly necessary. 🚀

