// Cloudflare Pages Function for OpenAI daily tips
// Now uses the Cloudflare Worker API at api.beready.se
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
  const { request } = context;
  
  try {
    const body = await request.json();
    const { userProfile } = body;

    const prompt = `Som svensk krisberedskaps- och odlingsexpert, ge 3-5 dagliga råd baserat på användarens profil:

Användarprofil:
- Klimatzon: ${userProfile?.climateZone || 'svealand'}
- Erfarenhet: ${userProfile?.experienceLevel || 'beginner'}
- Trädgårdsstorlek: ${userProfile?.gardenSize || 'medium'}
- Plats: ${userProfile?.county || 'okänd'} ${userProfile?.city || ''}

Svara med JSON-array med tips:
[
  {
    "id": "tip-1",
    "type": "tip",
    "priority": "high/medium/low",
    "title": "Tips titel",
    "description": "Detaljerad beskrivning",
    "action": "Konkret åtgärd",
    "timeframe": "Dagligen",
    "icon": "🌱",
    "category": "cultivation/preparedness",
    "season": "all",
    "difficulty": "beginner",
    "estimatedTime": "15 minuter",
    "tools": ["verktyg1", "verktyg2"],
    "steps": ["steg1", "steg2"],
    "tips": ["tips1", "tips2"]
  }
]`;

    // Call the Cloudflare Worker API
    const workerResponse = await fetch('https://api.beready.se', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt })
    });

    if (!workerResponse.ok) {
      throw new Error(`Worker API error: ${workerResponse.status}`);
    }

    const workerData = await workerResponse.json();
    const content = workerData.choices[0]?.message?.content;

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
