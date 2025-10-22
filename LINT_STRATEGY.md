# ESLint Strategy for CI/CD

## Overview

Our linting setup is optimized for different contexts:
- **Local Development**: Full warnings visible to help developers
- **Pull Requests**: Strict mode (--max-warnings=0) to prevent new warnings
- **Deploy Builds**: Quiet mode (errors only) for clean logs

## Problem Solved

**Before:** Deploy logs showed ~700 ESLint warnings, making it impossible to see real errors or deployment status.

**After:** Deploy logs only show ESLint errors, while PRs still enforce code quality standards.

---

## Package.json Scripts

### `npm run lint`
```bash
next lint
```
**Usage:** Local development and PR checks  
**Output:** All errors AND warnings  
**Purpose:** Help developers see and fix code quality issues

### `npm run lint:ci`
```bash
next lint --quiet
```
**Usage:** Deploy builds (push to main/master)  
**Output:** Errors only (warnings suppressed)  
**Purpose:** Keep deploy logs clean while catching critical issues

---

## GitHub Actions Workflow Behavior

### Pull Request Builds
```yaml
- name: Run ESLint (PR - Strict mode)
  if: github.event_name == 'pull_request'
  run: npm run lint -- --max-warnings=0
```

**What it does:**
- Runs full ESLint with all warnings shown
- Fails if ANY warnings are present (`--max-warnings=0`)
- Enforces code quality for new code
- Prevents warning count from growing

**Why:**
- PRs are the quality gate
- Developers should fix warnings before merging
- Keeps codebase quality high over time

### Deploy Builds (Push to main/master)
```yaml
- name: Run ESLint (Deploy - Quiet mode)
  if: github.event_name == 'push'
  run: npm run lint:ci
```

**What it does:**
- Runs ESLint in quiet mode (--quiet flag)
- Only shows errors (warnings suppressed)
- Still fails build if errors exist
- Keeps deploy logs clean

**Why:**
- Deploy logs need to be readable
- Existing warnings don't block deployments
- Errors still caught and prevent bad deployments
- Team can see deployment status clearly

---

## Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ Developer pushes code                                       │
└─────────────────┬───────────────────────────────────────────┘
                  │
         ┌────────┴─────────┐
         │                  │
    Pull Request        Push to main
         │                  │
         ▼                  ▼
   ┌─────────────┐    ┌─────────────┐
   │ npm run lint│    │npm run lint:│
   │ --max-warn=0│    │     ci      │
   ├─────────────┤    ├─────────────┤
   │ • All errors│    │ • Errors    │
   │ • All warns │    │ • No warns  │
   │ • Fail if   │    │ • Fail if   │
   │   warns > 0 │    │   errors    │
   └─────────────┘    └─────────────┘
         │                  │
         │                  │
    Must pass          Must pass
    to merge          to deploy
```

---

## Local Development Workflow

### Full lint check (recommended before commit)
```bash
cd rpac-web
npm run lint
```
**Output:**
```
✓ No ESLint errors found.
⚠ 734 warnings found.
  • no-unused-vars: 234 warnings
  • no-explicit-any: 189 warnings
  • react-hooks/exhaustive-deps: 145 warnings
  ...
```

### Quiet check (what CI deploy sees)
```bash
cd rpac-web
npm run lint:ci
```
**Output:**
```
✓ No ESLint errors found.
```

### Test PR strict mode locally
```bash
cd rpac-web
npm run lint -- --max-warnings=0
```
**Output:**
```
✖ Build failed with 734 warnings
```

---

## Gradual Warning Reduction Strategy

Since we have ~700 warnings, here's how to reduce them over time:

### Option 1: Fix warnings incrementally
```bash
# See warning breakdown
npm run lint

# Fix one category at a time
# Example: Fix unused imports in one file
npm run lint -- --fix src/components/SomeComponent.tsx
```

### Option 2: Auto-fix safe warnings
```bash
# Auto-fix all auto-fixable issues
npm run lint -- --fix

