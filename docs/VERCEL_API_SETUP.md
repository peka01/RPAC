# Vercel API Configuration Guide

## Environment Variables Required

Add these environment variables in Vercel Dashboard:

1. **Go to Vercel Dashboard:**
   - Select your RPAC project
   - Settings → Environment Variables

2. **Add OPENAI_API_KEY:**
   ```
   Key: OPENAI_API_KEY
   Value: sk-proj-... (your OpenAI API key)
   Environments: Production, Preview, Development
   ```

## Vercel Domain Configuration

Since you moved `api.beready.se` to Vercel:

1. **In Vercel Dashboard:**
   - Go to your project
   - Settings → Domains
   - Add Domain: `api.beready.se`
   - Vercel will provide DNS records

2. **In Cloudflare DNS:**
   - Go to beready.se domain
   - DNS → Manage DNS
   - Add/Edit CNAME record:
     ```
     Type: CNAME
     Name: api
     Target: cname.vercel-dns.com
     Proxy status: DNS only (gray cloud)
     TTL: Auto
     ```
   - **IMPORTANT**: Must be DNS only (not proxied) for Vercel SSL to work

3. **Wait for DNS propagation:**
   - Can take 5-60 minutes
   - Test: `curl https://api.beready.se/api/ai` (should return health check)

## Testing

### Local Development
```bash
cd rpac-web
npm run dev
# API available at: http://localhost:3000/api/ai
```

### Health Check
```bash
# Production
curl https://beready.se/api/ai

# Or if using custom domain
curl https://api.beready.se/api/ai
```

Should return:
```json
{
  "status": "ok",
  "service": "RPAC AI API",
  "version": "1.0",
  "timestamp": "...",
  "configured": true
}
```

### Test AI Request
```bash
curl -X POST https://beready.se/api/ai \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Säg hej på svenska", "type": "general"}'
```

## Troubleshooting

### Error: "AI service not configured"
- Check that OPENAI_API_KEY is set in Vercel environment variables
- Redeploy after adding environment variables

### Error: "Failed to fetch"
- Check DNS propagation: `dig api.beready.se`
- Verify CNAME points to `cname.vercel-dns.com`
- Make sure Cloudflare proxy is **disabled** (gray cloud)

### Error: "OpenAI API error"
- Verify OpenAI API key is valid
- Check OpenAI account has credits
- Check OpenAI API status: https://status.openai.com

## Migration Checklist

- [x] Created `/api/ai` endpoint in Vercel
- [x] Updated `openai-worker-service.ts` to use `/api/ai`
- [ ] Add `OPENAI_API_KEY` to Vercel environment variables
- [ ] Configure `api.beready.se` domain in Vercel (optional)
- [ ] Update Cloudflare DNS if using custom domain
- [ ] Test health check endpoint
- [ ] Test AI request
- [ ] Redeploy to production

## Notes

- **Edge Runtime**: API runs on Vercel Edge for low latency
- **No Cloudflare Worker needed**: Everything runs in Vercel now
- **Custom domain optional**: Can use `beready.se/api/ai` or `api.beready.se/api/ai`
- **Environment variables**: Must be set in Vercel, not in `.env.local`
