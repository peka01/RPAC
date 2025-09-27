import OpenAI from 'openai';
import { config } from './config';

// Initialize OpenAI
console.log('OpenAI API Key:', config.openai.apiKey ? 'Present' : 'Missing');
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
  dangerouslyAllowBrowser: true // Required for client-side usage
});

export interface PlantDiagnosisResult {
  plantName: string;
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
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  gardenSize: 'small' | 'medium' | 'large';
  preferences: string[];
  currentCrops: string[];
  householdSize?: number;
  hasChildren?: boolean;
  hasElderly?: boolean;
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
        if (typeof item === 'object' && item.period && item.aktiviteter) {
          return `${item.period}: ${Array.isArray(item.aktiviteter) ? item.aktiviteter.join(', ') : item.aktiviteter}`;
        }
        return String(item);
      }).join('\n');
    }
    return String(timeline);
  }

  // Helper method to format array data
  static formatArray(array: any): string[] {
    if (!Array.isArray(array)) {
      return [];
    }
    return array.map(item => {
      if (typeof item === 'string') {
        return item;
      }
      if (typeof item === 'object') {
        return JSON.stringify(item);
      }
      return String(item);
    });
  }

  /**
   * Analyze plant image for diseases, pests, and health issues
   */
  static async analyzePlantImage(imageBase64: string): Promise<PlantDiagnosisResult> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analysera växtbild. Identifiera: namn, hälsostatus, förtroende, beskrivning, rekommendationer, allvarlighetsgrad.

JSON:
{
  "plantName": "växtens namn",
  "healthStatus": "frisk|sjukdom|skadedjur|näringsbrist",
  "confidence": 0.85,
  "description": "kort beskrivning",
  "recommendations": ["rekommendation1", "rekommendation2"],
  "severity": "låg|medium|hög"
}`
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
        max_tokens: 500,
        temperature: 0.2
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Parse JSON response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          plantName: parsed.plantName || 'Okänd växt',
          healthStatus: parsed.healthStatus || 'healthy',
          confidence: parsed.confidence || 0.5,
          description: parsed.description || 'Kunde inte analysera bilden',
          recommendations: parsed.recommendations || [],
          severity: parsed.severity || 'low'
        };
      }

      throw new Error('Invalid JSON response');
    } catch (error) {
      console.error('OpenAI plant analysis error:', error);
      return {
        plantName: 'Okänd växt',
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

      // Parse JSON response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return Array.isArray(parsed) ? parsed : [];
      }

      throw new Error('Invalid JSON response');
    } catch (error) {
      console.error('OpenAI cultivation advice error:', error);
      return this.getFallbackAdvice();
    }
  }

  /**
   * Get crisis-specific cultivation advice
   */
  static async getCrisisAdvice(profile: UserProfile): Promise<CultivationAdvice[]> {
    try {
      const prompt = `Skapa krisodlingsråd för en familj i Sverige under krisläge. Fokusera på:
      - Snabb matproduktion
      - Hållbara grödor
      - Minimal resursanvändning
      - Självförsörjning
      
      Användarprofil:
      - Klimatzon: ${profile.climateZone}
      - Erfarenhet: ${profile.experienceLevel}
      - Trädgårdsstorlek: ${profile.gardenSize}
      
      Skapa 3-5 krisodlingsråd på svenska. Svara med JSON-format som tidigare.`;

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

      // Parse JSON response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return Array.isArray(parsed) ? parsed : [];
      }

      throw new Error('Invalid JSON response');
    } catch (error) {
      console.error('OpenAI crisis advice error:', error);
      return this.getFallbackAdvice();
    }
  }

  /**
   * Get fallback advice when OpenAI is unavailable
   */
  static getFallbackAdvice(): CultivationAdvice[] {
    return [
      {
        id: 'fallback-1',
        type: 'recommendation',
        priority: 'high',
        title: 'Planera din odling',
        description: 'Börja med att planera vad du vill odla baserat på din klimatzon och tillgängligt utrymme.',
        action: 'Skapa en odlingsplan',
        timeframe: 'Innan såsäsongen',
        icon: '📋',
        category: 'planning',
        season: 'winter',
        difficulty: 'beginner',
        estimatedTime: '2 timmar',
        tools: ['papper', 'penna', 'måttband'],
        steps: ['Mät tillgängligt utrymme', 'Välj lämpliga grödor', 'Planera plantering'],
        tips: ['Börja småskaligt första året', 'Välj grödor du gillar att äta']
      }
    ];
  }

  /**
   * Generate comprehensive cultivation plan using AI
   */
  static async generateCultivationPlan(userProfile: UserProfile, nutritionNeeds: any, selectedCrops: any[]): Promise<any> {
    try {
      const prompt = `Skapa odlingsplan för ${userProfile.householdSize || 3} personer i ${userProfile.climateZone}.

Grödor: ${selectedCrops.map(crop => crop.crop).join(', ')}
Näring: ${nutritionNeeds.dailyCalories} kcal, ${nutritionNeeds.protein}g protein
Erfarenhet: ${userProfile.experienceLevel}, Storlek: ${userProfile.gardenSize}

Näringsvärden:
- Kött: 20g protein/100g
- Fisk: 18g protein/100g  
- Mjölk: 3g protein/100ml
- Ägg: 6g protein/st
- Citrus: 50mg C-vitamin/100g
- Grönsaker: 30mg C-vitamin/100g

JSON:
{
  "id": "unique-id",
  "title": "Personlig odlingsplan för familjen",
  "description": "Kort beskrivning av planen",
  "timeline": "Jan: Planering\\nFeb: Beställ frön\\nMar: Förbered jord\\nApr: Så kalla grödor\\nMaj: Plantera värmeälskande\\nJun-Jul: Skötsel\\nAug-Sep: Skörd\\nOkt: Vinterförberedelse",
  "nutritionContribution": {
    "dailyCalories": 2000,
    "protein": 50,
    "carbs": 250,
    "fat": 65
  },
  "gapAnalysis": {
    "nutritionalGaps": [
      {"nutrient": "Protein", "gap": 15.2},
      {"nutrient": "Vitamin C", "gap": 8.5}
    ],
    "groceryNeeds": [
      {"item": "Kött", "estimatedCost": 45, "quantity": 0.2, "unit": "kg"},
      {"item": "Citrusfrukter", "estimatedCost": 25, "quantity": 0.5, "unit": "kg"}
    ],
    "totalEstimatedCost": 70
  },
  "nextSteps": [
    "Beställ frön i jan",
    "Förbered jord feb-mar",
    "Så kalla grödor mar",
    "Plantera värmeälskande maj"
  ],
  "recommendations": [
    "Börja med potatis/morötter",
    "Använd kompost",
    "Vattna regelbundet",
    "Rotera grödor årligen"
  ],
  "selfSufficiencyPercent": 45,
  "estimatedCost": 1200
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Parse JSON response
      let jsonData;
      try {
        // Remove any markdown formatting
        const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        jsonData = JSON.parse(cleanContent);
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        throw new Error('Invalid JSON response from AI');
      }

      return jsonData;
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw error;
    }
  }
}
