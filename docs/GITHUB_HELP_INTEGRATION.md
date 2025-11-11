# GitHub-Based Help System Architecture

**Version:** 1.0  
**Last Updated:** November 11, 2025  
**Status:** ✅ PRODUCTION SYSTEM (Mandatory Architecture)

## Critical Principle

**⚠️ THE HELP SYSTEM MUST ALWAYS READ FROM GITHUB ⚠️**

Help content is NOT bundled in the application. Help files are NOT served as static assets. Help content is ALWAYS fetched from the GitHub repository in real-time.

**Why?**
1. **Single source of truth**: GitHub repository is authoritative for all help content
2. **Immediate visibility**: Changes to help files are visible instantly after commit (no redeployment needed)
3. **No stale content**: Static files would become outdated and create confusion
4. **Edit workflow**: Help files can be edited directly in GitHub or through the help editor
5. **Version control**: All help changes tracked in git with full history

## System Architecture

### Flow Diagram

```
User opens KRISter assistant
    ↓
KRISter determines current route + params
    ↓
Looks up route in help-mappings.json
    ↓
Calls /api/help/[...path]
    ↓
API route fetches from GitHub
    ↓
GitHub API (with auth token)
    ↓ (fallback if API fails)
GitHub raw URL (https://raw.githubusercontent.com)
    ↓
Returns markdown content
    ↓
KRISter renders help in UI
```

### Components

#### 1. Help API Route
**File:** `rpac-web/src/app/api/help/[...path]/route.ts`

**Purpose:** Proxy endpoint that fetches markdown files from GitHub repository

**Key Features:**
- Edge runtime compatible (Cloudflare Pages)
- Security whitelist (VALID_HELP_FILES array)
- Dual fetch strategy (API + raw URL fallback)
- Comprehensive error logging
- Cache-busting headers

**Environment Variables:**
```bash
GITHUB_OWNER=peka01          # Repository owner
GITHUB_REPO=RPAC             # Repository name
GITHUB_BRANCH=main           # Branch to fetch from
GITHUB_HELP_DIR=rpac-web/public/help  # Help files directory
GITHUB_TOKEN=ghp_xxx         # Personal access token (REQUIRED for rate limits)
```

**Fetch Strategy:**
1. **First attempt**: GitHub API with auth token
   - URL: `https://api.github.com/repos/peka01/RPAC/contents/rpac-web/public/help/{path}.md?ref=main`
   - Headers: `Authorization: Bearer ${GITHUB_TOKEN}`
   - Benefit: Higher rate limits (5000/hour vs 60/hour), proper error messages

2. **Fallback**: GitHub raw URL with cache-busting
   - URL: `https://raw.githubusercontent.com/peka01/RPAC/main/rpac-web/public/help/{path}.md?t={timestamp}`
   - No auth required but rate limited
   - Direct file access

3. **Failure**: Return 404 with detailed error message
   - NO static file fallback
   - NO bundled content fallback
   - Explicit failure to make issues visible

#### 2. Security Whitelist
**Location:** `route.ts` line 20-50

**Current List (33 files):**
```typescript
const VALID_HELP_FILES = [
  'dashboard',
  'individual/overview',
  'individual/resources',
  'individual/cultivation',
  'individual/knowledge',
  'individual/coach',
  'individual/contacts',
  'individual/plan',
  'local/home',
  'local/discover',
  'local/activity',
  'local/forum',
  'local/map',
  'local/find',
  'local/members',
  'local/garden',
  'local/resources-shared',
  'local/resources-owned',
  'local/resources-help',
  'local/messages-community',
  'local/messages-direct',
  'local/admin',
  'regional/overview',
  'settings/profile',
  'settings/security',
  'settings/account',
  'settings/privacy',
  'settings/notifications',
  'settings/preferences',
  'admin/overview',
  'admin/super-admin',
  'auth/login',
  'auth/register',
];
```

**Purpose:** Prevent arbitrary file access via path traversal attacks

**Maintenance:** When adding new help files, MUST add to this whitelist

