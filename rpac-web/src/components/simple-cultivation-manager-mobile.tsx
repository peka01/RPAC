'use client';

import { useState, useEffect } from 'react';
import { Plus, Sprout, TrendingUp, Calendar, Trash, Star, ChevronRight, X, AlertCircle, ChevronDown, ChevronUp, Check, HelpCircle, Edit, Pencil } from 'lucide-react';
import { 
  cultivationPlanService, 
  CultivationPlan, 
  CultivationCrop,
  CROP_LIBRARY,
  CropName,
  calculatePlanNutrition,
  generateMonthlyActivities,
  MonthlyActivity,
  calculateExpectedYield
} from '@/lib/cultivation-plan-service';

interface SimpleCultivationManagerMobileProps {
  userId: string;
  householdSize?: number;
}

export function SimpleCultivationManagerMobile({ userId, householdSize = 2 }: SimpleCultivationManagerMobileProps) {
  const [plans, setPlans] = useState<CultivationPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<CultivationPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCropSelector, setShowCropSelector] = useState(false);
  const [showPlanSelector, setShowPlanSelector] = useState(false);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [editingPlan, setEditingPlan] = useState<CultivationPlan | null>(null);
  const [editingCropIndex, setEditingCropIndex] = useState<number | null>(null);

  useEffect(() => {
    loadPlans();
  }, [userId]);

  const loadPlans = async () => {
    setLoading(true);
    const data = await cultivationPlanService.getUserPlans(userId);
    setPlans(data);
    
    // Auto-select primary plan or first plan
    const primaryPlan = data.find(p => p.is_primary);
    if (primaryPlan) {
      setSelectedPlan(primaryPlan);
    } else if (data.length > 0) {
      setSelectedPlan(data[0]);
    }
    
    setLoading(false);
  };

  const handleCreatePlan = async (planName: string, description: string) => {
    const newPlan: CultivationPlan = {
      plan_name: planName,
      description,
      crops: [],
      is_primary: plans.length === 0
    };

    const created = await cultivationPlanService.createPlan(userId, newPlan);
    if (created) {
      await loadPlans();
      setSelectedPlan(created);
      setShowCreateModal(false);
    }
  };

  const handleUpdatePlan = async (planName: string, description: string) => {
    if (!editingPlan) return;

    const success = await cultivationPlanService.updatePlan(editingPlan.id!, {
      plan_name: planName,
      description
    });

    if (success) {
      await loadPlans();
      setShowCreateModal(false);
      setEditingPlan(null);
    }
  };

  const handleAddCrop = async (cropName: CropName, quantity: number, yieldKg: number) => {
    if (!selectedPlan) return;

    const newCrop: CultivationCrop = {
      cropName,
      quantity,
      estimatedYieldKg: yieldKg
    };

    const updatedCrops = [...selectedPlan.crops, newCrop];
    
    const success = await cultivationPlanService.updatePlan(selectedPlan.id!, {
      crops: updatedCrops
    });

    if (success) {
      await loadPlans();
      setShowCropSelector(false);
    }
  };

  const handleEditCrop = async (cropName: CropName, quantity: number, yieldKg: number) => {
    if (!selectedPlan || editingCropIndex === null) return;

    const updatedCrops = [...selectedPlan.crops];
    updatedCrops[editingCropIndex] = {
      cropName,
      quantity,
      estimatedYieldKg: yieldKg
    };
    
    const success = await cultivationPlanService.updatePlan(selectedPlan.id!, {
      crops: updatedCrops
    });

    if (success) {
      await loadPlans();
      setShowCropSelector(false);
      setEditingCropIndex(null);
    }
  };

  const handleRemoveCrop = async (index: number) => {
    if (!selectedPlan) return;

    const updatedCrops = selectedPlan.crops.filter((_, i) => i !== index);
    
    const success = await cultivationPlanService.updatePlan(selectedPlan.id!, {
      crops: updatedCrops
    });

    if (success) {
      await loadPlans();
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna odlingsplan?')) return;

    const success = await cultivationPlanService.deletePlan(planId);
    if (success) {
      await loadPlans();
      if (selectedPlan?.id === planId) {
        setSelectedPlan(null);
      }
    }
  };

  const handleSetPrimary = async (planId: string) => {
    const success = await cultivationPlanService.setPrimaryPlan(userId, planId);
    if (success) {
      await loadPlans();
    }
  };

  const toggleMonth = (month: string) => {
    setExpandedMonths(prev => {
      const next = new Set(prev);
      if (next.has(month)) {
        next.delete(month);
      } else {
        next.add(month);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3D4A2B] mx-auto mb-4"></div>
          <p className="text-gray-600">Laddar odlingsplaner...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (plans.length === 0) {
    return (
      <div className="px-4 py-6 space-y-6">
        <div className="bg-white rounded-xl p-8 text-center shadow-lg">
          <div className="text-6xl mb-4">🌱</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Skapa din första odlingsplan
          </h3>
          <p className="text-gray-600 mb-6 text-sm">
            Planera vilka grödor du vill odla och få översikt över näringsvärde och aktiviteter
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#556B2F] to-[#3D4A2B] text-white font-bold rounded-xl shadow-lg active:scale-95 transition-transform"
          >
            <Plus size={20} />
            <span>Skapa plan</span>
          </button>
        </div>

        {showCreateModal && (
          <CreatePlanModalMobile
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreatePlan}
          />
        )}
      </div>
    );
  }

  const nutrition = selectedPlan ? calculatePlanNutrition(selectedPlan, householdSize, 30) : null;
  const monthlyActivities = selectedPlan ? generateMonthlyActivities(selectedPlan.crops) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#5C6B47]/10 via-white to-[#707C5F]/10 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#3D4A2B] to-[#2A331E] text-white px-4 pt-6 pb-8 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">Odlingsplaner</h1>
            <p className="text-[#C8D5B9] text-sm">Planera din odling</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-colors active:scale-95"
          >
            <Plus size={24} />
          </button>
        </div>

        {/* Plan Selector */}
        {selectedPlan && (
          <button
            onClick={() => setShowPlanSelector(true)}
            className="w-full bg-white/15 backdrop-blur-sm rounded-xl p-4 flex items-center justify-between active:scale-98 transition-transform"
          >
            <div className="flex items-center gap-3">
              <Sprout size={24} />
              <div className="text-left">
                <div className="font-bold flex items-center gap-2">
                  {selectedPlan.plan_name}
                  {selectedPlan.is_primary && <Star size={14} className="text-[#B8860B] fill-current" />}
                </div>
                <div className="text-xs text-[#C8D5B9]">
                  {selectedPlan.crops.length} {selectedPlan.crops.length === 1 ? 'gröda' : 'grödor'}
                </div>
              </div>
            </div>
            <ChevronRight size={20} />
          </button>
        )}
      </div>

      {selectedPlan && nutrition && (
        <div className="px-4 -mt-4 space-y-4">
          {/* Nutrition Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-xl p-4 shadow-md">
              <div className="text-3xl font-black text-gray-900">{selectedPlan.crops.length}</div>
              <div className="text-xs text-gray-600 mt-1">Grödor</div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-md relative">
              <div className="text-3xl font-black text-[#556B2F]">
                {Math.round(nutrition.totalKcal / 1000)}k
              </div>
              <div className="flex items-center justify-center gap-1 mt-1">
                <div className="text-xs text-gray-600">kcal/mån</div>
                <div className="relative group">
                  <HelpCircle 
                    size={12} 
                    className="text-gray-400 active:text-gray-600 cursor-help transition-colors"
                  />
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-active:opacity-100 group-active:visible transition-all pointer-events-none z-50">
                    <div className="font-bold mb-1">Beräkning:</div>
                    <div className="space-y-1">
                      <div>• Alla grödors totala kcal delas på 12 månader</div>
                      <div>• Exempel: 36,000 kcal skörd ÷ 12 = 3k kcal/mån</div>
                    </div>
                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-md">
              <div className={`text-3xl font-black ${
                nutrition.percentOfTarget >= 80 ? 'text-[#556B2F]' : 
                nutrition.percentOfTarget >= 40 ? 'text-[#B8860B]' : 
                'text-[#8B4513]'
              }`}>
                {nutrition.percentOfTarget}%
              </div>
              <div className="flex items-center justify-center gap-1 text-xs text-gray-600 mt-1">
                <span>Av behov</span>
                <div className="group relative">
                  <HelpCircle size={12} className="text-gray-400" />
                  <div className="absolute bottom-full right-0 mb-2 w-56 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-active:opacity-100 group-active:visible transition-all pointer-events-none z-50 shadow-xl">
                    <div className="font-bold mb-1">Beräkning:</div>
                    <div className="space-y-1">
                      <div>• Hushåll: {householdSize} pers</div>
                      <div>• Dagsbehov: ~2000 kcal</div>
                      <div>• Månadsbehov: {(householdSize * 2000 * 30).toLocaleString()} kcal</div>
                    </div>
                    <div className="absolute top-full right-4 -mt-1">
                      <div className="border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Crops List */}
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900">Valda grödor</h3>
              <button
                onClick={() => setShowCropSelector(true)}
                className="px-3 py-1.5 bg-[#3D4A2B] text-white text-sm font-bold rounded-lg active:scale-95 transition-transform"
              >
                + Lägg till
              </button>
            </div>

            {selectedPlan.crops.length === 0 ? (
              <div className="text-center py-6 text-gray-500 text-sm">
                <Sprout size={40} className="mx-auto mb-2 text-gray-300" />
                <p>Inga grödor tillagda än</p>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedPlan.crops.map((crop, index) => {
                  const cropData = CROP_LIBRARY[crop.cropName];
                  const cropKcal = cropData.kcalPerKg * crop.estimatedYieldKg;
                  
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-lg bg-gray-50"
                    >
                      <div className="text-2xl">{cropData.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-900 text-sm">{cropData.name}</div>
                        <div className="text-xs text-gray-600">
                          {crop.quantity} plantor → {crop.estimatedYieldKg} kg
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setEditingCropIndex(index);
                            setShowCropSelector(true);
                          }}
                          className="p-2 text-[#3D4A2B] hover:bg-[#3D4A2B]/10 rounded-lg active:scale-95 transition-transform"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleRemoveCrop(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg active:scale-95 transition-transform"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Monthly Activities */}
          {selectedPlan.crops.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={20} className="text-[#3D4A2B]" />
                <h3 className="font-bold text-gray-900">Aktiviteter per månad</h3>
              </div>

              <div className="space-y-2">
                {monthlyActivities
                  .filter(m => m.sowingCrops.length > 0 || m.harvestingCrops.length > 0)
                  .map(month => {
                    const isExpanded = expandedMonths.has(month.month);
                    
                    return (
                      <div key={month.month} className="border border-gray-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleMonth(month.month)}
                          className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between active:bg-gray-100 transition-colors"
                        >
                          <div className="font-bold text-gray-900">{month.month}</div>
                          <div className="flex items-center gap-2">
                            <div className="flex -space-x-1">
                              {[...month.sowingCrops, ...month.harvestingCrops]
                                .slice(0, 3)
                                .map((crop, i) => (
                                  <span key={i} className="text-lg">
                                    {CROP_LIBRARY[crop].icon}
                                  </span>
                                ))}
                            </div>
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="p-4 space-y-3">
                            {month.sowingCrops.length > 0 && (
                              <div>
                                <div className="text-xs font-semibold text-gray-600 mb-2">Så/Plantera:</div>
                                <div className="flex flex-wrap gap-2">
                                  {month.sowingCrops.map(crop => (
                                    <div key={crop} className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded text-xs">
                                      <span>{CROP_LIBRARY[crop].icon}</span>
                                      <span className="font-medium">{crop}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {month.harvestingCrops.length > 0 && (
                              <div>
                                <div className="text-xs font-semibold text-gray-600 mb-2">Skörda:</div>
                                <div className="flex flex-wrap gap-2">
                                  {month.harvestingCrops.map(crop => (
                                    <div key={crop} className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded text-xs">
                                      <span>{CROP_LIBRARY[crop].icon}</span>
                                      <span className="font-medium">{crop}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Plan Management */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="space-y-2">
              {!selectedPlan.is_primary && (
                <button
                  onClick={() => handleSetPrimary(selectedPlan.id!)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-[#B8860B] text-[#B8860B] font-bold rounded-lg active:scale-98 transition-transform"
                >
                  <Star size={16} />
                  <span>Sätt som primär</span>
                </button>
              )}
              <button
                onClick={() => handleDeletePlan(selectedPlan.id!)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-red-500 text-red-600 font-bold rounded-lg active:scale-98 transition-transform"
              >
                <Trash size={16} />
                <span>Ta bort plan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreatePlanModalMobile
          onClose={() => {
            setShowCreateModal(false);
            setEditingPlan(null);
          }}
          onCreate={editingPlan ? handleUpdatePlan : handleCreatePlan}
          editingPlan={editingPlan}
        />
      )}

      {showCropSelector && selectedPlan && (
        <CropSelectorModalMobile
          onClose={() => {
            setShowCropSelector(false);
            setEditingCropIndex(null);
          }}
          onSelect={editingCropIndex !== null ? handleEditCrop : handleAddCrop}
          existingCrops={selectedPlan.crops.map(c => c.cropName)}
          editingCrop={editingCropIndex !== null ? selectedPlan.crops[editingCropIndex] : undefined}
        />
      )}

      {showPlanSelector && (
        <PlanSelectorSheet
          plans={plans}
          selectedPlan={selectedPlan}
          householdSize={householdSize}
          onSelect={(plan) => {
            setSelectedPlan(plan);
            setShowPlanSelector(false);
          }}
          onEdit={(plan) => {
            setEditingPlan(plan);
            setShowCreateModal(true);
            setShowPlanSelector(false);
          }}
          onClose={() => setShowPlanSelector(false)}
        />
      )}
    </div>
  );
}

// Mobile Create Plan Modal
function CreatePlanModalMobile({ onClose, onCreate, editingPlan }: {
  onClose: () => void;
  onCreate: (name: string, description: string) => void;
  editingPlan?: CultivationPlan | null;
}) {
  const [planName, setPlanName] = useState(editingPlan?.plan_name || '');
  const [description, setDescription] = useState(editingPlan?.description || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (planName.trim()) {
      onCreate(planName, description);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50">
      <div className="bg-white rounded-t-3xl w-full p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">
            {editingPlan ? 'Redigera plan' : 'Skapa ny plan'}
          </h3>
          <button onClick={onClose} className="p-2">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Planens namn *
            </label>
            <input
              type="text"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#3D4A2B] focus:ring-0"
              placeholder="t.ex. Sommarodling 2025"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Beskrivning (valfritt)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#3D4A2B] focus:ring-0 resize-none"
              placeholder="Beskriv din odlingsplan..."
              rows={3}
            />
          </div>

          <button
            type="submit"
            className="w-full px-4 py-4 bg-gradient-to-r from-[#556B2F] to-[#3D4A2B] text-white font-bold rounded-xl shadow-lg active:scale-98 transition-transform"
          >
            {editingPlan ? 'Spara ändringar' : 'Skapa plan'}
          </button>
        </form>
      </div>
    </div>
  );
}

// Mobile Crop Selector Modal
function CropSelectorModalMobile({ onClose, onSelect, existingCrops, editingCrop }: {
  onClose: () => void;
  onSelect: (crop: CropName, quantity: number, yieldKg: number) => void;
  existingCrops: CropName[];
  editingCrop?: CultivationCrop;
}) {
  const [selectedCrop, setSelectedCrop] = useState<CropName | null>(editingCrop?.cropName || null);
  const [quantity, setQuantity] = useState<number>(editingCrop?.quantity || 10);

  // When editing, allow the current crop to be selected even if it exists
  const availableCrops = Object.keys(CROP_LIBRARY).filter(
    crop => !existingCrops.includes(crop as CropName) || crop === editingCrop?.cropName
  ) as CropName[];

  // Auto-calculate yield whenever quantity or crop changes
  const estimatedYield = selectedCrop 
    ? calculateExpectedYield(selectedCrop, quantity)
    : 0;

  const handleSubmit = () => {
    if (selectedCrop) {
      onSelect(selectedCrop, quantity, estimatedYield);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50">
      <div className="bg-white rounded-t-3xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">
            {editingCrop ? 'Redigera gröda' : 'Lägg till gröda'}
          </h3>
          <button onClick={onClose} className="p-2">
            <X size={24} />
          </button>
        </div>

        {availableCrops.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm">Alla grödor har redan lagts till</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Välj gröda
              </label>
              <div className="grid grid-cols-3 gap-3">
                {availableCrops.map(cropName => {
                  const crop = CROP_LIBRARY[cropName];
                  return (
                    <button
                      key={cropName}
                      onClick={() => setSelectedCrop(cropName)}
                      className={`p-3 rounded-xl border-2 transition-all text-center ${
                        selectedCrop === cropName
                          ? 'border-[#3D4A2B] bg-[#3D4A2B]/5'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="text-2xl mb-1">{crop.icon}</div>
                      <div className="text-[10px] font-semibold text-gray-700">{crop.name}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedCrop && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Antal plantor
                  </label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    min="1"
                    step="1"
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-lg focus:border-[#3D4A2B] focus:ring-0 text-lg"
                    placeholder="Antal plantor"
                  />
                  <div className="mt-2 text-xs text-gray-500">
                    T.ex. "10" för 10 plantor
                  </div>
                </div>

                <div className="p-4 bg-[#556B2F]/10 rounded-lg border-2 border-[#556B2F]/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-gray-700">Beräknad skörd:</span>
                    <Check size={18} className="text-[#556B2F]" />
                  </div>
                  <div className="text-2xl font-black text-[#556B2F] mb-1">
                    {estimatedYield.toFixed(1)} kg
                  </div>
                  <div className="text-sm text-gray-600">
                    ≈ {Math.round(CROP_LIBRARY[selectedCrop].kcalPerKg * estimatedYield).toLocaleString()} kcal
                  </div>
                  <div className="mt-2 pt-2 border-t border-[#556B2F]/20 text-xs text-gray-500">
                    Baserat på genomsnittlig avkastning
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!selectedCrop}
              className="w-full px-4 py-4 bg-gradient-to-r from-[#556B2F] to-[#3D4A2B] text-white font-bold rounded-xl shadow-lg active:scale-98 transition-transform disabled:opacity-50"
            >
              Lägg till
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Plan Selector Sheet
function PlanSelectorSheet({ plans, selectedPlan, householdSize, onSelect, onEdit, onClose }: {
  plans: CultivationPlan[];
  selectedPlan: CultivationPlan | null;
  householdSize: number;
  onSelect: (plan: CultivationPlan) => void;
  onEdit: (plan: CultivationPlan) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={onClose}>
      <div className="bg-white rounded-t-3xl w-full max-h-[70vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Välj plan</h3>
          <button onClick={onClose} className="p-2">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-3">
          {plans.map(plan => {
            const planNutrition = calculatePlanNutrition(plan, householdSize, 30);
            
            return (
              <div
                key={plan.id}
                className={`w-full p-4 rounded-xl border-2 transition-all ${
                  selectedPlan?.id === plan.id
                    ? 'border-[#3D4A2B] bg-[#3D4A2B]/5'
                    : 'border-gray-200'
                }`}
              >
                <div 
                  onClick={() => onSelect(plan)}
                  className="cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Sprout size={18} className="text-[#3D4A2B]" />
                      <h3 className="font-bold text-gray-900">{plan.plan_name}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {plan.is_primary && (
                        <Star size={14} className="text-[#B8860B] fill-current" />
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(plan);
                        }}
                        className="p-1.5 text-gray-500 hover:text-[#3D4A2B] hover:bg-gray-100 rounded-lg active:scale-95 transition-all"
                        aria-label={`Redigera ${plan.plan_name}`}
                      >
                        <Edit size={14} />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                    {plan.description || 'Ingen beskrivning'}
                  </p>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-gray-500">
                      {plan.crops.length} {plan.crops.length === 1 ? 'gröda' : 'grödor'}
                    </span>
                    {plan.crops.length > 0 && (
                      <span className={`font-bold ${
                        planNutrition.percentOfTarget >= 80 ? 'text-[#556B2F]' : 
                        planNutrition.percentOfTarget >= 40 ? 'text-[#B8860B]' : 
                        'text-[#8B4513]'
                      }`}>
                        {planNutrition.percentOfTarget}% av behov
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
