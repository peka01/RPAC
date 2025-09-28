// Cloudflare Pages Function for OpenAI daily tips
export async function onRequest(context) {
  // Handle GET requests for testing
  if (context.request.method === 'GET') {
    return new Response(JSON.stringify({ 
      message: "Daily tips function is working",
      method: "GET",
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  const { request, env } = context;
  
  try {
    const body = await request.json();
    const { userProfile } = body;

    if (!env.NEXT_PUBLIC_OPENAI_API_KEY) {
      return new Response(JSON.stringify({
        error: 'OpenAI API key not configured'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create OpenAI API request
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.NEXT_PUBLIC_OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Du är en svensk krisberedskaps- och odlingsexpert. Ge personliga råd baserat på användarens profil och aktuell väderdata. Fokusera på praktiska, svenska råd för beredskap och odling.

Användarprofil:
- Klimatzon: ${userProfile?.climateZone || 'svealand'}
- Erfarenhet: ${userProfile?.experienceLevel || 'beginner'}
- Trädgårdsstorlek: ${userProfile?.gardenSize || 'medium'}
- Plats: ${userProfile?.county || 'okänd'} ${userProfile?.city || ''}

Ge 3-5 konkreta, praktiska råd för idag. Använd svenska termer och fokusera på krisberedskap och odling.`
          },
          {
            role: 'user',
            content: 'Ge mig dagliga råd för beredskap och odling baserat på min profil.'
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const data = await openaiResponse.json();
    const content = data.choices[0]?.message?.content;

    // Parse the response into structured tips
    const tips = parseTipsFromContent(content);

    return new Response(JSON.stringify(tips), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Daily tips error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to generate daily tips',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function parseTipsFromContent(content) {
  // Parse AI response into structured tips
  const lines = content.split('\n').filter(line => line.trim());
  const tips = [];
  
  let currentTip = null;
  
  for (const line of lines) {
    if (line.match(/^\d+\./) || line.startsWith('•') || line.startsWith('-')) {
      if (currentTip) tips.push(currentTip);
      currentTip = {
        id: `tip-${tips.length + 1}`,
        type: 'tip',
        priority: 'medium',
        title: line.replace(/^\d+\.\s*|^[•-]\s*/, '').trim(),
        description: '',
        action: '',
        timeframe: 'Dagligen',
        icon: '🌱',
        category: 'cultivation',
        season: 'all',
        difficulty: 'beginner',
        estimatedTime: '15 minuter',
        tools: [],
        steps: [],
        tips: []
      };
    } else if (currentTip && line.trim()) {
      if (!currentTip.description) {
        currentTip.description = line.trim();
      } else {
        currentTip.tips.push(line.trim());
      }
    }
  }
  
  if (currentTip) tips.push(currentTip);
  
  // Fallback if parsing fails
  if (tips.length === 0) {
    return [
      {
        id: 'fallback-1',
        type: 'tip',
        priority: 'high',
        title: 'Kontrollera dina förnödenheter',
        description: 'Se till att du har tillräckligt med mat och vatten för minst 3 dagar.',
        action: 'Inventera ditt förråd',
        timeframe: 'Veckovis',
        icon: '🚨',
        category: 'preparedness',
        season: 'all',
        difficulty: 'beginner',
        estimatedTime: '30 minuter',
        tools: ['Förteckning över förnödenheter'],
        steps: ['Kontrollera matförråd', 'Kontrollera vattenförråd', 'Uppdatera beredskapslista'],
        tips: ['Fokusera på icke-perishable mat', 'Ha minst 3 liter vatten per person per dag']
      }
    ];
  }
  
  return tips;
}