#### 3. Route Mappings Configuration
**File:** `rpac-web/public/config/help-mappings.json`

**Purpose:** Maps application routes + URL parameters to help file paths

**Example:**
```json
{
  "mappings": [
    {
      "route": "/settings",
      "params": "?tab=profile",
      "helpFile": "settings/profile"
    },
    {
      "route": "/local",
      "params": "?tab=resources&resourceTab=shared",
      "helpFile": "local/resources-shared"
    }
  ]
}
```

**Editor:** Visual route mappings editor in help-file-editor.tsx (KRISter → "Redigera hjälpfil" → "Rutt-mappningar" tab)

#### 4. Help Editor with GitHub Sync
**File:** `rpac-web/src/components/help-file-editor.tsx`

**Features:**
- Markdown editor with live preview
- AI assistance for content generation
- Route mappings visual editor
- Direct save to GitHub (via API)
- File listing from GitHub repo

**Workflow:**
1. User clicks "Redigera hjälpfil" in KRISter
2. Editor fetches current file from GitHub
3. User edits markdown with AI assistance
4. Click "Spara" → Commits directly to GitHub
5. Changes visible immediately in KRISter (no redeploy)

## GitHub API Integration Details

### Authentication

**Required:** GitHub Personal Access Token (PAT)

**Scopes Needed:**
- `repo` (full repository access)
  - Needed for: Contents API, commits, file operations

**Environment Setup:**

**Local Development (.env.local):**
```bash
GITHUB_TOKEN=ghp_your_personal_access_token_here
GITHUB_OWNER=peka01
GITHUB_REPO=RPAC
GITHUB_BRANCH=main
GITHUB_HELP_DIR=rpac-web/public/help
```

**Production (Cloudflare Pages):**
1. Go to Cloudflare dashboard → Pages → beready.se → Settings → Environment variables
2. Add production variable:
   - Name: `GITHUB_TOKEN`
   - Value: `ghp_xxx` (PAT with repo scope)
   - Environment: Production
3. Redeploy for changes to take effect

