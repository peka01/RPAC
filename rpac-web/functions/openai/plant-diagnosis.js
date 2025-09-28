// Cloudflare Function for OpenAI plant diagnosis
export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const body = await request.json();
    const { imageData, userProfile } = body;

    if (!env.OPENAI_API_KEY) {
      return new Response(JSON.stringify({
        error: 'OpenAI API key not configured'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create OpenAI API request with image
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analysera denna växtbild och ge en diagnos på svenska. Fokusera på svenska växter och odlingsförhållanden.

Användarprofil:
- Klimatzon: ${userProfile?.climateZone || 'svealand'}
- Erfarenhet: ${userProfile?.experienceLevel || 'beginner'}
- Trädgårdsstorlek: ${userProfile?.gardenSize || 'medium'}

Ge en strukturerad analys med:
1. Växtidentifiering (svenskt namn)
2. Hälsostatus (frisk/sjuk)
3. Eventuella problem (sjukdomar, skadedjur, näringsbrist)
4. Konkreta åtgärdsförslag
5. Förebyggande råd

Använd svenska termer och fokusera på svenska odlingsförhållanden.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageData}`
                }
              }
            ]
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
