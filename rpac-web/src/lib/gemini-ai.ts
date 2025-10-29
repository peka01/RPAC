import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from './config';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

// Get the generative model - try exact model from docs
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Vision model for image analysis  
const visionModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export interface PlantDiagnosisResult {
  plantName: string;
  healthStatus: 'healthy' | 'disease' | 'pest' | 'nutrient_deficiency';
  confidence: number;
  description: string;
  recommendations: string[];
  severity: 'low' | 'medium' | 'high';
  swedishName?: string;
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
}

export interface UserProfile {
  climateZone: 'gotaland' | 'svealand' | 'norrland';
  experienceLevel: 'beginner' | 'intermediate' | 'expert';
  gardenSize: 'small' | 'medium' | 'large';
  preferences: string[];
  currentCrops: string[];
  householdSize?: number;
  hasChildren?: boolean;
  hasElderly?: boolean;
}

export class GeminiAIService {
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
      const prompt = `
        Analysera denna växtbild och ge en detaljerad diagnos på svenska. 
        
        Fokusera på:
        1. Växtens namn (både vetenskapligt och svenskt namn)
        2. Hälsostatus (frisk, sjukdom, skadedjur, näringsbrist)
        3. Specifika problem du ser
        4. Rekommendationer för behandling
        5. Svårighetsgrad (låg, medel, hög)
        
        Svara i JSON-format:
        {
          "plantName": "Vetenskapligt namn",
          "swedishName": "Svenskt namn",
          "healthStatus": "healthy|disease|pest|nutrient_deficiency",
          "confidence": 0.85,
          "description": "Detaljerad beskrivning av vad du ser",
          "recommendations": ["Rekommendation 1", "Rekommendation 2"],
          "severity": "low|medium|high"
        }
      `;

      const imagePart = {
        inlineData: {
          data: imageBase64,
          mimeType: "image/jpeg"
        }
      };

