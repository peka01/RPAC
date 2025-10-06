import { supabase } from './supabase';

// Crop library with nutrition data (kcal per kg) and yield estimates
export const CROP_LIBRARY = {
  'Potatis': { 
    name: 'Potatis', 
    kcalPerKg: 770, 
    category: 'Rotfrukter', 
    icon: '🥔', 
    growingMonths: ['Apr', 'Maj', 'Jun'], 
    harvestMonths: ['Aug', 'Sep', 'Okt'],
    yieldPerPlant: 0.5, // kg per planta
    yieldPerM2: 3, // kg per m²
    yieldPerRow: 5 // kg per rad (1.5m lång)
  },
  'Morötter': { 
    name: 'Morötter', 
    kcalPerKg: 410, 
    category: 'Rotfrukter', 
    icon: '🥕', 
    growingMonths: ['Apr', 'Maj', 'Jun'], 
    harvestMonths: ['Jul', 'Aug', 'Sep'],
    yieldPerPlant: 0.1,
    yieldPerM2: 4,
    yieldPerRow: 3
  },
  'Kål': { 
    name: 'Kål', 
    kcalPerKg: 250, 
    category: 'Bladgrönsaker', 
    icon: '🥬', 
    growingMonths: ['Apr', 'Maj'], 
    harvestMonths: ['Sep', 'Okt', 'Nov'],
    yieldPerPlant: 1,
    yieldPerM2: 5,
    yieldPerRow: 8
  },
  'Tomater': { 
    name: 'Tomater', 
    kcalPerKg: 180, 
    category: 'Fruktgrönsaker', 
    icon: '🍅', 
    growingMonths: ['Apr', 'Maj'], 
    harvestMonths: ['Jul', 'Aug', 'Sep'],
    yieldPerPlant: 3,
    yieldPerM2: 6,
    yieldPerRow: 10
  },
  'Lök': { 
    name: 'Lök', 
    kcalPerKg: 400, 
    category: 'Lökväxter', 
    icon: '🧅', 
    growingMonths: ['Mar', 'Apr'], 
    harvestMonths: ['Jul', 'Aug', 'Sep'],
    yieldPerPlant: 0.15,
    yieldPerM2: 3,
    yieldPerRow: 4
  },
  'Spenat': { 
    name: 'Spenat', 
    kcalPerKg: 230, 
    category: 'Bladgrönsaker', 
    icon: '🥬', 
    growingMonths: ['Mar', 'Apr', 'Maj'], 
    harvestMonths: ['Maj', 'Jun', 'Jul'],
    yieldPerPlant: 0.1,
    yieldPerM2: 2,
    yieldPerRow: 2
  },
  'Gurka': { 
    name: 'Gurka', 
    kcalPerKg: 150, 
    category: 'Fruktgrönsaker', 
    icon: '🥒', 
    growingMonths: ['Maj', 'Jun'], 
    harvestMonths: ['Jul', 'Aug'],
    yieldPerPlant: 2,
    yieldPerM2: 4,
    yieldPerRow: 6
  },
  'Paprika': { 
    name: 'Paprika', 
    kcalPerKg: 260, 
    category: 'Fruktgrönsaker', 
    icon: '🫑', 
    growingMonths: ['Apr', 'Maj'], 
    harvestMonths: ['Jul', 'Aug', 'Sep'],
    yieldPerPlant: 1.5,
    yieldPerM2: 3,
    yieldPerRow: 5
  },
  'Bönor': { 
    name: 'Bönor', 
    kcalPerKg: 1270, 
    category: 'Baljväxter', 
    icon: '🫘', 
    growingMonths: ['Maj', 'Jun'], 
    harvestMonths: ['Jul', 'Aug', 'Sep'],
    yieldPerPlant: 0.3,
    yieldPerM2: 2,
    yieldPerRow: 3
  },
  'Ärtor': { 
    name: 'Ärtor', 
    kcalPerKg: 810, 
    category: 'Baljväxter', 
    icon: '🫛', 
    growingMonths: ['Apr', 'Maj'], 
    harvestMonths: ['Jun', 'Jul', 'Aug'],
    yieldPerPlant: 0.2,
    yieldPerM2: 1.5,
    yieldPerRow: 2
  },
  'Sallad': { 
    name: 'Sallad', 
    kcalPerKg: 150, 
    category: 'Bladgrönsaker', 
    icon: '🥗', 
    growingMonths: ['Apr', 'Maj', 'Jun'], 
    harvestMonths: ['Jun', 'Jul', 'Aug'],
    yieldPerPlant: 0.3,
    yieldPerM2: 2,
    yieldPerRow: 2
  },
  'Broccoli': { 
    name: 'Broccoli', 
    kcalPerKg: 340, 
    category: 'Kålväxter', 
    icon: '🥦', 
    growingMonths: ['Apr', 'Maj'], 
    harvestMonths: ['Jul', 'Aug', 'Sep'],
    yieldPerPlant: 0.5,
    yieldPerM2: 2,
    yieldPerRow: 4
  },
  'Blomkål': { 
    name: 'Blomkål', 
    kcalPerKg: 250, 
    category: 'Kålväxter', 
    icon: '🥬', 
    growingMonths: ['Apr', 'Maj'], 
    harvestMonths: ['Aug', 'Sep'],
    yieldPerPlant: 0.8,
    yieldPerM2: 3,
    yieldPerRow: 5
  },
  'Rädisor': { 
    name: 'Rädisor', 
    kcalPerKg: 160, 
    category: 'Rotfrukter', 
    icon: '🌱', 
    growingMonths: ['Apr', 'Maj', 'Jun', 'Jul'], 
    harvestMonths: ['Maj', 'Jun', 'Jul', 'Aug'],
    yieldPerPlant: 0.02,
    yieldPerM2: 1,
    yieldPerRow: 1
  },
  'Kålrot': { 
    name: 'Kålrot', 
    kcalPerKg: 370, 
    category: 'Rotfrukter', 
    icon: '🥕', 
    growingMonths: ['Maj', 'Jun'], 
    harvestMonths: ['Sep', 'Okt', 'Nov'],
    yieldPerPlant: 0.5,
    yieldPerM2: 4,
    yieldPerRow: 5
  },
  'Rödbetor': { 
    name: 'Rödbetor', 
    kcalPerKg: 430, 
    category: 'Rotfrukter', 
    icon: '🥬', 
    growingMonths: ['Apr', 'Maj'], 
    harvestMonths: ['Jul', 'Aug', 'Sep'],
    yieldPerPlant: 0.2,
    yieldPerM2: 3,
    yieldPerRow: 4
  },
  'Squash': { 
    name: 'Squash', 
    kcalPerKg: 170, 
    category: 'Fruktgrönsaker', 
    icon: '🥒', 
    growingMonths: ['Maj', 'Jun'], 
    harvestMonths: ['Jul', 'Aug', 'Sep'],
    yieldPerPlant: 4,
    yieldPerM2: 6,
    yieldPerRow: 10
  },
  'Pumpa': { 
    name: 'Pumpa', 
    kcalPerKg: 260, 
    category: 'Fruktgrönsaker', 
    icon: '🎃', 
    growingMonths: ['Maj', 'Jun'], 
    harvestMonths: ['Sep', 'Okt'],
    yieldPerPlant: 8,
    yieldPerM2: 10,
    yieldPerRow: 15
  },
  'Persilja': { 
    name: 'Persilja', 
    kcalPerKg: 360, 
    category: 'Örter', 
    icon: '🌿', 
    growingMonths: ['Apr', 'Maj'], 
    harvestMonths: ['Jun', 'Jul', 'Aug', 'Sep'],
    yieldPerPlant: 0.05,
    yieldPerM2: 0.5,
    yieldPerRow: 0.8
  },
  'Basilika': { 
    name: 'Basilika', 
    kcalPerKg: 230, 
    category: 'Örter', 
    icon: '🌿', 
    growingMonths: ['Maj'], 
    harvestMonths: ['Jun', 'Jul', 'Aug'],
    yieldPerPlant: 0.08,
    yieldPerM2: 0.6,
    yieldPerRow: 1
  },
};

