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
  

  
  // Safety check for undefined or null selectedCrops
  if (!selectedCrops || !Array.isArray(selectedCrops)) {
    return {
      calories: 0,
      cost: 0,
      spaceUsed: 0
    };
  }
  
  selectedCrops.forEach(cropName => {
    const plantCount = volumes[cropName] || 0;
    
    if (plantCount > 0 && gardenPlan?.crops) {
      // Find the crop in the garden plan
      const crop = gardenPlan.crops.find((c: any) => c.name === cropName);
      
      if (crop) {

        
        // FIXED: Calculate calories per plant correctly
        // Use the crop's calories as total calories for the yield, then calculate per plant
        const caloriesPerPlant = (crop.calories || 0) / Math.max(crop.yield || 1, 1);
        const caloriesFromCrop = caloriesPerPlant * plantCount * intensityMultiplier;
        totalCalories += caloriesFromCrop;
        

        
        // Estimate cost per plant (rough estimate based on crop type)
        const costPerPlant = getCropPrice(cropName);
        const costFromCrop = costPerPlant * plantCount;
        totalCost += costFromCrop;
        
        // FIXED: Calculate space used correctly - use space per plant directly
        const spacePerPlant = crop.spaceRequired || 0.5; // Default to 0.5 m² if not specified
        const spaceUsed = spacePerPlant * plantCount;
        totalSpaceUsed += spaceUsed;
        

      }
    }
  });

  const result = {
    calories: Math.round(totalCalories),
    cost: Math.round(totalCost),
    spaceUsed: Math.round(totalSpaceUsed * 10) / 10
  };
  

  
  return result;
};


