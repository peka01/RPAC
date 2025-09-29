// Cloudflare Pages Function for OpenAI coach responses
// Now uses the Cloudflare Worker API at api.beready.se
export async function onRequest(context) {
  // Handle GET requests for testing
  if (context.request.method === 'GET') {
    return new Response(JSON.stringify({ 
      message: "Coach response function is working",
      method: "GET",
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  const { request } = context;
  
  try {
    const body = await request.json();
    const { userProfile, userQuestion, chatHistory } = body;

    // Build conversation context for the Worker API
    const chatHistoryText = chatHistory && chatHistory.length > 0 
      ? chatHistory.map(msg => `${msg.sender}: ${msg.message}`).join('\n')
      : '';

            // Get current date and season
            const now = new Date();
            const currentDate = now.toLocaleDateString('sv-SE');
            const currentMonth = now.getMonth() + 1;
            const currentSeason = currentMonth >= 3 && currentMonth <= 5 ? 'vår' :
                                 currentMonth >= 6 && currentMonth <= 8 ? 'sommar' :
                                 currentMonth >= 9 && currentMonth <= 11 ? 'höst' : 'vinter';

            const prompt = `Som svensk krisberedskaps- och odlingsexpert, svara på användarens fråga:

AKTUELL TIDSPUNKT:
- Datum: ${currentDate}
- Månad: ${currentMonth}
- Säsong: ${currentSeason}

Användarprofil:
- Klimatzon: ${userProfile?.climateZone || 'svealand'}
- Erfarenhet: ${userProfile?.experienceLevel || 'beginner'}
- Trädgårdsstorlek: ${userProfile?.gardenSize || 'medium'}
- Plats: ${userProfile?.county || 'okänd'} ${userProfile?.city || ''}

Chatthistorik:
${chatHistoryText}

Användarens fråga: ${userQuestion}

Svara på svenska med praktiska råd för beredskap och odling. Tänk på att det är ${currentSeason} (månad ${currentMonth}) när du ger råd.`;

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
    const content = workerData.choices[0]?.message?.content || 'Jag kunde inte svara på din fråga just nu.';

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