**Creating a GitHub PAT:**
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token (classic)
3. Name: "RPAC Help System"
4. Expiration: 90 days (renewable)
5. Scopes: Check "repo" (full control of private repositories)
6. Generate token → Copy immediately (won't show again)

### Rate Limits

**Without Authentication:**
- GitHub API: 60 requests/hour per IP
- Raw URL: 60 requests/hour per IP
- Result: ~1 request/minute average

**With Authentication:**
- GitHub API: 5,000 requests/hour
- Raw URL: Still rate limited but not tracked separately
- Result: 83 requests/minute average

**Recommendation:** ALWAYS use GITHUB_TOKEN in production to avoid rate limit issues

### Cache Strategy

**Current Implementation:** No caching (always fresh)

**Headers Sent:**
```typescript
'Cache-Control': 'no-cache, no-store, must-revalidate',
'Pragma': 'no-cache',
```

**Reasoning:**
- Help content changes should be visible immediately
- Edge runtime cache would serve stale content
- Acceptable latency (<500ms for GitHub API)
- Low request volume (help opened occasionally, not per page load)

**Future Optimization (if needed):**
- Cloudflare KV cache with 5-minute TTL
- Webhook from GitHub to invalidate cache on push
- Client-side cache with ETag validation

### Error Handling

**Scenarios and Responses:**

1. **File not in whitelist:**
   - Status: 404
   - Body: `{ error: 'Help file not found', path: 'invalid/path' }`
   - Logged: Yes

2. **GitHub API fails (rate limit, auth, network):**
   - Behavior: Falls back to raw URL automatically
   - Logged: Yes (with error details)
   - User impact: None (transparent fallback)

3. **Both GitHub sources fail:**
   - Status: 404
   - Body: `{ error: 'Help file could not be read from any source', path: 'file/path' }`
   - Logged: Yes (detailed error)
   - User sees: "Hjälp inte tillgänglig just nu" in KRISter

4. **Invalid file path format:**
   - Status: 404
   - Body: `{ error: 'Help file not found', path: 'malformed' }`
   - Logged: Yes

5. **Network timeout:**
   - Status: 500
   - Body: `{ error: 'Internal server error', details: 'timeout', path: 'file/path' }`
   - Logged: Yes with stack trace

### Monitoring

**Key Metrics to Track:**

1. **Success Rate:**
   - Target: >99.5%
   - Monitor: Cloudflare Pages logs
   - Alert on: <95% success rate

2. **Response Time:**
   - Target: <500ms p95
   - Monitor: Cloudflare Analytics
   - Alert on: >2s p95

3. **GitHub API Rate Limits:**
   - Check: https://api.github.com/rate_limit (with auth token)
   - Monitor: Remaining quota
   - Alert on: <100 requests remaining

4. **Error Types:**
   - 404s: File missing or whitelist outdated
   - 403s: Auth token invalid or expired
   - 500s: Network issues or GitHub outage

**Log Analysis:**
```powershell
# Check production logs in Cloudflare dashboard
# Filter by: [HelpAPI]
# Look for patterns in failed requests
```

## File Structure in GitHub

### Repository Layout
```
peka01/RPAC
└── rpac-web/
    └── public/
        └── help/
            ├── dashboard.md
            ├── individual/
            │   ├── overview.md
            │   ├── resources.md
            │   ├── cultivation.md
            │   ├── knowledge.md
            │   ├── coach.md
            │   ├── contacts.md
            │   └── plan.md
            ├── local/
            │   ├── home.md
            │   ├── discover.md
            │   ├── activity.md
            │   ├── resources-shared.md
            │   ├── resources-owned.md
            │   ├── resources-help.md
            │   ├── messages-community.md
            │   ├── messages-direct.md
            │   └── admin.md
            ├── regional/
            │   └── overview.md
            ├── settings/
            │   ├── profile.md
            │   ├── security.md
            │   ├── account.md
            │   ├── privacy.md
            │   ├── notifications.md
            │   └── preferences.md
            ├── admin/
            │   ├── overview.md
            │   └── super-admin.md
            └── auth/
                ├── login.md
                └── register.md
```

### Naming Conventions

**Directory Names:**
- Lowercase
- Match primary route segments
- No spaces (use hyphens if needed)

**File Names:**
- Lowercase
- Kebab-case for multi-word names
- `.md` extension
- Match route parameters or features

**Examples:**
- ✅ `resources-shared.md` (multi-word with hyphen)
- ✅ `overview.md` (simple)
- ❌ `ResourcesShared.md` (wrong case)
- ❌ `resources shared.md` (space)

## Deployment Workflow

### Development Workflow

1. **Edit help file:**
   - Option A: Direct edit in GitHub (web UI)
   - Option B: Help editor in app (saves to GitHub via API)
   - Option C: Local edit + commit + push

2. **Commit to main:**
   - Changes immediately available in dev (`localhost:3000`)
   - No build needed
   - No restart needed

3. **Test locally:**
   - Open KRISter
   - Navigate to relevant page
   - Verify help content displays correctly

4. **Commit message format:**
   ```
   docs: update help for [feature]
   
   - Changed X to Y
   - Added section on Z
   - Updated localization keys
   ```

### Production Deployment

**Critical:** Help content changes do NOT require app redeployment!

1. **Commit help file to main branch**
   - Changes pushed to GitHub

2. **Wait ~1 minute**
   - GitHub CDN propagates changes
   - No Cloudflare Pages deployment triggered

3. **Verify in production**
   - Visit https://beready.se
   - Open KRISter
   - Navigate to updated page
   - Confirm new help content shows

**If help doesn't update:**
1. Check GitHub API rate limits
2. Verify GITHUB_TOKEN is set in Cloudflare Pages env vars
3. Check Cloudflare Pages logs for errors
4. Test direct GitHub API access with token

### Rollback Strategy

**To revert bad help content:**

1. **Option A: Revert commit in GitHub**
   ```bash
   git revert <commit-hash>
   git push origin main
   ```
   - Changes visible immediately in production

2. **Option B: Edit directly in GitHub**
   - Navigate to file in GitHub web UI
   - Click "Edit" → Make changes → Commit
   - Immediate visibility

3. **Option C: Use help editor**
   - Open help editor in app
   - Load file from GitHub
   - Make corrections → Save
   - Commits directly to GitHub

**No deployment needed for any rollback option!**

## Troubleshooting

### Common Issues

#### 1. "Help file not found" (404)

**Symptoms:** KRISter shows error message, 404 in network tab

**Causes:**
- File not in VALID_HELP_FILES whitelist
- File doesn't exist in GitHub repo
- Wrong file path in route mapping
- Typo in file name

**Solutions:**
1. Check file exists: https://github.com/peka01/RPAC/tree/main/rpac-web/public/help
2. Verify path matches exactly (case-sensitive)
3. Add to whitelist if missing:
   ```typescript
   const VALID_HELP_FILES = [
     // ... existing entries
     'new/file-path',  // Add here
   ];
   ```
4. Update route mapping if path changed

#### 2. "Rate limit exceeded" (403)

**Symptoms:** Intermittent 403 errors, works sometimes

**Causes:**
- No GITHUB_TOKEN set (using anonymous access)
- Token expired
- Exceeded 5000 requests/hour quota

**Solutions:**
1. Set GITHUB_TOKEN in environment variables
2. Rotate token (create new PAT)
3. Check rate limit: `curl -H "Authorization: Bearer $GITHUB_TOKEN" https://api.github.com/rate_limit`
4. Wait for quota reset (shown in rate_limit response)

#### 3. Stale content showing

**Symptoms:** Old help content visible despite GitHub file updated

**Causes:**
- Browser cache (unlikely with no-cache headers)
- CDN cache between Cloudflare and GitHub
- Wrong branch being fetched

**Solutions:**
1. Hard refresh browser (Ctrl+Shift+R)
2. Check GITHUB_BRANCH env var (should be "main")
3. Verify commit is on main branch
4. Wait 1-2 minutes for GitHub CDN propagation
5. Test direct GitHub raw URL to confirm file updated

#### 4. Cannot save from help editor

**Symptoms:** Save button fails, no commit created

**Causes:**
- GITHUB_TOKEN missing or invalid
- Token lacks `repo` scope
- Network issue to GitHub API
- File path not in whitelist

**Solutions:**
1. Verify GITHUB_TOKEN set and has `repo` scope
2. Check Cloudflare Pages logs for API errors
3. Test GitHub API access: `curl -H "Authorization: Bearer $TOKEN" https://api.github.com/user`
4. Ensure file path in VALID_HELP_FILES

#### 5. Production works, localhost doesn't

**Symptoms:** Help loads on beready.se but not locally

**Causes:**
- Missing `.env.local` file
- GITHUB_TOKEN not set locally
- Wrong environment variables

**Solutions:**
1. Create `rpac-web/.env.local`:
   ```bash
   GITHUB_TOKEN=ghp_your_token_here
   GITHUB_OWNER=peka01
   GITHUB_REPO=RPAC
   GITHUB_BRANCH=main
   GITHUB_HELP_DIR=rpac-web/public/help
   ```
2. Restart dev server: `npm run dev`
3. Test in browser

### Debug Checklist

When help system fails:

- [ ] Check Cloudflare Pages logs for `[HelpAPI]` entries
- [ ] Verify GITHUB_TOKEN set in environment
- [ ] Test GitHub API access with token
- [ ] Confirm file exists in GitHub at correct path
- [ ] Verify file in VALID_HELP_FILES whitelist
- [ ] Check route mapping points to correct file
- [ ] Test direct GitHub raw URL in browser
- [ ] Check GitHub API rate limit status
- [ ] Review recent commits for file renames/moves
- [ ] Clear browser cache and retry

## Security Considerations

### Path Traversal Prevention

**Attack Vector:** Malicious request to `/api/help/../../../../etc/passwd`

**Protection:**
1. VALID_HELP_FILES whitelist (only pre-approved paths)
2. Path normalization (segments joined with `/`)
3. No direct filesystem access (GitHub API only)
4. Edge runtime sandbox (limited capabilities)

**Result:** Even if path traversal attempted, whitelist check fails with 404

### Token Security

**Best Practices:**
- ✅ Use environment variables (never commit tokens)
- ✅ Rotate tokens every 90 days
- ✅ Use fine-grained PAT (not classic) when available
- ✅ Minimal scopes (repo only, not admin)
- ❌ Never log token values
- ❌ Never expose token in client-side code
- ❌ Don't commit `.env.local` to git

**Token Leakage:**
If token compromised:
1. Revoke immediately in GitHub settings
2. Generate new token
3. Update environment variables
4. Redeploy (production only)
5. Review audit logs for unauthorized access

### Content Integrity

**Risk:** Malicious markdown injection

**Protection:**
1. Repository access control (only authorized contributors)
2. Branch protection rules (require PR reviews)
3. Markdown sanitization in rendering (not in API)
4. No executable code in markdown (only markup)

**Note:** API serves raw markdown. Rendering component must sanitize!

## Performance Optimization

### Current Performance

**Typical Response Times:**
- GitHub API with auth: 200-400ms
- GitHub raw URL: 300-600ms
- Total (including network): <1s p95

**Optimization Opportunities:**

1. **Cloudflare KV Caching:**
   ```typescript
   // Check KV cache first
   const cached = await HELP_CACHE.get(filePath);
   if (cached) return cached;
   
   // Fetch from GitHub
   const content = await fetchFromGitHub(filePath);
   
   // Cache for 5 minutes
   await HELP_CACHE.put(filePath, content, { expirationTtl: 300 });
   ```

2. **Prefetching Common Files:**
   - Cache dashboard.md, local/home.md on app load
   - Reduces perceived latency for common paths

3. **Content Compression:**
   - Enable gzip/brotli for markdown responses
   - Reduces transfer size 60-80%

4. **HTTP/2 Multiplexing:**
   - Parallel requests for multiple help files
   - Improves batch loading

**Trade-offs:**
- Caching adds complexity
- Reduces "immediate visibility" benefit
- Requires cache invalidation strategy
- Current performance acceptable for MVP

## Future Enhancements

### Short-term (Next Sprint)

1. **Cloudflare KV Cache:**
   - Implement 5-minute cache TTL
   - Reduce GitHub API requests by 90%
   - Maintain acceptable update latency

2. **Better Error Messages:**
   - User-friendly "Hjälp inte tillgänglig" message
   - Link to GitHub file for direct viewing
   - "Försök igen" button

3. **Monitoring Dashboard:**
   - Cloudflare Workers Analytics
   - Success rate, latency, errors
   - GitHub API quota remaining

### Long-term (Future Phases)

1. **GitHub Webhook Integration:**
   - Auto-invalidate KV cache on push
   - True "immediate visibility" with caching
   - Event-driven architecture

2. **Help Content CDN:**
   - Cloudflare R2 bucket mirror
   - Sync from GitHub on push
   - Ultra-low latency serving

3. **Version Pinning:**
   - Load help content matching deployed app version
   - Prevent mismatch between code and docs
   - Useful for staging environments

4. **A/B Testing:**
   - Test different help content versions
   - Measure which explanations work best
   - Data-driven documentation

5. **Localization:**
   - Support multiple languages
   - `help/sv/`, `help/en/` directory structure
   - Auto-detect user language

## Related Documentation

- **Help Writing Guide:** `docs/help_conventions.md`
- **KRISter System:** `docs/KRISTER_HELP_SYSTEM_IMPLEMENTATION.md`
- **Route Mappings:** Visual editor in help-file-editor.tsx
- **API Reference:** `rpac-web/src/app/api/help/[...path]/route.ts`

---

**Remember:** The GitHub repository is THE source of truth. Never add static fallbacks. Never bundle help content. Always fetch from GitHub. This is a core architectural principle that ensures immediate visibility and prevents stale content issues.

**When in doubt:** Check the GitHub file directly, verify GITHUB_TOKEN is set, and review Cloudflare Pages logs for detailed error messages.
