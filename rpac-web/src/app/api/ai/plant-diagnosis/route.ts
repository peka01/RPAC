import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { z } from 'zod';

const plantDiagnosisRequestSchema = z.object({
  imageData: z.string().min(10).refine((data) => {
    // Validate that it's either a data URL or base64 string
    return data.startsWith('data:image/') || /^[A-Za-z0-9+/=]+$/.test(data);
  }, "Invalid image format. Please provide a valid image file."),
  userProfile: z.object({
    climateZone: z.string().optional(),
    experienceLevel: z.string().optional(),
    gardenSize: z.string().optional(),
  }).optional(),
});

// Rate limiting for plant diagnosis (e.g., 5 requests per minute per IP)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5;

export async function POST(request: NextRequest) {
  const ip = request.ip || 'unknown';

  // Apply rate limiting
  const now = Date.now();
  const client = rateLimitMap.get(ip) || { count: 0, lastReset: now };

  if (now - client.lastReset > RATE_LIMIT_WINDOW_MS) {
    client.count = 0;
    client.lastReset = now;
  }

  client.count++;
  rateLimitMap.set(ip, client);

  if (client.count > MAX_REQUESTS_PER_WINDOW) {
    return NextResponse.json({ error: 'Rate limit exceeded for plant diagnosis' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const validatedBody = plantDiagnosisRequestSchema.parse(body);
    const { imageData, userProfile } = validatedBody;

    // Use production API from api.beready.se
    console.log('Using production API for plant diagnosis');

    const prompt = `Som svensk växtexpert, analysera denna växtbild och ge diagnos:

Användarprofil:
- Klimatzon: ${userProfile?.climateZone || 'svealand'}
- Erfarenhetsnivå: ${userProfile?.experienceLevel || 'beginner'}
- Trädgårdsstorlek: ${userProfile?.gardenSize || 'medium'}

Analysera:
1. Växtens art och vetenskapliga namn
2. Hälsotillstånd (frisk, sjukdom, skadedjur, näringsbrist)
3. Beskrivning av problem/status
4. Konkreta rekommendationer för behandling
5. Allvarlighetsgrad (låg, medium, hög)
6. Tillförlitlighet (0-1)

Svara med JSON:
{
  "plantName": "Växtnamn",
  "scientificName": "Vetenskapligt namn",
  "healthStatus": "healthy/disease/pest/nutrient_deficiency",
  "description": "Detaljerad beskrivning av växtens tillstånd",
  "recommendations": ["Råd 1", "Råd 2", "Råd 3"],
  "confidence": 0.85,
  "severity": "low/medium/high"
}
Fokusera på svenska växter och odlingsförhållanden.`;

    const workerResponse = await fetch('https://api.beready.se', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'RPAC-PlantDiagnosis/1.0'
      },
      body: JSON.stringify({ 
        prompt,
        type: 'plant-diagnosis',
        imageData: imageData, // Pass the image data to the production API
        userProfile: userProfile
      }),
    });

    if (!workerResponse.ok) {
      const errorData = await workerResponse.json().catch(() => ({ message: 'Unknown worker error' }));
      throw new Error(`Worker API error: ${workerResponse.status} - ${errorData.message}`);
    }

    const workerData = await workerResponse.json();
    const content = workerData.choices?.[0]?.message?.content || workerData.response;

    // Try to parse the response into structured diagnosis
    let diagnosis;
    try {
      // Remove any markdown formatting
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      diagnosis = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Return a fallback diagnosis
      diagnosis = {
        plantName: "Okänd växt",
        scientificName: "Species unknown",
        healthStatus: "healthy",
        description: "Jag kunde inte analysera bilden just nu. Kontrollera att bilden är tydlig och välbelyst.",
        recommendations: [
          "Försök igen med en tydligare bild",
          "Kontakta en växtexpert för vidare analys"
        ],
        confidence: 0.3,
        severity: "low"
      };
    }

    return NextResponse.json(diagnosis);

  } catch (error) {
    console.error('Plant diagnosis API route error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to analyze plant image', details: error.message }, { status: 500 });
  }
}