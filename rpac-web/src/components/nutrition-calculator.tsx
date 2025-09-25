'use client';

import { useState, useEffect } from 'react';
import { t } from '@/lib/locales';
import { 
  Calculator,
  Users,
  Target,
  AlertTriangle,
  CheckCircle,
  BarChart,
  Scale,
  Apple,
  Zap
} from 'lucide-react';

interface NutritionalData {
  calories: number;
  protein: number; // grams per 100g
  carbohydrates: number;
  fat: number;
  fiber: number;
  vitamins: {
    A?: number; // IU
    C?: number; // mg
    K?: number; // mcg
    folate?: number; // mcg
  };
  minerals: {
    iron?: number; // mg
    calcium?: number; // mg
    potassium?: number; // mg
    magnesium?: number; // mg
  };
}

interface CropData {
  name: string;
  icon: string;
  nutrition: NutritionalData;
  harvestWeightPer100Plants: number; // kg per 100 plants
  storageWeeks: number;
  calorieDensity: 'low' | 'medium' | 'high';
  crisisPriority: 'low' | 'medium' | 'high';
}

const cropNutritionData: Record<string, CropData> = {
  potatoes: {
    name: 'cultivation.plants.potatoes',
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
    harvestWeightPer100Plants: 150, // 1.5kg per plant
    storageWeeks: 24,
    calorieDensity: 'medium',
    crisisPriority: 'high'
  },
  carrots: {
    name: 'cultivation.plants.carrots',
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
    harvestWeightPer100Plants: 80, // 800g per plant
    storageWeeks: 16,
    calorieDensity: 'low',
    crisisPriority: 'medium'
  },
  cabbage: {
    name: 'cultivation.plants.cabbage',
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
    harvestWeightPer100Plants: 120, // 1.2kg per plant
    storageWeeks: 12,
    calorieDensity: 'low',
    crisisPriority: 'medium'
  },
  kale: {
    name: 'cultivation.plants.kale',
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
    crisisPriority: 'high'
  },
  spinach: {
    name: 'cultivation.plants.spinach',
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
    crisisPriority: 'high'
  },
  lettuce: {
    name: 'cultivation.plants.lettuce',
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
    crisisPriority: 'low'
  },
  beets: {
    name: 'cultivation.plants.beets',
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
    crisisPriority: 'medium'
  }
};

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
}

interface NutritionCalculatorProps {
  gardenSize?: 'small' | 'medium' | 'large';
  plantedCrops?: PlantedCrop[];
  onCalculationChange?: (data: any) => void;
}

