import { swedishPlantDatabase, getPlantById, getDiseaseInfo, getPestInfo } from './swedish-plant-database';
import { getOpenAIApiKey, initializeRuntimeConfig } from './runtime-config';

export interface PlantDiagnosisResult {
  plantName: string;
  scientificName: string;
  healthStatus: 'healthy' | 'disease' | 'pest' | 'nutrient_deficiency';
  confidence: number;
  description: string;
  recommendations: string[];
  severity: 'low' | 'medium' | 'high';
}

export interface CultivationAdvice {
  id: string;
  type: 'recommendation' | 'warning' | 'tip' | 'seasonal';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action?: string;
  timeframe?: string;
  icon: string;
  plant?: string;
  category?: string;
  season?: string;
  difficulty?: string;
  estimatedTime?: string;
  tools?: string[];
  steps?: string[];
  tips?: string[];
}

export interface UserProfile {
  climateZone: string;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  gardenSize: 'small' | 'medium' | 'large';
  preferences: string[];
  currentCrops: string[];
  householdSize?: number;
  hasChildren?: boolean;
  hasElderly?: boolean;
  weather?: {
    temperature: number;
    humidity: number;
    rainfall: string;
    forecast: string;
    windSpeed: number;
    windDirection: string;
    pressure: number;
    uvIndex: number;
    sunrise: string;
    sunset: string;
  } | null;
  forecast?: Array<{
    date: string;
    temperature: { min: number; max: number };
    weather: string;
    rainfall: number;
    windSpeed: number;
  }>;
  extremeWeatherWarnings?: string[];
}

export class SecureOpenAIService {
  private static readonly RATE_LIMIT_KEY = 'openai_rate_limit';
  private static readonly RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
  private static readonly MAX_REQUESTS_PER_WINDOW = 5;

  /**
   * Check rate limiting to prevent abuse
   */
  private static checkRateLimit(): boolean {
    const now = Date.now();
    const stored = localStorage.getItem(this.RATE_LIMIT_KEY);
    
    if (!stored) {
      localStorage.setItem(this.RATE_LIMIT_KEY, JSON.stringify([now]));
      return true;
    }

    const requests: number[] = JSON.parse(stored);
    const validRequests = requests.filter(time => now - time < this.RATE_LIMIT_WINDOW);
    
    if (validRequests.length >= this.MAX_REQUESTS_PER_WINDOW) {
      return false;
    }

    validRequests.push(now);
    localStorage.setItem(this.RATE_LIMIT_KEY, JSON.stringify(validRequests));
    return true;
  }

  /**
   * Secure API call with rate limiting and error handling
   */
  private static async makeSecureAPICall(messages: any[], maxTokens: number = 1000): Promise<string> {
    // Check rate limiting
    if (!this.checkRateLimit()) {
      throw new Error('Rate limit exceeded. Please wait before making another request.');
    }

    // Initialize runtime config if not already done
    initializeRuntimeConfig();
    
    // Get API key from runtime configuration
    const apiKey = getOpenAIApiKey();
    
    if (!apiKey) {
      console.error('OpenAI API key not found. Environment check:', {
        hasProcessEnv: !!process.env.NEXT_PUBLIC_OPENAI_API_KEY,
        hasWindow: typeof window !== 'undefined',
        availableKeys: Object.keys(process.env).filter(k => k.includes('OPENAI')),
        runtimeConfig: getOpenAIApiKey()
      });
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages,
          max_tokens: maxTokens,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        if (response.status === 401) {
          throw new Error('Invalid API key. Please check your configuration.');
        }
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'No response generated';
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw error;
    }
  }

  /**
   * Generate daily preparedness tips with security measures
   */
  static async generateDailyPreparednessTips(profile: UserProfile): Promise<CultivationAdvice[]> {
    try {
      const weatherContext = profile.weather ? `
      Aktuellt väder:
      - Temperatur: ${profile.weather.temperature}°C
      - Luftfuktighet: ${profile.weather.humidity}%
      - Nederbörd: ${profile.weather.rainfall}
      - Väderlek: ${profile.weather.forecast}
      - Vind: ${profile.weather.windSpeed} m/s ${profile.weather.windDirection}
      ` : '';

      const forecastContext = profile.forecast && profile.forecast.length > 0 ? `
      Väderprognos (nästa ${profile.forecast.length} dagar):
      ${profile.forecast.map((day: any) => `- ${new Date(day.date).toLocaleDateString('sv-SE', { weekday: 'long' })}: ${day.temperature.min}°C - ${day.temperature.max}°C, ${day.weather}`).join('\n')}
      ` : '';

      const warningsContext = profile.extremeWeatherWarnings && profile.extremeWeatherWarnings.length > 0 ? `
      EXTREMA VÄDERVIKTIGA VARNINGAR:
      ${profile.extremeWeatherWarnings.join('\n')}
      ` : '';

      const messages = [
        {
          role: 'system',
          content: 'Du är en svensk krisberedskapsexpert och odlingsexpert. Ge praktiska, säkra råd på svenska för svenska familjer. Fokusera på MSB:s rekommendationer och svenska förhållanden.'
        },
        {
          role: 'user',
          content: `Skapa 3-5 dagliga beredskapstips för en familj i Sverige.

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
          
          Svara med JSON-format:
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
          ]`
        }
      ];

      const response = await this.makeSecureAPICall(messages, 2000);
      
      try {
        const tips = JSON.parse(response);
        return Array.isArray(tips) ? tips : this.getFallbackAdvice();
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        return this.getFallbackAdvice();
      }
    } catch (error) {
      console.error('Daily tips generation error:', error);
      return this.getFallbackAdvice();
    }
  }

