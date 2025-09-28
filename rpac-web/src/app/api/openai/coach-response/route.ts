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

export async function GET() {
  return NextResponse.json({ message: 'Coach response API is working' });
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
      return NextResponse.json({
        response: 'Jag kan tyvärr inte svara på din fråga just nu eftersom AI-tjänsten inte är tillgänglig. Försök igen senare eller kontakta en expert för vidare hjälp.',
        suggestions: [
          'Kontrollera väderprognosen på SMHI.se',
          'Se till att ha tillräckligt med förnödenheter hemma',
          'Plantera grödor som passar din klimatzon'
        ]
      });
    }

    const { userProfile, userQuestion, chatHistory } = await request.json();

    const weatherContext = userProfile.weather ? `
    Aktuellt väder:
    - Temperatur: ${userProfile.weather.temperature}°C
    - Luftfuktighet: ${userProfile.weather.humidity}%
    - Nederbörd: ${userProfile.weather.rainfall}
    - Väderlek: ${userProfile.weather.forecast}
    - Vind: ${userProfile.weather.windSpeed} m/s ${userProfile.weather.windDirection}
    - Tryck: ${userProfile.weather.pressure} hPa
    - UV-index: ${userProfile.weather.uvIndex}
    - Soluppgång: ${userProfile.weather.sunrise}
    - Solnedgång: ${userProfile.weather.sunset}
    ` : '';

    const forecastContext = userProfile.forecast && userProfile.forecast.length > 0 ? `
    Väderprognos (nästa ${userProfile.forecast.length} dagar):
    ${userProfile.forecast.map((day: any) => `- ${new Date(day.date).toLocaleDateString('sv-SE', { weekday: 'long' })}: ${day.temperature.min}°C - ${day.temperature.max}°C, ${day.weather}, ${day.rainfall}mm regn, ${day.windSpeed} m/s vind`).join('\n')}
    ` : '';

    const warningsContext = userProfile.extremeWeatherWarnings && userProfile.extremeWeatherWarnings.length > 0 ? `
    EXTREMA VÄDERVIKTIGA VARNINGAR:
    ${userProfile.extremeWeatherWarnings.join('\n')}
    ` : '';

    const prompt = `Du är en personlig AI-coach för krisberedskap och självförsörjning i Sverige. 

    Användarprofil:
    - Klimatzon: ${userProfile.climateZone}
    - Erfarenhet: ${userProfile.experienceLevel}
    - Trädgårdsstorlek: ${userProfile.gardenSize}
    - Föredragna grödor: ${userProfile.preferences.join(', ')}
    - Nuvarande grödor: ${userProfile.currentCrops.join(', ')}
    - Hushållsstorlek: ${userProfile.householdSize || 2}
    ${weatherContext}
    ${forecastContext}
    ${warningsContext}

    Användarens fråga: ${userQuestion}

    Svara på svenska med:
    - Praktiska, konkreta råd anpassade för svenska förhållanden
    - Fokus på krisberedskap och självförsörjning enligt MSB-riktlinjer
    - Använd svenska växtnamn och måttenheter (meter, liter, kilogram)
    - Vara hjälpsam och stödjande i svensk kriskommunikationsstil
    - Ge specifika åtgärder när möjligt med svenska myndighetsreferenser
    - Håll svaret koncist men informativt (max 300 ord)
    - Använd svenska krisberedskapsterminologi och MSB-rekommendationer
    - Fokusera särskilt på kommande väderförhållanden och extrema väderhändelser
    - Ge konkreta råd baserat på väderprognos och varningar`;

    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    return NextResponse.json({ response: content });
  } catch (error) {
    console.error('OpenAI coach response error:', error);
    return NextResponse.json(
      { error: 'Failed to generate coach response' },
      { status: 500 }
    );
  }
}
