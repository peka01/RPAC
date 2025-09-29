/**
 * Cloudflare Worker for OpenAI Chat Completions API
 * Handles POST requests with prompt data and returns AI responses
 * 
 * Security: API key is stored as Cloudflare secret and never exposed to browser
 * CORS: Handles preflight requests and allows cross-origin access
 */

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return handleCorsPreflight();
    }

    // Only allow POST requests for the main functionality
    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed. Use POST.' }),
        { 
          status: 405,
          headers: getCorsHeaders()
        }
      );
    }

    try {
      // Parse the request body to get the prompt
      const requestBody = await request.json();
      
      // Validate that prompt exists
      if (!requestBody.prompt || typeof requestBody.prompt !== 'string') {
        return new Response(
          JSON.stringify({ error: 'Invalid request. "prompt" field is required and must be a string.' }),
          { 
            status: 400,
            headers: getCorsHeaders()
          }
        );
      }

      // Call OpenAI API with the prompt
      const openaiResponse = await callOpenAI(requestBody.prompt, env.OPENAI_API_KEY);
      
      // Return the OpenAI response with CORS headers
      return new Response(
        JSON.stringify(openaiResponse),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...getCorsHeaders()
          }
        }
      );

    } catch (error) {
      console.error('Worker error:', error);
      
      // Return error response with CORS headers
      return new Response(
        JSON.stringify({ 
          error: 'Internal server error',
          details: error.message 
        }),
        { 
          status: 500,
          headers: getCorsHeaders()
        }
      );
    }
  }
};

/**
 * Calls OpenAI Chat Completions API
 * @param {string} prompt - User's prompt text
 * @param {string} apiKey - OpenAI API key from Cloudflare environment
 * @returns {Promise<Object>} OpenAI API response
 */
async function callOpenAI(prompt, apiKey) {
  const openaiUrl = 'https://api.openai.com/v1/chat/completions';
  
  const requestBody = {
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
    max_tokens: 1000,
    temperature: 0.7
  };

  const response = await fetch(openaiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
  }

  return await response.json();
}

/**
 * Handles CORS preflight requests (OPTIONS)
 * @returns {Response} CORS preflight response
 */
function handleCorsPreflight() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400' // Cache preflight for 24 hours
    }
  });
}

/**
 * Returns standard CORS headers for all responses
 * @returns {Object} CORS headers object
 */
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
}
