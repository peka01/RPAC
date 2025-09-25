'use client';

import { useState, useEffect } from 'react';
import { t } from '@/lib/locales';
import { 
  AlertTriangle,
  Clock,
  Zap,
  Shield,
  Heart,
  TrendingUp,
  Home,
  Sun,
  Droplets,
  Thermometer,
  Package,
  Calendar,
  Target,
  CheckCircle,
  ArrowRight,
  Lightbulb
} from 'lucide-react';

interface CrisisCrop {
  id: string;
  name: string;
  icon: string;
  daysToHarvest: number;
  nutritionScore: number; // 1-10
  difficultyLevel: 'easy' | 'medium' | 'hard';
  indoorSuitable: boolean;
  outdoorSuitable: boolean;
  storageWeeks: number;
  seedAvailability: 'easy' | 'medium' | 'hard';
  waterRequirement: 'low' | 'medium' | 'high';
  spaceRequirement: 'small' | 'medium' | 'large';
  calories100g: number;
  keyNutrients: string[];
  sowingInstructions: string[];
  harvestTips: string[];
  crisisAdvantages: string[];
}

const crisisCrops: CrisisCrop[] = [
  {
    id: 'microgreens',
    name: 'Mikrogrön',
    icon: '🌱',
    daysToHarvest: 7,
    nutritionScore: 9,
    difficultyLevel: 'easy',
    indoorSuitable: true,
    outdoorSuitable: false,
    storageWeeks: 1,
    seedAvailability: 'easy',
    waterRequirement: 'medium',
    spaceRequirement: 'small',
    calories100g: 25,
    keyNutrients: ['Vitamin A', 'Vitamin C', 'Folsyra'],
    sowingInstructions: [
      'Använd fina frön som ruccola eller kresse',
      'Så tätt på fuktig bomull eller jord',
      'Täck första dagarna för mörker',
      'Vattna med sprayflasko'
    ],
    harvestTips: [
      'Skär när bladen är 2-3 cm höga',
      'Ät inom 2-3 dagar efter skörd',
      'Skölj försiktigt före konsumtion'
    ],
    crisisAdvantages: [
      'Extremt snabb tillväxt',
      'Minimal utrustning krävs',
      'Hög näringsdensitet',
      'Fungerar inomhus året runt'
    ]
  },
  {
    id: 'radishes',
    name: 'Rädisor',
    icon: '🔴',
    daysToHarvest: 25,
    nutritionScore: 6,
    difficultyLevel: 'easy',
    indoorSuitable: true,
    outdoorSuitable: true,
    storageWeeks: 4,
    seedAvailability: 'easy',
    waterRequirement: 'medium',
    spaceRequirement: 'small',
    calories100g: 16,
    keyNutrients: ['Vitamin C', 'Folsyra', 'Kalium'],
    sowingInstructions: [
      'Så direkt i jord, 1 cm djupt',
      'Håll 2 cm avstånd mellan frön',
      'Vattna jämnt, undvik uttorkning',
      'Fungerar i temperaturer 5-25°C'
    ],
    harvestTips: [
      'Skörda när roten är 2-3 cm i diameter',
      'Dra upp hela plantan',
      'Både rot och blad är ätbara',
      'Skörda innan de blir för stora'
    ],
    crisisAdvantages: [
      'Snabb tillväxt',
      'Hela plantan är ätbar',
      'Växer i kyla',
      'Lätta att lagra'
    ]
  },
  {
    id: 'lettuce',
    name: 'Sallad',
    icon: '🥬',
    daysToHarvest: 30,
    nutritionScore: 5,
    difficultyLevel: 'easy',
    indoorSuitable: true,
    outdoorSuitable: true,
    storageWeeks: 2,
    seedAvailability: 'easy',
    waterRequirement: 'medium',
    spaceRequirement: 'medium',
    calories100g: 15,
    keyNutrients: ['Vitamin A', 'Vitamin K', 'Folsyra'],
    sowingInstructions: [
      'Så ytligt, bara täck lätt med jord',
      'Håll jämn fuktighet',
      'Så nytt var 2:a vecka för kontinuerlig skörd',
      'Föredrar svalare temperaturer'
    ],
    harvestTips: [
      'Skörda ytterbladen först',
      'Låt hjärtat fortsätta växa',
      'Skörda på morgonen för bästa kvalitet',
      'Kan skördas flera gånger'
    ],
    crisisAdvantages: [
      'Kontinuerlig skörd',
      'Lätt att odla',
      'Växer snabbt',
      'Kan odlas året runt inomhus'
    ]
  },
  {
    id: 'spinach',
    name: 'Spenat',
    icon: '🥬',
    daysToHarvest: 40,
    nutritionScore: 9,
    difficultyLevel: 'easy',
    indoorSuitable: true,
    outdoorSuitable: true,
    storageWeeks: 1,
    seedAvailability: 'easy',
    waterRequirement: 'medium',
    spaceRequirement: 'medium',
    calories100g: 23,
    keyNutrients: ['Järn', 'Vitamin K', 'Folsyra', 'Magnesium'],
    sowingInstructions: [
      'Så 1-2 cm djupt',
      'Föredrar sval väderlek',
      'Kan så på hösten för vinterskördar',
      'Så tätt, gallra senare'
    ],
    harvestTips: [
      'Skörda ytterbladen när de är 5-10 cm',
      'Låt mindre blad fortsätta växa',
      'Skörda innan växten börjar skjuta i höjd',
      'Kan ätas både rå och kokt'
    ],
    crisisAdvantages: [
      'Mycket näringsrikt',
      'Tål kyla väl',
      'Hög järnhalt',
      'Mångsidigt i matlagning'
    ]
  },
  {
    id: 'herbs',
    name: 'Kryddörter',
    icon: '🌿',
    daysToHarvest: 21,
    nutritionScore: 7,
    difficultyLevel: 'easy',
    indoorSuitable: true,
    outdoorSuitable: true,
    storageWeeks: 2,
    seedAvailability: 'medium',
    waterRequirement: 'low',
    spaceRequirement: 'small',
    calories100g: 35,
    keyNutrients: ['Vitamin C', 'Antioxidanter', 'Essentiella oljor'],
    sowingInstructions: [
      'Olika djup beroende på sort',
      'Basilika och koriander lätta att odla',
      'Så i små krukor på fönsterbrädan',
      'Klipp regelbundet för ny tillväxt'
    ],
    harvestTips: [
      'Klipp toppen för busigare växt',
      'Skörda på morgonen för bäst smak',
      'Frys eller torka för längre förvaring',
      'Använd direkt för bäst näringsvärde'
    ],
    crisisAdvantages: [
      'Förbättrar smaket på enkel mat',
      'Medicinska egenskaper',
      'Litet utrymme krävs',
      'Kontinuerlig skörd'
    ]
  },
  {
    id: 'sprouts',
    name: 'Groddade bönor',
    icon: '🌱',
    daysToHarvest: 5,
    nutritionScore: 8,
    difficultyLevel: 'easy',
    indoorSuitable: true,
    outdoorSuitable: false,
    storageWeeks: 1,
    seedAvailability: 'medium',
    waterRequirement: 'low',
    spaceRequirement: 'small',
    calories100g: 30,
    keyNutrients: ['Protein', 'Vitamin C', 'Enzym', 'Mineraler'],
    sowingInstructions: [
      'Blötlägg bönor/frön 8-12 timmar',
      'Skölj och lägg i groddburk',
      'Skölj 2 gånger per dag',
      'Håll mörkt första dagarna'
    ],
    harvestTips: [
      'Redo när skotten är 2-5 cm',
      'Skölj väl före konsumtion',
      'Ät inom 3-4 dagar',
      'Kan ätas råa eller lätt stekta'
    ],
    crisisAdvantages: [
      'Snabbast av alla',
      'Inget jord behövs',
      'Högt proteininnehåll',
      'Minimal utrustning'
    ]
  }
];

