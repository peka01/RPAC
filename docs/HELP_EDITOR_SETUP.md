# Help File Editor - GitHub Integration Setup

## Overview
The Help File Editor includes GitHub integration to commit changes directly from the editor. This requires a GitHub Personal Access Token.

## Setup Instructions

### 1. Create GitHub Personal Access Token

1. Go to **GitHub Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
   - Direct link: https://github.com/settings/tokens

2. Click **Generate new token** → **Generate new token (classic)**

3. Configure the token:
   - **Note**: "RPAC Help Editor" (or any descriptive name)
   - **Expiration**: Choose your preference (90 days, 1 year, or no expiration)
   - **Scopes**: Select **`repo`** (full control of private repositories)
     - This gives access to commit, push, and pull

4. Click **Generate token**

5. **IMPORTANT**: Copy the token immediately - you won't be able to see it again!

### 2. Add Token to Environment Variables

1. Open `rpac-web/.env.local`

2. Add this line:
   ```bash
   GITHUB_TOKEN=ghp_your_token_here
   ```
   (Replace `ghp_your_token_here` with your actual token)

3. Save the file

4. **Restart the dev server**:
   ```powershell
   cd rpac-web
   npm run dev
   ```

### 3. Verify Setup

1. Open the RPAC application
2. Navigate to any page with Krister Assistant
3. Click **"Redigera"** (Edit) on a help file
4. Make changes and click **"Commit & Push"**
5. If successful, you'll see: "File saved successfully to main"

## Troubleshooting

### Error: "GitHub integration not configured"
- **Cause**: GITHUB_TOKEN is missing from .env.local
- **Solution**: Follow setup instructions above

### Error: "401 Unauthorized"
- **Cause**: Token is invalid or expired
- **Solution**: Generate a new token with correct scopes

### Error: "403 Forbidden"
- **Cause**: Token doesn't have `repo` scope
- **Solution**: Regenerate token with `repo` scope selected

### Error: "404 Not Found"
- **Cause**: File path is incorrect or repository doesn't exist
- **Solution**: Verify the file path in the editor

## Security Notes

⚠️ **Never commit `.env.local` to Git** - it's already in `.gitignore`

⚠️ **Keep your token secure** - it provides full access to your repositories

⚠️ **Use token expiration** - rotate tokens periodically for security

## Alternative: Manual Save

If you don't want to set up GitHub integration:

1. Copy the markdown content from the editor
2. Save it manually to a file in `rpac-web/public/help/`
3. Commit using Git command line or GitHub Desktop

The editor will still work for editing and preview, just without automatic commit functionality.
