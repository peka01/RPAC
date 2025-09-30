# Production Deployment Guide - RPAC

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
