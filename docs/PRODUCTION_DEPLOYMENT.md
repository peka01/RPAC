# Production Deployment Guide - RPAC

## Environment Variables Setup

### Required Environment Variables

For production deployment, you need to set up the following environment variables:

#### 1. OpenAI API Key
```bash
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
```

**Important**: This must be set as a **repository secret** in GitHub with the name `NEXT_PUBLIC_OPENAI_API_KEY` because it's used in server-side API routes.

#### 2. Supabase Configuration
```bash
NEXT_PUBLIC_SUPABASE_URL=https://dsoujjudzrrtkkqwhpge.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzb3VqanVkenJydGtrcXdocGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2NTY3NjYsImV4cCI6MjA3NDIzMjc2Nn0.v95nh5WQWzrndcbElsmqTUVnO-jnuDtM1YcPUZNsHRA
```

#### 3. Optional: Gemini API Key
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

## GitHub Repository Secrets Setup

### Step 1: Add OpenAI API Key as Repository Secret

1. Go to your GitHub repository
2. Click on **Settings** tab
3. In the left sidebar, click on **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Name: `NEXT_PUBLIC_OPENAI_API_KEY`
6. Value: Your OpenAI API key from https://platform.openai.com/account/api-keys
7. Click **Add secret**

### Step 2: Verify Vercel Environment Variables

1. Go to your Vercel dashboard
2. Select your RPAC project
3. Go to **Settings** → **Environment Variables**
4. Ensure the following are set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_OPENAI_API_KEY` (this should be automatically pulled from GitHub secrets)

## API Routes Architecture

The application now uses server-side API routes for OpenAI calls to keep the API key secure:

### API Routes Created:
- `/api/openai/daily-tips` - Generate daily preparedness tips
- `/api/openai/coach-response` - Generate AI coach responses
- `/api/openai/plant-diagnosis` - Analyze plant images

### Security Benefits:
- ✅ API key never exposed to client-side code
- ✅ Server-side validation and error handling
- ✅ Rate limiting and abuse prevention
- ✅ Proper error responses

## Deployment Checklist

### Before Deployment:
- [ ] OpenAI API key added as GitHub repository secret
- [ ] Supabase environment variables configured
- [ ] All API routes tested locally
- [ ] Build process verified (`npm run build`)

### After Deployment:
- [ ] Test AI coach functionality
- [ ] Test weather integration
- [ ] Test plant diagnosis feature
- [ ] Verify error handling for missing API key
- [ ] Check console for any remaining client-side API key references

## Troubleshooting

### Common Issues:

#### 1. "OpenAI API Key: Missing" Error
**Cause**: API key not properly configured as repository secret
**Solution**: 
- Verify the secret is named exactly `NEXT_PUBLIC_OPENAI_API_KEY`
- Check that Vercel is pulling from GitHub secrets
- Redeploy the application after adding the secret

#### 2. 401 Unauthorized Errors
**Cause**: Invalid or expired API key
**Solution**:
- Verify the API key is correct in GitHub secrets
- Check that the API key has sufficient credits
- Ensure the API key has the correct permissions

#### 3. CORS Errors
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