  /**
   * Generate personal coach response with security measures
   */
  static async generatePersonalCoachResponse(context: {
    userProfile: UserProfile;
    userQuestion: string;
    chatHistory: any[];
  }): Promise<string> {
    try {
      const weatherContext = context.userProfile.weather ? `
      Aktuellt väder: ${context.userProfile.weather.temperature}°C, ${context.userProfile.weather.forecast}
      ` : '';

      const messages = [
        {
          role: 'system',
          content: 'Du är en svensk krisberedskapsexpert och personlig coach. Svara på svenska med praktiska råd baserat på MSB:s rekommendationer. Håll svaret koncist (max 300 ord).'
        },
        {
          role: 'user',
          content: `Användarprofil:
          - Klimatzon: ${context.userProfile.climateZone}
          - Erfarenhet: ${context.userProfile.experienceLevel}
          - Trädgårdsstorlek: ${context.userProfile.gardenSize}
          ${weatherContext}
          
          Fråga: ${context.userQuestion}
          
          Ge ett praktiskt svar på svenska med fokus på svenska förhållanden och MSB:s rekommendationer.`
        }
      ];

      return await this.makeSecureAPICall(messages, 500);
    } catch (error) {
      console.error('Personal coach error:', error);
      return 'Jag kan tyvärr inte svara på din fråga just nu. Kontrollera väderprognosen på SMHI.se och se till att ha tillräckligt med förnödenheter hemma.';
    }
  }

  /**
   * Analyze plant image with security measures
   */
  static async analyzePlantImage(imageBase64: string, userProfile?: UserProfile): Promise<PlantDiagnosisResult> {
    try {
      const messages = [
        {
          role: 'system',
          content: 'Du är en svensk växtexpert. Analysera växtbilder och ge diagnoser på svenska. Fokusera på svenska växter och odlingsförhållanden.'
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analysera denna växtbild och identifiera eventuella problem. Fokusera på svenska växter och odlingsförhållanden.
              
              Användarprofil:
              - Klimatzon: ${userProfile?.climateZone || 'svealand'}
              - Erfarenhet: ${userProfile?.experienceLevel || 'beginner'}
              - Trädgårdsstorlek: ${userProfile?.gardenSize || 'medium'}
              
              Svara med JSON-format:
              {
                "plantName": "Växtens namn",
                "scientificName": "Vetenskapligt namn",
                "healthStatus": "healthy|disease|pest|nutrient_deficiency",
                "confidence": 0.85,
                "description": "Beskrivning av växtens tillstånd",
                "recommendations": ["Rekommendation 1", "Rekommendation 2"],
                "severity": "low|medium|high"
              }`
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }
      ];

      const response = await this.makeSecureAPICall(messages, 1000);
      
      try {
        const diagnosis = JSON.parse(response);
        return diagnosis;
      } catch (parseError) {
        console.error('Failed to parse plant diagnosis:', parseError);
        return this.getFallbackDiagnosis();
      }
    } catch (error) {
      console.error('Plant diagnosis error:', error);
      return this.getFallbackDiagnosis();
    }
  }

  /**
   * Fallback advice when AI is unavailable
   */
  private static getFallbackAdvice(): CultivationAdvice[] {
    const currentMonth = new Date().getMonth() + 1;
    const season = currentMonth >= 3 && currentMonth <= 5 ? 'spring' : 
                  currentMonth >= 6 && currentMonth <= 8 ? 'summer' : 
                  currentMonth >= 9 && currentMonth <= 11 ? 'autumn' : 'winter';

    return [
      {
        id: 'fallback-1',
        type: 'tip',
        priority: 'medium',
        title: 'Kontrollera väderprognosen',
        description: 'Titta på väderprognosen för de kommande dagarna för att planera din odling.',
        action: 'Kontrollera SMHI:s väderprognos',
        timeframe: 'Dagligen',
        icon: '🌤️',
        category: 'weather',
        season: season,
        difficulty: 'beginner',
        estimatedTime: '5 minuter',
        tools: ['Internetanslutning', 'SMHI-app'],
        steps: ['Öppna SMHI:s webbplats', 'Kontrollera 5-dagars prognos', 'Planera odlingsaktiviteter'],
        tips: ['Fokusera på frostvarningar under våren', 'Undvik vattning vid regnprognos']
      },
      {
        id: 'fallback-2',
        type: 'tip',
        priority: 'high',
        title: 'Förbered för kriser',
        description: 'Se till att du har tillräckligt med mat och vatten för minst 3 dagar.',
        action: 'Kontrollera dina förnödenheter',
        timeframe: 'Veckovis',
        icon: '🚨',
        category: 'preparedness',
        season: 'all',
        difficulty: 'beginner',
        estimatedTime: '30 minuter',
        tools: ['Förteckning över förnödenheter'],
        steps: ['Inventera matförråd', 'Kontrollera vattenförråd', 'Uppdatera beredskapslista'],
        tips: ['Fokusera på icke-perishable mat', 'Ha minst 3 liter vatten per person per dag']
      }
    ];
  }

  /**
   * Fallback diagnosis when AI is unavailable
   */
  private static getFallbackDiagnosis(): PlantDiagnosisResult {
    return {
      plantName: 'AI-diagnos inte tillgänglig',
      scientificName: 'Unknown',
      healthStatus: 'healthy',
      confidence: 0,
      description: 'Jag kan tyvärr inte analysera din växtbild just nu. Kontakta en lokal trädgårdsexpert eller använd växtidentifieringsappar som PlantNet.',
      recommendations: [
        'Ta en tydlig bild av växten i dagsljus',
        'Kontrollera jordens fuktighet',
        'Undersök bladens färg och form noggrant'
      ],
      severity: 'medium'
    };
  }
}
