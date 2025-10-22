# Production Deployment Guide - RPAC

## 🚀 Cloudflare Pages Deployment

RPAC is deployed to **Cloudflare Pages** using the `@cloudflare/next-on-pages` adapter. This provides edge runtime capabilities and global CDN distribution.

### Deployment Platform
- **Platform**: Cloudflare Pages
- **Runtime**: Edge Runtime (V8 Isolates)
- **Adapter**: `@cloudflare/next-on-pages`
- **Functions**: Cloudflare Pages Functions (in `/functions` directory)

## 🔒 Security-First Deployment

This deployment guide includes comprehensive security measures implemented in RPAC. All security vulnerabilities have been addressed with production-ready solutions.

## Environment Variables Setup

### Required Environment Variables

For production deployment, you need to set up the following environment variables:

#### 1. Supabase Configuration (Required)
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
NEXT_PUBLIC_DEMO_MODE=false
```

#### 2. Security Configuration (Required)
```bash
# Encryption key for sensitive localStorage data (MUST be 32+ characters, random)
NEXT_PUBLIC_ENCRYPTION_KEY=your_secure_random_encryption_key_here
```

#### 3. AI Configuration (Optional - Uses Production API)
```bash
# Note: AI features now use production api.beready.se by default
# These are only needed if you want to override the production API
OPENAI_API_KEY=your_openai_api_key_here  # Optional
GEMINI_API_KEY=your_gemini_api_key_here  # Optional
```

### 🔒 Security Environment Variables

**CRITICAL**: The `NEXT_PUBLIC_ENCRYPTION_KEY` must be:
- At least 32 characters long
- Cryptographically random
- Different for each environment (dev/staging/prod)
- Never committed to version control

**Generate a secure key**:
```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32
```

## Cloudflare Pages Configuration

### Required Configuration Files

#### 1. `wrangler.toml` (CRITICAL)
The `wrangler.toml` file in the project root must include:

```toml
# Cloudflare Pages configuration
name = "rpac-web"
pages_build_output_dir = "rpac-web/out"

# Compatibility settings for Node.js runtime features
compatibility_date = "2024-10-21"
compatibility_flags = ["nodejs_compat"]
```

**IMPORTANT**: 
- `compatibility_date` locks in runtime behavior (use current date for latest features)
- `compatibility_flags = ["nodejs_compat"]` is **REQUIRED** for Next.js Edge Runtime
- Without these settings, deployment will fail with "nodejs_compat compatibility flag" error

### Cloudflare Dashboard Setup

#### Step 1: Set Environment Variables in Cloudflare

1. Go to your Cloudflare Dashboard
2. Navigate to **Pages** → Select **rpac-web** project
3. Go to **Settings** → **Environment Variables**
4. Add the following for both Production and Preview:
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
   - `NEXT_PUBLIC_ENCRYPTION_KEY` - 32+ character random encryption key
   - `NEXT_PUBLIC_DEMO_MODE` - Set to `false` for production

#### Step 2: Verify Compatibility Flags (Automatic via wrangler.toml)

If you've set up `wrangler.toml` correctly, compatibility flags are automatically applied. However, you can verify in:
1. **Pages** → **rpac-web** → **Settings** → **Functions**
2. Check that `nodejs_compat` appears in compatibility flags
3. Both Production and Preview environments should show this flag

### GitHub Repository Secrets Setup (Optional)

For GitHub Actions deployment automation:

1. Go to your GitHub repository
2. Click on **Settings** tab
3. In the left sidebar, click on **Secrets and variables** → **Actions**
4. Add secrets:
   - `CLOUDFLARE_API_TOKEN` - For automated deployments
   - `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID

## Edge Runtime Configuration

### All Dynamic Routes Must Use Edge Runtime

**CRITICAL**: All non-static routes MUST export the edge runtime configuration:

```typescript
// Add this to EVERY dynamic route page.tsx file
export const runtime = 'edge';
```

Routes that require this configuration:
- ✅ `/[samhalle]` - Dynamic community homespace
- ✅ `/auth/callback` - Authentication callback
- ✅ `/individual` - Individual preparedness
- ✅ `/local` - Local community hub
- ✅ `/local/discover` - Community discovery
- ✅ `/local/messages/*` - All messaging routes
- ✅ `/local/resources/*` - All resource routes

