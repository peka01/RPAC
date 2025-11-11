// Cloudflare Pages Function for OpenAI plant diagnosis
// Now uses the Cloudflare Worker API at api.beready.se
export async function onRequest(context) {
  // Handle GET requests for testing
  if (context.request.method === 'GET') {
    return new Response(JSON.stringify({ 
      message: "Plant diagnosis function is working",
      method: "GET",
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  const { request } = context;
  
  try {
    const body = await request.json();
    const { imageData, userProfile } = body;

    const prompt = `Som svensk växtexpert, analysera denna växtbild och ge diagnos:

Användarprofil:
- Klimatzon: ${userProfile?.climateZone || 'svealand'}
- Erfarenhet: ${userProfile?.experienceLevel || 'beginner'}
- Trädgårdsstorlek: ${userProfile?.gardenSize || 'medium'}

Svara med JSON:
{
  "plantName": "Växtnamn",
  "scientificName": "Vetenskapligt namn",
  "healthStatus": "healthy/disease/pest/nutrient_deficiency",
  "confidence": 0.85,
  "description": "Detaljerad beskrivning av växtens tillstånd",
  "recommendations": ["Råd 1", "Råd 2", "Råd 3"],
  "severity": "low/medium/high"
}

Fokusera på svenska växter och odlingsförhållanden.`;

    // Call the Cloudflare Worker API
    const workerResponse = await fetch('https://beready.se/api/ai', {
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

    // Parse the response into structured diagnosis
    const diagnosis = parseDiagnosisFromContent(content);

    return new Response(JSON.stringify(diagnosis), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Plant diagnosis error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to analyze plant image',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function parseDiagnosisFromContent(content) {
  // Parse AI response into structured diagnosis
  const lines = content.split('\n').filter(line => line.trim());
  
  let plantName = 'Okänd växt';
  let healthStatus = 'healthy';
  let confidence = 0.8;
  let description = '';
  let recommendations = [];
  let severity = 'low';

  for (const line of lines) {
    if (line.toLowerCase().includes('växt') || line.toLowerCase().includes('plant')) {
      plantName = line.replace(/^\d+\.\s*|^[•-]\s*/, '').trim();
    } else if (line.toLowerCase().includes('sjuk') || line.toLowerCase().includes('problem')) {
      healthStatus = 'disease';
      severity = 'medium';
    } else if (line.toLowerCase().includes('skadedjur') || line.toLowerCase().includes('pest')) {
      healthStatus = 'pest';
      severity = 'high';
    } else if (line.toLowerCase().includes('näring') || line.toLowerCase().includes('nutrient')) {
      healthStatus = 'nutrient_deficiency';
      severity = 'low';
    } else if (line.trim() && !line.match(/^\d+\./)) {
      if (!description) {
        description = line.trim();
      } else {
        recommendations.push(line.trim());
      }
    }
  }

  // Fallback if parsing fails
  if (!description) {
    description = 'Växten verkar vara i god kondition. Kontrollera regelbundet för tidiga tecken på problem.';
    recommendations = [
      'Kontrollera regelbundet för skadedjur',
      'Se till att växten får tillräckligt med vatten',
      'Kontrollera att jorden har bra dränering'
    ];
  }

  return {
    plantName,
    scientificName: plantName,
    healthStatus,
    confidence,
    description,
    recommendations,
    severity
  };
}
