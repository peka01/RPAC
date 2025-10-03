import { monthNames } from '@/constants/monthNames';

export interface MonthlyTask {
  month: string;
  tasks: string[];
  priority: 'low' | 'medium' | 'high';
}

export const generateMonthlyTasks = (
  selectedCrops: string[],
  gardenPlan?: any,
  cropVolumes?: Record<string, number>
): MonthlyTask[] => {
  const months = monthNames;

  const monthlyTasks = months.map((month, index) => {
    const tasks: string[] = [];
    const monthNumber = index + 1;

    selectedCrops.forEach(cropName => {
      const crop = gardenPlan?.crops.find((c: any) => c.name === cropName);
      if (crop) {
        const volume = cropVolumes?.[cropName] || 0;
        
        // Defensive: Check if sowingMonths exists and is an array before calling includes
        if (crop.sowingMonths && Array.isArray(crop.sowingMonths) && crop.sowingMonths.includes(month)) {
          tasks.push(`Så ${cropName} (${volume} plantor)`);
        }
        
        // Defensive: Check if harvestingMonths exists and is an array before calling includes
        if (crop.harvestingMonths && Array.isArray(crop.harvestingMonths) && crop.harvestingMonths.includes(month)) {
          tasks.push(`Skörda ${cropName} (${volume} plantor)`);
        }
      }
    });

    if (monthNumber === 1) {
      tasks.push('Planera kommande säsong');
      tasks.push('Beställ frön och plantor');
    }
    if (monthNumber === 3) {
      tasks.push('Börja förbereda jord');
    }
    if (monthNumber === 5) {
      tasks.push('Aktiva odlingsmånader börjar');
    }
    if (monthNumber === 9) {
      tasks.push('Höstskörd börjar');
    }

    let priority: 'low' | 'medium' | 'high' = 'low';
    if (tasks.length > 4) priority = 'high';
    else if (tasks.length > 2) priority = 'medium';

    return {
      month,
      tasks: tasks.length > 0 ? tasks : ['Inga specifika uppgifter denna månad'],
      priority
    };
  });

  return monthlyTasks;
};