**Why This Is Required:**
- Cloudflare Pages runs on Edge Runtime (V8 Isolates)
- Next.js needs explicit edge runtime declaration for proper build
- Without this, build will fail with "routes were not configured" error

### Build Process

The project uses `@cloudflare/next-on-pages` which:
1. Runs `vercel build` internally to generate Next.js build
2. Converts the build output to Cloudflare Pages format
3. Validates that all routes are edge-compatible
4. Generates Workers for each route

## Cloudflare Pages Functions

The application uses Cloudflare Pages Functions (not Next.js API routes) for serverless functionality:

### Functions Location: `/functions/api/`
- `daily-tips.js` - Generate daily preparedness tips
- `coach-response.js` - Generate AI coach responses  
- `plant-diagnosis.js` - Analyze plant images

These functions use Cloudflare's native function format and call the production API at `api.beready.se`.

### Security Benefits:
- ✅ API key never exposed to client-side code
- ✅ Edge runtime execution (low latency globally)
- ✅ Automatic scaling and DDoS protection
- ✅ Proper error responses

## Deployment Checklist

### Before Deployment:
- [ ] `wrangler.toml` configured with `compatibility_date` and `nodejs_compat` flag
- [ ] All dynamic routes have `export const runtime = 'edge'`
- [ ] Cloudflare environment variables configured (both Production and Preview)
- [ ] Supabase environment variables configured
- [ ] Build process verified (`npm run pages:build` in rpac-web directory)
- [ ] No TypeScript errors in components
- [ ] No console.log statements in JSX

### Build Commands:
```bash
# Development
cd rpac-web
npm run dev

# Production build (test locally)
cd rpac-web
npm run pages:build

# Preview locally
cd rpac-web
npm run preview

# Deploy to Cloudflare Pages
cd rpac-web
npm run deploy
```

### After Deployment:
- [ ] Verify site loads at production URL
- [ ] Test authentication flow
- [ ] Test AI coach functionality  
- [ ] Test weather integration
- [ ] Test plant diagnosis feature
- [ ] Test community features (messaging, resources)
- [ ] Verify all routes work (no 404s)
- [ ] Check browser console for errors
- [ ] Test on mobile devices

## 🔒 Security Deployment Checklist

### Pre-Deployment Security Verification

#### 1. Environment Security
- [ ] **Encryption Key**: Strong, random 32+ character encryption key set
- [ ] **Supabase RLS**: Row Level Security policies configured
- [ ] **API Keys**: No hardcoded secrets in codebase
- [ ] **HTTPS**: SSL/TLS enabled in production
- [ ] **Security Headers**: CSP, HSTS, and other headers configured

#### 2. Code Security
- [ ] **Input Validation**: All user inputs validated with Zod schemas
- [ ] **HTML Sanitization**: XSS protection implemented
- [ ] **Rate Limiting**: API abuse protection active
- [ ] **Error Handling**: No sensitive data in error messages
- [ ] **Client-Side Security**: Sensitive data encrypted in localStorage

#### 3. Database Security
- [ ] **RLS Policies**: Proper access control configured
- [ ] **Data Encryption**: Sensitive fields encrypted at rest
- [ ] **Backup Security**: Encrypted backups configured
- [ ] **Audit Logging**: Security events logged

### Security Monitoring

#### Production Security Monitoring
```bash
# Monitor for security events
- Failed authentication attempts
- Rate limit violations
- Input validation failures
- Encryption/decryption errors
- API abuse patterns
```

#### Security Headers Verification
```bash
# Verify security headers are present
curl -I https://your-domain.com | grep -E "(X-Frame-Options|X-Content-Type-Options|Strict-Transport-Security|Content-Security-Policy)"
```

## Troubleshooting

### Common Deployment Errors:

#### 1. "nodejs_compat compatibility flag not set"
**Error Message**: `Node.JS Compatibility Error - no nodejs_compat compatibility flag set`

**Cause**: Missing compatibility flag configuration

**Solution**:
- Add to `wrangler.toml`:
  ```toml
  compatibility_date = "2024-10-21"
  compatibility_flags = ["nodejs_compat"]
  ```
