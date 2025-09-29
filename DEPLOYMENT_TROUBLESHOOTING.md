# Cloudflare Pages Deployment Troubleshooting

## 🚨 Current Issue
The deployment is failing with:
```
sh: 1: wrangler: Permission denied
```

## 🔧 Solutions

### Option 1: Use the Updated Workflow (Recommended)
The main workflow has been updated to use direct `wrangler` commands instead of the problematic `cloudflare/pages-action@v1`.

**What was changed:**
- Removed the problematic `cloudflare/pages-action@v1`
- Added direct `wrangler` installation and deployment
- Added proper permissions (`id-token: write`)

### Option 2: Use Cloudflare Pages Direct Integration
Instead of GitHub Actions, you can use Cloudflare Pages' built-in Git integration:

1. **Go to Cloudflare Dashboard**
   - Navigate to Pages
   - Click "Create a project"
   - Connect your GitHub repository

2. **Configure Build Settings**
   ```
   Build command: cd rpac-web && npm run build
   Build output directory: rpac-web/out
   Root directory: /
   ```

3. **Set Environment Variables**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Option 3: Manual Deployment
If the automated deployment continues to fail, you can deploy manually:

```bash
# Install wrangler globally
npm install -g wrangler@3

# Login to Cloudflare
wrangler login

# Deploy to Pages
wrangler pages deploy rpac-web/out --project-name=rpac-web
```

## 🔍 Debugging Steps

### 1. Check GitHub Secrets
Ensure these secrets are set in your GitHub repository:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Verify API Token Permissions
Your Cloudflare API token needs these permissions:
- `Zone:Zone:Read`
- `Zone:Zone Settings:Edit`
- `Account:Cloudflare Pages:Edit`

### 3. Check Project Exists
Make sure the `rpac-web` project exists in your Cloudflare Pages dashboard.

## 🚀 Quick Fix Commands

### Test Wrangler Locally
```bash
# Install wrangler
npm install -g wrangler@3

# Test login
wrangler whoami

# Test deployment
wrangler pages deploy rpac-web/out --project-name=rpac-web --dry-run
```

### Alternative: Use npx
If global installation fails, use npx:
```bash
npx wrangler@3 pages deploy rpac-web/out --project-name=rpac-web
```

## 📋 Environment Variables Required

### GitHub Secrets
```
CLOUDFLARE_API_TOKEN=your_api_token_here
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Cloudflare Pages Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🎯 Next Steps

1. **Try the updated workflow** - The main workflow should now work
2. **If it still fails** - Use Cloudflare Pages direct integration
3. **For immediate deployment** - Use manual deployment commands

## 📞 Support

If you continue to have issues:
1. Check Cloudflare Pages documentation
2. Verify your API token permissions
3. Ensure the project exists in Cloudflare Pages dashboard
4. Try the alternative workflow file

---

**Status**: ✅ Updated workflow should resolve the permission issues
**Last Updated**: 2025-01-29
