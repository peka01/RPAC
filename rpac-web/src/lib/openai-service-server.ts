import { swedishPlantDatabase, getPlantById, getDiseaseInfo, getPestInfo } from './swedish-plant-database';

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

export class OpenAIService {
  // Helper method to format timeline data
  static formatTimeline(timeline: any): string {
    if (typeof timeline === 'string') {
      return timeline;
    }
    if (Array.isArray(timeline)) {
      return timeline.map(item => {
        if (typeof item === 'string') {
          return item;
        }
        if (item && typeof item === 'object') {
          return `${item.week || ''} ${item.task || ''}`.trim();
        }
        return String(item);
      }).join(', ');
    }
    return String(timeline);
  }

  /**
   * Generate daily preparedness tips using API route
   */
  static async generateDailyPreparednessTips(profile: UserProfile): Promise<CultivationAdvice[]> {
    try {
      const response = await fetch('/api/openai/daily-tips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profile }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const tips = await response.json();
      return tips;
    } catch (error) {
      console.error('OpenAI daily tips error:', error);
      return this.getFallbackAdvice();
    }
  }

  /**
   * Generate personal coach response using API route
   */
  static async generatePersonalCoachResponse(context: {
    userProfile: UserProfile;
    userQuestion: string;
    chatHistory: any[];
  }): Promise<string> {
    try {
      const response = await fetch('/api/openai/coach-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(context),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('OpenAI personal coach error:', error);
      return 'Ursäkta, jag kunde inte svara på din fråga just nu. Försök igen eller kontakta en expert för vidare hjälp.';
    }
  }

  /**
   * Analyze plant image using API route
   */
  static async analyzePlantImage(imageBase64: string, userProfile?: UserProfile): Promise<PlantDiagnosisResult> {
    try {
      const response = await fetch('/api/openai/plant-diagnosis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          imageBase64,
          userProfile: userProfile || {
            climateZone: 'svealand',
            experienceLevel: 'beginner',
            gardenSize: 'medium'
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const diagnosis = await response.json();
      return diagnosis;
    } catch (error) {
      console.error('OpenAI plant diagnosis error:', error);
      return {
        plantName: 'Okänd växt',
        scientificName: 'Unknown',
        healthStatus: 'healthy',
        confidence: 0,
        description: 'Kunde inte analysera bilden. Kontrollera att bilden är tydlig och välbelyst.',
        recommendations: ['Försök igen med en tydligare bild.', 'Kontakta en växtexpert för vidare analys.'],
        severity: 'low'
      };
    }
  }

  /**
   * Generate cultivation advice based on user profile
   */
  static async generateCultivationAdvice(profile: UserProfile, crisisMode: boolean = false): Promise<CultivationAdvice[]> {
    try {
      const prompt = `Skapa personliga odlingsråd för en familj i Sverige. 
      
      Användarprofil:
      - Klimatzon: ${profile.climateZone}
      - Erfarenhet: ${profile.experienceLevel}
      - Trädgårdsstorlek: ${profile.gardenSize}
      - Föredragna grödor: ${profile.preferences.join(', ')}
      - Nuvarande grödor: ${profile.currentCrops.join(', ')}
      - Krisläge: ${crisisMode ? 'Ja' : 'Nej'}
      
      Skapa 3-5 praktiska råd på svenska. Svara med JSON-format:
      [
        {
          "id": "unique-id",
          "title": "Rådets titel",
          "description": "Beskrivning av rådet",
          "priority": "high|medium|low",
          "category": "planting|maintenance|harvest|preparation",
          "season": "spring|summer|autumn|winter|all",
          "difficulty": "beginner|intermediate|advanced",
          "estimatedTime": "Tidsuppskattning",
          "tools": ["verktyg1", "verktyg2"],
          "steps": ["steg1", "steg2"],
          "tips": ["tips1", "tips2"]
        }
      ]`;

      // For now, return fallback advice since we don't have a server-side route for this
      return this.getFallbackAdvice();
    } catch (error) {
      console.error('OpenAI cultivation advice error:', error);
      return this.getFallbackAdvice();
    }
  }

  /**
   * Generate cultivation plan (fallback implementation)
   */
  static async generateCultivationPlan(userProfile: UserProfile, nutritionNeeds: any, selectedCrops: any[]): Promise<any> {
    try {
      // For now, return a fallback plan since we don't have a server-side route for this
      return {
        plan: {
          crops: selectedCrops,
          timeline: [
            { week: 1, tasks: ['Förbered jord', 'Plantera tidiga grödor'] },
            { week: 2, tasks: ['Vattna regelbundet', 'Kontrollera växters hälsa'] },
            { week: 3, tasks: ['Skörda tidiga grödor', 'Plantera nästa omgång'] }
          ],
          nutrition: nutritionNeeds,
          space: 'Anpassad efter valda grödor',
          cost: 'Beror på grödval och storlek'
        },
        success: true
      };
    } catch (error) {
      console.error('OpenAI cultivation plan error:', error);
      return {
        plan: null,
        success: false,
        error: 'Kunde inte generera odlingsplan'
      };
    }
  }

  /**
   * Generate conversation response (fallback implementation)
   */
  static async generateConversationResponse(context: any): Promise<string> {
    try {
      // For now, return a fallback response since we don't have a server-side route for this
      return 'Jag förstår din fråga om växtdiagnos. För en mer detaljerad analys, vänligen ladda upp en tydlig bild av växten så kan jag ge dig bättre råd.';
    } catch (error) {
      console.error('OpenAI conversation response error:', error);
      return 'Ursäkta, jag kunde inte svara på din fråga just nu. Försök igen eller kontakta en expert för vidare hjälp.';
    }
  }

  /**
   * Fallback advice when AI is unavailable
   */
  static getFallbackAdvice(): CultivationAdvice[] {
    const currentMonth = new Date().getMonth() + 1;
    const season = currentMonth >= 3 && currentMonth <= 5 ? 'spring' : 
                  currentMonth >= 6 && currentMonth <= 8 ? 'summer' : 
                  currentMonth >= 9 && currentMonth <= 11 ? 'autumn' : 'winter';

    const fallbackTips: CultivationAdvice[] = [
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

    return fallbackTips;
  }
}
