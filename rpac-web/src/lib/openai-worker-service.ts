/**
 * OpenAI Service using Cloudflare Worker API
 * This service replaces all direct OpenAI calls with calls to our Cloudflare Worker
 */

const WORKER_API_URL = 'https://api.beready.se';

export interface UserProfile {
  climateZone?: string;
  experienceLevel?: string;
  gardenSize?: string;
  householdSize?: number;
  ageGroups?: any;
  specialNeeds?: string[];
  crisisMode?: boolean;
  location?: string;
  county?: string;
  [key: string]: any;
}

export interface CultivationAdvice {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  icon: string;
}

export interface PlantDiagnosisResult {
  plantName: string;
  healthStatus: string;
  description: string;
  recommendations: string[];
  confidence: number;
}

/**
 * Call the Cloudflare Worker API
 */
async function callWorkerAPI(prompt: string): Promise<string> {
  try {
    const response = await fetch(WORKER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error(`Worker API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract the AI response from OpenAI's format
    if (data.choices && data.choices.length > 0) {
      return data.choices[0].message.content;
    }
    
    throw new Error('No response from AI');
  } catch (error) {
    console.error('Worker API call failed:', error);
    throw error;
  }
}

/**
 * Unified OpenAI Service using Cloudflare Worker
 */
export class OpenAIService {
  /**
   * Generate comprehensive cultivation plan using AI
   */
  static async generateCultivationPlan(
    userProfile: UserProfile, 
    nutritionNeeds: any, 
    selectedCrops: any[]
  ): Promise<any> {
    const prompt = `Som svensk beredskapsexpert och odlingsexpert, skapa en personlig odlingsplan baserad på följande information:

Användarprofil:
- Klimatzon: ${userProfile.climateZone || 'svealand'}
- Erfarenhetsnivå: ${userProfile.experienceLevel || 'beginner'}
- Trädgårdsstorlek: ${userProfile.gardenSize || 'medium'}
- Hushållsstorlek: ${userProfile.householdSize || 1} personer
- Plats: ${userProfile.location || 'Okänd plats'}
- Krisläge: ${userProfile.crisisMode ? 'Ja' : 'Nej'}

Näringsbehov: ${JSON.stringify(nutritionNeeds, null, 2)}

Valda grödor: ${selectedCrops.map(crop => crop.cropType || crop.name).join(', ')}

Skapa en detaljerad odlingsplan med följande struktur (svara endast med JSON):
{
  "title": "Personlig odlingsplan",
  "description": "Beskrivning av planen",
  "timeline": "Detaljerad tidslinje för året",
  "priority": "high/medium/low",
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
    "Beställ frön i januari",
    "Förbered jord februari-mars",
    "Så kalla grödor mars",
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

    try {
      const response = await callWorkerAPI(prompt);
      
      // Parse JSON response
      let jsonData;
      try {
        // Remove any markdown formatting
        const cleanContent = response.replace(/```json\n?/g, '').replace(/```\n?/g, '');
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

  /**
   * Generate daily preparedness tips using AI
   */
  static async generateDailyPreparednessTips(profile: UserProfile): Promise<CultivationAdvice[]> {
    const prompt = `Som svensk beredskapsexpert, ge 3 dagliga tips för beredskap och odling baserat på:

Användarprofil:
- Klimatzon: ${profile.climateZone || 'svealand'}
- Erfarenhetsnivå: ${profile.experienceLevel || 'beginner'}
- Trädgårdsstorlek: ${profile.gardenSize || 'medium'}
- Krisläge: ${profile.crisisMode ? 'Ja' : 'Nej'}

Svara med JSON-array med tips:
[
  {
    "id": "tip-1",
    "title": "Tips titel",
    "description": "Detaljerad beskrivning",
    "priority": "high/medium/low",
    "category": "odling/beredskap/väder",
    "icon": "🌱"
  }
]`;

    try {
      const response = await callWorkerAPI(prompt);
      
      let tips;
      try {
        const cleanContent = response.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        tips = JSON.parse(cleanContent);
      } catch (parseError) {
        console.error('Failed to parse tips response:', parseError);
        return this.getFallbackAdvice();
      }

      return tips;
    } catch (error) {
      console.error('Error generating tips:', error);
      return this.getFallbackAdvice();
    }
  }

  /**
   * Generate personal coach response using AI
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
    const prompt = `Som svensk beredskapsexpert och personlig coach, svara på användarens fråga:

Användarprofil:
- Klimatzon: ${userProfile.climateZone || 'svealand'}
- Erfarenhetsnivå: ${userProfile.experienceLevel || 'beginner'}
- Trädgårdsstorlek: ${userProfile.gardenSize || 'medium'}
- Krisläge: ${userProfile.crisisMode ? 'Ja' : 'Nej'}

Användarens fråga: ${userQuestion}

Chatthistorik: ${chatHistory.map(msg => `${msg.sender}: ${msg.message}`).join('\n')}

Svara på svenska med praktiska råd och tips för beredskap och odling.`;

    try {
      return await callWorkerAPI(prompt);
    } catch (error) {
      console.error('Error generating coach response:', error);
      return 'Jag beklagar, men jag kunde inte generera ett svar just nu. Försök igen senare.';
    }
  }

  /**
   * Analyze plant image using AI
   */
  static async analyzePlantImage(
    imageData: string,
    userProfile: UserProfile = { climateZone: 'svealand', experienceLevel: 'beginner', gardenSize: 'medium' }
  ): Promise<PlantDiagnosisResult> {
    const prompt = `Som svensk växtexpert, analysera denna växtbild och ge diagnos:

Användarprofil:
- Klimatzon: ${userProfile.climateZone}
- Erfarenhetsnivå: ${userProfile.experienceLevel}
- Trädgårdsstorlek: ${userProfile.gardenSize}

Svara med JSON:
{
  "plantName": "Växtnamn",
  "healthStatus": "Frisk/Sjuk/Behöver vård",
  "description": "Detaljerad beskrivning av växtens tillstånd",
  "recommendations": ["Råd 1", "Råd 2", "Råd 3"],
  "confidence": 0.85
}`;

    try {
      const response = await callWorkerAPI(prompt);
      
      let result;
      try {
        const cleanContent = response.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        result = JSON.parse(cleanContent);
      } catch (parseError) {
        console.error('Failed to parse plant analysis:', parseError);
        return this.getFallbackPlantDiagnosis();
      }

      return result;
    } catch (error) {
      console.error('Error analyzing plant:', error);
      return this.getFallbackPlantDiagnosis();
    }
  }

  /**
   * Fallback advice when AI is unavailable
   */
  private static getFallbackAdvice(): CultivationAdvice[] {
    return [
      {
        id: 'fallback-1',
        title: 'Kontrollera väderprognosen',
        description: 'Se till att ha tillräckligt med förnödenheter hemma baserat på väderprognosen.',
        priority: 'high',
        category: 'beredskap',
        icon: '🌤️'
      },
      {
        id: 'fallback-2',
        title: 'Vattna regelbundet',
        description: 'Håll jorden fuktig men inte våt för optimal växttillväxt.',
        priority: 'medium',
        category: 'odling',
        icon: '💧'
      },
      {
        id: 'fallback-3',
        title: 'Plantera för säsongen',
        description: 'Följ säsongens odlingskalender för bästa resultat.',
        priority: 'medium',
        category: 'odling',
        icon: '📅'
      }
    ];
  }

  /**
   * Fallback plant diagnosis when AI is unavailable
   */
  private static getFallbackPlantDiagnosis(): PlantDiagnosisResult {
    return {
      plantName: 'Okänd växt',
      healthStatus: 'Behöver närmare undersökning',
      description: 'Jag kunde inte analysera växten just nu. Kontakta en lokal växtexpert för vidare hjälp.',
      recommendations: [
        'Kontrollera jordens fuktighet',
        'Se till att växten får tillräckligt med ljus',
        'Kontakta en växtexpert för vidare hjälp'
      ],
      confidence: 0.3
    };
  }
}

/**
 * Secure OpenAI Service (alias for backward compatibility)
 */
export const SecureOpenAIService = OpenAIService;
