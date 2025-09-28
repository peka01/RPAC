/**
 * Swedish Plant Database
 * Comprehensive database of Swedish garden plants with diseases, pests, and solutions
 */

export interface SwedishPlant {
  id: string;
  name: string;
  scientificName: string;
  category: 'vegetable' | 'fruit' | 'herb' | 'flower' | 'tree' | 'berry';
  season: 'spring' | 'summer' | 'autumn' | 'winter' | 'all';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  commonDiseases: PlantDisease[];
  commonPests: PlantPest[];
  growingTips: string[];
  nutritionalValue: string;
  harvestTime: string;
  storageTips: string[];
}

export interface PlantDisease {
  name: string;
  symptoms: string[];
  causes: string[];
  solutions: string[];
  prevention: string[];
  severity: 'low' | 'medium' | 'high';
  season: string[];
}

export interface PlantPest {
  name: string;
  description: string;
  damage: string[];
  solutions: string[];
  prevention: string[];
  season: string[];
}

export const swedishPlantDatabase: SwedishPlant[] = [
  {
    id: 'potato',
    name: 'Potatis',
    scientificName: 'Solanum tuberosum',
    category: 'vegetable',
    season: 'spring',
    difficulty: 'beginner',
    commonDiseases: [
      {
        name: 'Potatisbladmögel',
        symptoms: ['Bruna fläckar på blad', 'Vita mögel på undersidan av blad', 'Blad vissnar'],
        causes: ['Fuktigt väder', 'Dålig luftcirkulation', 'För tät plantering'],
        solutions: ['Använd kopparhaltiga fungicider', 'Förbättra dränering', 'Öka avstånd mellan plantor'],
        prevention: ['Rotera grödor', 'Undvik övervattning', 'Välj resistenta sorter'],
        severity: 'high',
        season: ['juni', 'juli', 'augusti']
      },
      {
        name: 'Potatisröta',
        symptoms: ['Mjuka, ruttna knölar', 'Svart färg på knölar', 'Dålig lukt'],
        causes: ['För mycket vatten', 'Dålig jord', 'För tidig skörd'],
        solutions: ['Förbättra dränering', 'Använd torr jord', 'Skörda i rätt tid'],
        prevention: ['Bra jordförberedelse', 'Undvik övervattning', 'Välj rätt sort'],
        severity: 'high',
        season: ['augusti', 'september']
      }
    ],
    commonPests: [
      {
        name: 'Koloradbagge',
        description: 'Gul-svart randig skalbagge som äter potatisblad',
        damage: ['Hål i blad', 'Skelett av blad kvar', 'Minskad skörd'],
        solutions: ['Plocka bort manuellt', 'Använd neem-olja', 'Plantera gynnsamma växter'],
        prevention: ['Rotera grödor', 'Använd täckodling', 'Välj tidiga sorter'],
        season: ['juni', 'juli', 'augusti']
      }
    ],
    growingTips: [
      'Plantera i varma, väldränerade jordar',
      'Håll jorden fuktig men inte våt',
      'Använd kompost för bättre näring',
      'Skörda när bladen vissnar'
    ],
    nutritionalValue: 'Rik på kolhydrater, kalium och vitamin C',
    harvestTime: 'Augusti-september',
    storageTips: [
      'Förvara i mörk, sval miljö',
      'Undvik direkt solljus',
      'Kontrollera regelbundet för röta'
    ]
  },
  {
    id: 'carrot',
    name: 'Morot',
    scientificName: 'Daucus carota',
    category: 'vegetable',
    season: 'spring',
    difficulty: 'beginner',
    commonDiseases: [
      {
        name: 'Morotflugan',
        symptoms: ['Hål i morötter', 'Gula blad', 'Dålig utveckling'],
        causes: ['Flugan lägger ägg vid morotens bas'],
        solutions: ['Använd täckodling', 'Plantera tidigt på våren', 'Rotera grödor'],
        prevention: ['Täck med myggnät', 'Plantera bland andra växter', 'Undvik att plantera på samma plats'],
        severity: 'medium',
        season: ['maj', 'juni', 'juli']
      }
    ],
    commonPests: [
      {
        name: 'Morotflugan',
        description: 'Liten fluga som lägger ägg vid morotens bas',
        damage: ['Hål i morötter', 'Gula blad', 'Dålig utveckling'],
        solutions: ['Använd täckodling', 'Plantera tidigt', 'Rotera grödor'],
        prevention: ['Täck med myggnät', 'Plantera bland andra växter'],
        season: ['maj', 'juni', 'juli']
      }
    ],
    growingTips: [
      'Så direkt i jorden, inte i krukor',
      'Håll jorden fuktig för jämn tillväxt',
      'Tunna ut plantor för bättre utveckling',
      'Använd sandig jord för rakare morötter'
    ],
    nutritionalValue: 'Rik på beta-karoten, vitamin A och fiber',
    harvestTime: 'Juli-oktober',
    storageTips: [
      'Förvara i sand eller jord',
      'Håll fuktig miljö',
      'Kontrollera regelbundet'
    ]
  },
  {
    id: 'tomato',
    name: 'Tomat',
    scientificName: 'Solanum lycopersicum',
    category: 'vegetable',
    season: 'summer',
    difficulty: 'intermediate',
    commonDiseases: [
      {
        name: 'Tomatbladmögel',
        symptoms: ['Bruna fläckar på blad', 'Vita mögel', 'Blad vissnar'],
        causes: ['Fuktigt väder', 'Dålig luftcirkulation'],
        solutions: ['Förbättra luftcirkulation', 'Använd fungicider', 'Undvik vattning på blad'],
        prevention: ['Bra luftcirkulation', 'Undvik vattning på blad', 'Välj resistenta sorter'],
        severity: 'high',
        season: ['juli', 'augusti']
      },
      {
        name: 'Tomatröta',
        symptoms: ['Svarta fläckar på frukt', 'Mjuk frukt', 'Dålig smak'],
        causes: ['För mycket vatten', 'Dålig jord', 'För tidig skörd'],
        solutions: ['Förbättra dränering', 'Använd torr jord', 'Skörda i rätt tid'],
        prevention: ['Bra jordförberedelse', 'Undvik övervattning'],
        severity: 'medium',
        season: ['augusti', 'september']
      }
    ],
    commonPests: [
      {
        name: 'Vita flugan',
        description: 'Liten vit fluga som suger saft från blad',
        damage: ['Gula blad', 'Dålig utveckling', 'Honungsdagg'],
        solutions: ['Använd neem-olja', 'Plocka bort manuellt', 'Använd gynnsamma växter'],
        prevention: ['Bra luftcirkulation', 'Undvik övervattning', 'Välj resistenta sorter'],
        season: ['juni', 'juli', 'augusti']
      }
    ],
    growingTips: [
      'Plantera i varma, väldränerade jordar',
      'Håll jorden fuktig men inte våt',
      'Använd kompost för bättre näring',
      'Skörda när frukten är mogen'
    ],
    nutritionalValue: 'Rik på lykopen, vitamin C och kalium',
    harvestTime: 'Augusti-september',
    storageTips: [
      'Förvara i rumstemperatur',
      'Undvik kylskåp',
      'Kontrollera regelbundet'
    ]
  },
  {
    id: 'lettuce',
    name: 'Sallat',
    scientificName: 'Lactuca sativa',
    category: 'vegetable',
    season: 'spring',
    difficulty: 'beginner',
    commonDiseases: [
      {
        name: 'Sallatsbladmögel',
        symptoms: ['Bruna fläckar på blad', 'Vita mögel', 'Blad vissnar'],
        causes: ['Fuktigt väder', 'Dålig luftcirkulation'],
        solutions: ['Förbättra luftcirkulation', 'Använd fungicider', 'Undvik vattning på blad'],
        prevention: ['Bra luftcirkulation', 'Undvik vattning på blad'],
        severity: 'medium',
        season: ['juni', 'juli']
      }
    ],
    commonPests: [
      {
        name: 'Sallatslöss',
        description: 'Små gröna löss som suger saft från blad',
        damage: ['Gula blad', 'Dålig utveckling', 'Honungsdagg'],
        solutions: ['Använd neem-olja', 'Plocka bort manuellt', 'Använd gynnsamma växter'],
        prevention: ['Bra luftcirkulation', 'Undvik övervattning'],
        season: ['maj', 'juni', 'juli']
      }
    ],
    growingTips: [
      'Plantera i sval, väldränerade jordar',
      'Håll jorden fuktig',
      'Använd kompost för bättre näring',
      'Skörda när bladen är stora nog'
    ],
    nutritionalValue: 'Rik på vitamin K, folsyra och fiber',
    harvestTime: 'Juni-augusti',
    storageTips: [
      'Förvara i kylskåp',
      'Håll fuktig miljö',
      'Kontrollera regelbundet'
    ]
  },
  {
    id: 'strawberry',
    name: 'Jordgubbe',
    scientificName: 'Fragaria × ananassa',
    category: 'berry',
    season: 'spring',
    difficulty: 'beginner',
    commonDiseases: [
      {
        name: 'Jordgubbsmögel',
        symptoms: ['Grå mögel på frukt', 'Mjuk frukt', 'Dålig smak'],
        causes: ['Fuktigt väder', 'Dålig luftcirkulation'],
        solutions: ['Förbättra luftcirkulation', 'Använd fungicider', 'Undvik vattning på frukt'],
        prevention: ['Bra luftcirkulation', 'Undvik vattning på frukt'],
        severity: 'medium',
        season: ['juni', 'juli']
      }
    ],
    commonPests: [
      {
        name: 'Jordgubbslöss',
        description: 'Små gröna löss som suger saft från blad',
        damage: ['Gula blad', 'Dålig utveckling', 'Honungsdagg'],
        solutions: ['Använd neem-olja', 'Plocka bort manuellt', 'Använd gynnsamma växter'],
        prevention: ['Bra luftcirkulation', 'Undvik övervattning'],
        season: ['maj', 'juni', 'juli']
      }
    ],
    growingTips: [
      'Plantera i varma, väldränerade jordar',
      'Håll jorden fuktig',
      'Använd kompost för bättre näring',
      'Skörda när frukten är mogen'
    ],
    nutritionalValue: 'Rik på vitamin C, folsyra och antioxidanter',
    harvestTime: 'Juni-juli',
    storageTips: [
      'Förvara i kylskåp',
      'Håll fuktig miljö',
      'Kontrollera regelbundet'
    ]
  }
];

