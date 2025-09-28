import OpenAI from 'openai';
import { config } from './config';
import { swedishPlantDatabase, getPlantById, getDiseaseInfo, getPestInfo } from './swedish-plant-database';

// Initialize OpenAI
console.log('OpenAI API Key:', config.openai.apiKey ? 'Present' : 'Missing');
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
  dangerouslyAllowBrowser: true // Required for client-side usage
});

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
   * Analyze plant image for diseases, pests, and health issues using OpenAI Vision API
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
                text: `Du är en expert på svenska växter och växtsjukdomar med fokus på svenska trädgårdsförhållanden. Analysera denna växtbild och identifiera:

1. ALLA objekt i bilden (växter, verktyg, jord, krukor, skadedjur, etc.)
2. EXAKT växtidentifiering med både svenska namn och latinska vetenskapliga namn
3. Hälsostatus (frisk, sjukdom, skadedjur, näringsbrist)
4. Specifika problem eller sjukdomar
5. Allvarlighetsgrad
6. Praktiska rekommendationer på svenska med svenska måttenheter

VIKTIGT: 
- Ge EXAKT identifiering med latinska vetenskapliga namn
- Identifiera och beskriv ALLA synliga objekt i bilden för att ge en komplett analys
- Om du är osäker på arten, ange det och ge den närmaste möjliga identifieringen
- Använd svenska växtnamn och måttenheter (meter, liter, kilogram)
- Fokusera på svenska trädgårdsförhållanden och klimat

Fokusera på vanliga svenska trädgårdsväxter som:
- Potatis (Solanum tuberosum), morötter (Daucus carota), kål (Brassica oleracea), sallat (Lactuca sativa), spenat (Spinacia oleracea)
- Tomater (Solanum lycopersicum), gurkor (Cucumis sativus), paprika (Capsicum annuum)
- Jordgubbar (Fragaria × ananassa), hallon (Rubus idaeus), vinbär (Ribes rubrum)
- Örter som persilja (Petroselinum crispum), basilika (Ocimum basilicum), timjan (Thymus vulgaris)
- Svenska trädgårdsväxter: äpplen (Malus domestica), päron (Pyrus communis), plommon (Prunus domestica)

Svara ENDAST med JSON i detta format:
{
  "plantName": "svenska växtnamnet",
  "scientificName": "latinska vetenskapliga namnet",
  "healthStatus": "frisk|sjukdom|skadedjur|näringsbrist",
  "confidence": 0.85,
  "description": "detaljerad beskrivning av ALLA objekt du ser i bilden på svenska",
  "recommendations": ["praktisk rekommendation 1 på svenska", "praktisk rekommendation 2 på svenska"],
  "severity": "låg|medium|hög"
}`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 800,
        temperature: 0.1
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Parse JSON response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Try to match with Swedish plant database for more accurate recommendations
        const plantName = parsed.plantName || 'Okänd växt';
        const matchedPlant = swedishPlantDatabase.find(plant => 
          plant.name.toLowerCase().includes(plantName.toLowerCase()) ||
          plant.scientificName.toLowerCase().includes(plantName.toLowerCase())
        );
        
        let enhancedRecommendations = parsed.recommendations || [];
        
        // If we found a matching plant, enhance recommendations with database knowledge
        if (matchedPlant && parsed.healthStatus !== 'healthy') {
          const diseaseInfo = matchedPlant.commonDiseases.find(disease => 
            disease.name.toLowerCase().includes(parsed.description?.toLowerCase() || '')
          );
          
          if (diseaseInfo) {
            enhancedRecommendations = [
              ...enhancedRecommendations,
              ...diseaseInfo.solutions.slice(0, 2), // Add top 2 solutions from database
              ...diseaseInfo.prevention.slice(0, 1) // Add 1 prevention tip
            ];
          }
        }
        
        return {
          plantName: plantName,
          scientificName: parsed.scientificName || 'Okänd art',
          healthStatus: parsed.healthStatus || 'healthy',
          confidence: parsed.confidence || 0.5,
          description: parsed.description || 'Kunde inte analysera bilden',
          recommendations: enhancedRecommendations,
          severity: parsed.severity || 'low'
        };
      }

      throw new Error('Invalid JSON response');
    } catch (error) {
      console.error('OpenAI plant analysis error:', error);
      return {
        plantName: 'Okänd växt',
        scientificName: 'Okänd art',
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
   * Generate conversation response for plant diagnosis chat
   */
  static async generateConversationResponse(context: {
    plantName: string;
    healthStatus: string;
    description: string;
    recommendations: string[];
    userQuestion: string;
  }): Promise<string> {
    try {
      const prompt = `Du är en expert på svenska växter och växtsjukdomar. En användare har fått en växtdiagnos och ställer nu en följdfråga.

Växtdiagnos:
- Växt: ${context.plantName}
- Hälsostatus: ${context.healthStatus}
- Beskrivning: ${context.description}
- Rekommendationer: ${context.recommendations.join(', ')}

Användarens fråga: ${context.userQuestion}

Svara på svenska med praktiska råd baserat på diagnosen. Var hjälpsam och ge specifika tips för denna växt och situation. Håll svaret kort och användbart (max 200 ord).`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      return content;
    } catch (error) {
      console.error('OpenAI conversation error:', error);
      return 'Ursäkta, jag kunde inte svara på din fråga just nu. Försök igen eller kontakta en växtexpert för vidare hjälp.';
    }
  }

  /**
   * Generate daily preparedness tips using OpenAI
   */
  static async generateDailyPreparednessTips(profile: UserProfile): Promise<CultivationAdvice[]> {
    try {
      const prompt = `Skapa 3-5 dagliga beredskapstips för en familj i Sverige. 

      Användarprofil:
      - Klimatzon: ${profile.climateZone}
      - Erfarenhet: ${profile.experienceLevel}
      - Trädgårdsstorlek: ${profile.gardenSize}
      - Föredragna grödor: ${profile.preferences.join(', ')}
      - Nuvarande grödor: ${profile.currentCrops.join(', ')}
      - Hushållsstorlek: ${profile.householdSize || 2}
      
      Skapa praktiska, dagliga tips på svenska. Svara med JSON-format:
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

      // Parse JSON response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return Array.isArray(parsed) ? parsed : [];
      }

      throw new Error('Invalid JSON response');
    } catch (error) {
      console.error('OpenAI daily tips error:', error);
      return this.getFallbackAdvice();
    }
  }

  /**
   * Generate personal coach response using OpenAI
   */
  static async generatePersonalCoachResponse(context: {
    userProfile: UserProfile;
    userQuestion: string;
    chatHistory: any[];
  }): Promise<string> {
    try {
      const prompt = `Du är en personlig AI-coach för krisberedskap och självförsörjning i Sverige. 

      Användarprofil:
      - Klimatzon: ${context.userProfile.climateZone}
      - Erfarenhet: ${context.userProfile.experienceLevel}
      - Trädgårdsstorlek: ${context.userProfile.gardenSize}
      - Föredragna grödor: ${context.userProfile.preferences.join(', ')}
      - Nuvarande grödor: ${context.userProfile.currentCrops.join(', ')}
      - Hushållsstorlek: ${context.userProfile.householdSize || 2}

      Användarens fråga: ${context.userQuestion}

      Svara på svenska med:
      - Praktiska, konkreta råd anpassade för svenska förhållanden
      - Fokus på krisberedskap och självförsörjning enligt MSB-riktlinjer
      - Använd svenska växtnamn och måttenheter (meter, liter, kilogram)
      - Vara hjälpsam och stödjande i svensk kriskommunikationsstil
      - Ge specifika åtgärder när möjligt med svenska myndighetsreferenser
      - Håll svaret koncist men informativt (max 300 ord)
      - Använd svenska krisberedskapsterminologi och MSB-rekommendationer`;

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

      return content;
    } catch (error) {
      console.error('OpenAI personal coach error:', error);
      return 'Ursäkta, jag kunde inte svara på din fråga just nu. Försök igen eller kontakta en expert för vidare hjälp.';
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
      console.log('Starting AI cultivation plan generation...');
      const prompt = `Du är en AI som skapar odlingsplaner. VIKTIGT: Svara ENDAST med JSON, ingen annan text.

Skapa odlingsplan för ${userProfile.householdSize || 3} personer i ${userProfile.climateZone}.

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

Svara ENDAST med JSON i detta format:
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
      if (!content || typeof content !== 'string') {
        console.error('Invalid or missing content from OpenAI:', content);
        throw new Error('No valid response from OpenAI');
      }

      // Parse JSON response
      let jsonData;
      try {
        console.log('Raw AI response:', content);
        
        // Remove any markdown formatting and extract JSON
        let cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        
        // If the response contains text before JSON, extract just the JSON part
        const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanContent = jsonMatch[0];
        }
        
        console.log('Cleaned content for parsing:', cleanContent);
        jsonData = JSON.parse(cleanContent);
        console.log('Successfully parsed JSON:', jsonData);
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        console.error('Raw content:', content);
        console.error('Parse error details:', parseError instanceof Error ? parseError.message : String(parseError));
        
        // Return a fallback plan if JSON parsing fails
        return {
          id: 'fallback-plan',
          title: 'Personlig odlingsplan för familjen',
          description: 'En grundläggande odlingsplan baserad på dina valda grödor.',
          timeline: 'Jan: Planering\nFeb: Beställ frön\nMar: Förbered jord\nApr: Så kalla grödor\nMaj: Plantera värmeälskande\nJun-Jul: Skötsel\nAug-Sep: Skörd\nOkt: Vinterförberedelse',
          nutritionContribution: {
            dailyCalories: 2000,
            protein: 50,
            carbs: 250,
            fat: 65
          },
          gapAnalysis: {
            nutritionalGaps: [
              {nutrient: 'Protein', gap: 15.2},
              {nutrient: 'Vitamin C', gap: 8.5}
            ],
            groceryNeeds: [
              {item: 'Kött', estimatedCost: 45, quantity: 0.2, unit: 'kg'},
              {item: 'Citrusfrukter', estimatedCost: 25, quantity: 0.5, unit: 'kg'}
            ],
            totalEstimatedCost: 70
          },
          nextSteps: [
            'Beställ frön i januari',
            'Förbered jord februari-mars',
            'Så kalla grödor i mars',
            'Plantera värmeälskande grödor i maj'
          ],
          recommendations: [
            'Börja med potatis och morötter',
            'Använd kompost för bättre jordkvalitet',
            'Vattna regelbundet men undvik övervattning',
            'Rotera grödor årligen'
          ],
          selfSufficiencyPercent: 45,
          estimatedCost: 1200
        };
      }

      return jsonData;
    } catch (error) {
      console.error('OpenAI API error:', error);
      console.error('Error details:', error instanceof Error ? error.message : String(error));
      console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
      
      // Return fallback plan instead of throwing error
      return {
        id: 'error-fallback-plan',
        title: 'Personlig odlingsplan för familjen',
        description: 'En grundläggande odlingsplan (AI-tjänsten är tillfälligt otillgänglig).',
        timeline: 'Jan: Planering\nFeb: Beställ frön\nMar: Förbered jord\nApr: Så kalla grödor\nMaj: Plantera värmeälskande\nJun-Jul: Skötsel\nAug-Sep: Skörd\nOkt: Vinterförberedelse',
        nutritionContribution: {
          dailyCalories: 2000,
          protein: 50,
          carbs: 250,
          fat: 65
        },
        gapAnalysis: {
          nutritionalGaps: [
            {nutrient: 'Protein', gap: 15.2},
            {nutrient: 'Vitamin C', gap: 8.5}
          ],
          groceryNeeds: [
            {item: 'Kött', estimatedCost: 45, quantity: 0.2, unit: 'kg'},
            {item: 'Citrusfrukter', estimatedCost: 25, quantity: 0.5, unit: 'kg'}
          ],
          totalEstimatedCost: 70
        },
        nextSteps: [
          'Beställ frön i januari',
          'Förbered jord februari-mars',
          'Så kalla grödor i mars',
          'Plantera värmeälskande grödor i maj'
        ],
        recommendations: [
          'Börja med potatis och morötter',
          'Använd kompost för bättre jordkvalitet',
          'Vattna regelbundet men undvik övervattning',
          'Rotera grödor årligen'
        ],
        selfSufficiencyPercent: 45,
        estimatedCost: 1200
      };
    }
  }
}
