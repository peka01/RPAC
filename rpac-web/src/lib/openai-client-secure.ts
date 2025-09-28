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
   * Call Cloudflare Function with rate limiting and fallback
   */
  private static async callCloudflareFunction(endpoint: string, body: any): Promise<any> {
    // Check rate limiting
    if (!this.checkRateLimit()) {
      throw new Error('Rate limit exceeded. Please wait before making another request.');
    }

    try {
      const response = await fetch(`/api/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        // If Cloudflare Functions fail, throw error to trigger fallback
        throw new Error(`Cloudflare Function error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.warn('Cloudflare Function call failed, using fallback:', error);
      // Return fallback data instead of throwing
      return this.getFallbackResponse(endpoint, body);
    }
  }

  /**
   * Alternative direct OpenAI call (backup method)
   */
  private static async callDirectOpenAI(endpoint: string, body: any): Promise<any> {
    // Check if we have API key available
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not available for direct calls');
    }

    try {
      let openaiEndpoint = '';
      let openaiBody = {};

      switch (endpoint) {
        case 'daily-tips':
          openaiEndpoint = 'https://api.openai.com/v1/chat/completions';
          openaiBody = {
            model: 'gpt-4o',
            messages: [
              {
                role: 'system',
                content: `Du är en svensk krisberedskaps- och odlingsexpert. Ge personliga råd baserat på användarens profil. Fokusera på praktiska, svenska råd för beredskap och odling.`
              },
              {
                role: 'user',
                content: 'Ge mig dagliga råd för beredskap och odling baserat på min profil.'
              }
            ],
            max_tokens: 1000,
            temperature: 0.7
          };
          break;
        case 'coach-response':
          openaiEndpoint = 'https://api.openai.com/v1/chat/completions';
          openaiBody = {
            model: 'gpt-4o',
            messages: [
              {
                role: 'system',
                content: `Du är en svensk krisberedskaps- och odlingsexpert som fungerar som en personlig coach. Du ger praktiska råd på svenska för beredskap och odling.`
              },
              {
                role: 'user',
                content: body.userQuestion
              }
            ],
            max_tokens: 1000,
            temperature: 0.7
          };
          break;
        case 'plant-diagnosis':
          openaiEndpoint = 'https://api.openai.com/v1/chat/completions';
          openaiBody = {
            model: 'gpt-4o',
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: 'Analysera denna växtbild och ge en diagnos på svenska.'
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: `data:image/jpeg;base64,${body.imageData}`
                    }
                  }
                ]
              }
            ],
            max_tokens: 1000,
            temperature: 0.7
          };
          break;
        default:
          throw new Error(`Unknown endpoint: ${endpoint}`);
      }

      const response = await fetch(openaiEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(openaiBody),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return this.parseOpenAIResponse(endpoint, data);
    } catch (error) {
      console.warn('Direct OpenAI call failed, using fallback:', error);
      return this.getFallbackResponse(endpoint, body);
    }
  }

  /**
   * Parse OpenAI response into expected format
   */
  private static parseOpenAIResponse(endpoint: string, data: any): any {
    const content = data.choices[0]?.message?.content || '';

    switch (endpoint) {
      case 'daily-tips':
        return this.parseTipsFromContent(content);
      case 'coach-response':
        return {
          response: content,
          timestamp: new Date().toISOString()
        };
      case 'plant-diagnosis':
        return this.parseDiagnosisFromContent(content);
      default:
        return content;
    }
  }

  /**
   * Parse tips from AI content
   */
  private static parseTipsFromContent(content: string): any[] {
    const lines = content.split('\n').filter(line => line.trim());
    const tips = [];
    
    let currentTip = null;
    
    for (const line of lines) {
      if (line.match(/^\d+\./) || line.startsWith('•') || line.startsWith('-')) {
        if (currentTip) tips.push(currentTip);
        currentTip = {
          id: `tip-${tips.length + 1}`,
          type: 'tip',
          priority: 'medium',
          title: line.replace(/^\d+\.\s*|^[•-]\s*/, '').trim(),
          description: '',
          action: '',
          timeframe: 'Dagligen',
          icon: '🌱',
          category: 'cultivation',
          season: 'all',
          difficulty: 'beginner',
          estimatedTime: '15 minuter',
          tools: [],
          steps: [],
          tips: [] as string[]
        };
      } else if (currentTip && line.trim()) {
        if (!currentTip.description) {
          currentTip.description = line.trim();
        } else {
          currentTip.tips.push(line.trim());
        }
      }
    }
    
    if (currentTip) tips.push(currentTip);
    
    return tips.length > 0 ? tips : this.getFallbackAdvice();
  }

  /**
   * Parse diagnosis from AI content
   */
  private static parseDiagnosisFromContent(content: string): any {
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

  /**
   * Get fallback response when Cloudflare Functions fail
   */
  private static getFallbackResponse(endpoint: string, body: any): any {
    switch (endpoint) {
      case 'daily-tips':
        return this.getFallbackAdvice();
      case 'coach-response':
        return {
          response: 'Jag beklagar, men AI-tjänsten är inte tillgänglig just nu. Försök igen senare eller kontakta support.',
          timestamp: new Date().toISOString()
        };
      case 'plant-diagnosis':
        return this.getFallbackDiagnosis();
      default:
        return [];
    }
  }

  /**
   * Generate daily preparedness tips using Cloudflare Functions
   */
  static async generateDailyPreparednessTips(userProfile: UserProfile): Promise<CultivationAdvice[]> {
    try {
      // Try Cloudflare Functions first
      const result = await this.callCloudflareFunction('daily-tips', { userProfile });
      return result;
    } catch (error) {
      console.warn('Cloudflare Functions failed, trying direct OpenAI:', error);
      try {
        // Try direct OpenAI call as backup
        const data = await this.callDirectOpenAI('daily-tips', { userProfile });
        return data || this.getFallbackAdvice();
      } catch (directError) {
        console.error('Both Cloudflare Functions and direct OpenAI failed:', directError);
        return this.getFallbackAdvice();
      }
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
      // Try Cloudflare Functions first
      const result = await this.callCloudflareFunction('coach-response', {
        userProfile,
        userQuestion,
        chatHistory
      });
      return result.response;
    } catch (error) {
      console.warn('Cloudflare Functions failed, trying direct OpenAI:', error);
      try {
        // Try direct OpenAI call as backup
        const data = await this.callDirectOpenAI('coach-response', {
          userProfile,
          userQuestion,
          chatHistory
        });
        return data.response || 'Jag beklagar, men jag kunde inte generera ett svar just nu. Försök igen senare.';
      } catch (directError) {
        console.error('Both Cloudflare Functions and direct OpenAI failed:', directError);
        return 'Jag beklagar, men jag kunde inte generera ett svar just nu. Försök igen senare.';
      }
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
      // Try Cloudflare Functions first
      const result = await this.callCloudflareFunction('plant-diagnosis', {
        imageData,
        userProfile
      });
      return result;
    } catch (error) {
      console.warn('Cloudflare Functions failed, trying direct OpenAI:', error);
      try {
        // Try direct OpenAI call as backup
        const data = await this.callDirectOpenAI('plant-diagnosis', {
          imageData,
          userProfile
        });
        return data || this.getFallbackDiagnosis();
      } catch (directError) {
        console.error('Both Cloudflare Functions and direct OpenAI failed:', directError);
        return this.getFallbackDiagnosis();
      }
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