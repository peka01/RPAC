# Cloudflare Worker Deployment Guide

## Prerequisites

1. **Node.js** (version 18 or higher)
2. **Wrangler CLI** - Cloudflare's command-line tool
3. **Cloudflare account** with Workers enabled
4. **OpenAI API key** (already stored as `OPENAI_API_KEY` secret)

## Installation

1. **Install Wrangler globally:**
   ```bash
   npm install -g wrangler
   ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

3. **Login to Cloudflare:**
   ```bash
   wrangler login
   ```
   This will open your browser to authenticate with Cloudflare.

## Configuration

1. **Update worker name in `wrangler.toml`:**
   ```toml
   name = "your-unique-worker-name"
   ```

2. **Verify your OpenAI API key is set:**
   ```bash
   wrangler secret list
   ```
   You should see `OPENAI_API_KEY` in the list.

3. **If you need to update the API key:**
   ```bash
   wrangler secret put OPENAI_API_KEY
   ```
   Enter your OpenAI API key when prompted.

## Local Development

1. **Start local development server:**
   ```bash
   wrangler dev
   ```
   This will start a local server (usually at `http://localhost:8787`)

2. **Test your worker locally:**
   ```bash
   curl -X POST http://localhost:8787 \
     -H "Content-Type: application/json" \
     -d '{"prompt": "Hello, how are you?"}'
   ```

## Deployment

1. **Deploy to Cloudflare:**
   ```bash
   wrangler publish
   ```

2. **Your worker will be available at:**
   `https://your-worker-name.your-subdomain.workers.dev`

## Custom Domain Setup

### Option 1: Workers Routes (Recommended for scaling)

1. **Go to Cloudflare Dashboard** → Workers & Pages → Routes
2. **Add a new route:**
   - Pattern: `api.yourdomain.com/*`
   - Worker: Select your deployed worker
3. **Update your DNS:**
   - Add a CNAME record: `api` → `your-worker-name.your-subdomain.workers.dev`

### Option 2: Custom Domain (Alternative)

1. **In Cloudflare Dashboard** → Workers & Pages → Custom Domains
2. **Add custom domain:** `api.yourdomain.com`
3. **Follow the DNS setup instructions**

## Testing the Deployed Worker

```bash
curl -X POST https://api.yourdomain.com \
  -H "Content-Type: application/json" \
  -d '{"prompt": "What is the weather like today?"}'
```

## Frontend Integration

### JavaScript Example

```javascript
async function callOpenAI(prompt) {
  try {
    const response = await fetch('https://api.yourdomain.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: prompt })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw error;
  }
}

// Usage example
callOpenAI("Explain quantum computing in simple terms")
  .then(response => {
    console.log('AI Response:', response.choices[0].message.content);
  })
  .catch(error => {
    console.error('Error:', error);
  });
```

### React Example

```jsx
import { useState } from 'react';

function AIComponent() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const result = await fetch('https://api.yourdomain.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      
      const data = await result.json();
      setResponse(data.choices[0].message.content);
    } catch (error) {
      console.error('Error:', error);
      setResponse('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt..."
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send'}
        </button>
      </form>
      {response && <div>{response}</div>}
    </div>
  );
}
```

## Monitoring and Debugging

1. **View logs:**
   ```bash
   wrangler tail
   ```

2. **Check worker status:**
   ```bash
   wrangler whoami
   ```

3. **Update worker:**
   ```bash
   wrangler publish
   ```

## Security Notes

- ✅ API key is stored as a Cloudflare secret (never exposed to browser)
- ✅ CORS is properly configured for cross-origin requests
- ✅ Input validation prevents malformed requests
- ✅ Error handling prevents sensitive information leakage

## Troubleshooting

### Common Issues

1. **"Worker not found" error:**
   - Check your worker name in `wrangler.toml`
   - Ensure you're logged in: `wrangler whoami`

2. **"OpenAI API error" responses:**
   - Verify your API key: `wrangler secret list`
   - Check OpenAI account has sufficient credits

3. **CORS errors in browser:**
   - Ensure your domain is properly configured
   - Check that the worker is responding to OPTIONS requests

4. **"Method not allowed" errors:**
   - Ensure you're sending POST requests
   - Check Content-Type header is `application/json`

### Getting Help

- Check Cloudflare Workers documentation
- Review OpenAI API documentation
- Use `wrangler tail` to see real-time logs