export function NutritionCalculator({ 
  gardenSize = 'medium',
  plantedCrops = [],
  onCalculationChange 
}: NutritionCalculatorProps) {
  const [household, setHousehold] = useState<HouseholdProfile>({
    adults: 2,
    children: 1,
    elderly: 0,
    activityLevel: 'moderate'
  });

  const [selectedCrops, setSelectedCrops] = useState<PlantedCrop[]>([
    { cropType: 'potatoes', plantCount: 20, harvestsPerYear: 1 },
    { cropType: 'carrots', plantCount: 30, harvestsPerYear: 2 },
    { cropType: 'cabbage', plantCount: 15, harvestsPerYear: 1 },
    { cropType: 'kale', plantCount: 10, harvestsPerYear: 3 }
  ]);

  const [viewMode, setViewMode] = useState<'calculator' | 'analysis' | 'planning'>('calculator');

  // Calculate daily calorie needs based on household
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
    
    // Simplified calculation - assumes mixed gender
    const adultCalories = household.adults * ((baseCaloricNeeds.adult_male + baseCaloricNeeds.adult_female) / 2) * multiplier;
    const childCalories = household.children * baseCaloricNeeds.child * multiplier;
    const elderlyCalories = household.elderly * baseCaloricNeeds.elderly * multiplier;

    return Math.round(adultCalories + childCalories + elderlyCalories);
  };

  // Calculate annual production from garden
  const calculateAnnualProduction = () => {
    let totalCalories = 0;
    let totalWeight = 0;
    const nutritionTotals = {
      protein: 0,
      carbohydrates: 0,
      fat: 0,
      fiber: 0
    };

    selectedCrops.forEach(crop => {
      const cropData = cropNutritionData[crop.cropType];
      if (!cropData) return;

      const annualHarvestWeight = (crop.plantCount / 100) * cropData.harvestWeightPer100Plants * crop.harvestsPerYear;
      const annualCalories = (annualHarvestWeight * 1000) * (cropData.nutrition.calories / 100);

      totalCalories += annualCalories;
      totalWeight += annualHarvestWeight;
      
      // Calculate nutritional contributions
      const weightGrams = annualHarvestWeight * 1000;
      nutritionTotals.protein += (weightGrams / 100) * cropData.nutrition.protein;
      nutritionTotals.carbohydrates += (weightGrams / 100) * cropData.nutrition.carbohydrates;
      nutritionTotals.fat += (weightGrams / 100) * cropData.nutrition.fat;
      nutritionTotals.fiber += (weightGrams / 100) * cropData.nutrition.fiber;
    });

    return {
      totalCalories: Math.round(totalCalories),
      totalWeight: Math.round(totalWeight),
      dailyCalories: Math.round(totalCalories / 365),
      nutritionTotals
    };
  };

  // Calculate self-sufficiency metrics
  const calculateSelfSufficiency = () => {
    const dailyNeeds = calculateDailyCalorieNeeds();
    const production = calculateAnnualProduction();
    
    const selfSufficiencyPercent = Math.round((production.dailyCalories / dailyNeeds) * 100);
    const daysOfFood = Math.round(production.totalCalories / dailyNeeds);
    const deficit = dailyNeeds - production.dailyCalories;

    return {
      dailyNeeds,
      dailyProduction: production.dailyCalories,
      selfSufficiencyPercent,
      daysOfFood,
      deficit: deficit > 0 ? deficit : 0,
      surplus: deficit < 0 ? Math.abs(deficit) : 0,
      totalProduction: production
    };
  };

  const addCrop = (cropType: string) => {
    const defaultPlantCount = gardenSize === 'small' ? 5 : gardenSize === 'large' ? 30 : 15;
    setSelectedCrops(prev => [
      ...prev,
      { cropType, plantCount: defaultPlantCount, harvestsPerYear: 1 }
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

  // Notify parent component of changes
  useEffect(() => {
    onCalculationChange?.(stats);
  }, [stats, onCalculationChange]);

  const getSufficiencyColor = (percent: number) => {
    if (percent >= 80) return 'var(--color-sage)';
    if (percent >= 50) return 'var(--color-khaki)';
    return 'var(--color-warm-olive)';
  };

  const getSufficiencyIcon = (percent: number) => {
    if (percent >= 80) return CheckCircle;
    if (percent >= 50) return Target;
    return AlertTriangle;
  };

  return (
    <div className="rounded-lg p-6 border shadow-lg" style={{ 
      backgroundColor: 'var(--bg-card)',
      borderColor: 'var(--color-sage)'
    }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center shadow-sm" style={{ 
            background: 'linear-gradient(135deg, var(--color-sage) 0%, var(--color-secondary) 100%)' 
          }}>
            <Calculator className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {t('nutrition.calculator')}
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Beräkna kalorier och självförsörjning från din trädgård
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-right">
          <div>
            <div className="text-2xl font-bold" style={{ color: getSufficiencyColor(stats.selfSufficiencyPercent) }}>
              {stats.selfSufficiencyPercent}%
            </div>
            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {t('nutrition.self_sufficiency')}
            </div>
          </div>
          {(() => {
            const SufficiencyIcon = getSufficiencyIcon(stats.selfSufficiencyPercent);
            return <SufficiencyIcon className="w-6 h-6" style={{ color: getSufficiencyColor(stats.selfSufficiencyPercent) }} />;
          })()}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 mb-6 p-1 rounded-lg" style={{ backgroundColor: 'var(--bg-olive-light)' }}>
        {[
          { id: 'calculator', icon: Calculator, label: 'Kalkylator' },
          { id: 'analysis', icon: BarChart, label: 'Analys' },
          { id: 'planning', icon: Target, label: 'Planering' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setViewMode(tab.id as any)}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
              viewMode === tab.id ? 'shadow-sm' : 'hover:shadow-sm'
            }`}
            style={{
              backgroundColor: viewMode === tab.id ? 'var(--bg-card)' : 'transparent',
              color: viewMode === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)'
            }}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Calculator View */}
      {viewMode === 'calculator' && (
        <div className="space-y-6">
          {/* Household Configuration */}
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-olive-light)' }}>
            <h3 className="font-semibold mb-4 flex items-center space-x-2" style={{ color: 'var(--text-primary)' }}>
              <Users className="w-5 h-5" />
              <span>{t('nutrition.household_size')}</span>
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  {t('nutrition.age_groups.adults')}
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
                  {t('nutrition.age_groups.children')}
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
                  {t('nutrition.age_groups.elderly')}
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
                  <option value="sedentary">{t('nutrition.activity_level.sedentary')}</option>
                  <option value="light">{t('nutrition.activity_level.light')}</option>
                  <option value="moderate">{t('nutrition.activity_level.moderate')}</option>
                  <option value="active">{t('nutrition.activity_level.active')}</option>
                  <option value="very_active">{t('nutrition.activity_level.very_active')}</option>
                </select>
              </div>
            </div>
            
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              <strong>{t('nutrition.daily_needs')}:</strong> {stats.dailyNeeds.toLocaleString()} {t('nutrition.calories_per_day')}
            </div>
          </div>

          {/* Crop Configuration */}
          <div>
            <h3 className="font-semibold mb-4 flex items-center space-x-2" style={{ color: 'var(--text-primary)' }}>
              <Apple className="w-5 h-5" />
              <span>{t('nutrition.garden_production')}</span>
            </h3>
            
            <div className="space-y-3">
              {selectedCrops.map((crop, index) => {
                const cropData = cropNutritionData[crop.cropType];
                if (!cropData) return null;
                
                const annualWeight = (crop.plantCount / 100) * cropData.harvestWeightPer100Plants * crop.harvestsPerYear;
                const annualCalories = (annualWeight * 1000) * (cropData.nutrition.calories / 100);
                
                return (
                  <div key={index} className="p-4 border rounded-lg" style={{ borderColor: 'var(--color-secondary)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">{cropData.icon}</span>
                        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          {t(cropData.name)}
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
                          Årlig skörd
                        </label>
                        <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {annualWeight.toFixed(1)} kg
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>
                          Årliga kalorier
                        </label>
                        <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {Math.round(annualCalories).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Add Crop Button */}
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
                      <span className="text-sm">{t(cropData.name)}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analysis View */}
      {viewMode === 'analysis' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-olive-light)' }}>
              <div className="flex items-center space-x-2 mb-2">
                <Target className="w-5 h-5" style={{ color: 'var(--color-sage)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {t('nutrition.daily_needs')}
                </span>
              </div>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-sage)' }}>
                {stats.dailyNeeds.toLocaleString()}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {t('nutrition.calories_per_day')}
              </div>
            </div>

            <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-olive-light)' }}>
              <div className="flex items-center space-x-2 mb-2">
                <Zap className="w-5 h-5" style={{ color: 'var(--color-khaki)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {t('nutrition.production')}
                </span>
              </div>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-khaki)' }}>
                {stats.dailyProduction.toLocaleString()}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {t('nutrition.calories_per_day')}
              </div>
            </div>

            <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-olive-light)' }}>
              <div className="flex items-center space-x-2 mb-2">
                <Scale className="w-5 h-5" style={{ color: getSufficiencyColor(stats.selfSufficiencyPercent) }} />
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {t('nutrition.food_security')}
                </span>
              </div>
              <div className="text-2xl font-bold" style={{ color: getSufficiencyColor(stats.selfSufficiencyPercent) }}>
                {stats.daysOfFood}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {t('nutrition.days_of_food')}
              </div>
            </div>
          </div>

          {/* Nutritional Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-4 border rounded-lg" style={{ borderColor: 'var(--color-secondary)' }}>
              <h4 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                {t('nutrition.nutritional_balance')}
              </h4>
              
              <div className="space-y-3">
                {Object.entries(stats.totalProduction.nutritionTotals).map(([nutrient, value]) => (
                  <div key={nutrient} className="flex justify-between items-center">
                    <span className="text-sm capitalize" style={{ color: 'var(--text-secondary)' }}>
                      {t(`nutrition.${nutrient}`)}
                    </span>
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {value.toFixed(1)}g/år
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border rounded-lg" style={{ borderColor: 'var(--color-secondary)' }}>
              <h4 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Odlingseffektivitet
              </h4>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Total skördevikt:
                  </span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {stats.totalProduction.totalWeight} kg/år
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Kalorier per kg:
                  </span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {Math.round(stats.totalProduction.totalCalories / stats.totalProduction.totalWeight)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Månader av mat:
                  </span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {(stats.daysOfFood / 30).toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Planning View */}
      {viewMode === 'planning' && (
        <div className="space-y-6">
          <div className="text-center py-8">
            <Target className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--color-secondary)' }} />
            <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Odlingsplanering kommer snart
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Här kommer du kunna planera optimal odling för självförsörjning.
            </p>
          </div>
        </div>
      )}

      {/* Status Footer */}
      <div className="mt-6 p-4 rounded-lg" style={{ 
        backgroundColor: stats.selfSufficiencyPercent >= 50 ? 'rgba(135, 169, 107, 0.1)' : 'rgba(184, 134, 11, 0.1)',
        borderColor: getSufficiencyColor(stats.selfSufficiencyPercent),
        border: '1px solid'
      }}>
        <div className="flex items-center space-x-3">
          {(() => {
            const StatusIcon = getSufficiencyIcon(stats.selfSufficiencyPercent);
            return <StatusIcon className="w-5 h-5" style={{ color: getSufficiencyColor(stats.selfSufficiencyPercent) }} />;
          })()}
          <div className="flex-1">
            <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
              {stats.selfSufficiencyPercent >= 80 ? 'Utmärkt självförsörjning!' :
               stats.selfSufficiencyPercent >= 50 ? 'God självförsörjning' :
               'Begränsad självförsörjning'}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {stats.deficit > 0 ? 
                `Underskott: ${stats.deficit.toLocaleString()} kalorier/dag` :
                `Överskott: ${stats.surplus.toLocaleString()} kalorier/dag`
              }
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold" style={{ color: getSufficiencyColor(stats.selfSufficiencyPercent) }}>
              {stats.selfSufficiencyPercent}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
