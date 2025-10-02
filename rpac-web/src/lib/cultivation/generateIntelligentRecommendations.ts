import { cropDefaults } from '@/constants/cropDefaults';

export interface IntelligentRecommendations {
  crops: string[];
  volumes: Record<string, number>;
}

export const getDefaultCropQuantity = (cropName: string, gardenSize: number): number => {
  const cropConfig = cropDefaults[cropName];
  if (!cropConfig) {
    // Default for unknown crops
    return Math.max(3, Math.min(10, Math.floor(gardenSize / 5)));
  }

  // Calculate quantity based on garden size and crop characteristics
  const calculatedQuantity = Math.floor(cropConfig.base + (gardenSize * cropConfig.perM2));
  
  // Ensure reasonable bounds with crop-specific maximums
  return Math.max(2, Math.min(calculatedQuantity, cropConfig.max));
};

export const generateIntelligentRecommendations = (
  profile: any, 
  gardenSize: number
): IntelligentRecommendations => {
  // Calculate target calories based on household size - more realistic targets
  const dailyCaloriesPerPerson = 2000;
  const annualCalorieNeed = profile.household_size * dailyCaloriesPerPerson * 365;
  // More realistic self-sufficiency: 5-15% for most gardens
  const targetSelfSufficiency = Math.min(0.15, Math.max(0.05, gardenSize / 500)); 
  const targetCalories = Math.round(annualCalorieNeed * targetSelfSufficiency);
  
  // Available crops with calorie density (calories per m²)
  const availableCrops = [
    { name: "Potatis", caloriesPerPlant: 800, spacePerPlant: 0.5, pricePerPlant: 2, caloriesPerM2: 1600 },
    { name: "Morötter", caloriesPerPlant: 400, spacePerPlant: 0.1, pricePerPlant: 1, caloriesPerM2: 4000 },
    { name: "Kål", caloriesPerPlant: 250, spacePerPlant: 0.3, pricePerPlant: 3, caloriesPerM2: 833 },
    { name: "Lök", caloriesPerPlant: 400, spacePerPlant: 0.05, pricePerPlant: 0.5, caloriesPerM2: 8000 },
    { name: "Tomater", caloriesPerPlant: 160, spacePerPlant: 0.2, pricePerPlant: 5, caloriesPerM2: 800 },
    { name: "Gurka", caloriesPerPlant: 150, spacePerPlant: 0.2, pricePerPlant: 4, caloriesPerM2: 750 },
    { name: "Spenat", caloriesPerPlant: 200, spacePerPlant: 0.1, pricePerPlant: 1, caloriesPerM2: 2000 },
    { name: "Bönor", caloriesPerPlant: 350, spacePerPlant: 0.1, pricePerPlant: 3, caloriesPerM2: 3500 },
    { name: "Ärtor", caloriesPerPlant: 350, spacePerPlant: 0.1, pricePerPlant: 2, caloriesPerM2: 3500 },
    { name: "Rädisor", caloriesPerPlant: 200, spacePerPlant: 0.05, pricePerPlant: 1, caloriesPerM2: 4000 },
    { name: "Rödbetor", caloriesPerPlant: 300, spacePerPlant: 0.1, pricePerPlant: 2, caloriesPerM2: 3000 },
    { name: "Kålrot", caloriesPerPlant: 400, spacePerPlant: 0.2, pricePerPlant: 3, caloriesPerM2: 2000 }
  ];

  // Sort crops by calorie density (calories per m²) - highest first
  const sortedCrops = availableCrops.sort((a, b) => b.caloriesPerM2 - a.caloriesPerM2);

  const selectedCrops: string[] = [];
  const volumes: Record<string, number> = {};
  let totalCalories = 0;
  let totalSpaceUsed = 0;
  let totalCost = 0;
  const maxBudget = 2000; // 2000 kr budget

  // Select crops to maximize calories per area while ensuring good variety
  for (const crop of sortedCrops) {
    // Stop if we've used 90% of space or have 8+ different crops
    if (totalSpaceUsed >= gardenSize * 0.9 || selectedCrops.length >= 8) break;
    
    const remainingSpace = gardenSize - totalSpaceUsed;
    const remainingBudget = maxBudget - totalCost;
    
    // Calculate how many plants we can fit
    const maxPlantsForSpace = Math.floor(remainingSpace / crop.spacePerPlant);
    const maxPlantsForBudget = Math.floor(remainingBudget / crop.pricePerPlant);
    const maxPlants = Math.min(maxPlantsForSpace, maxPlantsForBudget, 30); // Cap at 30 per crop
    
    if (maxPlants > 0) {
      // Use a more reasonable plant count based on crop type and available space
      let plantCount;
      
      if (crop.caloriesPerM2 >= 3000) {
        // High-density crops: use more plants
        plantCount = Math.min(maxPlants, Math.max(5, Math.floor(remainingSpace * 0.1 / crop.spacePerPlant)));
      } else if (crop.caloriesPerM2 >= 1000) {
        // Medium-density crops: moderate amount
        plantCount = Math.min(maxPlants, Math.max(3, Math.floor(remainingSpace * 0.05 / crop.spacePerPlant)));
      } else {
        // Low-density crops: fewer plants
        plantCount = Math.min(maxPlants, Math.max(2, Math.floor(remainingSpace * 0.02 / crop.spacePerPlant)));
      }
      
      // Ensure we have at least 2 plants and not more than 30
      plantCount = Math.max(2, Math.min(plantCount, 30));
      
      if (plantCount > 0) {
        selectedCrops.push(crop.name);
        volumes[crop.name] = plantCount;
        totalCalories += crop.caloriesPerPlant * plantCount;
        totalSpaceUsed += crop.spacePerPlant * plantCount;
        totalCost += crop.pricePerPlant * plantCount;
      }
    }
  }

  // Ensure we have at least 5 different crops for good variety
  const essentialCrops = ["Potatis", "Morötter", "Kål", "Tomater", "Lök", "Spenat", "Bönor", "Ärtor"];
  essentialCrops.forEach(cropName => {
    if (!selectedCrops.includes(cropName) && selectedCrops.length < 6) {
      const crop = availableCrops.find(c => c.name === cropName);
      if (crop) {
        const defaultQuantity = getDefaultCropQuantity(cropName, gardenSize);
        selectedCrops.push(cropName);
        volumes[cropName] = defaultQuantity;
      }
    }
  });

  console.log('Intelligent recommendations:', {
    selectedCrops,
    volumes,
    totalCalories,
    totalSpaceUsed,
    totalCost,
    targetCalories
  });

  return {
    crops: selectedCrops,
    volumes: volumes
  };
};


