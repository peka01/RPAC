import { fallbackCrops } from '@/lib/cultivation/fallbackCrops';
import { generateMonthlyTasks } from '@/lib/cultivation/generateMonthlyTasks';
import { calculateGardenProduction } from '@/lib/cultivation/calculateGardenProduction';

export interface GardenPlan {
  selfSufficiencyPercent: number;
  caloriesFromGarden: number;
  caloriesFromGroceries: number;
  annualCalorieNeed: number;
  gardenProduction: number;
  grocerySuggestions: string[];
  crops: any[];
  monthlyTasks: any[];
  totalSpace: number;
  estimatedCost: number;
}

export interface UserProfile {
  household_size: number;
  has_children: boolean;
  has_elderly: boolean;
  has_pets: boolean;
  city: string;
  county: string;
  address: string;
  allergies: string;
  special_needs: string;
  garden_size: number;
  experience_level: 'beginner' | 'intermediate' | 'advanced';
  climate_zone: 'Götaland' | 'Svealand' | 'Norrland';
}

export const generateAIGardenPlan = async (
  profile: UserProfile,
  adjustableGardenSize: number,
  selectedCrops: string[],
  cultivationIntensity: 'low' | 'medium' | 'high',
  cropVolumes: Record<string, number>
): Promise<GardenPlan> => {
  let aiPlan: any = null;

  try {
    // 1. Build AI prompt
    const prompt = `Du är en expert på svensk odling och självförsörjning. Skapa en personlig odlingsplan för:

PROFIL:
- Hushåll: ${profile.household_size} personer
- Ort: ${profile.city}, ${profile.county}
- Klimatzon: ${profile.climate_zone}
- Erfarenhet: ${profile.experience_level}
- Trädgårdsstorlek: ${adjustableGardenSize} m²
- Allergier: ${profile.allergies || 'Inga'}
- Särskilda behov: ${profile.special_needs || 'Inga'}

UPPGIFT:
Skapa en detaljerad odlingsplan som maximerar självförsörjningen för detta hushåll. Inkludera:

1. Rekommenderade grödor (EXAKT 20 stycken - INTE FÄRRE) med:
   - Namn och vetenskapligt namn
   - Beskrivning
   - Svårighetsgrad (beginner/intermediate/advanced)
   - Såmånader och skördemånader
   - Utrymme per planta (m²) - VIKTIGT: Ange exakt m² per planta
   - Förväntad skörd (kg) - VIKTIGT: Ange total skörd i kg
   - Kalorier per kg
   - Näringshöjdpunkter
   - Färgkod (hex-färg)
   - Emoji-ikon (lämplig emoji för grödan)

VIKTIGT: Inkludera en mångfaldig mix av grödor:
- Rotgrönsaker (potatis, morötter, lök, rödbetor)
- Bladgrönsaker (spenat, sallad, kål)
- Fruktgrönsaker (tomater, paprika, gurka)
- Baljväxter (bönor, ärtor)
- Kryddor (persilja, basilika, timjan)
- Stärkelserika grödor (korn, havre)

2. Månadsvisa aktiviteter för hela året

3. Kostnadsuppskattning

4. Förslag på kompletterande köp

VIKTIGT: Du MÅSTE inkludera EXAKT 20 olika grödor i "crops" arrayen. INTE FÄRRE. Lista alla 20 grödor med fullständig information för varje.

Svara ENDAST med en JSON-struktur enligt detta format:
{
  "crops": [
    {
      "name": "Grödnamn",
      "scientificName": "Vetenskapligt namn",
      "description": "Beskrivning",
      "difficulty": "beginner/intermediate/advanced",
      "sowingMonths": ["Månad1", "Månad2"],
      "harvestingMonths": ["Månad1", "Månad2"],
      "spaceRequired": 10, // Total m² needed for this crop
      "yield": 20,
      "calories": 8000,
      "nutritionalHighlights": ["Näring1", "Näring2"],
      "color": "#hexfärg",
      "icon": "🥔"
    }
  ],
  "monthlyTasks": [
    {
      "month": "Januari",
      "tasks": ["Uppgift1", "Uppgift2"],
      "priority": "low/medium/high"
    }
  ],
  "grocerySuggestions": ["Förslag1", "Förslag2"],
  "estimatedCost": 500
}`;

    // 2. Call API
    const response = await fetch('https://api.beready.se', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'RPAC-CultivationPlanner/1.0'
      },
      body: JSON.stringify({
        prompt: prompt,
        type: 'cultivation-plan'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('AI API error details:', errorData);
      throw new Error(`AI API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || '{}';

    // 3. Clean JSON from AI
    let cleanedContent = content
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/,(\s*[}\]])/g, '$1')
      .replace(/([{,]\s*)(\w+):/g, '$1"$2":')
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
      .trim();

    try {
      aiPlan = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      aiPlan = null; // fallback later
    }

    // 4. Build crops list (AI or fallback)
    let crops = aiPlan?.crops || fallbackCrops();

    // Add spacePerPlant field
    crops = crops.map((crop: any) => ({
      ...crop,
      spacePerPlant:
        crop.spaceRequired && crop.yield
          ? Math.round((crop.spaceRequired / Math.max(crop.yield, 1)) * 100) / 100
          : crop.spacePerPlant || 0.5
    }));

    // 5. Calculate production stats
    const dailyCaloriesPerPerson = 2000;
    const annualCalorieNeed = profile.household_size * dailyCaloriesPerPerson * 365;
    const production = calculateGardenProduction(
      selectedCrops,
      adjustableGardenSize,
      cultivationIntensity,
      cropVolumes,
      { crops } // Pass crops as gardenPlan
    );
    const caloriesFromGroceries = Math.max(0, annualCalorieNeed - production.calories);
    const selfSufficiencyPercent = Math.round((production.calories / annualCalorieNeed) * 100);

    // 6. Return GardenPlan
    return {
      selfSufficiencyPercent,
      caloriesFromGarden: Math.round(production.calories),
      caloriesFromGroceries: Math.round(caloriesFromGroceries),
      annualCalorieNeed: Math.round(annualCalorieNeed),
      gardenProduction: Math.round(production.calories),
      grocerySuggestions:
        aiPlan?.grocerySuggestions || [
          'Köp kompletterande proteiner som ägg och mejeriprodukter',
          'Lägg till nötter och frön för fett och mineraler',
          'Köp citrusfrukter för vitamin C under vintern'
        ],
      crops,
      monthlyTasks: aiPlan?.monthlyTasks || generateMonthlyTasks(selectedCrops, { crops }, cropVolumes),
      totalSpace: Math.round(production.spaceUsed),
      estimatedCost: aiPlan?.estimatedCost || Math.round(production.cost)
    };
  } catch (error) {
    console.error('Error generating AI garden plan:', error);

    // Fallback crops if AI fails
    const crops = fallbackCrops();

    const dailyCaloriesPerPerson = 2000;
    const annualCalorieNeed = profile.household_size * dailyCaloriesPerPerson * 365;
    const production = calculateGardenProduction(
      selectedCrops,
      adjustableGardenSize,
      cultivationIntensity,
      cropVolumes,
      { crops }
    );
    const caloriesFromGroceries = Math.max(0, annualCalorieNeed - production.calories);
    const selfSufficiencyPercent = Math.round((production.calories / annualCalorieNeed) * 100);

    return {
      selfSufficiencyPercent,
      caloriesFromGarden: Math.round(production.calories),
      caloriesFromGroceries: Math.round(caloriesFromGroceries),
      annualCalorieNeed: Math.round(annualCalorieNeed),
      gardenProduction: Math.round(production.calories),
      grocerySuggestions: [
        'Köp kompletterande proteiner som ägg och mejeriprodukter',
        'Lägg till nötter och frön för fett och mineraler',
        'Köp citrusfrukter för vitamin C under vintern'
      ],
      crops,
      monthlyTasks: generateMonthlyTasks(selectedCrops, { crops }, cropVolumes),
      totalSpace: Math.round(production.spaceUsed),
      estimatedCost: Math.round(production.cost)
    };
  }
};


