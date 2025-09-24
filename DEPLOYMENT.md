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

The workflow will automatically create the Cloudflare Pages project if it doesn't exist.

### Manual Deployment
You can also trigger deployment manually:
1. Go to your GitHub repository
2. Click on "Actions" tab
3. Select "Deploy to Cloudflare Pages" workflow
4. Click "Run workflow"

### Creating the Project Manually (Alternative)
If you prefer to create the Cloudflare Pages project manually:

1. **Go to Cloudflare Dashboard**
   - Visit [https://dash.cloudflare.com/pages](https://dash.cloudflare.com/pages)

2. **Create New Project**
   - Click "Create a project"
   - Choose "Connect to Git"
   - Select your GitHub repository
   - Set project name: `rpac-web`
   - Set production branch: `main`

3. **Configure Build Settings**
   - Framework preset: `Next.js (Static HTML Export)`
   - Build command: `cd rpac-web && npm run build`
   - Build output directory: `rpac-web/out`
   - Root directory: `/`

4. **Environment Variables**
   - Add your environment variables in the project settings

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
5. **GitHub Permissions Error**: If you see "Resource not accessible by integration", the workflow has been updated to handle this automatically

### GitHub Permissions Issue
If you encounter a "Resource not accessible by integration" error:

**Solution 1: Use the Updated Workflow (Recommended)**
- The workflow has been updated to remove the GitHub deployment integration
- This eliminates the permission issue while still deploying to Cloudflare Pages

**Solution 2: Enable GitHub Deployments (Optional)**
If you want GitHub deployment status integration:
1. Go to your repository Settings → Actions → General
2. Under "Workflow permissions", select "Read and write permissions"
3. Check "Allow GitHub Actions to create and approve pull requests"

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
