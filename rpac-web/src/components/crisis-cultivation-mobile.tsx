'use client';

import { useState, useEffect } from 'react';
import { 
  AlertTriangle,
  Clock,
  Zap,
  Shield,
  CheckCircle,
  Droplets,
  Sun,
  Home as HomeIcon,
  Package,
  Calendar,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Flame,
  Leaf
} from 'lucide-react';

interface CrisisCrop {
  id: string;
  name: string;
  icon: string;
  daysToHarvest: number;
  nutritionScore: number;
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
      'Bladen är också ätbara',
      'Förvara kallt för längre hållbarhet'
    ],
    crisisAdvantages: [
      'Snabb skörd',
      'Fungerar i låga temperaturer',
      'Lätt att lyckas med',
      'Hela växten är ätbar'
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
    keyNutrients: ['Vitamin A', 'Folsyra', 'Vitamin K'],
    sowingInstructions: [
      'Så grunt, frön behöver ljus',
      'Håll jorden fuktig men inte blöt',
      'Platsbehov: 15-20 cm mellan plantor',
      'Trivs bäst i svalare temperaturer'
    ],
    harvestTips: [
      'Plocka ytterblad löpande',
      'Skörda hel planta när full',
      'Ät färskt för bäst smak'
    ],
    crisisAdvantages: [
      'Ger kontinuerlig skörd',
      'Liten insats krävs',
      'Växer inomhus',
      'Lågt vattenbehov'
    ]
  },
  {
    id: 'potatoes',
    name: 'Potatis',
    icon: '🥔',
    daysToHarvest: 90,
    nutritionScore: 8,
    difficultyLevel: 'easy',
    indoorSuitable: false,
    outdoorSuitable: true,
    storageWeeks: 26,
    seedAvailability: 'easy',
    waterRequirement: 'medium',
    spaceRequirement: 'large',
    calories100g: 77,
    keyNutrients: ['Vitamin C', 'Vitamin B6', 'Kalium', 'Fiber'],
    sowingInstructions: [
      'Använd sättpotatiser med groddögon',
      'Plantera 10 cm djupt',
      'Kupa jorden runt plantan',
      'Vattna regelbundet under tillväxt'
    ],
    harvestTips: [
      'Skörda när blasten vissnat',
      'Låt torka någon timme efter upptagning',
      'Förvara mörkt och svalt'
    ],
    crisisAdvantages: [
      'Extremt hög energiproduktion',
      'Utmärkt lagringsgröda',
      'Mättar länge',
      'Många användningssätt'
    ]
  },
  {
    id: 'beans',
    name: 'Bönor',
    icon: '🫘',
    daysToHarvest: 60,
    nutritionScore: 9,
    difficultyLevel: 'medium',
    indoorSuitable: false,
    outdoorSuitable: true,
    storageWeeks: 52,
    seedAvailability: 'easy',
    waterRequirement: 'medium',
    spaceRequirement: 'medium',
    calories100g: 347,
    keyNutrients: ['Protein', 'Fiber', 'Järn', 'Folsyra'],
    sowingInstructions: [
      'Så direkt efter sista frosten',
      '3-5 cm djupt',
      'Buschbönor eller klätterbönor',
      'Behöver ej förgroddas'
    ],
    harvestTips: [
      'Färska: Plocka innan bönorna svällt',
      'Torra: Låt torka på plantan',
      'Lagra torra bönor i tät behållare'
    ],
    crisisAdvantages: [
      'Hög proteinförsörjning',
      'Lång lagringstid',
      'Fixerar kväve i jorden',
      'Flerårig proteinresa'
    ]
  },
  {
    id: 'kale',
    name: 'Grönkål',
    icon: '🥬',
    daysToHarvest: 60,
    nutritionScore: 10,
    difficultyLevel: 'easy',
    indoorSuitable: false,
    outdoorSuitable: true,
    storageWeeks: 3,
    seedAvailability: 'easy',
    waterRequirement: 'medium',
    spaceRequirement: 'medium',
    calories100g: 35,
    keyNutrients: ['Vitamin A', 'Vitamin C', 'Vitamin K', 'Kalcium'],
    sowingInstructions: [
      'Så direkt i jord vår eller sommar',
      '1 cm djupt',
      '30 cm mellan plantor',
      'Tål frost väl'
    ],
    harvestTips: [
      'Plocka nedre blad först',
      'Blir sötare efter frost',
      'Ger skörd till vintern'
    ],
    crisisAdvantages: [
      'Extremt näringsrik',
      'Tål frost och kyla',
      'Lång skördeperiod',
      'Lätt att odla'
    ]
  }
];

interface CrisisCultivationMobileProps {
  user: { id: string };
}

