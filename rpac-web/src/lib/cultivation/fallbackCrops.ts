export interface CropRecommendation {
  name: string;
  scientificName: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  sowingMonths: string[];
  harvestingMonths: string[];
  spaceRequired: number;
  yield: number;
  calories: number;
  nutritionalHighlights: string[];
  spacePerPlant?: number;
  color: string;
  icon?: string;
}

export const fallbackCrops = (): CropRecommendation[] => [
  {
    name: "Potatis",
    scientificName: "Solanum tuberosum",
    description: "Grundläggande kolhydratkälla med hög kaloritetthet",
    difficulty: "beginner" as const,
    sowingMonths: ["Mars", "April"],
    harvestingMonths: ["Augusti", "September", "Oktober"],
    spaceRequired: 20,
    yield: 80,
    calories: 64000,
    nutritionalHighlights: ["Kolhydrater", "Kalium", "Vitamin C"],
    color: "#8B4513",
    icon: "🥔"
  },
  {
    name: "Morötter",
    scientificName: "Daucus carota",
    description: "Rik på betakaroten och vitamin A",
    difficulty: "beginner" as const,
    sowingMonths: ["Mars", "April", "Maj"],
    harvestingMonths: ["Juli", "Augusti", "September", "Oktober"],
    spaceRequired: 8,
    yield: 24,
    calories: 9600,
    nutritionalHighlights: ["Vitamin A", "Betakaroten", "Fiber"],
    color: "#FF8C00",
    icon: "🥕"
  },
  {
    name: "Tomater",
    scientificName: "Solanum lycopersicum",
    description: "Rika på lykopen och vitamin C",
    difficulty: "intermediate" as const,
    sowingMonths: ["Mars", "April"],
    harvestingMonths: ["Juli", "Augusti", "September"],
    spaceRequired: 12,
    yield: 30,
    calories: 5400,
    nutritionalHighlights: ["Vitamin C", "Lykopen", "Kalium"],
    color: "#FF4444",
    icon: "🍅"
  },
  {
    name: "Kål",
    scientificName: "Brassica oleracea",
    description: "Rik på vitamin K och folsyra",
    difficulty: "beginner" as const,
    sowingMonths: ["April", "Maj"],
    harvestingMonths: ["September", "Oktober", "November"],
    spaceRequired: 15,
    yield: 25,
    calories: 6250,
    nutritionalHighlights: ["Vitamin K", "Folsyra", "Fiber"],
    color: "#90EE90",
    icon: "🥬"
  },
  {
    name: "Lök",
    scientificName: "Allium cepa",
    description: "Grundläggande krydda med antibakteriella egenskaper",
    difficulty: "beginner" as const,
    sowingMonths: ["Mars", "April"],
    harvestingMonths: ["Juli", "Augusti", "September"],
    spaceRequired: 6,
    yield: 20,
    calories: 8000,
    nutritionalHighlights: ["Kväve", "Sulfider", "Vitamin C"],
    color: "#F0E68C",
    icon: "🧅"
  },
  {
    name: "Spenat",
    scientificName: "Spinacia oleracea",
    description: "Rik på järn och folsyra",
    difficulty: "beginner" as const,
    sowingMonths: ["Mars", "April", "Augusti"],
    harvestingMonths: ["Maj", "Juni", "September", "Oktober"],
    spaceRequired: 4,
    yield: 8,
    calories: 1800,
    nutritionalHighlights: ["Järn", "Folsyra", "Vitamin K"],
    color: "#228B22",
    icon: "🥬"
  },
  {
    name: "Gurka",
    scientificName: "Cucumis sativus",
    description: "Hög vattenhalt och vitamin K",
    difficulty: "intermediate" as const,
    sowingMonths: ["Maj", "Juni"],
    harvestingMonths: ["Juli", "Augusti", "September"],
    spaceRequired: 10,
    yield: 15,
    calories: 2250,
    nutritionalHighlights: ["Vatten", "Vitamin K", "Kalium"],
    color: "#32CD32",
    icon: "🥒"
  },
  {
    name: "Paprika",
    scientificName: "Capsicum annuum",
    description: "Rik på vitamin C och antioxidanter",
    difficulty: "intermediate" as const,
    sowingMonths: ["Mars", "April"],
    harvestingMonths: ["Juli", "Augusti", "September"],
    spaceRequired: 8,
    yield: 12,
    calories: 3600,
    nutritionalHighlights: ["Vitamin C", "Antioxidanter", "Fiber"],
    color: "#FF6347",
    icon: "🫑"
  },
  {
    name: "Bönor",
    scientificName: "Phaseolus vulgaris",
    description: "Hög proteinhalt och fiber",
    difficulty: "beginner" as const,
    sowingMonths: ["Maj", "Juni"],
    harvestingMonths: ["Augusti", "September"],
    spaceRequired: 12,
    yield: 18,
    calories: 6300,
    nutritionalHighlights: ["Protein", "Fiber", "Folsyra"],
    color: "#8B4513",
    icon: "🫘"
  },
  {
    name: "Ärtor",
    scientificName: "Pisum sativum",
    description: "Rika på protein och vitamin K",
    difficulty: "beginner" as const,
    sowingMonths: ["Mars", "April"],
    harvestingMonths: ["Juni", "Juli"],
    spaceRequired: 8,
    yield: 12,
    calories: 4200,
    nutritionalHighlights: ["Protein", "Vitamin K", "Fiber"],
    color: "#90EE90",
    icon: "🫘"
  }
];


