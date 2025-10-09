/**
 * OpenAI Service using Cloudflare Worker API
 * This service replaces all direct OpenAI calls with calls to our Cloudflare Worker
 */

import type { RemindersContext } from './reminders-context-service';

const WORKER_API_URL = 'https://api.beready.se';

interface AgeGroup {
  age: number;
  count: number;
}

interface WeatherWarning {
  type?: string;
  description?: string;
  message?: string;
  severity?: 'low' | 'moderate' | 'severe' | 'extreme';
}

interface Weather {
  temperature?: number;
  humidity?: number;
  forecast?: string;
  windSpeed?: number;
  precipitation?: number;
  feelsLike?: number;
  warnings?: WeatherWarning[];
}

interface Reminder {
  id: string;
  message: string;
  reminder_date: string;
  is_completed?: boolean;
}

export interface UserProfile {
  climateZone?: string;
  householdSize?: number;
  hasChildren?: boolean;
  county?: string;
  city?: string;
  ageGroups?: AgeGroup[];
  specialNeeds?: string[];
  crisisMode?: boolean;
  location?: string;
  weather?: Weather;
  reminders?: Reminder[];
  [key: string]: unknown;
}

export interface CultivationAdvice {
  id: string;
  type: 'recommendation' | 'warning' | 'tip' | 'seasonal';
  priority: 'high' | 'medium' | 'low';
  plant?: string;
  title: string;
  description: string;
  timeframe?: string;
  icon: string;
}

export interface PlantDiagnosisResult {
  plantName: string;
  scientificName: string;
  healthStatus: string;
  description: string;
  recommendations: string[];
  confidence: number;
  severity?: 'low' | 'medium' | 'high';
}

/**
 * Call the Cloudflare Worker API directly
 */
