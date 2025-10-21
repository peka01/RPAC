# 🚀 Cloudflare Pages Deployment Guide

This Next.js application is deployed to Cloudflare Pages using **@cloudflare/next-on-pages**, which enables hybrid rendering (static + ISR/SSR) on Cloudflare's edge network.

## 📋 Prerequisites

- Node.js 20+
- Cloudflare account
- GitHub repository (for automatic deployments)

## 🏗️ Architecture

**Build Process:**
```
Next.js Build → @cloudflare/next-on-pages → Cloudflare Pages
```

**Rendering Strategy:**
- **Static Pages**: `/dashboard`, `/individual`, `/local`, `/regional`, etc.
- **Dynamic Routes (ISR)**: `/[samhalle]` (community homepages with 60s revalidation)

## 🔧 Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production (Next.js)
npm run build

# Build for Cloudflare Pages
npm run pages:build

# Preview with Wrangler
npm run preview
```

## 🚀 Deployment

### Automatic Deployment (GitHub Actions)

Push to `main` branch triggers automatic deployment via `.github/workflows/deploy.yml`:

1. **Build Next.js** - Creates optimized production build
2. **Build for Cloudflare** - Runs `@cloudflare/next-on-pages` adapter
3. **Deploy** - Deploys `.vercel/output/static` to Cloudflare Pages

### Manual Deployment

```bash
# From rpac-web directory
npm run pages:build
wrangler pages deploy .vercel/output/static --project-name=rpac-web
```

## 🔑 Required Secrets

Set these in GitHub repository settings (Settings → Secrets and variables → Actions):

- `CLOUDFLARE_API_TOKEN` - Cloudflare API token with Pages permissions
- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

## 📁 Build Output

After running `npx @cloudflare/next-on-pages`:

```
.vercel/output/static/
├── _worker.js           # Cloudflare Worker for dynamic routes
├── _routes.json         # Route configuration
├── static/              # Static assets
└── ...
```

## 🔄 ISR Configuration

Dynamic routes use Incremental Static Regeneration:

**File: `src/app/[samhalle]/page.tsx`**
```typescript
export const revalidate = 60; // Revalidate every 60 seconds
```

This means:
- First request generates the page
- Cached for 60 seconds
- Next request after 60s regenerates the page
- Users see fast cached version while regeneration happens in background

## 🌐 Custom Domain

1. Go to Cloudflare Pages dashboard
2. Select your project
3. Go to "Custom domains"
4. Add `beready.se` (or your domain)
5. Cloudflare will automatically configure DNS

## 🐛 Troubleshooting

### Build Fails: "ENOENT: no such file or directory, scandir 'out'"

**Cause:** Using static export instead of @cloudflare/next-on-pages

**Fix:** Make sure `next.config.js` does NOT have `output: 'export'`

### Dynamic Routes Not Working

**Cause:** Missing `revalidate` export in route file

**Fix:** Add `export const revalidate = 60;` to dynamic route pages

### Environment Variables Not Working

**Cause:** Missing `NEXT_PUBLIC_` prefix

**Fix:** All client-side env vars must start with `NEXT_PUBLIC_`

## 📊 Performance

**Benefits of Cloudflare Pages + Next.js:**
- ⚡ Edge rendering (low latency worldwide)
- 🔄 ISR (dynamic content with caching)
- 💾 Automatic CDN caching
- 🔒 Built-in DDoS protection
- 📈 Unlimited bandwidth (on Pro plan)

## 🔗 Resources

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Next.js on Cloudflare](https://github.com/cloudflare/next-on-pages)
- [Next.js ISR Docs](https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration)

## 📝 Notes

- **Node Version**: 20.x (specified in `.node-version`)
- **Build Time**: ~2-3 minutes
- **Cold Start**: <100ms (Cloudflare Workers)
- **Deployment**: Automatic on push to main branch

---

**Last Updated**: 2025-10-21  
**Deployment Status**: ✅ Active on Cloudflare Pages

