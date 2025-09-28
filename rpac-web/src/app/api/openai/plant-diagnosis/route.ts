import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client only when needed
const getOpenAI = () => {
  if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }
  return new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  });
};

export async function POST(request: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const { imageBase64, userProfile } = await request.json();

    const prompt = `Analysera denna växtbild och identifiera eventuella problem. Fokusera på svenska växter och odlingsförhållanden.

    Användarprofil:
    - Klimatzon: ${userProfile?.climateZone || 'svealand'}
    - Erfarenhet: ${userProfile?.experienceLevel || 'beginner'}
    - Trädgårdsstorlek: ${userProfile?.gardenSize || 'medium'}
    
    Svara med JSON-format:
    {
      "plantName": "Växtens namn på svenska",
      "scientificName": "Vetenskapligt namn",
      "healthStatus": "healthy|disease|pest|nutrient_deficiency",
      "confidence": 0.0-1.0,
      "description": "Beskrivning av växtens tillstånd",
      "recommendations": ["Rekommendation 1", "Rekommendation 2"],
      "severity": "low|medium|high"
    }`;

    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    try {
      const diagnosis = JSON.parse(content);
      return NextResponse.json(diagnosis);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('OpenAI plant diagnosis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze plant image' },
      { status: 500 }
    );
  }
}