/**
 * Get plant information by ID
 */
export function getPlantById(id: string): SwedishPlant | undefined {
  return swedishPlantDatabase.find(plant => plant.id === id);
}

/**
 * Get plants by category
 */
export function getPlantsByCategory(category: SwedishPlant['category']): SwedishPlant[] {
  return swedishPlantDatabase.filter(plant => plant.category === category);
}

/**
 * Get plants by season
 */
export function getPlantsBySeason(season: SwedishPlant['season']): SwedishPlant[] {
  return swedishPlantDatabase.filter(plant => 
    plant.season === season || plant.season === 'all'
  );
}

/**
 * Search plants by name
 */
export function searchPlants(query: string): SwedishPlant[] {
  const lowercaseQuery = query.toLowerCase();
  return swedishPlantDatabase.filter(plant => 
    plant.name.toLowerCase().includes(lowercaseQuery) ||
    plant.scientificName.toLowerCase().includes(lowercaseQuery)
  );
}

/**
 * Get disease information by plant and disease name
 */
export function getDiseaseInfo(plantId: string, diseaseName: string): PlantDisease | undefined {
  const plant = getPlantById(plantId);
  if (!plant) return undefined;
  
  return plant.commonDiseases.find(disease => 
    disease.name.toLowerCase().includes(diseaseName.toLowerCase())
  );
}

/**
 * Get pest information by plant and pest name
 */
export function getPestInfo(plantId: string, pestName: string): PlantPest | undefined {
  const plant = getPlantById(plantId);
  if (!plant) return undefined;
  
  return plant.commonPests.find(pest => 
    pest.name.toLowerCase().includes(pestName.toLowerCase())
  );
}

/**
 * Get seasonal advice for a plant
 */
export function getSeasonalAdvice(plantId: string, season: string): string[] {
  const plant = getPlantById(plantId);
  if (!plant) return [];
  
  const advice: string[] = [];
  
  // Add general growing tips
  advice.push(...plant.growingTips);
  
  // Add seasonal specific advice
  if (season === 'spring') {
    advice.push('Förbered jorden väl innan plantering');
    advice.push('Plantera när jorden är varm nog');
  } else if (season === 'summer') {
    advice.push('Vattna regelbundet men undvik övervattning');
    advice.push('Kontrollera för skadedjur dagligen');
  } else if (season === 'autumn') {
    advice.push('Förbered för skörd');
    advice.push('Börja planera för nästa år');
  } else if (season === 'winter') {
    advice.push('Förbered jorden för nästa säsong');
    advice.push('Planera din odling för kommande år');
  }
  
  return advice;
}
