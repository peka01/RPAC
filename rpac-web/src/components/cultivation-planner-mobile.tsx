'use client';

import { useState, useEffect } from 'react';
import { 
  Sprout,
  Users,
  MapPin,
  Sparkles,
  ArrowRight,
  Check,
  TrendingUp,
  DollarSign,
  Maximize2,
  ChevronRight,
  Edit,
  Save,
  Home,
  Heart,
  Plus,
  Minus,
  X,
  Sliders,
  Calendar as CalendarIcon,
  ShoppingCart,
  Leaf,
  RefreshCw,
  ChevronDown,
  Info,
  Trash2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { calculateGardenProduction } from '@/lib/cultivation/calculateGardenProduction';
import { generateMonthlyTasks } from '@/lib/cultivation/generateMonthlyTasks';
import { useUserProfile } from '@/lib/useUserProfile';
import { generateAIGardenPlan } from '@/lib/ai/generateAIGardenPlan';
import { getClimateZoneFromCounty } from '@/constants/climateZones';

interface CultivationPlannerMobileProps {
  user: any;
  onPlanCreated?: (plan: any) => void;
}

interface UserProfile {
  household_size: number;
  has_children: boolean;
  has_elderly: boolean;
  has_pets: boolean;
  city: string;
  county: string;
  garden_size: number;
  experience_level: string;
  climate_zone: string;
}

export function CultivationPlannerMobile({ user, onPlanCreated }: CultivationPlannerMobileProps) {
  const { profile, refreshProfile } = useUserProfile(user);
  const [step, setStep] = useState<'welcome' | 'profile' | 'generating' | 'dashboard' | 'edit-crops' | 'monthly-tasks' | 'grocery' | 'settings' | 'select-plan'>('welcome');
  const [loading, setLoading] = useState(false);
  const [gardenPlan, setGardenPlan] = useState<any>(null);
  const [selectedCrops, setSelectedCrops] = useState<string[]>([]);
  const [cropVolumes, setCropVolumes] = useState<Record<string, number>>({});
  const [adjustableGardenSize, setAdjustableGardenSize] = useState(50);
  const [cultivationIntensity, setCultivationIntensity] = useState<'low' | 'medium' | 'high'>('medium');
  const [realTimeStats, setRealTimeStats] = useState<any>(null);
  const [savedPlans, setSavedPlans] = useState<any[]>([]);
  
  const [profileData, setProfileData] = useState<UserProfile>({
    household_size: 1,
    has_children: false,
    has_elderly: false,
    has_pets: false,
    city: '',
    county: '',
    garden_size: 50,
    experience_level: 'beginner',
    climate_zone: 'Svealand'
  });

  // Save plan state
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [planName, setPlanName] = useState('');
  const [currentPlanName, setCurrentPlanName] = useState(''); // Display name for loaded plan
  const [saveToCalendar, setSaveToCalendar] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      setProfileData({
        household_size: profile.household_size || 1,
        has_children: profile.has_children || false,
        has_elderly: profile.has_elderly || false,
        has_pets: profile.has_pets || false,
        city: profile.city || '',
        county: profile.county || '',
        garden_size: 50,
        experience_level: 'beginner',
        climate_zone: profile.county ? getClimateZoneFromCounty(profile.county) : 'Svealand'
      });
    }
  }, [profile]);

  // Load all saved plans on mount
  useEffect(() => {
    const loadSavedPlans = async () => {
      if (!user?.id) return;

      try {
        // Load all plans
        const { data: allPlans, error: allError } = await supabase
          .from('cultivation_plans')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (allPlans && !allError) {
          setSavedPlans(allPlans);
        }

        // Load primary plan
        const { data, error } = await supabase
          .from('cultivation_plans')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_primary', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (data && !error) {
          loadPlanData(data);
          setStep('dashboard');
        }
      } catch (error) {
        console.error('Error loading saved plans:', error);
      }
    };

    loadSavedPlans();
  }, [user?.id]);

  // Helper function to load plan data
  const loadPlanData = (data: any) => {
    const planData = data.plan_data || {};
    
    if (planData.gardenPlan) setGardenPlan(planData.gardenPlan);
    if (planData.selectedCrops) setSelectedCrops(planData.selectedCrops);
    if (planData.cropVolumes) setCropVolumes(planData.cropVolumes);
    if (planData.adjustableGardenSize) setAdjustableGardenSize(planData.adjustableGardenSize);
    if (planData.cultivationIntensity) setCultivationIntensity(planData.cultivationIntensity);
    if (planData.realTimeStats) setRealTimeStats(planData.realTimeStats);
    if (planData.profile) setProfileData(planData.profile);
    
    const displayName = planData.name || data.title || 'Min Odlingsplan';
    setCurrentPlanName(displayName);
  };

  // Load a specific plan
  const loadSpecificPlan = async (planId: string) => {
    try {
      const { data, error } = await supabase
        .from('cultivation_plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (data && !error) {
        loadPlanData(data);
        setStep('dashboard');
      }
    } catch (error) {
      console.error('Error loading plan:', error);
    }
  };

  // Delete a plan
  const deletePlan = async (planId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent loading the plan when clicking delete

    if (!confirm('Är du säker på att du vill ta bort denna odlingsplan?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('cultivation_plans')
        .delete()
        .eq('id', planId);

      if (error) {
        console.error('Error deleting plan:', error);
        alert('Kunde inte ta bort planen');
        return;
      }

      // Remove from local state
      setSavedPlans(prev => prev.filter(p => p.id !== planId));

      // If we deleted the current plan, reset to welcome screen
      if (savedPlans.find(p => p.id === planId)?.is_primary) {
        setGardenPlan(null);
        setSelectedCrops([]);
        setCropVolumes({});
        setCurrentPlanName('');
        setStep('welcome');
      }

      // If no plans left, go to welcome
      if (savedPlans.length <= 1) {
        setStep('welcome');
      }
    } catch (error) {
      console.error('Error deleting plan:', error);
      alert('Kunde inte ta bort planen');
    }
  };

  // Recalculate stats when crops/volumes/intensity change
  useEffect(() => {
    if (gardenPlan && selectedCrops.length > 0) {
      const production = calculateGardenProduction(
        selectedCrops,
        adjustableGardenSize,
        cultivationIntensity,
        cropVolumes,
        gardenPlan
      );

      const dailyCaloriesPerPerson = 2000;
      const annualCalorieNeed = profileData.household_size * dailyCaloriesPerPerson * 365;
      const selfSufficiencyPercent = Math.round((production.calories / annualCalorieNeed) * 100);

      setRealTimeStats({
        gardenProduction: production.calories,
        selfSufficiencyPercent,
        caloriesFromGroceries: Math.max(0, annualCalorieNeed - production.calories),
        totalCost: production.cost,
        totalSpace: production.spaceUsed
      });
    }
  }, [selectedCrops, cropVolumes, adjustableGardenSize, cultivationIntensity, gardenPlan, profileData.household_size]);

  const generatePlan = async () => {
    setStep('generating');
    setLoading(true);

    try {
      // Generate a default plan with all crops selected
      const allCrops = [
        'Potatis', 'Morötter', 'Tomater', 'Sallad', 'Lök', 'Kål',
        'Vitkål', 'Broccoli', 'Pumpa', 'Squash', 'Gurka', 'Paprika',
        'Äpple', 'Jordgubbar', 'Hallon', 'Krusbär', 'Blåbär', 'Dill',
        'Persilja', 'Basilika'
      ];

      // Create default volumes (number of plants per crop)
      const defaultVolumes: Record<string, number> = {};
      allCrops.forEach(crop => {
        defaultVolumes[crop] = Math.floor(profileData.garden_size / 10); // Simple distribution
      });

      const plan = await generateAIGardenPlan(
        {
          household_size: profileData.household_size,
          has_children: profileData.has_children,
          has_elderly: profileData.has_elderly,
          has_pets: profileData.has_pets,
          city: profileData.city,
          county: profileData.county,
          address: '',
          allergies: '',
          special_needs: '',
          garden_size: profileData.garden_size,
          experience_level: (profileData.experience_level || 'beginner') as 'beginner' | 'intermediate' | 'advanced',
          climate_zone: (profileData.climate_zone || 'Svealand') as 'Götaland' | 'Svealand' | 'Norrland'
        },
        profileData.garden_size,
        allCrops,
        'medium',
        defaultVolumes
      );
      
      setGardenPlan(plan);
      setSelectedCrops(allCrops);
      setCropVolumes(defaultVolumes);
      setAdjustableGardenSize(profileData.garden_size);
      setStep('dashboard');
      
      if (onPlanCreated) {
        onPlanCreated(plan);
      }
    } catch (error) {
      console.error('Error generating plan:', error);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const recalculatePlan = async () => {
    if (!gardenPlan) return;
    
    setLoading(true);
    try {
      const plan = await generateAIGardenPlan(
        {
          household_size: profileData.household_size,
          has_children: profileData.has_children,
          has_elderly: profileData.has_elderly,
          has_pets: profileData.has_pets,
          city: profileData.city,
          county: profileData.county,
          address: '',
          allergies: '',
          special_needs: '',
          garden_size: profileData.garden_size,
          experience_level: (profileData.experience_level || 'beginner') as 'beginner' | 'intermediate' | 'advanced',
          climate_zone: (profileData.climate_zone || 'Svealand') as 'Götaland' | 'Svealand' | 'Norrland'
        },
        adjustableGardenSize,
        selectedCrops,
        cultivationIntensity,
        cropVolumes
      );
      
      setGardenPlan(plan);
    } catch (error) {
      console.error('Error recalculating plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePlan = async () => {
    if (!planName.trim()) {
      alert('Vänligen ange ett plannamn');
      return;
    }

    try {
      const planData = {
        plan_data: {
          name: planName,
          profile: profileData,
          gardenPlan,
          selectedCrops,
          cropVolumes,
          adjustableGardenSize,
          cultivationIntensity,
          realTimeStats,
          created_at: new Date().toISOString()
        },
        user_id: user?.id
      };

      const { data, error } = await supabase
        .from('cultivation_plans')
        .insert([planData])
        .select()
        .single();

      if (error) {
        console.error('Error saving plan:', error);
        alert('Kunde inte spara planen');
        return;
      }

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setShowSaveModal(false);
      }, 2000);

      // Save to calendar if requested
      if (saveToCalendar) {
        await saveToCalendarEntries();
      }
    } catch (error) {
      console.error('Error saving plan:', error);
      alert('Kunde inte spara planen');
    }
  };

  const saveToCalendarEntries = async () => {
    if (!gardenPlan?.monthlyTasks || !user) return;
    
    try {
      await supabase
        .from('cultivation_calendar')
        .delete()
        .eq('user_id', user.id);
      
      const calendarEntries: any[] = [];
      
      gardenPlan.monthlyTasks.forEach((task: any) => {
        if (task.tasks && Array.isArray(task.tasks)) {
          task.tasks.forEach((taskItem: string) => {
            let activity = 'maintenance';
            const taskLower = taskItem.toLowerCase();
            if (taskLower.includes('så')) activity = 'sowing';
            else if (taskLower.includes('plantera')) activity = 'planting';
            else if (taskLower.includes('skörda')) activity = 'harvesting';
            
            calendarEntries.push({
              user_id: user.id,
              crop_name: task.month || 'Allmän aktivitet',
              crop_type: 'general',
              month: task.month || '',
              activity,
              climate_zone: profileData.climate_zone,
              garden_size: String(adjustableGardenSize),
              is_completed: false,
              notes: taskItem
            });
          });
        }
      });
      
      if (calendarEntries.length > 0) {
        await supabase
          .from('cultivation_calendar')
          .insert(calendarEntries);
      }
    } catch (error) {
      console.error('Error saving to calendar:', error);
    }
  };

  const resetPlan = () => {
    if (confirm('Är du säker på att du vill börja om med en ny plan?')) {
      setGardenPlan(null);
      setSelectedCrops([]);
      setCropVolumes({});
      setRealTimeStats(null);
      setStep('profile');
    }
  };

  const updateCropVolume = (cropName: string, change: number) => {
    setCropVolumes(prev => {
      const current = prev[cropName] || 0;
      const newValue = Math.max(0, current + change);
      return { ...prev, [cropName]: newValue };
    });
  };

  const removeCrop = (cropName: string) => {
    setSelectedCrops(prev => prev.filter(c => c !== cropName));
    setCropVolumes(prev => {
      const { [cropName]: _, ...rest } = prev;
      return rest;
    });
  };

  // Plan Selection Screen
  if (step === 'select-plan') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#5C6B47]/5 to-[#707C5F]/5">
        <div className="bg-gradient-to-br from-[#3D4A2B] to-[#2A331E] text-white px-6 py-8 rounded-b-3xl shadow-2xl mb-6">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setStep('dashboard')}
              className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-all active:scale-95 touch-manipulation"
            >
              <ArrowRight size={20} className="rotate-180" />
            </button>
            <h1 className="text-2xl font-bold flex-1">Välj Odlingsplan</h1>
          </div>
          <p className="text-white/80 text-sm">Du har {savedPlans.length} sparade planer</p>
        </div>

        <div className="px-6 space-y-4 pb-32">
          {savedPlans.map((plan) => {
            const planData = plan.plan_data || {};
            const displayName = planData.name || plan.title || 'Namnlös plan';
            const isPrimary = plan.is_primary;
            const createdAt = new Date(plan.created_at).toLocaleDateString('sv-SE');
            const cropCount = planData.selectedCrops?.length || 0;

            return (
              <div key={plan.id} className="relative">
                <button
                  onClick={() => loadSpecificPlan(plan.id)}
                  className={`w-full bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all touch-manipulation active:scale-98 text-left ${
                    isPrimary ? 'ring-2 ring-[#3D4A2B]' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-lg text-gray-900">{displayName}</h3>
                        {isPrimary && (
                          <span className="px-2 py-1 bg-[#3D4A2B] text-white text-xs font-bold rounded-full">
                            Aktiv
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">Skapad {createdAt}</p>
                    </div>
                    <ChevronRight size={20} className="text-gray-400 mt-1" strokeWidth={2} />
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <Leaf size={16} className="text-green-600" strokeWidth={2} />
                      <span className="text-gray-700">{cropCount} grödor</span>
                    </div>
                    {planData.realTimeStats?.selfSufficiencyPercent && (
                      <div className="flex items-center gap-2">
                        <TrendingUp size={16} className="text-blue-600" strokeWidth={2} />
                        <span className="text-gray-700">{planData.realTimeStats.selfSufficiencyPercent}% självförsörjning</span>
                      </div>
                    )}
                  </div>
                </button>

                {/* Delete Button */}
                <button
                  onClick={(e) => deletePlan(plan.id, e)}
                  className="absolute top-4 right-4 p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-all touch-manipulation active:scale-95 z-10"
                  aria-label="Ta bort plan"
                >
                  <Trash2 size={18} strokeWidth={2} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Welcome Screen
  if (step === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex flex-col items-center justify-center p-6">
        <div className="text-center mb-12">
          <div className="inline-block p-6 bg-gradient-to-br from-[#3D4A2B] to-[#2A331E] rounded-full mb-8 shadow-2xl">
            <Sprout size={64} className="text-white" strokeWidth={2} />
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Din Odlingsplan
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
            Låt AI skapa en personlig odlingsplan baserad på din trädgård och din familj
          </p>

          <div className="space-y-4 max-w-md mx-auto mb-12">
            {[
              { icon: Users, text: 'Anpassad för din familj' },
              { icon: MapPin, text: 'Baserad på ditt klimat' },
              { icon: Sparkles, text: 'AI-driven smart planering' },
              { icon: Heart, text: 'Fokus på självförsörjning' }
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-lg">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#3D4A2B]/10 rounded-full flex items-center justify-center">
                    <Icon size={24} className="text-[#3D4A2B]" />
                  </div>
                  <span className="text-left font-medium text-gray-800">{item.text}</span>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => setStep('profile')}
            className="w-full max-w-md bg-gradient-to-r from-[#556B2F] to-[#3D4A2B] text-white py-5 px-8 rounded-2xl font-bold text-lg hover:shadow-2xl transition-all touch-manipulation active:scale-98 flex items-center justify-center gap-2"
          >
            <span>Kom igång</span>
            <ArrowRight size={24} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    );
  }

  // Profile Setup Screen  
  if (step === 'profile') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#5C6B47]/5 to-[#707C5F]/5 p-6">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 h-2 bg-[#3D4A2B] rounded-full" />
            <div className="flex-1 h-2 bg-gray-200 rounded-full" />
            <div className="flex-1 h-2 bg-gray-200 rounded-full" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Din trädgård</h2>
          <p className="text-gray-600">Berätta om dina förutsättningar</p>
        </div>

        <div className="space-y-6">
          {/* Family Size */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <label className="block text-sm font-bold text-gray-700 mb-4">
              👨‍👩‍👧‍👦 Hur många är ni i familjen?
            </label>
            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                <button
                  key={num}
                  onClick={() => setProfileData({ ...profileData, household_size: num })}
                  className={`py-4 rounded-xl font-bold text-lg transition-all touch-manipulation active:scale-95 ${
                    profileData.household_size === num
                      ? 'bg-[#3D4A2B] text-white scale-105 shadow-lg'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Garden Size */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <label className="block text-sm font-bold text-gray-700 mb-4">
              🌱 Hur stor är din odlingsyta?
            </label>
            <div className="space-y-3">
              {[
                { value: 10, label: 'Liten (10m²)', emoji: '🪴', desc: 'Balkong/Lådor' },
                { value: 30, label: 'Medel (30m²)', emoji: '🏡', desc: 'Liten trädgård' },
                { value: 50, label: 'Stor (50m²)', emoji: '🌳', desc: 'Medelstor trädgård' },
                { value: 100, label: 'XL (100m²)', emoji: '🏞️', desc: 'Stor trädgård' }
              ].map(size => (
                <button
                  key={size.value}
                  onClick={() => setProfileData({ ...profileData, garden_size: size.value })}
                  className={`w-full p-4 rounded-xl transition-all touch-manipulation active:scale-98 ${
                    profileData.garden_size === size.value
                      ? 'bg-[#3D4A2B] text-white shadow-lg'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{size.emoji}</span>
                    <div className="flex-1 text-left">
                      <div className="font-bold">{size.label}</div>
                      <div className={`text-sm ${
                        profileData.garden_size === size.value ? 'text-white/80' : 'text-gray-600'
                      }`}>
                        {size.desc}
                      </div>
                    </div>
                    {profileData.garden_size === size.value && (
                      <Check size={24} strokeWidth={2.5} />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Experience Level */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <label className="block text-sm font-bold text-gray-700 mb-4">
              ⭐ Din erfarenhet av odling
            </label>
            <div className="space-y-3">
              {[
                { value: 'beginner', label: 'Nybörjare', emoji: '🌱', desc: 'Första året' },
                { value: 'intermediate', label: 'Erfaren', emoji: '🌿', desc: '2-5 år' },
                { value: 'advanced', label: 'Expert', emoji: '🌳', desc: '5+ år' }
              ].map(level => (
                <button
                  key={level.value}
                  onClick={() => setProfileData({ ...profileData, experience_level: level.value })}
                  className={`w-full p-4 rounded-xl transition-all touch-manipulation active:scale-98 ${
                    profileData.experience_level === level.value
                      ? 'bg-[#3D4A2B] text-white shadow-lg'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{level.emoji}</span>
                    <div className="flex-1 text-left">
                      <div className="font-bold">{level.label}</div>
                      <div className={`text-sm ${
                        profileData.experience_level === level.value ? 'text-white/80' : 'text-gray-600'
                      }`}>
                        {level.desc}
                      </div>
                    </div>
                    {profileData.experience_level === level.value && (
                      <Check size={24} strokeWidth={2.5} />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="fixed bottom-16 left-0 right-0 p-6 bg-white/95 backdrop-blur-sm border-t border-gray-200">
          <button
            onClick={generatePlan}
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#556B2F] to-[#3D4A2B] text-white py-5 px-6 rounded-2xl font-bold text-lg hover:shadow-2xl transition-all touch-manipulation active:scale-98 flex items-center justify-center gap-2"
          >
            <Sparkles size={24} strokeWidth={2.5} />
            <span>Skapa min odlingsplan</span>
            <ArrowRight size={24} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    );
  }

  // Generating Screen
  if (step === 'generating') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <div className="relative mb-12">
            <div className="w-32 h-32 bg-gradient-to-br from-[#3D4A2B] to-[#2A331E] rounded-full flex items-center justify-center animate-pulse">
              <Sparkles size={64} className="text-white" strokeWidth={2} />
            </div>
            <div className="absolute -inset-4 border-4 border-[#3D4A2B] rounded-full animate-ping opacity-20" />
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            AI skapar din plan
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
            Vi analyserar dina förutsättningar och skapar en perfekt odlingsplan
          </p>

          <div className="space-y-4 max-w-md mx-auto">
            {[
              '🌍 Anpassar för ditt klimat...',
              '👨‍👩‍👧‍👦 Beräknar för din familj...',
              '🌱 Väljer bästa grödorna...',
              '📅 Planerar månadsvis...',
              '✨ Optimerar självförsörjning...'
            ].map((text, index) => (
              <div 
                key={index} 
                className="bg-white rounded-xl p-4 shadow-lg animate-fade-in"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <p className="font-medium text-gray-800">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Dashboard Screen
  if (step === 'dashboard' && gardenPlan) {
    const stats = realTimeStats || {
      selfSufficiencyPercent: gardenPlan.selfSufficiencyPercent || 0,
      gardenProduction: gardenPlan.gardenProduction || 0,
      caloriesFromGroceries: gardenPlan.caloriesFromGroceries || 0,
      totalCost: gardenPlan.estimatedCost || 0,
      totalSpace: gardenPlan.totalSpace || profileData.garden_size
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#5C6B47]/5 to-[#707C5F]/5">
        {/* Hero Header */}
        <div className="bg-gradient-to-br from-[#3D4A2B] to-[#2A331E] text-white px-6 py-8 rounded-b-3xl shadow-2xl mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Sprout size={32} className="text-white" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-1">{currentPlanName || 'Din Odlingsplan'}</h1>
              <p className="text-white/80 text-sm">{profileData.climate_zone} • {adjustableGardenSize}m²</p>
            </div>
            <button 
              onClick={() => setStep('settings')}
              className="p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-all active:scale-95 touch-manipulation"
            >
              <Sliders size={20} />
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
              <div className="text-4xl font-bold mb-1">{stats.selfSufficiencyPercent}%</div>
              <div className="text-white/80 text-sm">Självförsörjning</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
              <div className="text-4xl font-bold mb-1">{selectedCrops.length}</div>
              <div className="text-white/80 text-sm">Olika grödor</div>
            </div>
          </div>

          {/* Cultivation Intensity */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Odlingsintensitet</span>
              <span className="text-xs px-3 py-1 bg-white/20 rounded-full">
                {cultivationIntensity === 'low' && 'Låg'}
                {cultivationIntensity === 'medium' && 'Medel'}
                {cultivationIntensity === 'high' && 'Hög'}
              </span>
            </div>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as const).map(intensity => (
                <button
                  key={intensity}
                  onClick={() => setCultivationIntensity(intensity)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all touch-manipulation active:scale-95 ${
                    cultivationIntensity === intensity
                      ? 'bg-white text-[#3D4A2B]'
                      : 'bg-white/20 text-white/70'
                  }`}
                >
                  {intensity === 'low' && 'Låg'}
                  {intensity === 'medium' && 'Medel'}
                  {intensity === 'high' && 'Hög'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-6 mb-6">
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setStep('edit-crops')}
              className="bg-white rounded-2xl p-4 shadow-lg text-center hover:shadow-xl transition-all touch-manipulation active:scale-98"
            >
              <Leaf className="w-8 h-8 mx-auto mb-2 text-[#3D4A2B]" />
              <div className="text-xs font-bold text-gray-900">Anpassa grödor</div>
            </button>
            <button
              onClick={() => setStep('monthly-tasks')}
              className="bg-white rounded-2xl p-4 shadow-lg text-center hover:shadow-xl transition-all touch-manipulation active:scale-98"
            >
              <CalendarIcon className="w-8 h-8 mx-auto mb-2 text-[#3D4A2B]" />
              <div className="text-xs font-bold text-gray-900">Månatliga uppgifter</div>
            </button>
            <button
              onClick={() => setStep('grocery')}
              className="bg-white rounded-2xl p-4 shadow-lg text-center hover:shadow-xl transition-all touch-manipulation active:scale-98"
            >
              <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-[#3D4A2B]" />
              <div className="text-xs font-bold text-gray-900">Matvaror</div>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="px-6 mb-6 space-y-3">
          <div className="bg-white rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Produktion per år</div>
                  <div className="text-xl font-bold text-gray-900">{Math.round(stats.gardenProduction / 1000)}k kcal</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Uppskattad kostnad</div>
                  <div className="text-xl font-bold text-gray-900">{stats.totalCost} kr</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Maximize2 className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Använd yta</div>
                  <div className="text-xl font-bold text-gray-900">{stats.totalSpace.toFixed(1)}m² / {adjustableGardenSize}m²</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Crops Preview */}
        <div className="px-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Dina grödor</h2>
            <button
              onClick={() => setStep('edit-crops')}
              className="text-sm font-medium text-[#3D4A2B] flex items-center gap-1"
            >
              Se alla <ChevronRight size={16} />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {selectedCrops.slice(0, 8).map((cropName) => {
              const crop = gardenPlan.crops?.find((c: any) => c.name === cropName);
              if (!crop) return null;
              return (
                <div key={cropName} className="bg-white rounded-xl p-3 shadow text-center">
                  <div className="text-3xl mb-1">{crop.icon || '🌱'}</div>
                  <div className="text-xs font-medium text-gray-700 truncate">{crop.name}</div>
                </div>
              );
            })}
          </div>
          {selectedCrops.length > 8 && (
            <button
              onClick={() => setStep('edit-crops')}
              className="w-full mt-3 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all touch-manipulation active:scale-98"
            >
              +{selectedCrops.length - 8} fler grödor
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="px-6 space-y-3 pb-6">
          <button
            onClick={() => setShowSaveModal(true)}
            className="w-full bg-gradient-to-r from-[#556B2F] to-[#3D4A2B] text-white py-5 px-6 rounded-2xl font-bold hover:shadow-2xl transition-all touch-manipulation active:scale-98 flex items-center justify-center gap-2"
          >
            <Save size={24} strokeWidth={2.5} />
            <span>Spara planen</span>
          </button>

          <button
            onClick={resetPlan}
            className="w-full bg-white border-2 border-[#3D4A2B] text-[#3D4A2B] py-5 px-6 rounded-2xl font-bold hover:bg-[#3D4A2B] hover:text-white transition-all touch-manipulation active:scale-98 flex items-center justify-center gap-2"
          >
            <RefreshCw size={24} strokeWidth={2.5} />
            <span>Ny plan</span>
          </button>
        </div>

        {/* Save Modal */}
        {showSaveModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end animate-fade-in">
            <div className="bg-white rounded-t-3xl p-6 w-full animate-slide-in-bottom">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Spara odlingsplan</h3>
              
              {saveSuccess ? (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-10 h-10 text-green-600" />
                  </div>
                  <p className="text-lg font-bold text-gray-900">Planen är sparad!</p>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Namn på planen..."
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 focus:border-[#3D4A2B] outline-none text-lg mb-4"
                  />

                  <label className="flex items-center gap-3 mb-6">
                    <input
                      type="checkbox"
                      checked={saveToCalendar}
                      onChange={(e) => setSaveToCalendar(e.target.checked)}
                      className="w-6 h-6 rounded border-2 border-gray-300 text-[#3D4A2B] focus:ring-[#3D4A2B]"
                    />
                    <span className="text-gray-700">Spara också till odlingskalender</span>
                  </label>

                  <div className="space-y-3">
                    <button
                      onClick={savePlan}
                      className="w-full bg-gradient-to-r from-[#556B2F] to-[#3D4A2B] text-white py-4 px-6 rounded-xl font-bold hover:shadow-xl transition-all touch-manipulation active:scale-98"
                    >
                      Spara
                    </button>
                    <button
                      onClick={() => setShowSaveModal(false)}
                      className="w-full bg-gray-100 text-gray-700 py-4 px-6 rounded-xl font-bold hover:bg-gray-200 transition-all touch-manipulation active:scale-98"
                    >
                      Avbryt
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Edit Crops Screen
  if (step === 'edit-crops' && gardenPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#5C6B47]/5 to-[#707C5F]/5">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#3D4A2B] to-[#2A331E] text-white px-6 py-8 rounded-b-3xl shadow-2xl mb-6">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setStep('dashboard')}
              className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-all active:scale-95 touch-manipulation"
            >
              <ArrowRight size={20} className="rotate-180" />
            </button>
            <h1 className="text-2xl font-bold flex-1">Anpassa Grödor</h1>
          </div>
          <p className="text-white/80 text-sm">
            Justera antal plantor per gröda eller ta bort grödor
          </p>
        </div>

        {/* Crops List */}
        <div className="px-6 space-y-3">
          {selectedCrops.map(cropName => {
            const crop = gardenPlan.crops?.find((c: any) => c.name === cropName);
            const volume = cropVolumes[cropName] || 0;

            if (!crop) return null;

            return (
              <div key={cropName} className="bg-white rounded-2xl p-5 shadow-lg">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-4xl">{crop.icon || '🌱'}</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900">{crop.name}</h3>
                    <p className="text-sm text-gray-600">
                      {crop.spaceRequired}m² per växt
                    </p>
                  </div>
                  <button
                    onClick={() => removeCrop(cropName)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all touch-manipulation active:scale-95"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Volume Controls */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateCropVolume(cropName, -1)}
                    disabled={volume === 0}
                    className="p-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all touch-manipulation active:scale-95"
                  >
                    <Minus size={20} strokeWidth={2.5} />
                  </button>

                  <div className="flex-1 bg-[#3D4A2B]/10 rounded-xl py-4 text-center">
                    <div className="text-3xl font-bold text-[#3D4A2B]">{volume}</div>
                    <div className="text-xs text-gray-600 mt-1">plantor</div>
                  </div>

                  <button
                    onClick={() => updateCropVolume(cropName, 1)}
                    className="p-3 bg-[#3D4A2B] text-white rounded-xl hover:bg-[#2A331E] transition-all touch-manipulation active:scale-95"
                  >
                    <Plus size={20} strokeWidth={2.5} />
                  </button>
                </div>

                {/* Space Info */}
                <div className="mt-3 text-center text-sm text-gray-600">
                  Total yta: <span className="font-bold text-[#3D4A2B]">
                    {(volume * (crop.spaceRequired || 0)).toFixed(1)}m²
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Actions */}
        <div className="fixed bottom-16 left-0 right-0 p-6 bg-white/95 backdrop-blur-sm border-t border-gray-200 space-y-3">
          <div className="bg-[#3D4A2B]/10 rounded-2xl p-4 mb-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Total yta använd:</span>
              <span className="text-lg font-bold text-[#3D4A2B]">
                {selectedCrops.reduce((sum, cropName) => {
                  const crop = gardenPlan.crops?.find((c: any) => c.name === cropName);
                  const volume = cropVolumes[cropName] || 0;
                  return sum + (volume * (crop?.spaceRequired || 0));
                }, 0).toFixed(1)}m² / {profileData.garden_size}m²
              </span>
            </div>
          </div>

          <button
            onClick={async () => {
              await recalculatePlan();
              setStep('dashboard');
            }}
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#556B2F] to-[#3D4A2B] text-white py-5 px-6 rounded-2xl font-bold hover:shadow-2xl transition-all touch-manipulation active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
                <span>Beräknar om...</span>
              </>
            ) : (
              <>
                <Check size={24} strokeWidth={2.5} />
                <span>Uppdatera plan</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Monthly Tasks Screen
  if (step === 'monthly-tasks' && gardenPlan) {
    const monthlyTasks = gardenPlan.monthlyTasks || generateMonthlyTasks(selectedCrops, gardenPlan, cropVolumes);

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#5C6B47]/5 to-[#707C5F]/5 pb-6">
        <div className="bg-gradient-to-br from-[#3D4A2B] to-[#2A331E] text-white px-6 py-8 rounded-b-3xl shadow-2xl mb-6">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setStep('dashboard')}
              className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-all active:scale-95 touch-manipulation"
            >
              <ArrowRight size={20} className="rotate-180" />
            </button>
            <h1 className="text-2xl font-bold flex-1">Månatliga uppgifter</h1>
          </div>
          <p className="text-white/80 text-sm">
            Uppgifter för varje månad i odlingssäsongen
          </p>
        </div>

        <div className="px-6 space-y-4">
          {monthlyTasks.map((task: any, index: number) => (
            <div key={index} className="bg-white rounded-2xl p-5 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-[#3D4A2B]/10 rounded-full flex items-center justify-center">
                  <CalendarIcon className="w-6 h-6 text-[#3D4A2B]" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">{task.month}</h3>
              </div>
              <ul className="space-y-2">
                {task.tasks && task.tasks.map((taskItem: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-700">
                    <span className="text-[#3D4A2B] mt-1">•</span>
                    <span className="flex-1">{taskItem}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Grocery Suggestions Screen
  if (step === 'grocery' && gardenPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#5C6B47]/5 to-[#707C5F]/5 pb-6">
        <div className="bg-gradient-to-br from-[#3D4A2B] to-[#2A331E] text-white px-6 py-8 rounded-b-3xl shadow-2xl mb-6">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setStep('dashboard')}
              className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-all active:scale-95 touch-manipulation"
            >
              <ArrowRight size={20} className="rotate-180" />
            </button>
            <h1 className="text-2xl font-bold flex-1">Matvaror att köpa</h1>
          </div>
          <p className="text-white/80 text-sm">
            Kompletterande matvaror för fullständig näring
          </p>
        </div>

        <div className="px-6 space-y-3">
          {gardenPlan.grocerySuggestions && gardenPlan.grocerySuggestions.map((suggestion: string, index: number) => (
            <div key={index} className="bg-white rounded-2xl p-5 shadow-lg flex items-start gap-4">
              <div className="w-10 h-10 bg-[#3D4A2B]/10 rounded-full flex items-center justify-center flex-shrink-0">
                <ShoppingCart className="w-5 h-5 text-[#3D4A2B]" />
              </div>
              <p className="flex-1 text-gray-700 leading-relaxed">{suggestion}</p>
            </div>
          ))}

          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-5 mt-6">
            <div className="flex items-start gap-3">
              <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-blue-900 mb-2">Tips!</h4>
                <p className="text-sm text-blue-800">
                  Din trädgård täcker {realTimeStats?.selfSufficiencyPercent || gardenPlan.selfSufficiencyPercent}% av ditt årliga kaloriebehov. 
                  Komplettera med dessa matvaror för en balanserad kost.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Settings Screen
  if (step === 'settings' && gardenPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#5C6B47]/5 to-[#707C5F]/5">
        <div className="bg-gradient-to-br from-[#3D4A2B] to-[#2A331E] text-white px-6 py-8 rounded-b-3xl shadow-2xl mb-6">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setStep('dashboard')}
              className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-all active:scale-95 touch-manipulation"
            >
              <ArrowRight size={20} className="rotate-180" />
            </button>
            <h1 className="text-2xl font-bold flex-1">Inställningar</h1>
          </div>
        </div>

        <div className="px-6 space-y-6">
          {/* Select Plan Button */}
          {savedPlans.length > 0 && (
            <button
              onClick={() => setStep('select-plan')}
              className="w-full bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all touch-manipulation active:scale-98 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Leaf size={24} className="text-blue-600" strokeWidth={2} />
                </div>
                <div className="text-left">
                  <div className="font-bold text-gray-900">Byt odlingsplan</div>
                  <div className="text-sm text-gray-600">{savedPlans.length} sparade planer</div>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-400" strokeWidth={2} />
            </button>
          )}

          {/* Garden Size Slider */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <label className="block text-sm font-bold text-gray-700 mb-4">
              🌳 Odlingsyta: {adjustableGardenSize}m²
            </label>
            <input
              type="range"
              min="10"
              max="200"
              step="5"
              value={adjustableGardenSize}
              onChange={(e) => setAdjustableGardenSize(Number(e.target.value))}
              className="w-full h-3 bg-gray-200 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #3D4A2B 0%, #3D4A2B ${(adjustableGardenSize - 10) / 190 * 100}%, #e5e7eb ${(adjustableGardenSize - 10) / 190 * 100}%, #e5e7eb 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>10m²</span>
              <span>200m²</span>
            </div>
          </div>

          {/* Cultivation Intensity */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <label className="block text-sm font-bold text-gray-700 mb-4">
              ⚡ Odlingsintensitet
            </label>
            <div className="space-y-3">
              {[
                { value: 'low' as const, label: 'Låg', emoji: '🌱', desc: 'Mindre underhåll, lägre skörd' },
                { value: 'medium' as const, label: 'Medel', emoji: '🌿', desc: 'Balanserat mellan arbete och skörd' },
                { value: 'high' as const, label: 'Hög', emoji: '🌳', desc: 'Mer arbete, högre skörd' }
              ].map(intensity => (
                <button
                  key={intensity.value}
                  onClick={() => setCultivationIntensity(intensity.value)}
                  className={`w-full p-4 rounded-xl transition-all touch-manipulation active:scale-98 ${
                    cultivationIntensity === intensity.value
                      ? 'bg-[#3D4A2B] text-white shadow-lg'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{intensity.emoji}</span>
                    <div className="flex-1 text-left">
                      <div className="font-bold">{intensity.label}</div>
                      <div className={`text-sm ${
                        cultivationIntensity === intensity.value ? 'text-white/80' : 'text-gray-600'
                      }`}>
                        {intensity.desc}
                      </div>
                    </div>
                    {cultivationIntensity === intensity.value && (
                      <Check size={24} strokeWidth={2.5} />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Profile Info */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-sm font-bold text-gray-700 mb-4">👨‍👩‍👧‍👦 Din profil</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Familj:</span>
                <span className="font-medium text-gray-900">{profileData.household_size} personer</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Klimatzon:</span>
                <span className="font-medium text-gray-900">{profileData.climate_zone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Erfarenhet:</span>
                <span className="font-medium text-gray-900">
                  {profileData.experience_level === 'beginner' && 'Nybörjare'}
                  {profileData.experience_level === 'intermediate' && 'Erfaren'}
                  {profileData.experience_level === 'advanced' && 'Expert'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Apply Button */}
        <div className="fixed bottom-16 left-0 right-0 p-6 bg-white/95 backdrop-blur-sm border-t border-gray-200">
          <button
            onClick={async () => {
              await recalculatePlan();
              setStep('dashboard');
            }}
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#556B2F] to-[#3D4A2B] text-white py-5 px-6 rounded-2xl font-bold hover:shadow-2xl transition-all touch-manipulation active:scale-98 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
                <span>Uppdaterar...</span>
              </>
            ) : (
              <>
                <Check size={24} strokeWidth={2.5} />
                <span>Tillämpa ändringar</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return null;
}