// Calculate expected yield based on number of plants
export function calculateExpectedYield(cropName: CropName, quantity: number): number {
  const crop = CROP_LIBRARY[cropName];
  return quantity * crop.yieldPerPlant;
}

export type CropName = keyof typeof CROP_LIBRARY;

export interface CultivationCrop {
  cropName: CropName;
  quantity: number; // Number of plants
  estimatedYieldKg: number;
  notes?: string;
}

export interface CultivationPlan {
  id?: string;
  user_id?: string;
  plan_name: string;
  description?: string;
  crops: CultivationCrop[];
  is_primary?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface MonthlyActivity {
  month: string;
  sowingCrops: CropName[];
  plantingCrops: CropName[];
  harvestingCrops: CropName[];
  maintenanceTasks: string[];
}

// Calculate nutrition contribution for a plan
export function calculatePlanNutrition(plan: CultivationPlan, householdSize: number = 2, targetDays: number = 30): {
  totalKcal: number;
  kcalPerDay: number;
  kcalPerPersonPerDay: number;
  percentOfTarget: number;
  targetKcalPerDay: number;
} {
  const totalKcal = plan.crops.reduce((sum, crop) => {
    const cropData = CROP_LIBRARY[crop.cropName];
    return sum + (cropData.kcalPerKg * crop.estimatedYieldKg);
  }, 0);

  const targetKcalPerPersonPerDay = 2000; // Average adult
  const targetKcalPerDay = targetKcalPerPersonPerDay * householdSize;
  const kcalPerDay = totalKcal / targetDays;
  const kcalPerPersonPerDay = kcalPerDay / householdSize;
  const percentOfTarget = (kcalPerDay / targetKcalPerDay) * 100;

  return {
    totalKcal,
    kcalPerDay,
    kcalPerPersonPerDay,
    percentOfTarget: Math.round(percentOfTarget),
    targetKcalPerDay
  };
}

// Generate monthly activities from selected crops
export function generateMonthlyActivities(crops: CultivationCrop[]): MonthlyActivity[] {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
  
  return months.map(month => {
    const sowingCrops: CropName[] = [];
    const plantingCrops: CropName[] = [];
    const harvestingCrops: CropName[] = [];
    const maintenanceTasks: string[] = [];

    crops.forEach(crop => {
      const cropData = CROP_LIBRARY[crop.cropName];
      
      if (cropData.growingMonths.includes(month)) {
        sowingCrops.push(crop.cropName);
        plantingCrops.push(crop.cropName);
      }
      
      if (cropData.harvestMonths.includes(month)) {
        harvestingCrops.push(crop.cropName);
      }
    });

    // Add seasonal maintenance tasks
    if (['Mar', 'Apr'].includes(month)) {
      maintenanceTasks.push('Förbered odlingsbäddar', 'Kontrollera verktyg');
    }
    if (['Maj', 'Jun', 'Jul'].includes(month)) {
      maintenanceTasks.push('Vattna regelbundet', 'Ogräsrensning');
    }
    if (['Aug', 'Sep'].includes(month)) {
      maintenanceTasks.push('Skörd och lagring', 'Förbered för höst');
    }
    if (['Okt', 'Nov'].includes(month)) {
      maintenanceTasks.push('Rensa bäddar', 'Täck jord med växtmaterial');
    }

    return {
      month,
      sowingCrops,
      plantingCrops,
      harvestingCrops,
      maintenanceTasks: sowingCrops.length > 0 || harvestingCrops.length > 0 ? maintenanceTasks : []
    };
  });
}

// Database service
export const cultivationPlanService = {
  async getUserPlans(userId: string): Promise<CultivationPlan[]> {
    const { data, error } = await supabase
      .from('cultivation_plans')
      .select('*')
      .eq('user_id', userId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching plans:', error);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      user_id: row.user_id,
      plan_name: row.title,
      description: row.description,
      crops: Array.isArray(row.crops) ? row.crops : [],
      is_primary: row.is_primary || false,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));
  },

