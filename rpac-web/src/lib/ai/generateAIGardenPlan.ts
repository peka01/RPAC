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
    // 1. Use pre-defined Swedish crops and fetch real nutrition data
    const swedishCrops = [
      {"name": "Potatis", "scientificName": "Solanum tuberosum", "description": "Stärkelserik rotgrönsak, lätt att odla", "difficulty": "beginner", "sowingMonths": ["April"], "harvestingMonths": ["Augusti"], "spaceRequired": 1, "yield": 15, "calories": 12000, "nutritionalHighlights": ["C-vitamin", "Kalium"], "color": "#8B4513", "icon": "🥔"},
      {"name": "Morötter", "scientificName": "Daucus carota", "description": "Söt rotgrönsak rik på betakaroten", "difficulty": "beginner", "sowingMonths": ["April"], "harvestingMonths": ["Juli"], "spaceRequired": 0.5, "yield": 8, "calories": 3200, "nutritionalHighlights": ["A-vitamin", "Betakaroten"], "color": "#FF8C00", "icon": "🥕"},
      {"name": "Tomater", "scientificName": "Solanum lycopersicum", "description": "Saftig fruktgrönsak, kräver värme", "difficulty": "intermediate", "sowingMonths": ["Mars"], "harvestingMonths": ["Juli"], "spaceRequired": 0.5, "yield": 5, "calories": 1000, "nutritionalHighlights": ["C-vitamin", "Lykopen"], "color": "#FF0000", "icon": "🍅"},
      {"name": "Sallad", "scientificName": "Lactuca sativa", "description": "Snabbväxande bladgrönsak", "difficulty": "beginner", "sowingMonths": ["April"], "harvestingMonths": ["Juni"], "spaceRequired": 0.2, "yield": 2, "calories": 100, "nutritionalHighlights": ["Fiber", "Folat"], "color": "#90EE90", "icon": "🥬"},
      {"name": "Lök", "scientificName": "Allium cepa", "description": "Kryddgrönsak med lång hållbarhet", "difficulty": "beginner", "sowingMonths": ["April"], "harvestingMonths": ["Augusti"], "spaceRequired": 0.3, "yield": 3, "calories": 450, "nutritionalHighlights": ["C-vitamin", "Flavonoider"], "color": "#F5F5DC", "icon": "🧅"},
      {"name": "Kål", "scientificName": "Brassica oleracea", "description": "Näringsrik bladgrönsak för höst/vinter", "difficulty": "intermediate", "sowingMonths": ["Maj"], "harvestingMonths": ["September"], "spaceRequired": 0.8, "yield": 4, "calories": 400, "nutritionalHighlights": ["C-vitamin", "K-vitamin"], "color": "#228B22", "icon": "🥬"},
      {"name": "Gurka", "scientificName": "Cucumis sativus", "description": "Vätskerik grönsak, kräver värme", "difficulty": "intermediate", "sowingMonths": ["Maj"], "harvestingMonths": ["Juli"], "spaceRequired": 0.5, "yield": 8, "calories": 400, "nutritionalHighlights": ["Vätska", "K-vitamin"], "color": "#32CD32", "icon": "🥒"},
      {"name": "Spenat", "scientificName": "Spinacia oleracea", "description": "Näringsrik bladgrönsak", "difficulty": "beginner", "sowingMonths": ["April"], "harvestingMonths": ["Juni"], "spaceRequired": 0.3, "yield": 2, "calories": 200, "nutritionalHighlights": ["Järn", "Folat"], "color": "#228B22", "icon": "🥬"},
      {"name": "Rödbetor", "scientificName": "Beta vulgaris", "description": "Söt rotgrönsak, lång hållbarhet", "difficulty": "beginner", "sowingMonths": ["April"], "harvestingMonths": ["Augusti"], "spaceRequired": 0.4, "yield": 6, "calories": 1800, "nutritionalHighlights": ["Folat", "Mangan"], "color": "#DC143C", "icon": "🥕"},
      {"name": "Bönor", "scientificName": "Phaseolus vulgaris", "description": "Proteinrik baljväxt", "difficulty": "beginner", "sowingMonths": ["Maj"], "harvestingMonths": ["Augusti"], "spaceRequired": 0.3, "yield": 3, "calories": 1200, "nutritionalHighlights": ["Protein", "Fiber"], "color": "#8B4513", "icon": "🫘"},
      {"name": "Ärtor", "scientificName": "Pisum sativum", "description": "Söt baljväxt, tidig skörd", "difficulty": "beginner", "sowingMonths": ["April"], "harvestingMonths": ["Juni"], "spaceRequired": 0.3, "yield": 4, "calories": 1200, "nutritionalHighlights": ["Protein", "C-vitamin"], "color": "#90EE90", "icon": "🫘"},
      {"name": "Paprika", "scientificName": "Capsicum annuum", "description": "Färgrik fruktgrönsak, kräver värme", "difficulty": "advanced", "sowingMonths": ["Mars"], "harvestingMonths": ["Juli"], "spaceRequired": 0.4, "yield": 3, "calories": 450, "nutritionalHighlights": ["C-vitamin", "A-vitamin"], "color": "#FFD700", "icon": "🫑"},
      {"name": "Persilja", "scientificName": "Petroselinum crispum", "description": "Kryddört, tvåårig", "difficulty": "beginner", "sowingMonths": ["April"], "harvestingMonths": ["Juni"], "spaceRequired": 0.1, "yield": 1, "calories": 50, "nutritionalHighlights": ["C-vitamin", "K-vitamin"], "color": "#228B22", "icon": "🌿"},
      {"name": "Basilika", "scientificName": "Ocimum basilicum", "description": "Aromatisk kryddört", "difficulty": "beginner", "sowingMonths": ["Maj"], "harvestingMonths": ["Juli"], "spaceRequired": 0.1, "yield": 0.5, "calories": 25, "nutritionalHighlights": ["A-vitamin", "K-vitamin"], "color": "#228B22", "icon": "🌿"},
      {"name": "Rädisor", "scientificName": "Raphanus sativus", "description": "Snabbväxande rotgrönsak", "difficulty": "beginner", "sowingMonths": ["April"], "harvestingMonths": ["Juni"], "spaceRequired": 0.1, "yield": 2, "calories": 100, "nutritionalHighlights": ["C-vitamin", "Folat"], "color": "#FFB6C1", "icon": "🥕"},
      {"name": "Kålrot", "scientificName": "Brassica napus", "description": "Mild kålgrönsak", "difficulty": "beginner", "sowingMonths": ["Maj"], "harvestingMonths": ["Augusti"], "spaceRequired": 0.3, "yield": 3, "calories": 300, "nutritionalHighlights": ["C-vitamin", "K-vitamin"], "color": "#DDA0DD", "icon": "🥬"},
      {"name": "Squash", "scientificName": "Cucurbita pepo", "description": "Stor fruktgrönsak", "difficulty": "intermediate", "sowingMonths": ["Maj"], "harvestingMonths": ["Augusti"], "spaceRequired": 2, "yield": 8, "calories": 3200, "nutritionalHighlights": ["A-vitamin", "C-vitamin"], "color": "#FFA500", "icon": "🎃"},
      {"name": "Broccoli", "scientificName": "Brassica oleracea", "description": "Näringsrik kålgrönsak", "difficulty": "intermediate", "sowingMonths": ["Maj"], "harvestingMonths": ["Augusti"], "spaceRequired": 0.6, "yield": 2, "calories": 200, "nutritionalHighlights": ["C-vitamin", "K-vitamin"], "color": "#228B22", "icon": "🥦"},
      {"name": "Blomkål", "scientificName": "Brassica oleracea", "description": "Vit kålgrönsak, kräver kyla", "difficulty": "intermediate", "sowingMonths": ["Maj"], "harvestingMonths": ["Augusti"], "spaceRequired": 0.6, "yield": 2, "calories": 200, "nutritionalHighlights": ["C-vitamin", "K-vitamin"], "color": "#F5F5F5", "icon": "🥦"},
      {"name": "Ruccola", "scientificName": "Eruca sativa", "description": "Pikant bladgrönsak", "difficulty": "beginner", "sowingMonths": ["April"], "harvestingMonths": ["Juni"], "spaceRequired": 0.2, "yield": 1, "calories": 50, "nutritionalHighlights": ["C-vitamin", "K-vitamin"], "color": "#90EE90", "icon": "🥬"}
    ];

    // 2. Use crops without fetching nutrition data initially (will be fetched on-demand)
    console.log('Using pre-defined crops with on-demand nutrition data fetching...');
    
    const cropsWithNutrition = swedishCrops.map(crop => ({
      ...crop,
      // Nutrition data will be fetched when user clicks refresh button
      nutritionData: null
    }));

    console.log('Pre-defined crops ready for on-demand nutrition fetching:', cropsWithNutrition.length);

    const monthlyTasks = [
      {"month": "Januari", "tasks": ["Planera odlingen för året", "Beställ frön"], "priority": "low"},
      {"month": "Februari", "tasks": ["Förbered jord och verktyg", "Börja så tomater inomhus"], "priority": "medium"},
      {"month": "Mars", "tasks": ["Så tomater och paprika inomhus", "Förbered odlingsbäddar"], "priority": "high"},
      {"month": "April", "tasks": ["Så potatis, morötter, lök och rädisor", "Så sallad och spinat"], "priority": "high"},
      {"month": "Maj", "tasks": ["Plantera ut tomater", "Så kål, broccoli och blomkål"], "priority": "high"},
      {"month": "Juni", "tasks": ["Skörda sallad och rädisor", "Så gurka och squash"], "priority": "medium"},
      {"month": "Juli", "tasks": ["Skörda tomater, gurka och paprika", "Vattna regelbundet"], "priority": "high"},
      {"month": "Augusti", "tasks": ["Skörda potatis och morötter", "Så höstgrödor"], "priority": "high"},
      {"month": "September", "tasks": ["Skörda kål och rödbetor", "Förbered för vinter"], "priority": "medium"},
      {"month": "Oktober", "tasks": ["Skörda sista grödor", "Rensa odlingsbäddar"], "priority": "low"},
      {"month": "November", "tasks": ["Förbered jord för nästa år", "Lagra skörd"], "priority": "low"},
      {"month": "December", "tasks": ["Planera nästa års odling", "Vila och återhämta dig"], "priority": "low"}
    ];

    const grocerySuggestions = [
      "Köp kött och fisk för protein",
      "Tillsätt mejeriprodukter för kalcium",
      "Köp nötter och frön för fett och mineraler",
      "Köp citrusfrukter för vitamin C under vintern"
    ];

    // Create the plan directly without AI
    aiPlan = {
      crops: cropsWithNutrition,
      monthlyTasks: monthlyTasks,
      grocerySuggestions: grocerySuggestions,
      estimatedCost: 500
    };

    console.log('Using pre-defined Swedish crops plan:', aiPlan);

    // 2. Build crops list from pre-defined plan
    let crops = aiPlan.crops;

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
}
