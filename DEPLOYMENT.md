# Deployment Guide - Cloudflare Pages

This guide explains how to deploy the RPAC web application to Cloudflare Pages using GitHub Actions.

## Prerequisites

1. **Cloudflare Account**: You need a Cloudflare account with Pages enabled
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Required Secrets**: You need to set up the following secrets in your GitHub repository

## Required GitHub Secrets

Set these secrets in your GitHub repository settings (`Settings` → `Secrets and variables` → `Actions`):

### Cloudflare Secrets
- `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token with Pages permissions
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare Account ID

### Application Secrets
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Getting Cloudflare Credentials

### 1. Get Cloudflare API Token
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. Click "Create Token"
3. Use "Custom token" template
4. Set permissions:
   - `Account:Cloudflare Pages:Edit`
   - `Zone:Zone:Read` (if using custom domains)
5. Account Resources: Include your account
6. Zone Resources: Include all zones (if using custom domains)
7. Copy the generated token

### 2. Get Cloudflare Account ID
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Select any domain from your account
3. In the right sidebar, find "Account ID"
4. Copy the Account ID

## Deployment Process

### Automatic Deployment
The deployment happens automatically when you:
- Push to the `main` or `master` branch
- Create a pull request to `main` or `master`

### Manual Deployment
You can also trigger deployment manually:
1. Go to your GitHub repository
2. Click on "Actions" tab
3. Select "Deploy to Cloudflare Pages" workflow
4. Click "Run workflow"

## Build Configuration

The application is configured for static export with the following settings:

- **Output**: Static export (`output: 'export'`)
- **Trailing Slash**: Enabled for better routing
- **Images**: Unoptimized (required for static export)
- **Build Directory**: `rpac-web/out`

## Environment Variables

Make sure to set these environment variables in your Cloudflare Pages project:

1. Go to your Cloudflare Pages project
2. Navigate to `Settings` → `Environment variables`
3. Add the following variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Custom Domain (Optional)

To use a custom domain:

1. In Cloudflare Pages, go to your project
2. Click on "Custom domains"
3. Add your domain
4. Follow the DNS configuration instructions

## Troubleshooting

### Common Issues

1. **Build Failures**: Check that all environment variables are set correctly
2. **404 Errors**: Ensure `trailingSlash: true` is set in Next.js config
3. **API Errors**: Verify Supabase credentials are correct
4. **Deployment Timeout**: Large builds may timeout; consider optimizing bundle size

### Build Logs
- Check GitHub Actions logs for build issues
- Check Cloudflare Pages logs for runtime issues

## Local Development

To test the static build locally:

```bash
cd rpac-web
npm run build
npx serve out
```

## Support

For issues with:
- **Cloudflare Pages**: Check [Cloudflare Pages documentation](https://developers.cloudflare.com/pages/)
- **GitHub Actions**: Check [GitHub Actions documentation](https://docs.github.com/en/actions)
- **Next.js Static Export**: Check [Next.js documentation](https://nextjs.org/docs/advanced-features/static-html-export)