async function callWorkerAPI(prompt: string): Promise<string> {
  try {
    const response = await fetch(WORKER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'RPAC-Client/1.0'
      },
      body: JSON.stringify({ prompt, type: 'general' }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || data.response || 'No response generated';
  } catch (error) {
    console.error('AI API call failed:', error);
    throw error;
  }
}

/**
 * Unified OpenAI Service using Cloudflare Worker
 */
interface NutritionNeeds {
  dailyCalories: number;
  protein: number;
  carbs: number;
  fat: number;
  [key: string]: number;
}

interface SelectedCrop {
  cropType?: string;
  name: string;
  [key: string]: unknown;
}

interface CultivationPlanResponse {
  title: string;
  description: string;
  timeline: string;
  priority: string;
  nutritionContribution: NutritionNeeds;
  gapAnalysis: {
    nutritionalGaps: Array<{ nutrient: string; gap: number }>;
    groceryNeeds: Array<{ item: string; estimatedCost: number; quantity: number; unit: string }>;
    totalEstimatedCost: number;
  };
  nextSteps: string[];
  recommendations: string[];
  selfSufficiencyPercent: number;
  estimatedCost: number;
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
    nutritionNeeds: NutritionNeeds, 
    selectedCrops: SelectedCrop[]
  ): Promise<CultivationPlanResponse> {
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
  static async generateDailyPreparednessTips(
    profile: UserProfile, 
    remindersContext?: RemindersContext,
    tipHistory?: {
      recentlyShownTips: string[];
      savedToRemindersTips: string[];
      completedTips: string[];
    }
  ): Promise<CultivationAdvice[]> {
    // Get current date and season
    const now = new Date();
    const currentDate = now.toLocaleDateString('sv-SE');
    const currentMonth = now.getMonth() + 1;
    const currentSeason = currentMonth >= 3 && currentMonth <= 5 ? 'vår' :
                         currentMonth >= 6 && currentMonth <= 8 ? 'sommar' :
                         currentMonth >= 9 && currentMonth <= 11 ? 'höst' : 'vinter';

    // Build reminders context for AI
    const remindersContextText = remindersContext ? `
ANVÄNDARENS PÅMINNELSER:
- Väntande påminnelser: ${remindersContext.reminderStats.totalPending}
- Försenade påminnelser: ${remindersContext.reminderStats.totalOverdue}
- Genomförda denna vecka: ${remindersContext.reminderStats.completedThisWeek}
- Genomförandegrad: ${remindersContext.reminderStats.completionRate}%

FÖRSENADE UPPGIFTER (kräver omedelbar uppmärksamhet):
${remindersContext.overdueReminders.map(r => 
  `- ${r.message} (försenad sedan ${new Date(r.reminder_date).toLocaleDateString('sv-SE')})`
).join('\n')}

KOMMANDE UPPGIFTER (nästa 7 dagar):
${remindersContext.upcomingReminders.map(r => 
  `- ${r.message} (${new Date(r.reminder_date).toLocaleDateString('sv-SE')})`
).join('\n')}

GENOMFÖRDA IDAG:
${remindersContext.completedToday.map(r => 
  `- ${r.message} (klar)`
).join('\n')}
` : '';

    // Build tip history context for AI
    const tipHistoryText = tipHistory ? `
TIPS HISTORIK (undvik att upprepa dessa):
- Nyligen visade tips (senaste 7 dagarna): ${tipHistory.recentlyShownTips.join(', ') || 'Inga'}
- Tips sparade till påminnelser: ${tipHistory.savedToRemindersTips.join(', ') || 'Inga'}
- Genomförda tips: ${tipHistory.completedTips.join(', ') || 'Inga'}

VIKTIGT: Generera INTE tips som redan har visats nyligen eller som användaren redan har sparat till påminnelser.
` : '';

    const prompt = `Som svensk beredskapsexpert, ge 3 dagliga tips för beredskap och odling baserat på:

AKTUELL TIDSPUNKT:
- Datum: ${currentDate}
- Månad: ${currentMonth}
- Säsong: ${currentSeason}

Användarprofil:
- Klimatzon: ${profile.climateZone || 'svealand'}
- Erfarenhetsnivå: ${profile.experienceLevel || 'beginner'}
- Trädgårdsstorlek: ${profile.gardenSize || 'medium'}
- Krisläge: ${profile.crisisMode ? 'Ja' : 'Nej'}

${remindersContextText}

${tipHistoryText}

VIKTIGT: 
1. Om det finns försenade påminnelser, ge tips som hjälper användaren att komma ikapp
2. Om användaren har hög genomförandegrad, ge avancerade tips
3. Om användaren har låg genomförandegrad, fokusera på enkla, motiverande tips
4. Anpassa tips baserat på kommande påminnelser
5. Ge råd som är relevanta för ${currentSeason} (månad ${currentMonth})
6. UNDVIK att upprepa tips som redan har visats nyligen eller sparats till påminnelser

Svara med JSON-array med tips:
[
  {
    "id": "tip-1",
    "type": "recommendation/warning/tip/seasonal/reminder_followup",
    "priority": "high/medium/low",
    "plant": "växtnamn (valfritt)",
    "title": "Tips titel",
    "description": "Detaljerad beskrivning",
    "timeframe": "Tidsram (valfritt)",
    "icon": "🌱",
    "relatedReminder": "ID till relaterad påminnelse (valfritt)"
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
    chatHistory = [],
    appContext
  }: {
    userProfile: UserProfile;
    userQuestion: string;
    chatHistory?: Array<{ sender: string; message: string; timestamp: string }>;
    appContext?: {
      cultivationPlan?: {
        crops?: Array<{ cropName: string; estimatedYieldKg?: number }>;
        self_sufficiency_percent?: number;
        title?: string;
        description?: string;
      };
      resources?: Array<{ category: string; acquired: boolean }>;
      upcomingTasks?: Array<{ activity: string; crop_name: string; month: string }>;
      currentPage?: string;
    };
  }): Promise<string> {
    // Get current date and season
    const now = new Date();
    const currentDate = now.toLocaleDateString('sv-SE');
    const currentMonth = now.getMonth() + 1;
    const currentSeason = currentMonth >= 3 && currentMonth <= 5 ? 'vår' :
                         currentMonth >= 6 && currentMonth <= 8 ? 'sommar' :
                         currentMonth >= 9 && currentMonth <= 11 ? 'höst' : 'vinter';

    // Build context about user's cultivation plan
    let cultivationContext = '';
    if (appContext?.cultivationPlan?.crops && appContext.cultivationPlan.crops.length > 0) {
      const cropList = appContext.cultivationPlan.crops.map((c) => 
        `  • ${c.cropName}${c.estimatedYieldKg ? ` (beräknad skörd: ${c.estimatedYieldKg}kg/år)` : ''}`
      ).join('\n');
      const selfSuff = appContext.cultivationPlan.self_sufficiency_percent || 0;
      cultivationContext = `
ANVÄNDARENS ODLINGSPLAN:
- Plan: "${appContext.cultivationPlan.title || 'Primär odling'}"${appContext.cultivationPlan.description ? `\n- Beskrivning: ${appContext.cultivationPlan.description}` : ''}
- Antal grödor: ${appContext.cultivationPlan.crops.length} st
- ⚠️ SPECIFIKA GRÖDOR SOM ANVÄNDAREN ODLAR:
${cropList}${selfSuff > 0 ? `\n- Självförsörjningsgrad: ${selfSuff}%` : ''}

VIKTIGT: Referera till dessa EXAKTA grödor när du ger råd om odling!`;
    }

    // Build context about resources
    let resourcesContext = '';
    if (appContext?.resources && appContext.resources.length > 0) {
      const byCategory = appContext.resources.reduce((acc: Record<string, number>, r) => {
        acc[r.category] = (acc[r.category] || 0) + (r.acquired ? 1 : 0);
        return acc;
      }, {});
      const total = appContext.resources.length;
      const acquired = appContext.resources.filter((r) => r.acquired).length;
      resourcesContext = `
BEREDSKAPSLAGER:
- Totalt resurser: ${acquired}/${total} insamlade (${Math.round(acquired/total*100)}%)
- Kategorier: ${Object.entries(byCategory)
    .map(([cat, count]) => `${cat}: ${count}`)
    .join(', ')}
- MSB-rekommendation: Mat och vatten för 3-7 dagar minimum`;
    }

    // Build cultivation calendar context (if available)
    let cultivationTasks = '';
    if (appContext?.upcomingTasks && appContext.upcomingTasks.length > 0) {
      cultivationTasks = `
ODLINGSUPPGIFTER (Kommande månad):
${appContext.upcomingTasks.slice(0, 5).map((task) => 
  `- ${task.activity || 'Uppgift'}: ${task.crop_name} (${task.month || 'Nu'})`
).join('\n')}`;
    }

    // Build weather context with warnings
    let weatherContext = '';
    if (userProfile.weather) {
      const w = userProfile.weather;
      weatherContext = `
VÄDERLÄGE (${userProfile.city || userProfile.county || 'Din plats'}):
- Temperatur: ${w.temperature}°C
- Luftfuktighet: ${w.humidity}%
- Prognos: ${w.forecast || 'Ingen prognos tillgänglig'}`;
      
      // Add weather warnings if present
      if (w.warnings && w.warnings.length > 0) {
        weatherContext += `
- ⚠️ VÄDERVARNINGAR (VIKTIGT!):
  ${w.warnings.map((warn) => 
    `• ${warn.type || 'Varning'}: ${warn.description || warn.message || 'Se SMHI'}`
  ).join('\n  ')}`;
      }
      
      // Add wind/precipitation if available
      if (w.windSpeed) weatherContext += `\n- Vind: ${w.windSpeed} m/s`;
      if (w.precipitation) weatherContext += `\n- Nederbörd: ${w.precipitation}mm`;
      if (w.feelsLike) weatherContext += `\n- Känns som: ${w.feelsLike}°C`;
    }

    const prompt = `Du är KRISter, en svensk AI-assistent för samhällsberedskap och självförsörjning. Du hjälper användare med Beready-appen.

BEREADY-APPENS FUNKTIONER:
1. MITT HEM (Individuell beredskap):
   - Hemprofil: Hushållsstorlek, plats, husdjur
   - Resurslager: Hantera mat, vatten, mediciner, verktyg (MSB-baserat)
   - Odlingsplanering: Skapa odlingsplaner för självförsörjning
   - Odlingskalender: Månatliga sådd/skörd-uppgifter per klimatzon

2. LOKALT (Samhällesfunktioner):
   - Hitta/gå med i lokala samhällen baserat på postnummer
   - Dela resurser med grannar (mat, verktyg, utrustning)
   - Chatt med samhällsmedlemmar
   - Samhällsresurser: Gemensam utrustning (pumpar, generatorer, etc)

3. REGIONALT (Länsnivå):
   - Regional översikt för hela länet (t.ex. Kronobergs län, Skåne län)
   - Statistik: Aktiva samhällen, totalt antal medlemmar, genomsnittlig beredskapspoäng
   - Ser alla lokala samhällen i länet med medlemsantal och resurser
   - Information från Länsstyrelsen (länk till officiell länssida)
   - Officiella krisresurser: Krisinformation.se, MSB.se, SMHI.se
   - Samordning mellan samhällen i samma län

4. INSTÄLLNINGAR:
   - Hemprofil, platsinfo, notifieringar

AKTUELL TIDPUNKT:
- Datum: ${currentDate}
- Månad: ${currentMonth}
- Säsong: ${currentSeason}
- Klimatzon: ${userProfile.climateZone ? userProfile.climateZone.charAt(0).toUpperCase() + userProfile.climateZone.slice(1) : 'Okänd'}

HUSHÅLLSPROFIL:
- Hushållsstorlek: ${userProfile.householdSize || 2} personer
- Har barn: ${userProfile.hasChildren ? 'Ja' : 'Nej'}
- Plats: ${userProfile.county || 'Okänd kommun'}, ${userProfile.city || ''}
${weatherContext}

⚠️ VAR ÄR ANVÄNDAREN JUST NU?
Aktuell sida: ${appContext?.currentPage || 'Okänd'}
${appContext?.currentPage === 'resources' ? '→ Användaren tittar på RESURSLAGER - fokusera på beredskapsresurser!' : ''}
${appContext?.currentPage === 'cultivation' ? '→ Användaren tittar på ODLING - fokusera på odlingsråd!' : ''}
${appContext?.currentPage === 'individual' ? '→ Användaren är på MITT HEM - ge allmän beredskapsöversikt' : ''}
${appContext?.currentPage === 'local' ? '→ Användaren tittar på LOKALT - fokusera på samhällen och resursdelning' : ''}
${appContext?.currentPage === 'regional' ? '→ Användaren tittar på REGIONALT - fokusera på länsnivå, samordning mellan samhällen, Länsstyrelsen' : ''}

ANVÄNDARENS SITUATION:${cultivationContext}${resourcesContext}${cultivationTasks}

CHATTHISTORIK:
${chatHistory.length > 0 ? chatHistory.map(msg => `${msg.sender}: ${msg.message}`).join('\n') : 'Ingen tidigare konversation'}

ANVÄNDARENS FRÅGA:
${userQuestion}

DITT SVAR:
Svara på svenska med:

⚠️ LÄSKONTROLL FÖRST:
1. Vad frågar användaren OM? (odling, resurser, app-hjälp, väder, etc.)
2. Vilken sida är de på? (${appContext?.currentPage || 'okänd'})
3. Matcha ditt svar med FRÅGAN och SIDAN!

SVARSREGLER:
- Om frågan handlar om RESURSER/BEREDSKAP/GREJER → Svara om MSB-resurser, mat, vatten, mediciner
- Om frågan handlar om ODLING/VÄXTER/GRÖDOR → Svara om odling och användarens specifika grödor
- Om frågan handlar om REGIONALT/LÄNET/LÄNSSTYRELSEN → Svara om regional samordning, länsnivå, officiella resurser
- Om användaren är på sidan "resources" → Fokusera på beredskapslager
- Om användaren är på sidan "cultivation" → Fokusera på odling
- Om användaren är på sidan "regional" → Fokusera på länsnivå, samhällen i länet, Länsstyrelsen
- ⚠️ Om det finns VÄDERVARNINGAR: Nämn dessa FÖRST
- Håll svaret koncist men hjälpsamt (2-4 meningar)
- Om användaren behöver gå till en annan sida → Hänvisa kort (t.ex. "Du hittar odlingskalendern under Mitt hem", "Du hittar regional översikt under Regionalt")

EXEMPEL:
Fråga: "Vilka grejer bör jag ha hemma?" på sidan "resources"
→ Svara om MSB:s beredskapslista: mat för 3-7 dagar, vatten, mediciner, ficklampa, batterier
→ INTE om odling eller växter!

Fråga: "Vad ska jag göra med mina odlingar?" på sidan "cultivation"  
→ Svara om användarens specifika grödor och säsongstips
→ INTE om beredskapslager!

Fråga: "Hur ser beredskapen ut i mitt län?" på sidan "regional"
→ Svara om länsnivå, samordning mellan samhällen, hänvisa till Länsstyrelsens information
→ INTE om individuella beredskapslager eller odling!

TONLÄGE OCH STIL:
- Du är en varm, hjälpsam kompis - INTE en "besserwisser"
- Använd vardagligt svenskt språk
- Gå DIREKT på svaret - ingen onödig bakgrundsinformation
- Upprepa INTE fakta som användaren redan vet (t.ex. väderdata, deras egna grödor)
- Fokusera på HANDLINGAR och KONKRETA TIPS
- Kort och kärnfullt - inga långa förklaringar

FEL TON (besserwisser):
❌ "Just nu är det 13°C i Växjö. För dina grödor - potatis, gurka, lök och tomater - är det viktigt att..."
❌ "Som du säkert vet har du X resurser..."

RÄTT TON (hjälpsam kompis):
✅ "Tänk på att täcka grödorna om det blir frost inatt!"
✅ "MSB rekommenderar mat för 3-7 dagar - börja med ris, pasta och konserver."
✅ "Du behöver 9 liter vatten per person. Markera dem som 'Har' när du lagt till."

FEL: 
- Säg INTE "i Beready-appen" eller "använd appen" - användaren är redan här!
- Blanda ALDRIG språk! Endast SVENSKA i hela svaret - INGET engelska!
- Inga fraser som "Let me know", "I can help", "Feel free" etc.

Om användaren behöver byta sida: 
- Skriv sidan på svenska: "Mitt hem", "Resurslager", "Odlingskalendern"
- Format som kan göras klickbar: Sätt sidnamn på ny rad eller med emoji
  ✅ "📍 Gå till Mitt hem → Resurslager"
  ✅ "Under Mitt hem hittar du odlingsplanen"

Kom ihåg: HANDLINGAR först, inte fakta-upprepning! Och ALDRIG blandat språk!`;

    try {
      return await callWorkerAPI(prompt);
    } catch (error) {
      console.error('Error generating coach response:', error);
      return 'Jag beklagar, men jag kunde inte generera ett svar just nu. Försök igen senare.';
    }
  }

  /**
   * Analyze plant image using Cloudflare Worker API
   */
  static async analyzePlantImage(
    imageData: string,
    userProfile: UserProfile = { climateZone: 'svealand', experienceLevel: 'beginner', gardenSize: 'medium' }
  ): Promise<PlantDiagnosisResult> {
    try {
      const prompt = `Som svensk växtexpert, analysera denna växtbild och ge diagnos:

Användarprofil:
- Klimatzon: ${userProfile.climateZone || 'svealand'}
- Erfarenhetsnivå: ${userProfile.experienceLevel || 'beginner'}
- Trädgårdsstorlek: ${userProfile.gardenSize || 'medium'}

Analysera:
1. Växtens art och vetenskapliga namn
2. Hälsotillstånd (frisk, sjukdom, skadedjur, näringsbrist)
3. Beskrivning av problem/status
4. Konkreta rekommendationer för behandling
5. Allvarlighetsgrad (låg, medium, hög)
6. Tillförlitlighet (0-1)

Svara med JSON:
{
  "plantName": "Växtnamn",
  "scientificName": "Vetenskapligt namn",
  "healthStatus": "healthy/disease/pest/nutrient_deficiency",
  "description": "Detaljerad beskrivning av växtens tillstånd",
  "recommendations": ["Råd 1", "Råd 2", "Råd 3"],
  "confidence": 0.85,
  "severity": "low/medium/high"
}
Fokusera på svenska växter och odlingsförhållanden.`;

      const response = await fetch('https://api.beready.se', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'RPAC-PlantDiagnosis/1.0'
        },
        body: JSON.stringify({ 
          prompt,
          type: 'plant-diagnosis',
          imageData: imageData,
          userProfile: userProfile
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Plant diagnosis API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || data.response;

      // Try to parse the response into structured diagnosis
      let diagnosis;
      try {
        // Remove any markdown formatting
        const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        diagnosis = JSON.parse(cleanContent);
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        // Return a fallback diagnosis
        diagnosis = {
          plantName: "Okänd växt",
          scientificName: "Species unknown",
          healthStatus: "healthy",
          description: "Jag kunde inte analysera bilden just nu. Kontrollera att bilden är tydlig och välbelyst.",
          recommendations: [
            "Försök igen med en tydligare bild",
            "Kontakta en växtexpert för vidare analys"
          ],
          confidence: 0.3,
          severity: "low"
        };
      }

      return {
        plantName: diagnosis.plantName,
        scientificName: diagnosis.scientificName,
        healthStatus: diagnosis.healthStatus,
        description: diagnosis.description,
        recommendations: diagnosis.recommendations,
        confidence: diagnosis.confidence,
        severity: diagnosis.severity
      };
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
        type: 'warning',
        title: 'Kontrollera väderprognosen',
        description: 'Se till att ha tillräckligt med förnödenheter hemma baserat på väderprognosen.',
        priority: 'high',
        timeframe: 'Dagligen',
        icon: '🌤️'
      },
      {
        id: 'fallback-2',
        type: 'tip',
        title: 'Vattna regelbundet',
        description: 'Håll jorden fuktig men inte våt för optimal växttillväxt.',
        priority: 'medium',
        timeframe: 'Dagligen',
        icon: '💧'
      },
      {
        id: 'fallback-3',
        type: 'recommendation',
        title: 'Plantera för säsongen',
        description: 'Följ säsongens odlingskalender för bästa resultat.',
        priority: 'medium',
        timeframe: 'Månadsvis',
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
      scientificName: 'Species unknown',
      healthStatus: 'Behöver närmare undersökning',
      description: 'Jag kunde inte analysera växten just nu. Kontakta en lokal växtexpert för vidare hjälp.',
      recommendations: [
        'Kontrollera jordens fuktighet',
        'Se till att växten får tillräckligt med ljus',
        'Kontakta en växtexpert för vidare hjälp'
      ],
      confidence: 0.3,
      severity: 'low'
    };
  }
}

/**
 * Secure OpenAI Service (alias for backward compatibility)
 */
export const SecureOpenAIService = OpenAIService;