# Review changes before committing
git diff
```

### Option 3: Disable noisy rules temporarily
Add to `.eslintrc.json`:
```json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": ["warn", { 
      "argsIgnorePattern": "^_" 
    }]
  }
}
```

---

## FAQ

### Q: Why not just disable all warnings in CI?
**A:** We still want warnings to show in PRs to catch issues early and maintain code quality.

### Q: Will this hide real problems?
**A:** No. ESLint **errors** (actual bugs) still show in all contexts. Only **warnings** (style issues) are hidden in deploy logs.

### Q: Can I see warnings in deploy logs if I need to?
**A:** Yes, temporarily change the workflow to use `npm run lint` instead of `npm run lint:ci`, or check the PR build logs.

### Q: What's the difference between errors and warnings?
- **Errors**: Critical issues that ESLint considers bugs (e.g., undefined variables, syntax errors)
- **Warnings**: Code quality issues that don't break functionality (e.g., unused vars, any types)

### Q: Should I fix warnings locally?
**A:** Yes! Warnings help you write better code. They're just hidden in deploy logs to keep them readable.

### Q: Will existing warnings block my PR?
**A:** Yes, if using `--max-warnings=0`. This is intentional to prevent warning accumulation. Fix them or discuss with the team about adjusting rules.

---

## Troubleshooting

### Issue: PR fails with "too many warnings"
**Solution:**
1. Run `npm run lint` locally to see warnings
2. Fix warnings in your changed files
3. If warnings are in untouched files, consider:
   - Creating a separate PR to fix those warnings
   - Temporarily adjusting `--max-warnings` threshold
   - Using `// eslint-disable-next-line` for valid exceptions

### Issue: Deploy logs still showing warnings
**Solution:**
- Verify workflow is using `npm run lint:ci` for push events
- Check `package.json` has `lint:ci` script with `--quiet` flag
- Clear GitHub Actions cache if old workflow is cached

### Issue: Want to see warnings in deploy logs temporarily
**Solution:**
Edit `.github/workflows/deploy.yml`:
```yaml
- name: Run ESLint (Deploy - Quiet mode)
  if: github.event_name == 'push'
  run: npm run lint  # Changed from lint:ci
```

---

## Best Practices

### ✅ Do:
- Run `npm run lint` before committing
- Fix warnings in files you're editing
- Use `// eslint-disable-next-line` sparingly with comments explaining why
- Set up your IDE to show ESLint warnings inline

### ❌ Don't:
- Disable entire rule categories without team discussion
- Ignore warnings completely
- Use `// eslint-disable` for large blocks without justification
- Bypass `--max-warnings=0` in PRs without addressing the warnings

---

## Monitoring Warning Count

### Check current warning count
```bash
cd rpac-web
npm run lint 2>&1 | grep "warnings found"
```

### Track over time
Add to your workflow (optional):
```yaml
- name: Count warnings
  run: |
    WARNINGS=$(npm run lint 2>&1 | grep -oP '\d+(?= warnings)' || echo "0")
    echo "Current warning count: $WARNINGS"
```

---

## Future Improvements

### Short-term (Next sprint):
- [ ] Fix auto-fixable warnings with `npm run lint -- --fix`
- [ ] Create issue to track warning reduction goal
- [ ] Document accepted exceptions in code comments

### Medium-term (Next month):
- [ ] Reduce warnings to < 100
- [ ] Enable stricter rules for new code
- [ ] Update ESLint config for better defaults

### Long-term (Next quarter):
- [ ] Achieve `--max-warnings=0` for entire codebase
- [ ] Enable all recommended rules
- [ ] Set up pre-commit hooks with lint-staged

---

## Related Files

- `rpac-web/package.json` - Contains `lint` and `lint:ci` scripts
- `.github/workflows/deploy.yml` - CI/CD workflow with conditional linting
- `rpac-web/.eslintrc.json` - ESLint configuration (if exists)
- `rpac-web/next.config.js` - Next.js ESLint integration settings

---

**Created:** October 22, 2025  
**Last Updated:** October 22, 2025  
**Author:** CI/CD Optimization Task

