# Next.js Lint Command Deprecation Note

## Important: `next lint` Deprecation Warning

As of Next.js 15+, the `next lint` command is deprecated and will be removed in Next.js 16.

### Current Warning Message
```
`next lint` is deprecated and will be removed in Next.js 16.
For new projects, use create-next-app to choose your preferred linter.
For existing projects, migrate to the ESLint CLI:
npx @next/codemod@canary next-lint-to-eslint-cli .
```

### Impact on Our Setup

**Good News:** Our current implementation still works perfectly in Next.js 15.5.2, and the `--quiet` flag is standard ESLint, so the behavior is correct.

**Action Needed:** When upgrading to Next.js 16, we'll need to migrate from `next lint` to direct ESLint CLI usage.

---

## Migration Plan (Before Next.js 16 Upgrade)

### Step 1: Run Next.js Codemod
```bash
cd rpac-web
npx @next/codemod@canary next-lint-to-eslint-cli .
```

This will:
- Update package.json scripts
- Migrate Next.js lint configuration to standard ESLint
- Preserve all existing rules and behavior

### Step 2: Update package.json Scripts

**Current (Next.js 15.5.2):**
```json
{
  "scripts": {
    "lint": "next lint",
    "lint:ci": "next lint --quiet"
  }
}
```

**After Migration (Next.js 16 ready):**
```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:ci": "eslint --quiet ."
  }
}
```

### Step 3: Verify .eslintrc.json

After running the codemod, ensure `.eslintrc.json` includes:
```json
{
  "extends": [
    "next/core-web-vitals"
  ],
  "rules": {
    // Your custom rules
  }
}
```

---

## Current Status

✅ **No immediate action required**
- We're on Next.js 15.5.2 (locked for @cloudflare/next-on-pages compatibility)
- `next lint` still works and is supported
- Our `--quiet` flag is standard ESLint, will work with direct ESLint CLI too

⏰ **Action required before Next.js 16 upgrade**
- Run migration codemod
- Test lint scripts
- Update documentation

---

## Why This Doesn't Affect Our Current Implementation

1. **The `--quiet` flag is ESLint standard**: Whether using `next lint --quiet` or `eslint --quiet`, the behavior is identical

2. **Our workflow strategy remains valid**: The conditional PR vs deploy logic doesn't depend on the command name

3. **Migration is straightforward**: Next.js provides an automated codemod for this exact scenario

---

## Testing After Migration

When you migrate, test these scenarios:

```bash
# Full lint (should show all warnings)
npm run lint

# Quiet mode (should show only errors)
npm run lint:ci

# PR strict mode (should fail if warnings exist)
npm run lint -- --max-warnings=0
```

All three should behave identically before and after migration.

---

## Updated GitHub Actions After Migration

The workflow will work without changes, but for clarity:

**Current:**
```yaml
- name: Run ESLint (PR - Strict mode)
  if: github.event_name == 'pull_request'
  run: npm run lint -- --max-warnings=0
```

**After Migration (same behavior):**
```yaml
- name: Run ESLint (PR - Strict mode)
  if: github.event_name == 'pull_request'
  run: npm run lint -- --max-warnings=0
```

The `npm run` command stays the same; only the underlying script changes.

---

## Timeline

| Date | Status | Action |
|------|--------|--------|
| **Oct 2025** | ✅ Current | Using `next lint` (works fine) |
| **Q1 2026** | ⏳ Planning | Monitor @cloudflare/next-on-pages Next.js 16 support |
| **Q2 2026** | 🔄 Migration | Run codemod when upgrading to Next.js 16 |
| **Q3 2026** | ✅ Complete | Using direct ESLint CLI |

---

## Recommendation

**Don't migrate yet.** Wait until:
1. You're ready to upgrade to Next.js 16
2. @cloudflare/next-on-pages supports Next.js 16
3. You have time to test thoroughly

The current implementation is correct and will continue working in Next.js 15.x.

---

## Related Documentation

- [Next.js ESLint Migration Guide](https://nextjs.org/docs/app/building-your-application/configuring/eslint)
- [ESLint CLI Options](https://eslint.org/docs/latest/use/command-line-interface)
- Our `LINT_STRATEGY.md` - Current lint setup documentation

---

**Created:** October 22, 2025  
**Status:** Informational - No immediate action required  
**Review Date:** When upgrading to Next.js 16