export function CrisisCultivationMobile({ user }: CrisisCultivationMobileProps) {
  const [urgencyLevel, setUrgencyLevel] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [timeframe, setTimeframe] = useState(30);
  const [location, setLocation] = useState<'indoor' | 'outdoor' | 'both'>('both');
  const [plan, setPlan] = useState<{ crops: CrisisCrop[]; timeline: string[] } | null>(null);
  const [selectedCrop, setSelectedCrop] = useState<CrisisCrop | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [step, setStep] = useState<'setup' | 'plan' | 'details'>('setup');

  const getUrgencyColor = () => {
    switch (urgencyLevel) {
      case 'low':
        return '#10B981';
      case 'medium':
        return '#F59E0B';
      case 'high':
        return '#EF4444';
      case 'critical':
        return '#7F1D1D';
      default:
        return '#F59E0B';
    }
  };

  const getUrgencyLabel = () => {
    switch (urgencyLevel) {
      case 'low':
        return 'Låg brådska';
      case 'medium':
        return 'Medel brådska';
      case 'high':
        return 'Hög brådska';
      case 'critical':
        return 'Kritisk situation';
    }
  };

  const generatePlan = () => {
    let filteredCrops = crisisCrops.filter(crop => {
      if (location === 'indoor') return crop.indoorSuitable;
      if (location === 'outdoor') return crop.outdoorSuitable;
      return true;
    });

    // Sort by urgency priorities
    filteredCrops.sort((a, b) => {
      if (urgencyLevel === 'critical' || urgencyLevel === 'high') {
        return a.daysToHarvest - b.daysToHarvest;
      }
      return b.nutritionScore - a.nutritionScore;
    });

    // Take top crops based on urgency
    const cropsCount = urgencyLevel === 'critical' ? 3 : urgencyLevel === 'high' ? 4 : 6;
    const selectedCrops = filteredCrops.slice(0, cropsCount);

    setPlan({
      crops: selectedCrops,
      timeline: [
        'Idag: Starta mikrogrön och groddning',
        'Dag 3: Så rädisor och sallad',
        'Dag 7: Första mikrogrön-skörd',
        `Dag ${timeframe}: Planens slut - utvärdera`
      ]
    });

    setStep('plan');
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'easy':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'medium':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'hard':
        return 'bg-red-100 text-red-700 border-red-200';
    }
  };

  const getDifficultyLabel = (level: string) => {
    switch (level) {
      case 'easy':
        return 'Lätt';
      case 'medium':
        return 'Medel';
      case 'hard':
        return 'Svår';
    }
  };

  // Setup Step
  if (step === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50/50 to-orange-50/50 pb-32">
        {/* Hero Header */}
        <div className="bg-gradient-to-br from-[#8B4513] to-[#A0522D] text-white px-6 py-8 rounded-b-3xl shadow-2xl mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <AlertTriangle size={32} className="text-white" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-1">Krisodling</h1>
              <p className="text-white/80 text-sm">Snabb matproduktion vid behov</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
              <div className="text-2xl font-bold mb-1">7</div>
              <div className="text-white/80 text-xs">Dagar till mat</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
              <div className="text-2xl font-bold mb-1">90%</div>
              <div className="text-white/80 text-xs">Framgång</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
              <div className="text-2xl font-bold mb-1">6</div>
              <div className="text-white/80 text-xs">Grödor</div>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="px-6 space-y-4">
          {/* Urgency Level */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <Flame size={24} className="text-orange-500" strokeWidth={2.5} />
              <div>
                <h3 className="font-bold text-lg text-gray-900">Brå human Nivå</h3>
                <p className="text-sm text-gray-600">Hur snabbt behöver du mat?</p>
              </div>
            </div>

            <div className="space-y-2">
              {(['low', 'medium', 'high', 'critical'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setUrgencyLevel(level)}
                  className={`w-full p-4 rounded-xl border-2 transition-all touch-manipulation active:scale-98 text-left ${
                    urgencyLevel === level
                      ? 'border-[#8B4513] bg-[#8B4513]/10'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-gray-900 mb-1">
                        {level === 'low' && 'Låg brådska'}
                        {level === 'medium' && 'Medel brådska'}
                        {level === 'high' && 'Hög brådska'}
                        {level === 'critical' && 'Kritisk situation'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {level === 'low' && 'Planera för framtiden'}
                        {level === 'medium' && 'Starta inom en vecka'}
                        {level === 'high' && 'Börja idag'}
                        {level === 'critical' && 'Akut behov av mat'}
                      </div>
                    </div>
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor:
                          level === 'low'
                            ? '#10B981'
                            : level === 'medium'
                            ? '#F59E0B'
                            : level === 'high'
                            ? '#EF4444'
                            : '#7F1D1D'
                      }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Timeframe */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <Clock size={24} className="text-[#3D4A2B]" strokeWidth={2.5} />
              <div>
                <h3 className="font-bold text-lg text-gray-900">Tidsram</h3>
                <p className="text-sm text-gray-600">Hur lång period planerar du för?</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="14"
                  max="90"
                  step="7"
                  value={timeframe}
                  onChange={(e) => setTimeframe(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#3D4A2B]"
                />
                <div className="w-20 text-right">
                  <span className="text-2xl font-bold text-[#3D4A2B]">{timeframe}</span>
                  <span className="text-sm text-gray-600 ml-1">dagar</span>
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <HomeIcon size={24} className="text-[#3D4A2B]" strokeWidth={2.5} />
              <div>
                <h3 className="font-bold text-lg text-gray-900">Odlingsplats</h3>
                <p className="text-sm text-gray-600">Var ska du odla?</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {(['indoor', 'outdoor', 'both'] as const).map((loc) => (
                <button
                  key={loc}
                  onClick={() => setLocation(loc)}
                  className={`p-4 rounded-xl border-2 transition-all touch-manipulation active:scale-98 ${
                    location === loc
                      ? 'border-[#3D4A2B] bg-[#3D4A2B]/10'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-2">
                    {loc === 'indoor' && '🏠'}
                    {loc === 'outdoor' && '🌳'}
                    {loc === 'both' && '🏡'}
                  </div>
                  <div className="text-sm font-bold text-gray-900">
                    {loc === 'indoor' && 'Inomhus'}
                    {loc === 'outdoor' && 'Utomhus'}
                    {loc === 'both' && 'Båda'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="fixed bottom-16 left-0 right-0 px-6">
          <button
            onClick={generatePlan}
            className="w-full bg-gradient-to-r from-[#8B4513] to-[#A0522D] text-white py-5 px-6 rounded-2xl font-bold text-lg hover:shadow-2xl transition-all touch-manipulation active:scale-98 flex items-center justify-center gap-3"
          >
            <Zap size={24} strokeWidth={2.5} />
            Skapa Krisplan
          </button>
        </div>
      </div>
    );
  }

  // Plan Step
  if (step === 'plan' && plan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50/50 to-orange-50/50 pb-32">
        {/* Header with Urgency */}
        <div
          className="text-white px-6 py-6 rounded-b-3xl shadow-2xl mb-6"
          style={{ background: `linear-gradient(135deg, ${getUrgencyColor()} 0%, ${getUrgencyColor()}CC 100%)` }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep('setup')}
                className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-all active:scale-95 touch-manipulation"
              >
                <ChevronDown size={20} className="rotate-90" strokeWidth={2.5} />
              </button>
              <div>
                <h2 className="text-xl font-bold">Din Krisplan</h2>
                <p className="text-white/80 text-sm">{getUrgencyLabel()}</p>
              </div>
            </div>
            <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full">
              <span className="font-bold">{timeframe} dagar</span>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="px-6 mb-6">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <Calendar size={24} className="text-[#3D4A2B]" strokeWidth={2.5} />
              <h3 className="font-bold text-lg text-gray-900">Tidsplan</h3>
            </div>
            <div className="space-y-3">
              {plan.timeline.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ backgroundColor: getUrgencyColor() }}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-sm font-medium text-gray-900">{item}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recommended Crops */}
        <div className="px-6">
          <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
            <Leaf size={24} className="text-[#3D4A2B]" strokeWidth={2.5} />
            Rekommenderade Grödor
          </h3>
          <div className="space-y-3">
            {plan.crops.map((crop, index) => (
              <button
                key={crop.id}
                onClick={() => {
                  setSelectedCrop(crop);
                  setStep('details');
                }}
                className="w-full bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all touch-manipulation active:scale-98 text-left border-2 border-transparent hover:border-[#3D4A2B]/30"
              >
                <div className="flex items-start gap-4">
                  {/* Priority Badge */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ backgroundColor: `${getUrgencyColor()}20` }}
                  >
                    {crop.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-bold text-lg text-gray-900">{crop.name}</h4>
                      <span
                        className="px-2 py-1 rounded-full text-xs font-bold"
                        style={{
                          backgroundColor: `${getUrgencyColor()}20`,
                          color: getUrgencyColor()
                        }}
                      >
                        #{index + 1}
                      </span>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <Clock size={14} />
                        <span>{crop.daysToHarvest} dagar</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <Shield size={14} />
                        <span>{crop.nutritionScore}/10</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <Package size={14} />
                        <span>
                          {crop.spaceRequirement === 'small' ? 'Litet' : crop.spaceRequirement === 'medium' ? 'Medel' : 'Stort'}
                        </span>
                      </div>
                    </div>

                    {/* Top Advantage */}
                    <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
                      <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                      <span className="text-sm text-green-800 font-medium">{crop.crisisAdvantages[0]}</span>
                    </div>
                  </div>

                  <ArrowRight size={20} className="text-gray-400 flex-shrink-0 mt-4" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Restart Button */}
        <div className="fixed bottom-16 left-0 right-0 px-6">
          <button
            onClick={() => setStep('setup')}
            className="w-full bg-white text-gray-700 py-4 px-6 rounded-xl font-bold hover:bg-gray-50 transition-all touch-manipulation active:scale-98 shadow-lg border-2 border-gray-200"
          >
            Justera Inställningar
          </button>
        </div>
      </div>
    );
  }

  // Details Step
  if (step === 'details' && selectedCrop) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50/50 to-blue-50/50 pb-32">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#3D4A2B] to-[#2A331E] text-white px-6 py-6 rounded-b-3xl shadow-2xl mb-6">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setStep('plan')}
              className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-all active:scale-95 touch-manipulation"
            >
              <ChevronDown size={20} className="rotate-90" strokeWidth={2.5} />
            </button>
            <div className="text-4xl">{selectedCrop.icon}</div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1">{selectedCrop.name}</h2>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${getDifficultyColor(selectedCrop.difficultyLevel)}`}>
                  {getDifficultyLabel(selectedCrop.difficultyLevel)}
                </span>
              </div>
            </div>
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
              <div className="text-2xl font-bold mb-1">{selectedCrop.daysToHarvest}</div>
              <div className="text-white/80 text-xs">Dagar till skörd</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
              <div className="text-2xl font-bold mb-1">{selectedCrop.nutritionScore}/10</div>
              <div className="text-white/80 text-xs">Näringsvärde</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
              <div className="text-2xl font-bold mb-1">{selectedCrop.storageWeeks}</div>
              <div className="text-white/80 text-xs">Veckors lagring</div>
            </div>
          </div>
        </div>

        {/* Details Content */}
        <div className="px-6 space-y-4">
          {/* Crisis Advantages */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
              <Zap size={20} className="text-orange-500" strokeWidth={2.5} />
              Krisstyrkor
            </h3>
            <div className="space-y-2">
              {selectedCrop.crisisAdvantages.map((advantage, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                  <CheckCircle size={16} className="text-orange-600 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                  <span className="text-sm text-gray-900 font-medium">{advantage}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sowing Instructions */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
              <Sun size={20} className="text-amber-500" strokeWidth={2.5} />
              Sådd-instruktioner
            </h3>
            <div className="space-y-2">
              {selectedCrop.sowingInstructions.map((instruction, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {index + 1}
                  </div>
                  <span className="text-sm text-gray-700 pt-0.5">{instruction}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Harvest Tips */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
              <Package size={20} className="text-green-600" strokeWidth={2.5} />
              Skördetips
            </h3>
            <div className="space-y-2">
              {selectedCrop.harvestTips.map((tip, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                  <span className="text-sm text-gray-900">{tip}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Key Nutrients */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
              <Shield size={20} className="text-blue-600" strokeWidth={2.5} />
              Näringsämnen
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedCrop.keyNutrients.map((nutrient, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border-2 border-blue-200"
                >
                  {nutrient}
                </span>
              ))}
            </div>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-700">
                <span className="font-bold text-lg text-blue-700">{selectedCrop.calories100g}</span>
                <span className="text-gray-600 ml-1">kcal per 100g</span>
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="font-bold text-lg text-gray-900 mb-4">Krav & Förutsättningar</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Droplets size={16} className="text-blue-500" />
                  <span className="text-sm font-bold text-gray-700">Vattenbehov</span>
                </div>
                <span className="text-sm text-gray-600 capitalize">{selectedCrop.waterRequirement}</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Package size={16} className="text-green-500" />
                  <span className="text-sm font-bold text-gray-700">Utrymme</span>
                </div>
                <span className="text-sm text-gray-600">
                  {selectedCrop.spaceRequirement === 'small' ? 'Litet' : selectedCrop.spaceRequirement === 'medium' ? 'Medel' : 'Stort'}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <HomeIcon size={16} className="text-purple-500" />
                  <span className="text-sm font-bold text-gray-700">Inomhus</span>
                </div>
                <span className="text-sm text-gray-600">{selectedCrop.indoorSuitable ? 'Ja' : 'Nej'}</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sun size={16} className="text-amber-500" />
                  <span className="text-sm font-bold text-gray-700">Utomhus</span>
                </div>
                <span className="text-sm text-gray-600">{selectedCrop.outdoorSuitable ? 'Ja' : 'Nej'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="fixed bottom-16 left-0 right-0 px-6">
          <button
            onClick={() => setStep('plan')}
            className="w-full bg-gradient-to-r from-[#556B2F] to-[#3D4A2B] text-white py-4 px-6 rounded-xl font-bold hover:shadow-xl transition-all touch-manipulation active:scale-98"
          >
            Tillbaka till Plan
          </button>
        </div>
      </div>
    );
  }

  return null;
}

