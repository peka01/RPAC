import { getCropPrice } from './getCropPrice';

export interface GardenProduction {
  calories: number;
  cost: number;
  spaceUsed: number;
}

export const calculateGardenProduction = (
  selectedCrops: string[], 
  gardenSize: number, 
  intensity: 'low' | 'medium' | 'high', 
  volumes: Record<string, number>,
  gardenPlan?: any
): GardenProduction => {
  const intensityMultiplier = intensity === 'low' ? 0.8 : intensity === 'medium' ? 1.0 : 1.3;
  
  let totalCalories = 0;
  let totalCost = 0;
  let totalSpaceUsed = 0;
  
  selectedCrops.forEach(cropName => {
    const plantCount = volumes[cropName] || 0;
    
    if (plantCount > 0 && gardenPlan?.crops) {
      // Find the crop in the garden plan
      const crop = gardenPlan.crops.find((c: any) => c.name === cropName);
      
      if (crop) {
        // Calculate calories per plant from the crop's total calories and yield
        const caloriesPerPlant = crop.calories / Math.max(crop.yield, 1);
        const caloriesFromCrop = caloriesPerPlant * plantCount * intensityMultiplier;
        totalCalories += caloriesFromCrop;
        
        // Estimate cost per plant (rough estimate based on crop type)
        const costPerPlant = getCropPrice(cropName);
        const costFromCrop = costPerPlant * plantCount;
        totalCost += costFromCrop;
        
        // Calculate space used based on crop's space requirement
        const spacePerPlant = crop.spaceRequired / Math.max(crop.yield, 1);
        const spaceUsed = spacePerPlant * plantCount;
        totalSpaceUsed += spaceUsed;
      }
    }
  });

  return {
    calories: Math.round(totalCalories),
    cost: Math.round(totalCost),
    spaceUsed: Math.round(totalSpaceUsed * 10) / 10
  };
};


