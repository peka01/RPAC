import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const { profile } = await request.json();

    const weatherContext = profile.weather ? `
    Aktuellt väder:
    - Temperatur: ${profile.weather.temperature}°C
    - Luftfuktighet: ${profile.weather.humidity}%
    - Nederbörd: ${profile.weather.rainfall}
    - Väderlek: ${profile.weather.forecast}
    - Vind: ${profile.weather.windSpeed} m/s ${profile.weather.windDirection}
    - Tryck: ${profile.weather.pressure} hPa
    - UV-index: ${profile.weather.uvIndex}
    - Soluppgång: ${profile.weather.sunrise}
    - Solnedgång: ${profile.weather.sunset}
    ` : '';

    const forecastContext = profile.forecast && profile.forecast.length > 0 ? `
    Väderprognos (nästa ${profile.forecast.length} dagar):
    ${profile.forecast.map(day => `- ${new Date(day.date).toLocaleDateString('sv-SE', { weekday: 'long' })}: ${day.temperature.min}°C - ${day.temperature.max}°C, ${day.weather}, ${day.rainfall}mm regn, ${day.windSpeed} m/s vind`).join('\n')}
    ` : '';

    const warningsContext = profile.extremeWeatherWarnings && profile.extremeWeatherWarnings.length > 0 ? `
    EXTREMA VÄDERVIKTIGA VARNINGAR:
    ${profile.extremeWeatherWarnings.join('\n')}
    ` : '';

    const prompt = `Skapa 3-5 dagliga beredskapstips för en familj i Sverige. 

    Användarprofil:
    - Klimatzon: ${profile.climateZone}
    - Erfarenhet: ${profile.experienceLevel}
    - Trädgårdsstorlek: ${profile.gardenSize}
    - Föredragna grödor: ${profile.preferences.join(', ')}
    - Nuvarande grödor: ${profile.currentCrops.join(', ')}
    - Hushållsstorlek: ${profile.householdSize || 2}
    ${weatherContext}
    ${forecastContext}
    ${warningsContext}
    
    Skapa praktiska, dagliga tips på svenska som tar hänsyn till aktuellt väder och kommande väderförhållanden. Fokusera särskilt på frostvarningar och extrema väderförhållanden. Svara med JSON-format:
    [
      {
        "id": "unique-id",
        "type": "tip|warning|reminder|achievement",
        "priority": "high|medium|low",
        "title": "Tipset titel",
        "description": "Beskrivning av tipset",
        "action": "Åtgärd att vidta",
        "timeframe": "När att göra",
        "icon": "emoji",
        "category": "preparedness|cultivation|weather|safety",
        "difficulty": "beginner|intermediate|advanced",
        "estimatedTime": "Tidsuppskattning",
        "tools": ["verktyg1", "verktyg2"],
        "steps": ["steg1", "steg2"],
        "tips": ["tips1", "tips2"]
      }
    ]`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    try {
      const tips = JSON.parse(content);
      return NextResponse.json(tips);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('OpenAI daily tips error:', error);
    return NextResponse.json(
      { error: 'Failed to generate daily tips' },
      { status: 500 }
    );
  }
}
