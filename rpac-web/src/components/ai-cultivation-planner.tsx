'use client';

import { useState, useEffect } from 'react';
import { t } from '@/lib/locales';
import { OpenAIService } from '@/lib/openai-worker-service';
import { 
  Brain,
  Calculator,
  Target,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Leaf,
  Sprout,
  Apple,
  Users,
  MapPin,
  Thermometer,
  Droplets,
  TrendingUp,
  Calendar,
  Package,
  Zap
} from 'lucide-react';

interface NutritionalData {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  vitamins: {
    A?: number;
    C?: number;
    K?: number;
    folate?: number;
  };
  minerals: {
    iron?: number;
    calcium?: number;
    potassium?: number;
    magnesium?: number;
  };
}

interface CropData {
  name: string;
  icon: string;
  nutrition: NutritionalData;
  harvestWeightPer100Plants: number;
  storageWeeks: number;
  calorieDensity: 'low' | 'medium' | 'high';
  crisisPriority: 'low' | 'medium' | 'high';
  growingTime: number; // weeks
  difficulty: 'beginner' | 'intermediate' | 'expert';
  season: 'spring' | 'summer' | 'autumn' | 'winter' | 'year_round';
  costPerSeed: number; // SEK
  yieldPerSquareMeter: number; // kg
}

interface HouseholdProfile {
  adults: number;
  children: number;
  elderly: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
}

interface PlantedCrop {
  cropType: string;
  plantCount: number;
  harvestsPerYear: number;
  squareMeters: number;
}

interface GroceryItem {
  name: string;
  category: 'protein' | 'carbs' | 'fats' | 'vitamins' | 'minerals';
  calories: number;
  costPerKg: number;
  priority: 'essential' | 'important' | 'optional';
  source: 'store' | 'garden' | 'both';
}

interface CultivationPlan {
  id: string;
  title: string;
  description: string;
  crops: PlantedCrop[];
  totalCalories: number;
  selfSufficiencyPercent: number;
  groceryGap: GroceryItem[];
  estimatedCost: number;
  timeline: string;
  priority: 'high' | 'medium' | 'low';
  nextSteps?: string[];
  recommendations?: string[];
}

interface AICultivationPlannerProps {
  userProfile?: any;
  crisisMode?: boolean;
}

