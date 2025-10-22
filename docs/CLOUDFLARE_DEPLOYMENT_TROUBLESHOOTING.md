# 🚨 Cloudflare Pages Deployment Troubleshooting

## Common Wrangler Action Failures

### Error: "The process '/opt/hostedtoolcache/node/20.19.5/x64/bin/npx' failed with exit code 1"

This error typically occurs due to one of these issues:

#### 1. **Build Output Directory Mismatch** ✅ FIXED
**Problem**: `wrangler.toml` points to wrong output directory
**Solution**: Updated `wrangler.toml`:
```toml
pages_build_output_dir = ".vercel/output/static"  # Was: "rpac-web/out"
```

#### 2. **Missing Compatibility Flags** ✅ FIXED
**Problem**: Cloudflare Pages needs explicit compatibility flags
**Solution**: Added to deployment command:
```bash
--compatibility-date=2024-10-21 --compatibility-flags=nodejs_compat
```

#### 3. **Build Process Failing Silently** ✅ FIXED
**Problem**: `@cloudflare/next-on-pages` fails but doesn't show error
**Solution**: Added build verification step in GitHub Actions

## Fixed Issues in This Update

### 1. Updated `wrangler.toml`
```toml
# BEFORE (WRONG)
pages_build_output_dir = "rpac-web/out"

# AFTER (CORRECT)
pages_build_output_dir = ".vercel/output/static"
```

### 2. Enhanced GitHub Actions Workflow
- Added build output verification
- Added compatibility flags to deployment command
- Added fallback deployment method
- Added detailed logging for debugging

### 3. Improved Error Handling
- Build verification step shows exactly what's missing
- Fallback deployment if primary method fails
- Better error messages for troubleshooting

## Deployment Process Flow

1. **Build Next.js**: `npm run build`
2. **Build for Cloudflare**: `npx @cloudflare/next-on-pages`
3. **Verify Output**: Check `.vercel/output/static` exists
4. **Deploy**: `wrangler pages deploy` with compatibility flags
5. **Fallback**: If step 4 fails, try direct wrangler command

## Required GitHub Secrets

Make sure these are set in your repository:
- `CLOUDFLARE_API_TOKEN` - API token with Pages permissions
- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

## Manual Deployment (for testing)

```bash
cd rpac-web
npm run build
npx @cloudflare/next-on-pages
npx wrangler pages deploy .vercel/output/static --project-name=rpac-web --compatibility-date=2024-10-21 --compatibility-flags=nodejs_compat
```

## Verification Steps

After deployment, verify:
1. Build output directory exists: `.vercel/output/static/`
2. Static files are present: `index.html`, `_worker.js`, etc.
3. Compatibility flags are set in Cloudflare Dashboard
4. Environment variables are configured in Cloudflare Pages

## Next Steps

1. Push these changes to trigger a new deployment
2. Monitor the GitHub Actions logs for the new verification steps
3. If deployment still fails, check the detailed build output logs
4. Verify all required secrets are set in GitHub repository settings
