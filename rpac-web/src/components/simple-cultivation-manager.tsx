'use client';

import { useState, useEffect } from 'react';
import { Plus, Sprout, TrendingUp, Calendar, Edit, Trash, Star, ChevronRight, X, Check, AlertCircle, HelpCircle, Pencil } from 'lucide-react';
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
import { OpenAIService } from '@/lib/openai-worker-service';

interface SimpleCultivationManagerProps {
  userId: string;
  householdSize?: number;
}

export function SimpleCultivationManager({ userId, householdSize = 2 }: SimpleCultivationManagerProps) {
  const [plans, setPlans] = useState<CultivationPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<CultivationPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCropSelector, setShowCropSelector] = useState(false);
  const [showMonthlyView, setShowMonthlyView] = useState(false);
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
      is_primary: plans.length === 0 // First plan is primary
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
      <div className="space-y-6">
        <div className="bg-white rounded-xl p-12 text-center shadow-lg border-2 border-gray-200">
          <div className="text-7xl mb-6">🌱</div>
          <h3 className="text-2xl font-black text-gray-900 mb-3">
            Skapa din första odlingsplan
          </h3>
          <p className="text-gray-600 font-medium mb-8 max-w-md mx-auto leading-relaxed">
            Planera vilka grödor du vill odla och få översikt över näringsvärde och aktiviteter per månad
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#556B2F] to-[#3D4A2B] text-white font-bold text-base rounded-xl hover:shadow-xl transition-all shadow-lg min-h-[56px] touch-manipulation active:scale-98"
          >
            <Plus size={22} />
            <span>Skapa plan</span>
          </button>
        </div>

        {showCreateModal && (
          <CreatePlanModal
            onClose={() => {
              setShowCreateModal(false);
              setEditingPlan(null);
            }}
            onCreate={editingPlan ? handleUpdatePlan : handleCreatePlan}
            editingPlan={editingPlan}
          />
        )}
      </div>
    );
  }

  const nutrition = selectedPlan ? calculatePlanNutrition(selectedPlan, householdSize, 30) : null;
  const monthlyActivities = selectedPlan ? generateMonthlyActivities(selectedPlan.crops) : [];

  return (
    <div className="space-y-6">
      {/* Header with Plan Selector */}
      <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-black text-gray-900">Mina odlingsplaner</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#556B2F] to-[#3D4A2B] text-white font-bold text-sm rounded-lg hover:shadow-lg transition-all shadow-md min-h-[40px] touch-manipulation active:scale-98"
          >
            <Plus size={18} />
            <span>Ny plan</span>
          </button>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map(plan => {
            const planNutrition = calculatePlanNutrition(plan, householdSize, 30);
            
            return (
              <div
                key={plan.id}
                className={`relative p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                  selectedPlan?.id === plan.id
                    ? 'border-[#3D4A2B] bg-[#3D4A2B]/5 shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Clickable area to select plan */}
                <div 
                  onClick={() => setSelectedPlan(plan)}
                  className="cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Sprout size={20} className="text-[#3D4A2B]" />
                      <h3 className="font-bold text-gray-900">{plan.plan_name}</h3>
                    </div>
                    <div className="flex items-center gap-2 z-10">
                      {plan.is_primary && (
                        <Star size={16} className="text-[#B8860B] fill-current" />
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingPlan(plan);
                          setShowCreateModal(true);
                        }}
                        className="p-1.5 text-gray-500 hover:text-[#3D4A2B] hover:bg-gray-100 rounded-lg transition-colors"
                        title="Redigera plan"
                        aria-label={`Redigera ${plan.plan_name}`}
                      >
                        <Edit size={16} />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {plan.description || 'Ingen beskrivning'}
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-600">
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
                    <ChevronRight size={16} className="text-gray-400" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Plan Details */}
      {selectedPlan && nutrition && (
        <>
          {/* Nutrition Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-[#3D4A2B]/10 rounded-xl flex items-center justify-center">
                  <Sprout size={28} className="text-[#3D4A2B]" />
                </div>
                <div>
                  <div className="text-4xl font-black text-gray-900">{selectedPlan.crops.length}</div>
                  <div className="text-sm font-semibold text-gray-700">Grödor i planen</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-[#556B2F]/20">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-[#556B2F]/10 rounded-xl flex items-center justify-center">
                  <TrendingUp size={28} className="text-[#556B2F]" />
                </div>
                <div className="flex-1">
                  <div className="text-4xl font-black text-[#556B2F]">
                    {Math.round(nutrition.totalKcal / 1000)}k
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="text-sm font-semibold text-gray-700">Totalt kcal/månad</div>
                    <div className="relative group">
                      <HelpCircle 
                        size={16} 
                        className="text-gray-400 hover:text-gray-600 cursor-help transition-colors"
                      />
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none z-50">
                        <div className="font-bold mb-1">Beräkning:</div>
                        <div className="space-y-1">
                          <div>• Alla grödors totala kcal delas på 12 månader</div>
                          <div>• Exempel: 36,000 kcal skörd ÷ 12 = 3,000 kcal/månad</div>
                          <div>• Visar genomsnittligt energivärde per månad</div>
                        </div>
                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={`bg-white rounded-xl p-6 shadow-lg border-2 ${
              nutrition.percentOfTarget >= 80 ? 'border-[#556B2F]/20' : 
              nutrition.percentOfTarget >= 40 ? 'border-[#B8860B]/20' : 
              'border-[#8B4513]/20'
            }`}>
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                  nutrition.percentOfTarget >= 80 ? 'bg-[#556B2F]/10' : 
                  nutrition.percentOfTarget >= 40 ? 'bg-[#B8860B]/10' : 
                  'bg-[#8B4513]/10'
                }`}>
                  <TrendingUp size={28} className={
                    nutrition.percentOfTarget >= 80 ? 'text-[#556B2F]' : 
                    nutrition.percentOfTarget >= 40 ? 'text-[#B8860B]' : 
                    'text-[#8B4513]'
                  } />
                </div>
                <div className="flex-1">
                  <div className={`text-4xl font-black ${
                    nutrition.percentOfTarget >= 80 ? 'text-[#556B2F]' : 
                    nutrition.percentOfTarget >= 40 ? 'text-[#B8860B]' : 
                    'text-[#8B4513]'
                  }`}>
                    {nutrition.percentOfTarget}%
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold text-gray-700">Av hushållets behov</div>
                    <div className="group relative">
                      <HelpCircle size={16} className="text-gray-400 hover:text-gray-600 cursor-help" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none z-50 shadow-xl">
                        <div className="font-bold mb-1">Beräkning:</div>
                        <div className="space-y-1">
                          <div>• Hushållsstorlek: {householdSize} {householdSize === 1 ? 'person' : 'personer'}</div>
                          <div>• Dagsbehov: ~2000 kcal/person</div>
                          <div>• Total skörd: {nutrition.totalKcal.toLocaleString()} kcal</div>
                          <div>• Månadsbehov: {nutrition.targetKcalPerDay.toLocaleString()} kcal/dag × 30 = {(nutrition.targetKcalPerDay * 30).toLocaleString()} kcal</div>
                          <div>• Täckningsgrad: {Math.round(nutrition.totalKcal / (nutrition.targetKcalPerDay * 30) * 100)}%</div>
                        </div>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                          <div className="border-4 border-transparent border-t-gray-900"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Crops List */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-gray-900">Valda grödor</h3>
              <button
                onClick={() => setShowCropSelector(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#3D4A2B] text-white font-bold text-sm rounded-lg hover:bg-[#2A331E] transition-colors min-h-[40px] touch-manipulation"
              >
                <Plus size={18} />
                <span>Lägg till gröda</span>
              </button>
            </div>

            {selectedPlan.crops.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Sprout size={48} className="mx-auto mb-3 text-gray-300" />
                <p>Inga grödor tillagda än. Klicka på "Lägg till gröda" för att börja.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedPlan.crops.map((crop, index) => {
                  const cropData = CROP_LIBRARY[crop.cropName];
                  const cropKcal = cropData.kcalPerKg * crop.estimatedYieldKg;
                  
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                    >
                      <div className="text-3xl">{cropData.icon}</div>
                      <div className="flex-1">
                        <div className="font-bold text-gray-900">{cropData.name}</div>
                        <div className="text-sm text-gray-600">
                          {crop.quantity} plantor → {crop.estimatedYieldKg} kg → ~{Math.round(cropKcal)} kcal
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingCropIndex(index);
                            setShowCropSelector(true);
                          }}
                          className="p-2 text-[#3D4A2B] hover:bg-[#3D4A2B]/10 rounded-lg transition-colors"
                          title="Redigera gröda"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleRemoveCrop(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Ta bort gröda"
                        >
                          <Trash size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Monthly Activities Overview */}
          {selectedPlan.crops.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar size={24} className="text-[#3D4A2B]" />
                  <h3 className="text-lg font-black text-gray-900">Aktiviteter per månad</h3>
                </div>
              </div>

              <MonthlyActivitiesView activities={monthlyActivities} />
            </div>
          )}

          {/* Plan Management */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="flex flex-wrap gap-3">
              {!selectedPlan.is_primary && (
                <button
                  onClick={() => handleSetPrimary(selectedPlan.id!)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-[#B8860B] text-[#B8860B] font-bold text-sm rounded-lg hover:bg-[#B8860B] hover:text-white transition-colors"
                >
                  <Star size={16} />
                  <span>Sätt som primär plan</span>
                </button>
              )}
              <button
                onClick={() => handleDeletePlan(selectedPlan.id!)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-red-500 text-red-600 font-bold text-sm rounded-lg hover:bg-red-500 hover:text-white transition-colors"
              >
                <Trash size={16} />
                <span>Ta bort plan</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreatePlanModal
          onClose={() => {
            setShowCreateModal(false);
            setEditingPlan(null);
          }}
          onCreate={editingPlan ? handleUpdatePlan : handleCreatePlan}
          editingPlan={editingPlan}
        />
      )}

      {showCropSelector && selectedPlan && (
        <CropSelectorModal
          onClose={() => {
            setShowCropSelector(false);
            setEditingCropIndex(null);
          }}
          onSelect={editingCropIndex !== null ? handleEditCrop : handleAddCrop}
          existingCrops={selectedPlan.crops.map(c => c.cropName)}
          editingCrop={editingCropIndex !== null ? selectedPlan.crops[editingCropIndex] : undefined}
        />
      )}
    </div>
  );
}

// Monthly Activities Component
function MonthlyActivitiesView({ activities }: { activities: MonthlyActivity[] }) {
  const activeMonths = activities.filter(m => 
    m.sowingCrops.length > 0 || m.harvestingCrops.length > 0
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {activeMonths.map(month => (
        <div
          key={month.month}
          className="p-4 rounded-lg border-2 border-gray-200 hover:border-[#3D4A2B] transition-colors"
        >
          <h4 className="font-bold text-gray-900 mb-3">{month.month}</h4>
          
          {month.sowingCrops.length > 0 && (
            <div className="mb-2">
              <div className="text-xs font-semibold text-gray-600 mb-1">Så/Plantera:</div>
              <div className="flex flex-wrap gap-1">
                {month.sowingCrops.map(crop => (
                  <span key={crop} className="text-lg" title={crop}>
                    {CROP_LIBRARY[crop].icon}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {month.harvestingCrops.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-600 mb-1">Skörda:</div>
              <div className="flex flex-wrap gap-1">
                {month.harvestingCrops.map(crop => (
                  <span key={crop} className="text-lg" title={crop}>
                    {CROP_LIBRARY[crop].icon}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Create Plan Modal
function CreatePlanModal({ onClose, onCreate, editingPlan }: {
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-black text-gray-900">
            {editingPlan ? 'Redigera plan' : 'Skapa ny plan'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
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
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#3D4A2B] focus:ring-0 transition-colors"
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
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#3D4A2B] focus:ring-0 transition-colors resize-none"
              placeholder="Beskriv din odlingsplan..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Avbryt
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-gradient-to-r from-[#556B2F] to-[#3D4A2B] text-white font-bold rounded-lg hover:shadow-lg transition-all"
            >
              {editingPlan ? 'Spara ändringar' : 'Skapa plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Crop Selector Modal
function CropSelectorModal({ onClose, onSelect, existingCrops, editingCrop }: {
  onClose: () => void;
  onSelect: (crop: CropName, quantity: number, yieldKg: number) => void;
  existingCrops: CropName[];
  editingCrop?: CultivationCrop;
}) {
  const [selectedCrop, setSelectedCrop] = useState<CropName | null>(editingCrop?.cropName || null);
  const [quantity, setQuantity] = useState<number>(editingCrop?.quantity || 10);
  const [customCropName, setCustomCropName] = useState('');
  const [loadingCustomCrop, setLoadingCustomCrop] = useState(false);
  const [customCropError, setCustomCropError] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // When editing, allow the current crop to be selected even if it exists
  const availableCrops = Object.keys(CROP_LIBRARY).filter(
    crop => !existingCrops.includes(crop as CropName) || crop === editingCrop?.cropName
  ) as CropName[];

  // Auto-calculate yield whenever quantity or crop changes
  const estimatedYield = selectedCrop 
    ? calculateExpectedYield(selectedCrop, quantity)
    : 0;

  const handleCustomCropAdd = async () => {
    if (!customCropName.trim()) return;
    
    setLoadingCustomCrop(true);
    setCustomCropError('');

    try {
      // Check if crop already exists (case-insensitive)
      const normalizedName = customCropName.trim();
      const existingCropKey = Object.keys(CROP_LIBRARY).find(
        key => key.toLowerCase() === normalizedName.toLowerCase()
      );

      if (existingCropKey) {
        setSelectedCrop(existingCropKey as CropName);
        setCustomCropName('');
        setLoadingCustomCrop(false);
        return;
      }

      // Fetch crop info from AI
      const cropInfo = await OpenAIService.getCropInformation(normalizedName);
      
      if (!cropInfo) {
        setCustomCropError('Kunde inte hitta information. Kontrollera att GEMINI_API_KEY är konfigurerad.');
        setLoadingCustomCrop(false);
        return;
      }

      // Add to CROP_LIBRARY temporarily (in memory only)
      (CROP_LIBRARY as any)[cropInfo.name] = cropInfo;
      
      setSelectedCrop(cropInfo.name as CropName);
      setCustomCropName('');
      setCustomCropError('');
      setShowCustomInput(false);
    } catch (error) {
      console.error('Error adding custom crop:', error);
      setCustomCropError('Ett fel uppstod. Försök igen.');
    } finally {
      setLoadingCustomCrop(false);
    }
  };

  const handleSubmit = () => {
    if (selectedCrop) {
      onSelect(selectedCrop, quantity, estimatedYield);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 my-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-black text-gray-900">
            {editingCrop ? 'Redigera gröda' : 'Lägg till gröda'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {availableCrops.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle size={48} className="mx-auto mb-3 text-gray-300" />
            <p>Alla tillgängliga grödor har redan lagts till i planen.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Välj gröda
              </label>
              
              {showCustomInput ? (
                <div className="mb-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customCropName}
                      onChange={(e) => setCustomCropName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCustomCropAdd()}
                      placeholder="T.ex. Salvia, Melon..."
                      className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-[#3D4A2B] focus:ring-0"
                      disabled={loadingCustomCrop}
                      autoFocus
                    />
                    <button
                      onClick={handleCustomCropAdd}
                      disabled={!customCropName.trim() || loadingCustomCrop}
                      className="px-4 py-2 bg-[#3D4A2B] text-white rounded-lg hover:bg-[#2A331E] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                    >
                      {loadingCustomCrop ? 'Hämtar...' : 'Lägg till'}
                    </button>
                    <button
                      onClick={() => {
                        setShowCustomInput(false);
                        setCustomCropName('');
                        setCustomCropError('');
                      }}
                      className="px-3 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  {customCropError && (
                    <p className="mt-2 text-sm text-red-600">{customCropError}</p>
                  )}
                  <p className="mt-2 text-xs text-gray-600">
                    AI hämtar automatiskt odlingsinformation från vår kunskapsbas
                  </p>
                </div>
              ) : null}
              
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3 max-h-[300px] overflow-y-auto p-2">
                {availableCrops.map(cropName => {
                  const crop = CROP_LIBRARY[cropName];
                  return (
                    <button
                      key={cropName}
                      onClick={() => setSelectedCrop(cropName)}
                      className={`p-4 rounded-xl border-2 transition-all text-center hover:shadow-md ${
                        selectedCrop === cropName
                          ? 'border-[#3D4A2B] bg-[#3D4A2B]/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-3xl mb-2">{crop.icon}</div>
                      <div className="text-xs font-semibold text-gray-700">{crop.name}</div>
                      <div className="text-[10px] text-gray-500">{crop.category}</div>
                    </button>
                  );
                })}
                
                {/* Add Custom Crop Button */}
                <button
                  onClick={() => setShowCustomInput(true)}
                  className="p-4 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 hover:bg-blue-100 hover:border-blue-400 transition-all text-center"
                >
                  <div className="text-3xl mb-2 text-blue-500">➕</div>
                  <div className="text-xs font-semibold text-blue-700">Lägg till</div>
                  <div className="text-[10px] text-blue-600">egen gröda</div>
                </button>
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
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#3D4A2B] focus:ring-0 transition-colors text-lg"
                    placeholder="Antal plantor"
                  />
                  <div className="mt-2 text-xs text-gray-500">
                    T.ex. "10" för 10 plantor
                  </div>
                </div>

                <div className="p-4 bg-[#556B2F]/10 rounded-lg border-2 border-[#556B2F]/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-gray-700">Beräknad skörd:</span>
                    <Check size={20} className="text-[#556B2F]" />
                  </div>
                  <div className="text-2xl font-black text-[#556B2F] mb-1">
                    {estimatedYield.toFixed(1)} kg
                  </div>
                  <div className="text-sm text-gray-600">
                    ≈ {Math.round(CROP_LIBRARY[selectedCrop].kcalPerKg * estimatedYield).toLocaleString()} kcal totalt
                  </div>
                  <div className="mt-2 pt-2 border-t border-[#556B2F]/20 text-xs text-gray-500">
                    Baserat på genomsnittlig avkastning för {CROP_LIBRARY[selectedCrop].name}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Avbryt
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedCrop}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-[#556B2F] to-[#3D4A2B] text-white font-bold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Lägg till
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