const cropNutritionData: Record<string, CropData> = {
  potatoes: {
    name: 'Potatis',
    icon: '🥔',
    nutrition: {
      calories: 77,
      protein: 2.0,
      carbohydrates: 17.6,
      fat: 0.1,
      fiber: 2.2,
      vitamins: { C: 19.7, K: 2.0, folate: 15 },
      minerals: { potassium: 425, magnesium: 23, iron: 0.8 }
    },
    harvestWeightPer100Plants: 150,
    storageWeeks: 24,
    calorieDensity: 'medium',
    crisisPriority: 'high',
    growingTime: 16,
    difficulty: 'beginner',
    season: 'spring',
    costPerSeed: 0.5,
    yieldPerSquareMeter: 3.5
  },
  carrots: {
    name: 'Morötter',
    icon: '🥕',
    nutrition: {
      calories: 41,
      protein: 0.9,
      carbohydrates: 9.6,
      fat: 0.2,
      fiber: 2.8,
      vitamins: { A: 16706, C: 5.9, K: 13.2 },
      minerals: { potassium: 320, calcium: 33, magnesium: 12 }
    },
    harvestWeightPer100Plants: 80,
    storageWeeks: 16,
    calorieDensity: 'low',
    crisisPriority: 'medium',
    growingTime: 12,
    difficulty: 'beginner',
    season: 'spring',
    costPerSeed: 0.1,
    yieldPerSquareMeter: 4.0
  },
  cabbage: {
    name: 'Kål',
    icon: '🥬',
    nutrition: {
      calories: 25,
      protein: 1.3,
      carbohydrates: 5.8,
      fat: 0.1,
      fiber: 2.5,
      vitamins: { C: 36.6, K: 76, folate: 43 },
      minerals: { potassium: 170, calcium: 40, magnesium: 12 }
    },
    harvestWeightPer100Plants: 120,
    storageWeeks: 12,
    calorieDensity: 'low',
    crisisPriority: 'medium',
    growingTime: 14,
    difficulty: 'beginner',
    season: 'spring',
    costPerSeed: 0.2,
    yieldPerSquareMeter: 3.0
  },
  kale: {
    name: 'Grönkål',
    icon: '🥬',
    nutrition: {
      calories: 35,
      protein: 2.9,
      carbohydrates: 4.4,
      fat: 1.5,
      fiber: 4.1,
      vitamins: { A: 15376, C: 93.4, K: 390 },
      minerals: { calcium: 254, iron: 1.6, magnesium: 33 }
    },
    harvestWeightPer100Plants: 60,
    storageWeeks: 2,
    calorieDensity: 'low',
    crisisPriority: 'high',
    growingTime: 8,
    difficulty: 'beginner',
    season: 'spring',
    costPerSeed: 0.3,
    yieldPerSquareMeter: 2.5
  },
  spinach: {
    name: 'Spinat',
    icon: '🥬',
    nutrition: {
      calories: 23,
      protein: 2.9,
      carbohydrates: 3.6,
      fat: 0.4,
      fiber: 2.2,
      vitamins: { A: 9377, C: 28.1, K: 483, folate: 194 },
      minerals: { iron: 2.7, calcium: 99, magnesium: 79, potassium: 558 }
    },
    harvestWeightPer100Plants: 40,
    storageWeeks: 1,
    calorieDensity: 'low',
    crisisPriority: 'high',
    growingTime: 6,
    difficulty: 'beginner',
    season: 'spring',
    costPerSeed: 0.2,
    yieldPerSquareMeter: 2.0
  },
  lettuce: {
    name: 'Sallad',
    icon: '🥬',
    nutrition: {
      calories: 15,
      protein: 1.4,
      carbohydrates: 2.9,
      fat: 0.2,
      fiber: 1.3,
      vitamins: { A: 7405, C: 9.2, K: 126, folate: 38 },
      minerals: { potassium: 194, calcium: 36, iron: 0.9 }
    },
    harvestWeightPer100Plants: 50,
    storageWeeks: 2,
    calorieDensity: 'low',
    crisisPriority: 'low',
    growingTime: 6,
    difficulty: 'beginner',
    season: 'spring',
    costPerSeed: 0.1,
    yieldPerSquareMeter: 1.5
  },
  beets: {
    name: 'Rödbetor',
    icon: '🍠',
    nutrition: {
      calories: 43,
      protein: 1.6,
      carbohydrates: 9.6,
      fat: 0.2,
      fiber: 2.8,
      vitamins: { C: 4.9, folate: 109 },
      minerals: { potassium: 325, magnesium: 23, iron: 0.8 }
    },
    harvestWeightPer100Plants: 90,
    storageWeeks: 20,
    calorieDensity: 'low',
    crisisPriority: 'medium',
    growingTime: 12,
    difficulty: 'beginner',
    season: 'spring',
    costPerSeed: 0.3,
    yieldPerSquareMeter: 3.5
  },
  tomatoes: {
    name: 'Tomater',
    icon: '🍅',
    nutrition: {
      calories: 18,
      protein: 0.9,
      carbohydrates: 3.9,
      fat: 0.2,
      fiber: 1.2,
      vitamins: { A: 833, C: 13.7, K: 7.9, folate: 15 },
      minerals: { potassium: 237, calcium: 10, magnesium: 11 }
    },
    harvestWeightPer100Plants: 200,
    storageWeeks: 1,
    calorieDensity: 'low',
    crisisPriority: 'medium',
    growingTime: 16,
    difficulty: 'intermediate',
    season: 'summer',
    costPerSeed: 0.5,
    yieldPerSquareMeter: 8.0
  },
  beans: {
    name: 'Bönor',
    icon: '🫘',
    nutrition: {
      calories: 347,
      protein: 21.6,
      carbohydrates: 63.4,
      fat: 1.2,
      fiber: 15.2,
      vitamins: { C: 1.4, K: 5.6, folate: 394 },
      minerals: { iron: 6.7, calcium: 83, magnesium: 138, potassium: 1406 }
    },
    harvestWeightPer100Plants: 50,
    storageWeeks: 52,
    calorieDensity: 'high',
    crisisPriority: 'high',
    growingTime: 12,
    difficulty: 'beginner',
    season: 'spring',
    costPerSeed: 0.2,
    yieldPerSquareMeter: 1.5
  }
};