  async createPlan(userId: string, plan: CultivationPlan): Promise<CultivationPlan | null> {
    const { data, error } = await supabase
      .from('cultivation_plans')
      .insert({
        user_id: userId,
        title: plan.plan_name,
        description: plan.description || '',
        crops: plan.crops,
        is_primary: plan.is_primary || false,
        plan_id: `plan_${Date.now()}`
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating plan:', error);
      return null;
    }

    return {
      id: data.id,
      user_id: data.user_id,
      plan_name: data.title,
      description: data.description,
      crops: data.crops,
      is_primary: data.is_primary,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  },

  async updatePlan(planId: string, updates: Partial<CultivationPlan>): Promise<boolean> {
    const dbUpdates: any = {};
    
    if (updates.plan_name) dbUpdates.title = updates.plan_name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.crops) dbUpdates.crops = updates.crops;
    if (updates.is_primary !== undefined) dbUpdates.is_primary = updates.is_primary;

    const { error } = await supabase
      .from('cultivation_plans')
      .update(dbUpdates)
      .eq('id', planId);

    if (error) {
      console.error('Error updating plan:', error);
      return false;
    }

    return true;
  },

  async deletePlan(planId: string): Promise<boolean> {
    const { error } = await supabase
      .from('cultivation_plans')
      .delete()
      .eq('id', planId);

    if (error) {
      console.error('Error deleting plan:', error);
      return false;
    }

    return true;
  },

  async setPrimaryPlan(userId: string, planId: string): Promise<boolean> {
    // First, unset all plans as primary
    await supabase
      .from('cultivation_plans')
      .update({ is_primary: false })
      .eq('user_id', userId);

    // Then set the selected plan as primary
    const { error } = await supabase
      .from('cultivation_plans')
      .update({ is_primary: true })
      .eq('id', planId);

    if (error) {
      console.error('Error setting primary plan:', error);
      return false;
    }

    return true;
  }
};

