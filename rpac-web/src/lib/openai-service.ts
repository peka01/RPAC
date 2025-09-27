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
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: 'planting' | 'maintenance' | 'harvest' | 'preparation';
  season: 'spring' | 'summer' | 'autumn' | 'winter' | 'all';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  tools: string[];
  steps: string[];
  tips: string[];
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
                text: `Analysera denna växtbild och ge en detaljerad diagnos på svenska. Identifiera:
                1. Växtens namn
                2. Hälsostatus (frisk, sjukdom, skadedjur, näringsbrist)
                3. Förtroende (0-1)
                4. Beskrivning av problemet
                5. Rekommendationer för behandling
                6. Allvarlighetsgrad (låg, medium, hög)
                
                Svara med JSON-format:
                {
                  "plantName": "växtens namn",
                  "healthStatus": "frisk|sjukdom|skadedjur|näringsbrist",
                  "confidence": 0.85,
                  "description": "beskrivning",
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
        max_tokens: 1000,
        temperature: 0.3
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
   * Generate comprehensive cultivation plan
   */
  static async generateCultivationPlan(profile: UserProfile, nutritionNeeds: any, selectedCrops: any[]): Promise<any> {
    try {
      const prompt = `Skapa en personlig odlingsplan för en familj i Sverige. 
      
      Användarprofil:
      - Klimatzon: ${profile.climateZone}
      - Erfarenhet: ${profile.experienceLevel}
      - Trädgårdsstorlek: ${profile.gardenSize}
      - Föredragna grödor: ${profile.preferences.join(', ')}
      - Valda grödor: ${selectedCrops.map(crop => crop.crop).join(', ')}
      - Näringsbehov: ${JSON.stringify(nutritionNeeds)}
      
      Valda grödor med kostnadsdata:
      ${selectedCrops.map(crop => `- ${crop.crop}: ${crop.spaceRequired}m², ${crop.costPerM2}kr/m², totalt ${(crop.spaceRequired * crop.costPerM2).toFixed(0)}kr`).join('\n')}
      
      VIKTIGT: För tidslinjen, använd EXAKT detta format - varje månad på en egen rad:
      "Januari: Planering och förberedelser
      Februari: Beställ frön och jord  
      Mars: Förbered jorden och såbäddar
      April: Så morötter, kål och potatis
      Maj: Plantera ut tomater
      Juni: Vattna och sköta regelbundet
      Juli: Skörda tidiga grödor
      Augusti: Höstskörd av tomater
      September: Skörda potatis och morötter
      Oktober: Förbered för vinter"
      
      OBS: Varje månad måste vara på sin egen rad med format "Månad: Beskrivning"
      
      Svara med JSON-format:
      {
        "titel": "Planens titel",
        "beskrivning": "Detaljerad beskrivning av planen", 
        "tidslinje": "Januari: Planering och förberedelser\\nFebruari: Beställ frön och jord\\nMars: Förbered jorden och såbäddar\\nApril: Så morötter, kål och potatis\\nMaj: Plantera ut tomater\\nJuni: Vattna och sköta regelbundet\\nJuli: Skörda tidiga grödor\\nAugusti: Höstskörd av tomater\\nSeptember: Skörda potatis och morötter\\nOktober: Förbered för vinter",
        "nästa_steg": ["steg1", "steg2", "steg3"],
        "rekommendationer": ["rek1", "rek2", "rek3"],
        "prioritet": "high|medium|low"
      }`;

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

      // Parse JSON response - handle markdown code blocks
      let jsonText = content;
      if (jsonText.includes('```json')) {
        jsonText = jsonText.replace(/```json\s*/, '').replace(/```\s*$/, '');
      }
      
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Handle nested structure - AI might return {odlingsplan: {...}}
        const planData = parsed.odlingsplan || parsed;
        
        // Map Swedish field names to English field names expected by UI
        const mappedPlan = {
          id: 'ai-generated-plan',
          title: planData.titel || planData.title || 'AI-genererad odlingsplan',
          description: planData.beskrivning || planData.description || 'Personlig odlingsplan',
          crops: planData.grödor || planData.crops || [],
          totalCalories: planData.totala_kalorier || planData.totalCalories || 0,
          selfSufficiencyPercent: planData.självförsörjning || planData.selfSufficiencyPercent || 0,
          groceryGap: planData.inköpsgap || planData.groceryGap || [],
          estimatedCost: planData.uppskattad_kostnad || planData.estimatedCost || 0,
          timeline: OpenAIService.formatTimeline(planData.tidslinje || planData.timeline || '12 månader'),
          priority: planData.prioritet || planData.priority || 'high',
          nextSteps: OpenAIService.formatArray(planData.nästa_steg || planData.nextSteps || []),
          recommendations: OpenAIService.formatArray(planData.rekommendationer || planData.recommendations || [])
        };
        
        return mappedPlan;
      }

      throw new Error('Invalid JSON response');
    } catch (error) {
      console.error('OpenAI cultivation plan error:', error);
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('429') || error.message.includes('quota')) {
          console.warn('OpenAI quota exceeded, using fallback plan');
        } else if (error.message.includes('401') || error.message.includes('unauthorized')) {
          console.warn('OpenAI API key invalid, using fallback plan');
        } else {
          console.warn('OpenAI API error, using fallback plan:', error.message);
        }
      }
      
      return this.getFallbackPlan(profile, nutritionNeeds);
    }
  }

  /**
   * Fallback advice when API fails
   */
  static getFallbackAdvice(): CultivationAdvice[] {
    return [
      {
        id: 'fallback-1',
        title: 'Förbered jorden',
        description: 'Börja med att förbereda jorden för odling genom att rensa ogräs och lägga till kompost.',
        priority: 'high',
        category: 'preparation',
        season: 'spring',
        difficulty: 'beginner',
        estimatedTime: '2-3 timmar',
        tools: ['spade', 'kompost', 'hacka'],
        steps: ['Rensa ogräs', 'Lägg till kompost', 'Blanda jorden'],
        tips: ['Arbeta i små sektioner', 'Använd kompost för bättre jordkvalitet']
      },
      {
        id: 'fallback-2',
        title: 'Välj lämpliga grödor',
        description: 'Välj grödor som passar din klimatzon och erfarenhetsnivå.',
        priority: 'medium',
        category: 'planting',
        season: 'spring',
        difficulty: 'beginner',
        estimatedTime: '1 timme',
        tools: ['frön', 'planteringsplan'],
        steps: ['Undersök klimatzon', 'Välj grödor', 'Plantera'],
        tips: ['Börja med enkla grödor', 'Följ såinstruktioner']
      }
    ];
  }

  /**
   * Fallback plan when API fails
   */
  static getFallbackPlan(profile: UserProfile, nutritionNeeds: any): any {
    const householdSize = profile.householdSize || 3;
    const experienceLevel = profile.experienceLevel || 'beginner';
    
    return {
      id: 'fallback-plan',
      title: `Personlig odlingsplan för ${householdSize} personer`,
      description: `En grundläggande odlingsplan anpassad för ${experienceLevel} odlare. Denna plan fokuserar på enkla grödor som är lätta att odla och ger bra skördar.`,
      crops: ['Potatis', 'Morötter', 'Sallad', 'Tomater', 'Gurka', 'Basilika'],
      totalCalories: householdSize * 2000 * 0.3, // 30% self-sufficiency
      selfSufficiencyPercent: 30,
      groceryGap: [
        { name: 'Kött', costPerKg: 120, quantity: 2 },
        { name: 'Mjölkprodukter', costPerKg: 15, quantity: 5 },
        { name: 'Spannmål', costPerKg: 8, quantity: 10 }
      ],
      estimatedCost: householdSize * 800,
      timeline: `Januari: Planering och förberedelser
Februari: Beställ frön och jord
Mars: Förbered jorden och såbäddar
April: Så kalla grödor (sallad, morötter, spenat)
Maj: Plantera tomater och gurka
Juni: Regelbunden vattning och skötsel
Juli: Skörda tidiga grödor
Augusti: Höstskörd av tomater och gurka
September: Skörda potatis och morötter
Oktober: Förbered för vinter och planera nästa år`,
      priority: 'high',
      nextSteps: [
        'Beställ frön och jord i januari',
        'Förbered odlingsbäddar i februari-mars',
        'Börja såning av kalla grödor i mars',
        'Plantera värmeälskande grödor i maj'
      ],
      recommendations: [
        'Börja med enkla grödor som potatis och morötter',
        'Använd kompost för bättre jordkvalitet',
        'Vattna regelbundet men undvik övervattning',
        'Rotera grödor årligen för bättre jordkvalitet',
        'Dokumentera vad som fungerar bra för nästa år'
      ]
    };
  }
}