export function AICultivationPlanner({ 
  userProfile = {}, 
  crisisMode = false 
}: AICultivationPlannerProps) {
  const [currentStep, setCurrentStep] = useState<'nutrition' | 'planning' | 'grocery' | 'timeline'>('nutrition');
  const [household, setHousehold] = useState<HouseholdProfile>({
    adults: 2,
    children: 1,
    elderly: 0,
    activityLevel: 'moderate'
  });
  const [selectedCrops, setSelectedCrops] = useState<PlantedCrop[]>([]);
  const [cultivationPlan, setCultivationPlan] = useState<CultivationPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [calendarItems, setCalendarItems] = useState<any[]>([]);
  const [showCalendarSuccess, setShowCalendarSuccess] = useState(false);
  const [addedItemsCount, setAddedItemsCount] = useState(0);
  const [editingTimelineItem, setEditingTimelineItem] = useState<string | null>(null);
  const [editTimelineForm, setEditTimelineForm] = useState({ period: '', description: '' });

  // Calculate daily calorie needs
  const calculateDailyCalorieNeeds = () => {
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };

    const baseCaloricNeeds = {
      adult_male: 1800,
      adult_female: 1600,
      child: 1400,
      elderly: 1500
    };

    const multiplier = activityMultipliers[household.activityLevel];
    const adultCalories = household.adults * ((baseCaloricNeeds.adult_male + baseCaloricNeeds.adult_female) / 2) * multiplier;
    const childCalories = household.children * baseCaloricNeeds.child * multiplier;
    const elderlyCalories = household.elderly * baseCaloricNeeds.elderly * multiplier;

    return Math.round(adultCalories + childCalories + elderlyCalories);
  };

  // Calculate annual production from garden
  const calculateAnnualProduction = () => {
    let totalCalories = 0;
    let totalWeight = 0;
    let totalCost = 0;
    let totalSquareMeters = 0;

    selectedCrops.forEach(crop => {
      const cropData = cropNutritionData[crop.cropType];
      if (!cropData) return;

      const annualHarvestWeight = (crop.plantCount / 100) * cropData.harvestWeightPer100Plants * crop.harvestsPerYear;
      const annualCalories = (annualHarvestWeight * 1000) * (cropData.nutrition.calories / 100);
      const cropCost = crop.plantCount * cropData.costPerSeed;

      totalCalories += annualCalories;
      totalWeight += annualHarvestWeight;
      totalCost += cropCost;
      totalSquareMeters += crop.squareMeters;
    });

    return {
      totalCalories: Math.round(totalCalories),
      totalWeight: Math.round(totalWeight),
      dailyCalories: Math.round(totalCalories / 365),
      totalCost,
      totalSquareMeters
    };
  };

  // Calculate self-sufficiency and grocery gap
  const calculateSelfSufficiency = () => {
    const dailyNeeds = calculateDailyCalorieNeeds();
    const production = calculateAnnualProduction();
    
    const selfSufficiencyPercent = Math.round((production.dailyCalories / dailyNeeds) * 100);
    const deficit = dailyNeeds - production.dailyCalories;

    // Generate grocery gap items
    const groceryGap: GroceryItem[] = [];
    
    if (deficit > 0) {
      // Add essential grocery items to fill the gap
      groceryGap.push({
        name: 'Ris (långkornigt)',
        category: 'carbs',
        calories: 365,
        costPerKg: 25,
        priority: 'essential',
        source: 'store'
      });
      
      groceryGap.push({
        name: 'Pasta (durum)',
        category: 'carbs',
        calories: 371,
        costPerKg: 18,
        priority: 'essential',
        source: 'store'
      });
      
      groceryGap.push({
        name: 'Linser (torkade)',
        category: 'protein',
        calories: 353,
        costPerKg: 35,
        priority: 'essential',
        source: 'store'
      });
      
      groceryGap.push({
        name: 'Havregryn',
        category: 'carbs',
        calories: 389,
        costPerKg: 22,
        priority: 'important',
        source: 'store'
      });
      
      groceryGap.push({
        name: 'Olja (raps)',
        category: 'fats',
        calories: 884,
        costPerKg: 15,
        priority: 'important',
        source: 'store'
      });
    }

    return {
      dailyNeeds,
      dailyProduction: production.dailyCalories,
      selfSufficiencyPercent,
      deficit: deficit > 0 ? deficit : 0,
      surplus: deficit < 0 ? Math.abs(deficit) : 0,
      totalProduction: production,
      groceryGap
    };
  };

  // Generate AI cultivation plan using Gemini AI
  const generateCultivationPlan = async () => {
    setLoading(true);
    
    try {
      const stats = calculateSelfSufficiency();
      const production = calculateAnnualProduction();
      
      // Create user profile for AI
      const userProfile = {
        climateZone: 'svealand' as const,
        experienceLevel: 'beginner' as const,
        gardenSize: 'medium' as const,
        preferences: selectedCrops.map(c => c.cropType),
        currentCrops: selectedCrops.map(c => c.cropType),
        householdSize: household.adults + household.children + household.elderly,
        hasChildren: household.children > 0,
        hasElderly: household.elderly > 0
      };
      
      // Use real Gemini AI for plan generation
        const aiPlan = await OpenAIService.generateCultivationPlan(
          userProfile,
          stats,
          selectedCrops
        );
      
      const plan: CultivationPlan = {
        id: 'ai-plan-1',
        title: aiPlan.title || 'AI-genererad odlingsplan',
        description: aiPlan.description || `Personlig odlingsplan baserad på ${household.adults + household.children + household.elderly} personers näringsbehov`,
        crops: selectedCrops,
        totalCalories: production.totalCalories,
        selfSufficiencyPercent: stats.selfSufficiencyPercent,
        groceryGap: stats.groceryGap,
        estimatedCost: aiPlan.estimatedCost || (production.totalCost + stats.groceryGap.reduce((sum, item) => sum + item.costPerKg * 2, 0)),
        timeline: aiPlan.timeline || '12 månader',
        priority: aiPlan.priority || (stats.selfSufficiencyPercent >= 70 ? 'high' : stats.selfSufficiencyPercent >= 40 ? 'medium' : 'low')
      };
      
      setCultivationPlan(plan);
      // Automatically move to timeline step to show the generated plan
      setCurrentStep('timeline');
    } catch (error) {
      console.error('Error generating AI plan:', error);
      
      // Fallback to basic plan if AI fails
      const stats = calculateSelfSufficiency();
      const production = calculateAnnualProduction();
      
      const fallbackPlan: CultivationPlan = {
        id: 'fallback-plan',
        title: 'Grundläggande odlingsplan',
        description: `Enkel odlingsplan baserad på ${household.adults + household.children + household.elderly} personers näringsbehov`,
        crops: selectedCrops,
        totalCalories: production.totalCalories,
        selfSufficiencyPercent: stats.selfSufficiencyPercent,
        groceryGap: stats.groceryGap,
        estimatedCost: production.totalCost + stats.groceryGap.reduce((sum, item) => sum + item.costPerKg * 2, 0),
        timeline: '12 månader',
        priority: stats.selfSufficiencyPercent >= 70 ? 'high' : stats.selfSufficiencyPercent >= 40 ? 'medium' : 'low'
      };
      
      setCultivationPlan(fallbackPlan);
      // Also move to timeline for fallback plan
      setCurrentStep('timeline');
    } finally {
      setLoading(false);
    }
  };

  // Add timeline item to calendar
  const addToCalendar = (item: any) => {
    const calendarItem = {
      id: `calendar-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: `${item.period}: ${item.description}`,
      period: item.period,
      description: item.description,
      date: new Date().toISOString(),
      type: 'cultivation_task',
      priority: 'medium',
      completed: false,
      source: 'ai_plan'
    };
    
    setCalendarItems(prev => [...prev, calendarItem]);
    setAddedItemsCount(1);
    setShowCalendarSuccess(true);
    
    // Save to localStorage for persistence across components
    const updatedItems = [...calendarItems, calendarItem];
    localStorage.setItem('ai-calendar-items', JSON.stringify(updatedItems));
    
    // Hide success message after 3 seconds
    setTimeout(() => setShowCalendarSuccess(false), 3000);
    
    console.log('Added to calendar:', calendarItem);
  };

  const addAllToCalendar = (timelineItems: any[]) => {
    const newCalendarItems = timelineItems.map((item, index) => ({
      id: `calendar-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
      title: `${item.period}: ${item.description}`,
      period: item.period,
      description: item.description,
      date: new Date().toISOString(),
      type: 'cultivation_task',
      priority: 'medium',
      completed: false,
      source: 'ai_plan'
    }));
    
    setCalendarItems(prev => [...prev, ...newCalendarItems]);
    setAddedItemsCount(newCalendarItems.length);
    setShowCalendarSuccess(true);
    
    // Save to localStorage for persistence across components
    const updatedItems = [...calendarItems, ...newCalendarItems];
    localStorage.setItem('ai-calendar-items', JSON.stringify(updatedItems));
    
    // Hide success message after 3 seconds
    setTimeout(() => setShowCalendarSuccess(false), 3000);
    
    console.log('Added all items to calendar:', newCalendarItems);
  };

  // Timeline edit functions
  const startEditTimeline = (item: any) => {
    setEditingTimelineItem(item.period + item.description);
    setEditTimelineForm({ period: item.period, description: item.description });
  };

  const saveEditTimeline = () => {
    if (!editingTimelineItem) return;
    
    // Update the cultivation plan timeline
    if (cultivationPlan) {
      const updatedTimeline = cultivationPlan.timeline
        .split('\n')
        .map(line => {
          const match = line.match(/^(.*?):\s*(.*)$/);
          if (match && match[1] === editTimelineForm.period && match[2] === editTimelineForm.description) {
            return `${editTimelineForm.period}: ${editTimelineForm.description}`;
          }
          return line;
        })
        .join('\n');
      
      setCultivationPlan(prev => prev ? { ...prev, timeline: updatedTimeline } : null);
    }
    
    setEditingTimelineItem(null);
    setEditTimelineForm({ period: '', description: '' });
  };

  const cancelEditTimeline = () => {
    setEditingTimelineItem(null);
    setEditTimelineForm({ period: '', description: '' });
  };

  const addCrop = (cropType: string) => {
    const cropData = cropNutritionData[cropType];
    if (!cropData) return;

    const defaultPlantCount = 10;
    const defaultSquareMeters = Math.ceil(defaultPlantCount / cropData.yieldPerSquareMeter);

    setSelectedCrops(prev => [
      ...prev,
      { 
        cropType, 
        plantCount: defaultPlantCount, 
        harvestsPerYear: 1,
        squareMeters: defaultSquareMeters
      }
    ]);
  };

  const updateCrop = (index: number, updates: Partial<PlantedCrop>) => {
    setSelectedCrops(prev => prev.map((crop, i) => 
      i === index ? { ...crop, ...updates } : crop
    ));
  };

  const removeCrop = (index: number) => {
    setSelectedCrops(prev => prev.filter((_, i) => i !== index));
  };

  const stats = calculateSelfSufficiency();

  const getStepIcon = (step: string) => {
    switch (step) {
      case 'nutrition': return Calculator;
      case 'planning': return Target;
      case 'grocery': return ShoppingCart;
      case 'timeline': return Calendar;
      default: return Target;
    }
  };

  const getStepColor = (step: string) => {
    if (currentStep === step) return 'var(--color-sage)';
    return 'var(--color-secondary)';
  };

  return (
    <div className="rounded-lg p-6 border shadow-lg" style={{ 
      backgroundColor: 'var(--bg-card)',
      borderColor: crisisMode ? 'var(--color-warm-olive)' : 'var(--color-sage)'
    }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center shadow-sm" style={{ 
            background: `linear-gradient(135deg, ${crisisMode ? 'var(--color-warm-olive)' : 'var(--color-sage)'} 0%, var(--color-secondary) 100%)` 
          }}>
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Min odling
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Personlig odlingsplan baserad på näringsbehov
            </p>
          </div>
        </div>

        {crisisMode && (
          <div className="flex items-center space-x-2 px-3 py-1 rounded-full border" style={{
            backgroundColor: 'rgba(184, 134, 11, 0.1)',
            borderColor: 'var(--color-warm-olive)'
          }}>
            <AlertTriangle className="w-4 h-4" style={{ color: 'var(--color-warm-olive)' }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--color-warm-olive)' }}>
              Krisläge
            </span>
          </div>
        )}
      </div>

      {/* Step Navigation */}
      <div className="flex space-x-1 mb-6 p-1 rounded-lg" style={{ backgroundColor: 'var(--bg-olive-light)' }}>
        {[
          { id: 'nutrition', label: '1. Beräkna näring', icon: Calculator },
          { id: 'planning', label: '2. AI-rådgivning', icon: Target },
          { id: 'grocery', label: '3. Odlingsplan', icon: ShoppingCart },
          { id: 'timeline', label: '4. Tidslinje', icon: Calendar }
        ].map(step => {
          const StepIcon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = ['nutrition', 'planning', 'grocery'].indexOf(currentStep) > ['nutrition', 'planning', 'grocery'].indexOf(step.id);
          
          return (
            <button
              key={step.id}
              onClick={() => setCurrentStep(step.id as any)}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                isActive ? 'shadow-sm' : 'hover:shadow-sm'
              }`}
              style={{
                backgroundColor: isActive ? 'var(--bg-card)' : isCompleted ? 'rgba(135, 169, 107, 0.1)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : isCompleted ? 'var(--color-sage)' : 'var(--text-secondary)'
              }}
            >
              <StepIcon className="w-4 h-4" />
              <span>{step.label}</span>
            </button>
          );
        })}
      </div>

      {/* Step 1: Nutrition Calculator */}
      {currentStep === 'nutrition' && (
        <div className="space-y-6">
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-olive-light)' }}>
            <h3 className="font-semibold mb-4 flex items-center space-x-2" style={{ color: 'var(--text-primary)' }}>
              <Users className="w-5 h-5" />
              <span>Hushållsstorlek</span>
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Vuxna
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={household.adults}
                  onChange={(e) => setHousehold(prev => ({ ...prev, adults: parseInt(e.target.value) || 0 }))}
                  className="w-full p-2 border rounded"
                  style={{ borderColor: 'var(--color-secondary)' }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Barn
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={household.children}
                  onChange={(e) => setHousehold(prev => ({ ...prev, children: parseInt(e.target.value) || 0 }))}
                  className="w-full p-2 border rounded"
                  style={{ borderColor: 'var(--color-secondary)' }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Äldre
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={household.elderly}
                  onChange={(e) => setHousehold(prev => ({ ...prev, elderly: parseInt(e.target.value) || 0 }))}
                  className="w-full p-2 border rounded"
                  style={{ borderColor: 'var(--color-secondary)' }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Aktivitetsnivå
                </label>
                <select
                  value={household.activityLevel}
                  onChange={(e) => setHousehold(prev => ({ ...prev, activityLevel: e.target.value as any }))}
                  className="w-full p-2 border rounded"
                  style={{ borderColor: 'var(--color-secondary)' }}
                >
                  <option value="sedentary">Stillasittande</option>
                  <option value="light">Lätt aktiv</option>
                  <option value="moderate">Måttlig aktiv</option>
                  <option value="active">Aktiv</option>
                  <option value="very_active">Mycket aktiv</option>
                </select>
              </div>
            </div>
            
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              <strong>Dagliga behov:</strong> {stats.dailyNeeds.toLocaleString()} kalorier/dag
            </div>
          </div>

          {/* Nutrition Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-olive-light)' }}>
              <div className="flex items-center space-x-2 mb-2">
                <Target className="w-5 h-5" style={{ color: 'var(--color-sage)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Dagliga behov
                </span>
              </div>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-sage)' }}>
                {stats.dailyNeeds.toLocaleString()}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                kalorier/dag
              </div>
            </div>

            <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-olive-light)' }}>
              <div className="flex items-center space-x-2 mb-2">
                <Zap className="w-5 h-5" style={{ color: 'var(--color-khaki)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Produktion
                </span>
              </div>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-khaki)' }}>
                {stats.dailyProduction.toLocaleString()}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                kalorier/dag
              </div>
            </div>

            <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-olive-light)' }}>
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="w-5 h-5" style={{ color: stats.selfSufficiencyPercent >= 50 ? 'var(--color-sage)' : 'var(--color-warm-olive)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Självförsörjning
                </span>
              </div>
              <div className="text-2xl font-bold" style={{ color: stats.selfSufficiencyPercent >= 50 ? 'var(--color-sage)' : 'var(--color-warm-olive)' }}>
                {stats.selfSufficiencyPercent}%
              </div>
              <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                av behov
              </div>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={() => setCurrentStep('planning')}
              className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
              style={{ 
                backgroundColor: 'var(--color-sage)',
                color: 'white'
              }}
            >
              Fortsätt till AI-rådgivning →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: AI Planning */}
      {currentStep === 'planning' && (
        <div className="space-y-6">
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-olive-light)' }}>
            <h3 className="font-semibold mb-4 flex items-center space-x-2" style={{ color: 'var(--text-primary)' }}>
              <Apple className="w-5 h-5" />
              <span>Välj grödor för odling</span>
            </h3>
            
            <div className="space-y-3">
              {selectedCrops.map((crop, index) => {
                const cropData = cropNutritionData[crop.cropType];
                if (!cropData) return null;
                
                return (
                  <div key={index} className="p-4 border rounded-lg" style={{ borderColor: 'var(--color-secondary)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">{cropData.icon}</span>
                        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          {cropData.name}
                        </span>
                      </div>
                      <button
                        onClick={() => removeCrop(index)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Ta bort
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>
                          Antal plantor
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={crop.plantCount}
                          onChange={(e) => updateCrop(index, { plantCount: parseInt(e.target.value) || 1 })}
                          className="w-full p-2 text-sm border rounded"
                          style={{ borderColor: 'var(--color-secondary)' }}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>
                          Kvadratmeter
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={crop.squareMeters}
                          onChange={(e) => updateCrop(index, { squareMeters: parseInt(e.target.value) || 1 })}
                          className="w-full p-2 text-sm border rounded"
                          style={{ borderColor: 'var(--color-secondary)' }}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>
                          Skördar/år
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="4"
                          value={crop.harvestsPerYear}
                          onChange={(e) => updateCrop(index, { harvestsPerYear: parseInt(e.target.value) || 1 })}
                          className="w-full p-2 text-sm border rounded"
                          style={{ borderColor: 'var(--color-secondary)' }}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>
                          Svårighet
                        </label>
                        <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {cropData.difficulty === 'beginner' ? 'Nybörjare' : 
                           cropData.difficulty === 'intermediate' ? 'Medel' : 'Expert'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Add Crop Buttons */}
              <div className="p-4 border-2 border-dashed rounded-lg" style={{ borderColor: 'var(--color-secondary)' }}>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(cropNutritionData).map(([cropType, cropData]) => (
                    <button
                      key={cropType}
                      onClick={() => addCrop(cropType)}
                      className="flex items-center space-x-2 px-3 py-2 border rounded-lg hover:shadow-sm transition-all duration-200"
                      style={{ 
                        backgroundColor: 'var(--bg-card)',
                        borderColor: 'var(--color-secondary)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <span>{cropData.icon}</span>
                      <span className="text-sm">{cropData.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={() => setCurrentStep('grocery')}
              className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
              style={{ 
                backgroundColor: 'var(--color-sage)',
                color: 'white'
              }}
            >
              Fortsätt till odlingsplan →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Grocery Gap Analysis */}
      {currentStep === 'grocery' && (
        <div className="space-y-6">
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-olive-light)' }}>
            <h3 className="font-semibold mb-4 flex items-center space-x-2" style={{ color: 'var(--text-primary)' }}>
              <ShoppingCart className="w-5 h-5" />
              <span>Matinköp för att fylla luckan</span>
            </h3>
            
            {stats.groceryGap.length > 0 ? (
              <div className="space-y-3">
                {stats.groceryGap.map((item, index) => (
                  <div key={index} className="p-3 border rounded-lg" style={{ borderColor: 'var(--color-secondary)' }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          {item.name}
                        </div>
                        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {item.calories} kalorier/kg • {item.costPerKg} kr/kg
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {item.priority === 'essential' ? 'Viktigt' : 
                           item.priority === 'important' ? 'Medel' : 'Valfritt'}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          {item.category}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--color-sage)' }} />
                <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Utmärkt självförsörjning!
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Din odling täcker alla näringsbehov. Du behöver inte köpa extra mat.
                </p>
              </div>
            )}

            <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-card)' }}>
              <div className="flex items-center justify-between">
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  Beräknad kostnad för matinköp:
                </span>
                <span className="text-lg font-bold" style={{ color: 'var(--color-sage)' }}>
                  {stats.groceryGap.reduce((sum, item) => sum + item.costPerKg * 2, 0).toLocaleString()} kr/år
                </span>
              </div>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={() => {
                generateCultivationPlan();
                setCurrentStep('timeline');
              }}
              className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
              style={{ 
                backgroundColor: 'var(--color-sage)',
                color: 'white'
              }}
            >
              {loading ? 'Genererar plan...' : 'Generera AI-odlingsplan'}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Timeline */}
      {currentStep === 'timeline' && cultivationPlan && (
        <div className="space-y-6">
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-olive-light)' }}>
            <h3 className="font-semibold mb-4 flex items-center space-x-2" style={{ color: 'var(--text-primary)' }}>
              <Calendar className="w-5 h-5" />
              <span>Min odlingsplan</span>
            </h3>
            
            {/* AI Generated Plan Content */}
            <div className="mb-6">
              <div className="p-4 border rounded-lg mb-4" style={{ borderColor: 'var(--color-sage)' }}>
                <h4 className="font-semibold mb-2 text-lg" style={{ color: 'var(--text-primary)' }}>
                  {cultivationPlan.title}
                </h4>
                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                  {cultivationPlan.description}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 border rounded-lg" style={{ borderColor: 'var(--color-secondary)' }}>
                  <h4 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Planöversikt
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--text-secondary)' }}>Självförsörjning:</span>
                      <span style={{ color: 'var(--text-primary)' }}>{cultivationPlan.selfSufficiencyPercent}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--text-secondary)' }}>Total kalorier:</span>
                      <span style={{ color: 'var(--text-primary)' }}>{cultivationPlan.totalCalories.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--text-secondary)' }}>Beräknad kostnad:</span>
                      <span style={{ color: 'var(--text-primary)' }}>{typeof cultivationPlan.estimatedCost === 'number' ? cultivationPlan.estimatedCost.toLocaleString() : '0'} kr/år</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg" style={{ borderColor: 'var(--color-secondary)' }}>
                  <h4 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Nästa steg
                  </h4>
                  <div className="space-y-2 text-sm">
                    {cultivationPlan.nextSteps && cultivationPlan.nextSteps.length > 0 ? (
                      cultivationPlan.nextSteps.map((step, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4" style={{ color: 'var(--color-sage)' }} />
                          <span style={{ color: 'var(--text-primary)' }}>{step}</span>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4" style={{ color: 'var(--color-sage)' }} />
                          <span style={{ color: 'var(--text-primary)' }}>Beställ frön och jord</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" style={{ color: 'var(--color-khaki)' }} />
                          <span style={{ color: 'var(--text-primary)' }}>Förbered odlingsbäddar</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" style={{ color: 'var(--color-secondary)' }} />
                          <span style={{ color: 'var(--text-primary)' }}>Börja såning i mars</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Timeline */}
              {cultivationPlan.timeline && (
                <div className="p-4 border rounded-lg mb-4" style={{ borderColor: 'var(--color-secondary)' }}>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium flex items-center space-x-2" style={{ color: 'var(--text-primary)' }}>
            <Calendar className="w-5 h-5" />
            <span>Tidslinje</span>
          </h4>
          {(() => {
            // Parse timeline to get items for "Add all" button
            const timelineText = cultivationPlan.timeline;
            const lines = timelineText.split('\n').filter(line => line.trim());
            const timelineItems = lines.map(line => {
              const match = line.match(/^(Januari|Februari|Mars|April|Maj|Juni|Juli|Augusti|September|Oktober|November|December|januari|februari|mars|april|maj|juni|juli|augusti|september|oktober|november|december):\s*(.+)$/);
              if (match) {
                return {
                  period: match[1],
                  description: match[2].trim()
                };
              }
              return {
                period: 'Allmänt',
                description: line.trim()
              };
            }).filter(item => item.description && item.description.length > 3);
            
            if (timelineItems.length > 0) {
              return (
                <button
                  onClick={() => addAllToCalendar(timelineItems)}
                  className="px-3 py-1 text-xs rounded-md transition-colors duration-200 hover:shadow-sm flex items-center space-x-1"
                  style={{ 
                    backgroundColor: 'var(--color-sage)', 
                    color: 'white',
                    border: 'none'
                  }}
                  title={t('ai_cultivation_planner.add_all_to_calendar')}
                >
                  <Calendar className="w-3 h-3" />
                  <span>Lägg till alla</span>
                </button>
              );
            }
            return null;
          })()}
        </div>
                  {/* Debug: log the entire timeline */}
                  {(() => { console.log('Full timeline:', cultivationPlan.timeline); return null; })()}
                  <div className="space-y-3">
                    {(() => {
                      // Parse timeline properly
                      const timelineText = cultivationPlan.timeline;
                      console.log('Processing timeline:', timelineText);
                      
                      // Split by newlines first, then parse each line
                      const lines = timelineText.split('\n').filter(line => line.trim());
                      console.log('Timeline lines:', lines);
                      
                      const timelineItems = lines.map(line => {
                        // Look for pattern "Month: Description"
                        const match = line.match(/^(Januari|Februari|Mars|April|Maj|Juni|Juli|Augusti|September|Oktober|November|December|januari|februari|mars|april|maj|juni|juli|augusti|september|oktober|november|december):\s*(.+)$/);
                        if (match) {
                          return {
                            period: match[1],
                            description: match[2].trim()
                          };
                        }
                        // Fallback: if no colon, treat as description
                        return {
                          period: 'Allmänt',
                          description: line.trim()
                        };
                      }).filter(item => item.description && item.description.length > 3);
                      
                      // If no proper timeline items found, create a fallback
                      if (timelineItems.length === 0) {
                        return [{
                          period: 'Planering',
                          description: 'Kontakta AI-rådgivaren för en personlig odlingsplan'
                        }].map((item, index): JSX.Element => (
                          <div key={index} className="flex items-start space-x-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-olive-light)' }}>
                            <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: 'var(--color-sage)' }} />
                            <div className="flex-1">
                              <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                                {item.period}
                              </div>
                              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                {item.description}
                              </div>
                            </div>
                          </div>
                        ));
                      }
                      
                      console.log('Parsed timeline items:', timelineItems);
                      
                      console.log('Timeline items:', timelineItems);
                      
                      return timelineItems.map((item, index): JSX.Element => {
                        const itemKey = item.period + item.description;
                        const isEditing = editingTimelineItem === itemKey;
                        
                        return (
                          <div key={index} className="flex items-start space-x-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-olive-light)' }}>
                            <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: 'var(--color-sage)' }} />
                            <div className="flex-1">
                              {isEditing ? (
                                // Edit mode
                                <div className="space-y-3">
                                  <input
                                    type="text"
                                    value={editTimelineForm.period}
                                    onChange={(e) => setEditTimelineForm(prev => ({ ...prev, period: e.target.value }))}
                                    className="w-full px-2 py-1 text-sm border rounded"
                                    placeholder="Period (t.ex. Mars)"
                                  />
                                  <textarea
                                    value={editTimelineForm.description}
                                    onChange={(e) => setEditTimelineForm(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full px-2 py-1 text-sm border rounded"
                                    placeholder="Beskrivning"
                                    rows={2}
                                  />
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={saveEditTimeline}
                                      className="px-3 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700"
                                    >
                                      Spara
                                    </button>
                                    <button
                                      onClick={cancelEditTimeline}
                                      className="px-3 py-1 text-xs rounded bg-gray-500 text-white hover:bg-gray-600"
                                    >
                                      Avbryt
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                // View mode
                                <>
                                  <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                                    {item.period}
                                  </div>
                                  {item.description && (
                                    <div className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                                      {item.description}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                            <div className="flex space-x-1">
                              {!isEditing && (
                                <>
                                  <button
                                    onClick={() => startEditTimeline(item)}
                                    className="px-2 py-1 text-xs rounded bg-blue-500 text-white hover:bg-blue-600"
                                    title="Redigera"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={() => addToCalendar(item)}
                                    className="px-3 py-1 text-xs rounded-md transition-colors duration-200 hover:shadow-sm"
                                    style={{ 
                                      backgroundColor: 'var(--color-sage)', 
                                      color: 'white',
                                      border: 'none'
                                    }}
                                    title={t('ai_cultivation_planner.add_to_calendar')}
                                  >
                                    + Kalender
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {cultivationPlan.recommendations && cultivationPlan.recommendations.length > 0 && (
                <div className="p-4 border rounded-lg" style={{ borderColor: 'var(--color-sage)' }}>
                  <h4 className="font-medium mb-3 flex items-center space-x-2" style={{ color: 'var(--text-primary)' }}>
                    <Leaf className="w-5 h-5" />
                    <span>Rekommendationer</span>
                  </h4>
                  <div className="space-y-2">
                    {cultivationPlan.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start space-x-2 text-sm">
                        <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: 'var(--color-sage)' }} />
                        <span style={{ color: 'var(--text-secondary)' }}>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Calendar Items Summary */}
            {calendarItems.length > 0 && (
              <div className="p-4 border rounded-lg mb-4" style={{ borderColor: 'var(--color-sage)' }}>
                <h4 className="font-medium mb-3 flex items-center space-x-2" style={{ color: 'var(--text-primary)' }}>
                  <Calendar className="w-5 h-5" />
                  <span>Lagt till i min odlingskalender ({calendarItems.length} aktiviteter)</span>
                </h4>
                <div className="space-y-2">
                  {calendarItems.map((item, index) => (
                    <div key={item.id} className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: 'var(--bg-olive-light)' }}>
                      <div className="flex-1">
                        <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {item.period}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {item.description}
                        </div>
                      </div>
                      <button
                        onClick={() => setCalendarItems(prev => prev.filter(calItem => calItem.id !== item.id))}
                        className="ml-2 px-2 py-1 text-xs rounded hover:bg-red-100"
                        style={{ color: 'var(--color-secondary)' }}
                        title={t('ai_cultivation_planner.remove_from_calendar')}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Success Notification */}
            {showCalendarSuccess && (
              <div className="fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50" style={{ backgroundColor: 'var(--color-sage)', color: 'white' }}>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5" />
                  <span>
                    {addedItemsCount === 1 ? 'Lagt till i odlingskalender!' : `${addedItemsCount} aktiviteter lagda till i odlingskalender!`}
                  </span>
                </div>
              </div>
            )}

            <div className="text-center">
              <button
                onClick={() => setCurrentStep('nutrition')}
                className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
                style={{ 
                  backgroundColor: 'var(--color-secondary)',
                  color: 'white'
                }}
              >
                Börja om planeringen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center space-x-3 py-8">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{
            borderColor: 'var(--color-sage)'
          }}></div>
          <span style={{ color: 'var(--text-secondary)' }}>
            AI genererar din personliga odlingsplan...
          </span>
        </div>
      )}
    </div>
  );
}
