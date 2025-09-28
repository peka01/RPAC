// Cloudflare Function for OpenAI coach responses
export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const body = await request.json();
    const { userProfile, userQuestion, chatHistory } = body;

    if (!env.NEXT_PUBLIC_OPENAI_API_KEY) {
      return new Response(JSON.stringify({
        error: 'OpenAI API key not configured'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Build conversation context
    const messages = [
      {
        role: 'system',
        content: `Du är en svensk krisberedskaps- och odlingsexpert som fungerar som en personlig coach. Du ger praktiska råd på svenska för beredskap och odling.

Användarprofil:
- Klimatzon: ${userProfile?.climateZone || 'svealand'}
- Erfarenhet: ${userProfile?.experienceLevel || 'beginner'}
- Trädgårdsstorlek: ${userProfile?.gardenSize || 'medium'}
- Plats: ${userProfile?.county || 'okänd'} ${userProfile?.city || ''}

Du svarar alltid på svenska och ger konkreta, praktiska råd. Fokusera på krisberedskap och odling.`
      }
    ];

    // Add chat history
    if (chatHistory && chatHistory.length > 0) {
      chatHistory.forEach(msg => {
        messages.push({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.message
        });
      });
    }

    // Add current question
    messages.push({
      role: 'user',
      content: userQuestion
    });

    // Create OpenAI API request
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.NEXT_PUBLIC_OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const data = await openaiResponse.json();
    const content = data.choices[0]?.message?.content;

    return new Response(JSON.stringify({
      response: content,
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Coach response error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to generate coach response',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