interface CrisisCultivationProps {
  urgencyLevel?: 'low' | 'medium' | 'high' | 'extreme';
  availableSpace?: 'indoor' | 'outdoor' | 'both';
  timeframe?: number; // days available
}

export function CrisisCultivation({ 
  urgencyLevel = 'medium',
  availableSpace = 'both',
  timeframe = 30 
}: CrisisCultivationProps) {
  const [selectedCrop, setSelectedCrop] = useState<CrisisCrop | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'plan' | 'progress'>('overview');
  const [userPlan, setUserPlan] = useState<{
    selectedCrops: string[];
    startDate: Date;
    targetCalories: number;
  }>({
    selectedCrops: [],
    startDate: new Date(),
    targetCalories: 500 // Daily calories from cultivation
  });

  // Filter crops based on criteria
  const getRecommendedCrops = () => {
    return crisisCrops
      .filter(crop => {
        // Space filter
        if (availableSpace === 'indoor' && !crop.indoorSuitable) return false;
        if (availableSpace === 'outdoor' && !crop.outdoorSuitable) return false;
        
        // Timeframe filter
        if (crop.daysToHarvest > timeframe) return false;
        
        return true;
      })
      .sort((a, b) => {
        // Sort by urgency priority
        if (urgencyLevel === 'extreme') {
          return a.daysToHarvest - b.daysToHarvest; // Fastest first
        } else {
          return (b.nutritionScore * 10 - b.daysToHarvest) - (a.nutritionScore * 10 - a.daysToHarvest);
        }
      });
  };

  const getUrgencyColor = () => {
    switch (urgencyLevel) {
      case 'extreme': return 'var(--color-warm-olive)';
      case 'high': return '#B8860B';
      case 'medium': return 'var(--color-sage)';
      default: return 'var(--color-cool-olive)';
    }
  };

  const getUrgencyMessage = () => {
    switch (urgencyLevel) {
      case 'extreme': return 'Akut situation - fokusera på snabbast möjliga skörd';
      case 'high': return 'Hög prioritet - välj snabbväxande näringsrika grödor';
      case 'medium': return 'Planerad beredskap - balansera tid och näring';
      default: return 'Förebyggande odling - långsiktig planering';
    }
  };

  const calculateOptimalPlan = () => {
    const recommended = getRecommendedCrops().slice(0, 3);
    const totalCaloriesPerDay = recommended.reduce((sum, crop) => {
      const estimatedHarvest = 100; // grams per harvest
      const harvestsPerMonth = Math.floor(30 / crop.daysToHarvest);
      const caloriesPerMonth = (estimatedHarvest * crop.calories100g * harvestsPerMonth) / 30;
      return sum + caloriesPerMonth;
    }, 0);

    return {
      crops: recommended,
      estimatedDailyCalories: Math.round(totalCaloriesPerDay),
      timeToFirstHarvest: Math.min(...recommended.map(c => c.daysToHarvest)),
      sustainabilityScore: Math.round((totalCaloriesPerDay / userPlan.targetCalories) * 100)
    };
  };

  const plan = calculateOptimalPlan();
  const recommendedCrops = getRecommendedCrops();

  // Calculate daily calorie production from recommended crops
  const calculateDailyCalorieProduction = () => {
    const dailyCalories = recommendedCrops.slice(0, 3).reduce((sum, crop) => {
      const estimatedDailyHarvest = 50; // grams per day during harvest period
      const harvestDays = Math.ceil(30 / crop.daysToHarvest); // harvest cycles per month
      const caloriesPerDay = (estimatedDailyHarvest * crop.calories100g / 100) * harvestDays;
      return sum + caloriesPerDay;
    }, 0);
    return Math.round(dailyCalories);
  };

  return (
    <div className="rounded-lg p-6 border shadow-lg" style={{ 
      backgroundColor: 'var(--bg-card)',
      borderColor: getUrgencyColor()
    }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center shadow-sm" style={{ 
            background: `linear-gradient(135deg, ${getUrgencyColor()} 0%, var(--color-secondary) 100%)` 
          }}>
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {t('cultivation.crisis_cultivation')}
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {getUrgencyMessage()}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="text-lg font-bold" style={{ color: getUrgencyColor() }}>
              {plan.timeToFirstHarvest} dagar
            </div>
            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Till första skörd
            </div>
          </div>
          
          <div className={`px-3 py-1 rounded-full text-xs font-semibold`} style={{
            backgroundColor: `${getUrgencyColor()}20`,
            color: getUrgencyColor()
          }}>
            {urgencyLevel.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-olive-light)' }}>
          <div className="flex items-center space-x-2 mb-1">
            <Zap className="w-4 h-4" style={{ color: getUrgencyColor() }} />
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Snabbaste</span>
          </div>
          <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            {Math.min(...recommendedCrops.map(c => c.daysToHarvest))} dagar
          </div>
        </div>

        <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-olive-light)' }}>
          <div className="flex items-center space-x-2 mb-1">
            <Heart className="w-4 h-4" style={{ color: 'var(--color-sage)' }} />
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Näring</span>
          </div>
          <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            {Math.max(...recommendedCrops.map(c => c.nutritionScore))}/10
          </div>
        </div>

        <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-olive-light)' }}>
          <div className="flex items-center space-x-2 mb-1">
            <Home className="w-4 h-4" style={{ color: 'var(--color-cool-olive)' }} />
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Inomhus</span>
          </div>
          <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            {recommendedCrops.filter(c => c.indoorSuitable).length}
          </div>
        </div>

        <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-olive-light)' }}>
          <div className="flex items-center space-x-2 mb-1">
            <Target className="w-4 h-4" style={{ color: 'var(--color-khaki)' }} />
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Kalorier/dag</span>
          </div>
          <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            {plan.estimatedDailyCalories}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 mb-6 p-1 rounded-lg" style={{ backgroundColor: 'var(--bg-olive-light)' }}>
        {[
          { id: 'overview', icon: AlertTriangle, label: 'Översikt' },
          { id: 'plan', icon: Calendar, label: 'Plan' },
          { id: 'progress', icon: TrendingUp, label: 'Framsteg' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
              activeTab === tab.id ? 'shadow-sm' : 'hover:shadow-sm'
            }`}
            style={{
              backgroundColor: activeTab === tab.id ? 'var(--bg-card)' : 'transparent',
              color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)'
            }}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendedCrops.slice(0, 6).map(crop => (
              <div
                key={crop.id}
                className="p-4 rounded-lg border cursor-pointer hover:shadow-md transition-all duration-200"
                style={{ 
                  backgroundColor: 'var(--bg-card)',
                  borderColor: selectedCrop?.id === crop.id ? getUrgencyColor() : 'var(--color-secondary)'
                }}
                onClick={() => setSelectedCrop(selectedCrop?.id === crop.id ? null : crop)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{crop.icon}</span>
                    <div>
                      <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                        {crop.name}
                      </h3>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {crop.difficultyLevel === 'easy' ? 'Lätt' : 
                         crop.difficultyLevel === 'medium' ? 'Medel' : 'Svår'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-bold" style={{ color: getUrgencyColor() }}>
                      {crop.daysToHarvest}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      dagar
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex space-x-2">
                    {crop.indoorSuitable && (
                      <div className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs" style={{
                        backgroundColor: 'rgba(135, 169, 107, 0.1)',
                        color: 'var(--color-sage)'
                      }}>
                        <Home className="w-3 h-3" />
                        <span>Inomhus</span>
                      </div>
                    )}
                    
                    {crop.nutritionScore >= 8 && (
                      <div className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs" style={{
                        backgroundColor: 'rgba(184, 134, 11, 0.1)',
                        color: 'var(--color-khaki)'
                      }}>
                        <Heart className="w-3 h-3" />
                        <span>Näringsrik</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedCrop?.id === crop.id && (
                  <div className="mt-4 pt-4 border-t space-y-3" style={{ borderColor: 'var(--color-secondary)' }}>
                    <div>
                      <h4 className="font-semibold text-xs mb-2" style={{ color: 'var(--text-primary)' }}>
                        Krisfördelar:
                      </h4>
                      <ul className="space-y-1">
                        {crop.crisisAdvantages.slice(0, 2).map((advantage, i) => (
                          <li key={i} className="text-xs flex items-start space-x-1">
                            <span style={{ color: getUrgencyColor() }}>•</span>
                            <span style={{ color: 'var(--text-secondary)' }}>{advantage}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span style={{ color: 'var(--text-tertiary)' }}>Kalorier:</span>
                        <span className="ml-1" style={{ color: 'var(--text-secondary)' }}>
                          {crop.calories100g}/100g
                        </span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-tertiary)' }}>Lagring:</span>
                        <span className="ml-1" style={{ color: 'var(--text-secondary)' }}>
                          {crop.storageWeeks} veckor
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Emergency Growing Tips */}
          <div className="p-4 rounded-lg border" style={{ 
            backgroundColor: `${getUrgencyColor()}10`,
            borderColor: getUrgencyColor()
          }}>
            <div className="flex items-center space-x-2 mb-3">
              <Lightbulb className="w-5 h-5" style={{ color: getUrgencyColor() }} />
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                Krisodlingstips
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Minimal utrustning:
                </h4>
                <ul className="space-y-1 text-xs">
                  <li style={{ color: 'var(--text-secondary)' }}>• Plastlådor eller gamla yoghurtburkar</li>
                  <li style={{ color: 'var(--text-secondary)' }}>• Vanlig potatisjord från affären</li>
                  <li style={{ color: 'var(--text-secondary)' }}>• Sprayflasko för vattning</li>
                  <li style={{ color: 'var(--text-secondary)' }}>• Plastfolie för att skapa växthuseffekt</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Maximera näringsutbytet:
                </h4>
                <ul className="space-y-1 text-xs">
                  <li style={{ color: 'var(--text-secondary)' }}>• Ät hela växten när möjligt (blad + rötter)</li>
                  <li style={{ color: 'var(--text-secondary)' }}>• Kombinera med sprouting för protein</li>
                  <li style={{ color: 'var(--text-secondary)' }}>• Successiv såning för kontinuerlig skörd</li>
                  <li style={{ color: 'var(--text-secondary)' }}>• Spara frön för framtida odling</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plan Tab */}
      {activeTab === 'plan' && (
        <div className="space-y-6">
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-olive-light)' }}>
            <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Optimal krisodlingsplan för {timeframe} dagar
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plan.crops.map((crop, index) => (
                <div key={crop.id} className="p-3 rounded-lg border" style={{ 
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--color-secondary)'
                }}>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-xl">{crop.icon}</span>
                    <div>
                      <h4 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                        {crop.name}
                      </h4>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        Prioritet {index + 1}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--text-tertiary)' }}>Skörd:</span>
                      <span style={{ color: 'var(--text-primary)' }}>
                        {crop.daysToHarvest} dagar
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--text-tertiary)' }}>Näringsvärde:</span>
                      <span style={{ color: 'var(--text-primary)' }}>
                        {crop.nutritionScore}/10
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--text-tertiary)' }}>Platskrav:</span>
                      <span style={{ color: 'var(--text-primary)' }}>
                        {crop.spaceRequirement === 'small' ? 'Litet' :
                         crop.spaceRequirement === 'medium' ? 'Medel' : 'Stort'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-secondary)' }}>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-3 h-3" style={{ color: 'var(--color-sage)' }} />
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {crop.crisisAdvantages[0]}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 rounded-lg border" style={{ 
              backgroundColor: 'var(--bg-card)',
              borderColor: getUrgencyColor()
            }}>
              <h4 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                Tidsplan för de närmaste {timeframe} dagarna
              </h4>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" 
                       style={{ backgroundColor: getUrgencyColor() }}>
                    1
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                      Idag: Starta mikrogrön och groddning
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Första skörden på 5-7 dagar
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" 
                       style={{ backgroundColor: 'var(--color-sage)', color: 'white' }}>
                    2
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                      Dag 3: Så rädisor och sallad
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Skörd efter 25-30 dagar
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" 
                       style={{ backgroundColor: 'var(--color-cool-olive)', color: 'white' }}>
                    3
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                      Dag 7: Första mikrogrön-skörd
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Starta ny omgång direkt
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Tab */}
      {activeTab === 'progress' && (
        <div className="space-y-6">
          <div className="text-center py-8">
            <Package className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--color-secondary)' }} />
            <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Uppföljning kommer snart
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Här kommer du kunna följa dina odlingars framsteg och logga skördar.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
