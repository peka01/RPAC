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
  category?: string;
  season?: string;
  difficulty?: string;
  estimatedTime?: string;
  tools?: string[];
  steps?: string[];
  tips?: string[];
}

export interface UserProfile {
  climateZone?: 'gotaland' | 'svealand' | 'norrland';
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  gardenSize?: 'small' | 'medium' | 'large';
  county?: string;
  city?: string;
  preferences?: string[];
  currentCrops?: string[];
}

export class SecureOpenAIService {
  /**
   * Rate limiting check (5 requests per minute)
   */
  private static checkRateLimit(): boolean {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    const requests = JSON.parse(localStorage.getItem('openai_requests') || '[]');

    const recentRequests = requests.filter((timestamp: number) => timestamp > oneMinuteAgo);

    if (recentRequests.length >= 5) {
      console.warn('OpenAI API rate limit exceeded. Please wait a moment.');
      return false;
    }

    recentRequests.push(now);
    localStorage.setItem('openai_requests', JSON.stringify(recentRequests));
    return true;
  }

  /**
   * Call Cloudflare Function with rate limiting
   */
  private static async callCloudflareFunction(endpoint: string, body: any): Promise<any> {
    // Check rate limiting
    if (!this.checkRateLimit()) {
      throw new Error('Rate limit exceeded. Please wait before making another request.');
    }

    try {
      const response = await fetch(`/functions/openai/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Cloudflare Function call failed:', error);
      throw error;
    }
  }

  /**
   * Generate daily preparedness tips using Cloudflare Functions
   */
  static async generateDailyPreparednessTips(userProfile: UserProfile): Promise<CultivationAdvice[]> {
    try {
      const result = await this.callCloudflareFunction('daily-tips', { userProfile });
      return result;
    } catch (error) {
      console.error('Error generating daily tips:', error);
      return this.getFallbackAdvice();
    }
  }

  /**
   * Generate personal coach response using Cloudflare Functions
   */
  static async generatePersonalCoachResponse({
    userProfile,
    userQuestion,
    chatHistory = []
  }: {
    userProfile: UserProfile;
    userQuestion: string;
    chatHistory?: Array<{ sender: string; message: string; timestamp: string }>;
  }): Promise<string> {
    try {
      const result = await this.callCloudflareFunction('coach-response', {
        userProfile,
        userQuestion,
        chatHistory
      });
      return result.response;
    } catch (error) {
      console.error('Error generating coach response:', error);
      return 'Jag beklagar, men jag kunde inte generera ett svar just nu. Försök igen senare.';
    }
  }

  /**
   * Analyze plant image using Cloudflare Functions
   */
  static async analyzePlantImage(
    imageData: string,
    userProfile: UserProfile = { climateZone: 'svealand', experienceLevel: 'beginner', gardenSize: 'medium' }
  ): Promise<PlantDiagnosisResult> {
    try {
      const result = await this.callCloudflareFunction('plant-diagnosis', {
        imageData,
        userProfile
      });
      return result;
    } catch (error) {
      console.error('Error analyzing plant image:', error);
      return this.getFallbackDiagnosis();
    }
  }

  /**
   * Fallback advice when AI is unavailable
   */
  static getFallbackAdvice(): CultivationAdvice[] {
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
      },
      {
        id: 'fallback-3',
        type: 'tip',
        priority: 'medium',
        title: 'Plantera för säsongen',
        description: 'Kontrollera vilka grönsaker som kan planteras nu baserat på din klimatzon.',
        action: 'Kontrollera odlingskalender',
        timeframe: 'Månadsvis',
        icon: '🌱',
        category: 'cultivation',
        season: 'spring',
        difficulty: 'beginner',
        estimatedTime: '1 timme',
        tools: ['Odlingskalender', 'Frön', 'Jord'],
        steps: ['Kontrollera väderprognos', 'Förbered jord', 'Plantera frön'],
        tips: ['Börja med enkla grönsaker som sallad', 'Kontrollera frostvarningar']
      }
    ];
  }

  /**
   * Fallback diagnosis when AI is unavailable
   */
  static getFallbackDiagnosis(): PlantDiagnosisResult {
    return {
      plantName: 'Okänd växt',
      scientificName: 'Plant species',
      healthStatus: 'healthy',
      confidence: 0.5,
      description: 'Jag kunde inte analysera bilden just nu. Försök igen senare eller kontakta en lokal odlingsexpert.',
      recommendations: [
        'Kontrollera regelbundet för skadedjur',
        'Se till att växten får tillräckligt med vatten',
        'Kontrollera att jorden har bra dränering'
      ],
      severity: 'low'
    };
  }
}