- OR set manually in Cloudflare Dashboard: Pages → Settings → Functions → Compatibility Flags
- Redeploy after making changes

#### 2. "compatibility_flags cannot be specified without a compatibility_date"
**Error Message**: `Failed to publish your Function. Got error: compatibility_flags cannot be specified without a compatibility_date`

**Cause**: `compatibility_flags` requires `compatibility_date` to be set

**Solution**:
- Ensure `wrangler.toml` has BOTH:
  ```toml
  compatibility_date = "2024-10-21"  # Current date
  compatibility_flags = ["nodejs_compat"]
  ```

#### 3. "routes were not configured to run with the Edge Runtime"
**Error Message**: `The following routes were not configured to run with the Edge Runtime: /[route]`

**Cause**: Dynamic routes missing edge runtime export

**Solution**:
- Add to ALL dynamic page.tsx files:
  ```typescript
  export const runtime = 'edge';
  ```
- Check all routes in error message and add this export
- Common locations: `/app/[samhalle]/page.tsx`, `/app/local/*/page.tsx`

#### 4. "Type 'void' is not assignable to type 'ReactNode'"
**Error Message**: TypeScript error with console.log in JSX

**Cause**: `console.log()` returns void, can't be used as JSX content

**Solution**:
- Remove console.log statements from JSX:
  ```typescript
  // ❌ WRONG
  <div>{console.log('debug')}</div>
  
  // ✅ CORRECT
  <div>Content</div>
  ```
- Move console.log outside JSX or use useEffect

#### 5. "Property 'data' does not exist on type 'RealtimeChannel'"
**Error Message**: TypeScript error with Supabase realtime subscription

**Cause**: Incorrect Supabase realtime API usage

**Solution**:
- Fix subscription pattern:
  ```typescript
  // ❌ WRONG
  const { data, error } = supabase.channel('...').subscribe();
  
  // ✅ CORRECT
  const subscription = supabase.channel('...')
    .on('postgres_changes', {...}, callback)
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Subscribed');
      }
    });
  ```

### Common Issues:

#### 1. "Encryption Key: Missing" Error
**Cause**: `NEXT_PUBLIC_ENCRYPTION_KEY` not configured
**Solution**: 
- Generate a secure 32+ character random key
- Set as environment variable in production
- Restart application after setting

#### 2. "Invalid Image Format" Error
**Cause**: Image validation failing in plant diagnosis
**Solution**:
- Check that images are valid JPEG/PNG format
- Verify image data is properly base64 encoded
- Ensure image size is within limits

#### 3. Rate Limit Exceeded
**Cause**: Too many API requests
**Solution**:
- Wait for rate limit window to reset
- Implement client-side request queuing
- Consider upgrading rate limits if needed

#### 4. CORS Errors
**Cause**: API routes not properly configured
**Solution**:
- Verify all API routes are in the correct directory structure
- Check that the routes are properly exported
- Ensure the fetch calls are using relative URLs

### Debug Steps:

1. **Check Environment Variables**:
   ```bash
   # In Vercel dashboard, check that all required variables are set
   ```

2. **Test API Routes Locally**:
   ```bash
   npm run dev
   # Test each API route individually
   ```

3. **Check Build Logs**:
   ```bash
   # Look for any build errors related to missing environment variables
   ```

4. **Verify API Key Access**:
   ```bash
   # Test the API key directly with OpenAI
   curl -H "Authorization: Bearer YOUR_API_KEY" https://api.openai.com/v1/models
   ```

## Production Monitoring

### Key Metrics to Monitor:
- API response times
- Error rates for OpenAI calls
- User engagement with AI features
- Weather data accuracy

### Alerts to Set Up:
- High error rates for API calls
- OpenAI API quota approaching limits
- Weather service failures
- Database connection issues

## Cost Management

### OpenAI API Usage:
- Monitor usage in OpenAI dashboard
- Set up billing alerts
- Consider implementing rate limiting for heavy users
- Use fallback responses when API is unavailable

### Optimization Strategies:
- Cache AI responses when appropriate
- Use shorter prompts for simple queries
- Implement request queuing for high traffic
- Monitor and optimize token usage

---

**Note**: This deployment guide ensures that RPAC's AI features work securely in production while maintaining the user experience and protecting sensitive API keys.