      const result = await visionModel.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();

      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback if JSON parsing fails
      return {
        plantName: "Okänd växt",
        healthStatus: "healthy",
        confidence: 0.5,
        description: "Kunde inte analysera bilden korrekt.",
        recommendations: ["Kontakta en växtexpert för vidare analys."],
        severity: "low"
      };

    } catch (error) {
      console.error('Gemini AI plant analysis error:', error);
      return {
        plantName: "Analysfel",
        healthStatus: "healthy",
        confidence: 0.0,
        description: "Kunde inte analysera bilden. Kontrollera att bilden är tydlig och välbelyst.",
        recommendations: ["Försök igen med en tydligare bild."],
        severity: "low"
      };
    }
  }

  /**
   * Generate personalized cultivation advice based on user profile
   */
  static async generateCultivationAdvice(
    profile: UserProfile, 
    crisisMode: boolean = false
  ): Promise<CultivationAdvice[]> {
    try {
      const prompt = `
        Du är en expert på svensk odling och krisberedskap. Ge personliga odlingsråd baserat på användarens profil.
        
        Användarprofil:
        - Klimatzon: ${profile.climateZone}
        - Erfarenhet: ${profile.experienceLevel}
        - Trädgårdsstorlek: ${profile.gardenSize}
        - Nuvarande grödor: ${profile.currentCrops.join(', ')}
        - Hushållsstorlek: ${profile.householdSize || 'Okänd'}
        - Krisläge: ${crisisMode ? 'Ja' : 'Nej'}
        
        ${crisisMode ? `
        KRISLÄGE - Fokusera på:
        - Snabbväxande, näringsrika grödor
        - MSB-rekommendationer för krisberedskap
        - Lagringsbar mat
        - Vatteneffektiv odling
        ` : `
        NORMAL ODLING - Fokusera på:
        - Säsongens odlingsuppgifter
        - Optimala grödor för klimatzonen
        - Erfarenhetsbaserade råd
        `}
        
        Ge 3-5 konkreta råd i JSON-format:
        [
          {
            "id": "unique-id",
            "type": "recommendation|warning|tip|seasonal",
            "priority": "high|medium|low",
            "title": "Kort titel",
            "description": "Detaljerad beskrivning",
            "action": "Konkret åtgärd",
            "timeframe": "Tidsram",
            "icon": "Emoji",
            "plant": "Växtnamn (om relevant)"
          }
        ]
        
        Använd svenska språk och svenska växtnamn.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse JSON response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback recommendations
      return this.getFallbackAdvice(profile, crisisMode);

    } catch (error) {
      console.error('Gemini AI cultivation advice error:', error);
      return this.getFallbackAdvice(profile, crisisMode);
    }
  }

  /**
   * Generate crisis-specific advice based on MSB guidelines
   */
  static async getCrisisAdvice(profile: UserProfile): Promise<CultivationAdvice[]> {
    try {
      const prompt = `
        Du är en expert på svensk krisberedskap enligt MSB:s riktlinjer "Om krisen eller kriget kommer".
        Ge krisberedskapsråd för odling baserat på användarens profil.
        
        Användarprofil:
        - Klimatzon: ${profile.climateZone}
        - Erfarenhet: ${profile.experienceLevel}
        - Trädgårdsstorlek: ${profile.gardenSize}
        - Hushållsstorlek: ${profile.householdSize || 'Okänd'}
        
        Fokusera på MSB-rekommendationer:
        - Snabbväxande grödor (rädisor, spenat, sallad)
        - Lagringsbar mat (potatis, morötter, kål)
        - Vatteneffektiv odling
        - Inomhusodling som backup
        - Näringsdensa grödor
        
        Ge 4-6 krisråd i JSON-format:
        [
          {
            "id": "crisis-1",
            "type": "warning",
            "priority": "high",
            "title": "MSB: Snabbväxande grödor",
            "description": "Enligt MSB-riktlinjer: Prioritera rädisor och spenat som ger snabb avkastning.",
            "action": "Så rädisor och spenat inom 2 veckor",
            "timeframe": "4-6 veckor till skörd",
            "icon": "⚡"
          }
        ]
        
        Använd svenska språk och referera till MSB-riktlinjer.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse JSON response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return this.getFallbackCrisisAdvice(profile);

    } catch (error) {
      console.error('Gemini AI crisis advice error:', error);
      return this.getFallbackCrisisAdvice(profile);
    }
  }

  /**
   * Generate weather-based cultivation advice
   */
  static async getWeatherAdvice(
    profile: UserProfile, 
    weatherData: any
  ): Promise<CultivationAdvice[]> {
    try {
      const prompt = `
        Ge väderbaserade odlingsråd baserat på aktuellt väder och användarprofil.
        
        Väderdata:
        - Temperatur: ${weatherData.temperature}°C
        - Luftfuktighet: ${weatherData.humidity}%
        - Nederbörd: ${weatherData.rainfall}
        - Prognos: ${weatherData.forecast}
        
        Användarprofil:
        - Klimatzon: ${profile.climateZone}
        - Trädgårdsstorlek: ${profile.gardenSize}
        - Nuvarande grödor: ${profile.currentCrops.join(', ')}
        
        Ge 2-3 väderbaserade råd i JSON-format:
        [
          {
            "id": "weather-1",
            "type": "tip",
            "priority": "medium",
            "title": "Väderbaserat råd",
            "description": "Beskrivning baserat på väder",
            "action": "Konkret åtgärd",
            "timeframe": "Tidsram",
            "icon": "🌧️"
          }
        ]
        
        Använd svenska språk.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse JSON response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return [];

    } catch (error) {
      console.error('Gemini AI weather advice error:', error);
      return [];
    }
  }

  /**
   * Generate comprehensive cultivation plan
   */
  static async generateCultivationPlan(
    profile: UserProfile,
    nutritionNeeds: any,
    selectedCrops: any[]
  ): Promise<any> {
    try {
      const prompt = `Skapa en personlig odlingsplan för en familj. Inkludera: titel, beskrivning, tidslinje, nästa steg, rekommendationer, uppskattad kostnad och prioritet. Svara med JSON-format på svenska.`;

      let result, response, text;
      try {
        console.log('Calling Gemini API...');
        
        // Add timeout to prevent hanging (increased to 60 seconds for real AI)
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('API call timeout after 60 seconds')), 60000)
        );
        
        const apiPromise = model.generateContent(prompt);
        result = await Promise.race([apiPromise, timeoutPromise]);
        
        console.log('Got response from Gemini API');
        response = await (result as any).response;
        console.log('Extracted response object');
        text = response.text();
        console.log('Got text from response:', text.substring(0, 200) + '...');
        
        // Parse JSON response - handle markdown code blocks
        let jsonText = text;
        
        // Remove markdown code blocks if present
        if (jsonText.includes('```json')) {
          jsonText = jsonText.replace(/```json\s*/, '').replace(/```\s*$/, '');
        }
        
        console.log('Cleaned JSON text:', jsonText.substring(0, 200) + '...');
        
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          console.log('Found JSON match, parsing...');
          const parsed = JSON.parse(jsonMatch[0]);
          console.log('Parsed successfully:', parsed);
          
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
            timeline: GeminiAIService.formatTimeline(planData.tidslinje || planData.timeline || '12 månader'),
            priority: planData.prioritet || planData.priority || 'high',
            nextSteps: GeminiAIService.formatArray(planData.nästa_steg || planData.nextSteps || []),
            recommendations: GeminiAIService.formatArray(planData.rekommendationer || planData.recommendations || [])
          };
          
          console.log('Mapped plan:', mappedPlan);
          return mappedPlan;
        }
        
        console.log('No JSON match found, using fallback');
        return this.getFallbackPlan(profile, nutritionNeeds);
      } catch (error) {
        console.error('Model error, using fallback response...', error);
        // Return mock data when API fails
        return {
          plan: "AI-genererad odlingsplan (mock data på grund av API-problem)",
          crops: ["Potatis", "Morötter", "Sallad", "Tomater"],
          timeline: [
            "Mars: Förbered jord och såbäddar",
            "April: Så kalla grödor (sallad, morötter)",
            "Maj: Plantera tomater och andra värmeälskande grödor",
            "Juni-Juli: Skötsel och vattning",
            "Augusti-September: Skörd"
          ],
          recommendations: [
            "Använd kompost för bättre jordkvalitet",
            "Vattna regelbundet men undvik övervattning",
            "Rotera grödor årligen för bättre jordkvalitet"
          ],
          estimatedCost: 2500,
          priority: "high"
        };
      }

      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return this.getFallbackPlan(profile, nutritionNeeds);

    } catch (error) {
      console.error('Gemini AI cultivation plan error:', error);
      return this.getFallbackPlan(profile, nutritionNeeds);
    }
  }

  // Fallback methods for when AI is unavailable
  private static getFallbackAdvice(profile: UserProfile, crisisMode: boolean): CultivationAdvice[] {
    const currentMonth = new Date().getMonth() + 1;
    const season = currentMonth >= 3 && currentMonth <= 5 ? 'spring' :
                  currentMonth >= 6 && currentMonth <= 8 ? 'summer' :
                  currentMonth >= 9 && currentMonth <= 11 ? 'autumn' : 'winter';

    if (crisisMode) {
      return [
        {
          id: 'crisis-fallback-1',
          type: 'warning',
          priority: 'high',
          title: 'MSB: Snabbväxande grödor',
          description: 'Enligt MSB-riktlinjer: Prioritera rädisor och spenat som ger snabb avkastning.',
          action: 'Så rädisor och spenat inom 2 veckor',
          timeframe: '4-6 veckor till skörd',
          icon: '⚡'
        },
        {
          id: 'crisis-fallback-2',
          type: 'recommendation',
          priority: 'high',
          title: 'MSB: Lagringsbar mat',
          description: 'Prioritera potatis, morötter och kål som kan lagras länge.',
          action: 'Plantera potatis och rotfrukter',
          timeframe: '16-20 veckor till skörd',
          icon: '📦'
        }
      ];
    }

    return [
      {
        id: 'fallback-1',
        type: 'tip',
        priority: 'medium',
        title: 'Säsongens odling',
        description: `Det är ${season} och tid att fokusera på säsongens odlingsuppgifter.`,
        action: 'Kontrollera dina plantor dagligen',
        timeframe: 'Dagligen',
        icon: '🌱'
      }
    ];
  }

  private static getFallbackCrisisAdvice(profile: UserProfile): CultivationAdvice[] {
    return [
      {
        id: 'crisis-fallback-1',
        type: 'warning',
        priority: 'high',
        title: 'MSB: Kriskrisberedskap',
        description: 'Enligt MSB-riktlinjer: Fokusera på snabbväxande, näringsrika grödor.',
        action: 'Så rädisor och spenat omedelbart',
        timeframe: '2-4 veckor till skörd',
        icon: '⚡'
      }
    ];
  }

  private static getFallbackPlan(profile: UserProfile, nutritionNeeds: any): any {
    return {
      title: 'Fallback odlingsplan',
      description: 'Enkel odlingsplan baserad på grundläggande rekommendationer.',
      timeline: '12 månader',
      nextSteps: [
        'Beställ frön för säsongen',
        'Förbered odlingsbäddar',
        'Börja såning enligt kalender'
      ],
      recommendations: [
        'Följ säsongens odlingskalender',
        'Vattna regelbundet',
        'Kontrollera växter dagligen'
      ],
      estimatedCost: 1000,
      priority: 'medium'
    };
  }
}
