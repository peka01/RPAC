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
  // Using CROP_LIBRARY data: kcalPerKg × yieldPerPlant
  const availableCrops = [
    { name: "Potatis", caloriesPerPlant: 385, spacePerPlant: 0.5, pricePerPlant: 2, caloriesPerM2: 770 * 3 }, // 770 kcal/kg × 0.5 kg/plant
    { name: "Morötter", caloriesPerPlant: 41, spacePerPlant: 0.1, pricePerPlant: 1, caloriesPerM2: 410 * 4 }, // 410 kcal/kg × 0.1 kg/plant
    { name: "Kål", caloriesPerPlant: 250, spacePerPlant: 0.3, pricePerPlant: 3, caloriesPerM2: 250 * 5 }, // 250 kcal/kg × 1 kg/plant
    { name: "Lök", caloriesPerPlant: 60, spacePerPlant: 0.05, pricePerPlant: 0.5, caloriesPerM2: 400 * 3 }, // 400 kcal/kg × 0.15 kg/plant
    { name: "Tomater", caloriesPerPlant: 540, spacePerPlant: 0.2, pricePerPlant: 5, caloriesPerM2: 180 * 6 }, // 180 kcal/kg × 3 kg/plant
    { name: "Gurka", caloriesPerPlant: 300, spacePerPlant: 0.2, pricePerPlant: 4, caloriesPerM2: 150 * 4 }, // 150 kcal/kg × 2 kg/plant
    { name: "Spenat", caloriesPerPlant: 23, spacePerPlant: 0.1, pricePerPlant: 1, caloriesPerM2: 230 * 2 }, // 230 kcal/kg × 0.1 kg/plant
    { name: "Bönor", caloriesPerPlant: 381, spacePerPlant: 0.1, pricePerPlant: 3, caloriesPerM2: 1270 * 2 }, // 1270 kcal/kg × 0.3 kg/plant
    { name: "Ärtor", caloriesPerPlant: 162, spacePerPlant: 0.1, pricePerPlant: 2, caloriesPerM2: 810 * 1.5 }, // 810 kcal/kg × 0.2 kg/plant
    { name: "Rädisor", caloriesPerPlant: 24, spacePerPlant: 0.05, pricePerPlant: 1, caloriesPerM2: 160 * 3 }, // 160 kcal/kg × 0.15 kg/plant
    { name: "Rödbetor", caloriesPerPlant: 172, spacePerPlant: 0.1, pricePerPlant: 2, caloriesPerM2: 430 * 4 }, // 430 kcal/kg × 0.4 kg/plant
    { name: "Kålrot", caloriesPerPlant: 185, spacePerPlant: 0.2, pricePerPlant: 3, caloriesPerM2: 370 * 2.5 } // 370 kcal/kg × 0.5 kg/plant
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


