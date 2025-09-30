'use client';

import { useState, useEffect } from 'react';
import { useUserProfile } from '@/lib/useUserProfile';
import { OpenAIService } from '@/lib/openai-worker-service';
import { supabase } from '@/lib/supabase';
import { t } from '@/lib/locales';
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
  Calendar,
  Thermometer,
  Droplets,
  TrendingUp,
  Package,
  Zap,
  Edit3,
  Plus,
  Trash2,
  Save
} from 'lucide-react';

interface NutritionProfile {
  householdSize: number;
  ageGroups: {
    children: number;
    adults: number;
    elderly: number;
  };
  activityLevel: 'sedentary' | 'moderate' | 'active';
  specialNeeds: string[];
  crisisMode: boolean;
  targetSelfSufficiency: number;
}

interface CropRecommendation {
  crop: string;
  suitability: 'excellent' | 'good' | 'moderate' | 'challenging';
  season: string[];
  yield: number; // kg per m²
  nutritionValue: any;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  localTips: string[];
  spaceRequired: number; // m²
  costPerM2: number;
}

interface GapAnalysis {
  nutritionalGaps: {
    nutrient: string;
    current: number;
    needed: number;
    gap: number;
    solutions: string[];
  }[];
  groceryNeeds: {
    item: string;
    quantity: number;
    unit: string;
    estimatedCost: number;
    priority: 'high' | 'medium' | 'low';
    alternatives: string[];
  }[];
  totalEstimatedCost: number;
  costBreakdown: {
    category: string;
    amount: number;
    percentage: number;
  }[];
}

interface CultivationPlan {
  id: string;
  title: string;
  description: string;
  timeline: string;
  crops: CropRecommendation[];
  nutritionContribution: any;
  gapAnalysis: GapAnalysis;
  estimatedCost: number;
  selfSufficiencyPercent: number;
  nextSteps: string[];
  recommendations: string[];
}

interface EnhancedCultivationPlannerProps {
  user: any;
}

export function EnhancedCultivationPlanner({ user }: EnhancedCultivationPlannerProps) {
  const { profile, refreshProfile } = useUserProfile(user);
  const [currentStep, setCurrentStep] = useState<'profile' | 'nutrition' | 'crops' | 'plan' | 'gaps'>('profile');
  const [loading, setLoading] = useState(false);
  const [cultivationPlan, setCultivationPlan] = useState<CultivationPlan | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [profileUpdateData, setProfileUpdateData] = useState({
    household_size: 1,
    has_children: false,
    has_elderly: false,
    has_pets: false,
    city: '',
    county: '',
    address: '',
    allergies: '',
    special_needs: ''
  });
  const [cropRecommendations, setCropRecommendations] = useState<CropRecommendation[]>([]);
  const [selectedCrops, setSelectedCrops] = useState<string[]>([]);
  const [cropAmounts, setCropAmounts] = useState<Record<string, number>>({});
  const [showAddCropModal, setShowAddCropModal] = useState(false);
  const [showCropLibraryModal, setShowCropLibraryModal] = useState(false);
  const [newCropName, setNewCropName] = useState('');
  const [isFetchingNutrition, setIsFetchingNutrition] = useState(false);
  const [hasExistingPlan, setHasExistingPlan] = useState(false);
  const [existingPlan, setExistingPlan] = useState<CultivationPlan | null>(null);
  const [showSavePlanModal, setShowSavePlanModal] = useState(false);
  const [planName, setPlanName] = useState('');
  const [savedPlans, setSavedPlans] = useState<any[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<any>(null);

  // Update profileUpdateData when profile changes
  useEffect(() => {
    if (profile) {
      setProfileUpdateData({
        household_size: profile.household_size || 1,
        has_children: profile.has_children || false,
        has_elderly: profile.has_elderly || false,
        has_pets: profile.has_pets || false,
        city: profile.city || '',
        county: profile.county || '',
        address: profile.address || '',
        allergies: profile.allergies || '',
        special_needs: profile.special_needs || ''
      });
    }
  }, [profile]);

  // Load existing cultivation plan on mount
  useEffect(() => {
    if (profile?.user_id) {
      loadSavedPlans();
    }
  }, [profile?.user_id]);

  // Check for existing plan and show option to load it
  useEffect(() => {
    if (hasExistingPlan && existingPlan && currentStep === 'profile') {
      // Show a notification that there's an existing plan
      console.log('Existing plan found:', existingPlan);
    }
  }, [hasExistingPlan, existingPlan, currentStep]);

  // Comprehensive crop library
  const cropLibrary = {
    // Pre-added crops (4-6 essential crops that are always loaded)
    preAdded: [
      {
        crop: 'Potatis',
        suitability: 'excellent',
        season: ['april', 'maj', 'juni', 'juli', 'augusti', 'september'],
        yield: 8,
        nutritionValue: { calories: 77, protein: 2.0, vitaminC: 17 },
        difficulty: 'beginner',
        localTips: ['Sätt potatis i april-maj när jorden är varm', 'Högsta skörd i september-oktober'],
        spaceRequired: 4.0, // 4m² for 10 plants (0.4m² per plant)
        costPerM2: 45
      },
      {
        crop: 'Morötter',
        suitability: 'excellent',
        season: ['mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september'],
        yield: 6,
        nutritionValue: { calories: 41, protein: 0.9, vitaminC: 5.9 },
        difficulty: 'beginner',
        localTips: ['Så direkt i marken från mars', 'Fördelar att så i flera omgångar'],
        spaceRequired: 2.0,
        costPerM2: 35
      },
      {
        crop: 'Kål',
        suitability: 'excellent',
        season: ['april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober'],
        yield: 5,
        nutritionValue: { calories: 25, protein: 1.3, vitaminC: 36.6 },
        difficulty: 'intermediate',
        localTips: ['Plantera ut i maj-juni', 'Vattna regelbundet för god skörd'],
        spaceRequired: 1.0,
        costPerM2: 55
      },
      {
        crop: 'Tomater',
        suitability: 'good',
        season: ['maj', 'juni', 'juli', 'augusti', 'september'],
        yield: 4,
        nutritionValue: { calories: 18, protein: 0.9, vitaminC: 13.7 },
        difficulty: 'intermediate',
        localTips: ['Kräver växthus eller skyddad plats', 'Börja inomhus i mars'],
        spaceRequired: 1.5, // 1.5m² for 3 plants (0.5m² per plant)
        costPerM2: 65
      },
      {
        crop: 'Lök',
        suitability: 'excellent',
        season: ['mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september'],
        yield: 7,
        nutritionValue: { calories: 40, protein: 1.1, vitaminC: 7.4 },
        difficulty: 'beginner',
        localTips: ['Sätt löksets i mars-april', 'Lätt att odla och förvara'],
        spaceRequired: 0.2, // 0.2m² for 10 plants (0.02m² per plant)
        costPerM2: 40
      },
      {
        crop: 'Sallad',
        suitability: 'excellent',
        season: ['mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september'],
        yield: 3,
        nutritionValue: { calories: 15, protein: 1.4, vitaminC: 9.2 },
        difficulty: 'beginner',
        localTips: ['Så kontinuerligt från mars', 'Snabbväxande och lättodlad'],
        spaceRequired: 0.2, // 0.2m² for 5 plants (0.04m² per plant)
        costPerM2: 25
      }
    ],
    
    // Additional crops to choose from (10-12 crops)
    library: [
      {
        crop: 'Gurka',
        suitability: 'good',
        season: ['maj', 'juni', 'juli', 'augusti', 'september'],
        yield: 3,
        nutritionValue: { calories: 16, protein: 0.7, vitaminC: 2.8 },
        difficulty: 'intermediate',
        localTips: ['Kräver mycket vatten', 'Bäst i växthus eller skyddad plats'],
        spaceRequired: 4.0, // 4m² for 10 plants (0.4m² per plant)
        costPerM2: 60
      },
      {
        crop: 'Paprika',
        suitability: 'moderate',
        season: ['maj', 'juni', 'juli', 'augusti', 'september'],
        yield: 2,
        nutritionValue: { calories: 31, protein: 1.0, vitaminC: 127.7 },
        difficulty: 'advanced',
        localTips: ['Kräver växthus i Sverige', 'Börja inomhus i februari'],
        spaceRequired: 1.5, // 1.5m² for 3 plants (0.5m² per plant)
        costPerM2: 80
      },
      {
        crop: 'Zucchini',
        suitability: 'good',
        season: ['maj', 'juni', 'juli', 'augusti', 'september'],
        yield: 4,
        nutritionValue: { calories: 17, protein: 1.2, vitaminC: 17.9 },
        difficulty: 'beginner',
        localTips: ['Lätt att odla, stor skörd', 'Så direkt i marken i maj'],
        spaceRequired: 1.0, // 1m² for 2 plants (0.5m² per plant)
        costPerM2: 50
      },
      {
        crop: 'Ärtor',
        suitability: 'excellent',
        season: ['mars', 'april', 'maj', 'juni', 'juli'],
        yield: 2,
        nutritionValue: { calories: 81, protein: 5.4, vitaminC: 40 },
        difficulty: 'beginner',
        localTips: ['Så tidigt i mars-april', 'Frosthärdiga och lättodlade'],
        spaceRequired: 2.0,
        costPerM2: 30
      },
      {
        crop: 'Bönor',
        suitability: 'good',
        season: ['maj', 'juni', 'juli', 'augusti', 'september'],
        yield: 3,
        nutritionValue: { calories: 31, protein: 1.8, vitaminC: 12.2 },
        difficulty: 'beginner',
        localTips: ['Så efter frost i maj', 'Kräver stöd för klättrande sorter'],
        spaceRequired: 1.5, // 1.5m² for 3 plants (0.5m² per plant)
        costPerM2: 35
      },
      {
        crop: 'Spenat',
        suitability: 'excellent',
        season: ['mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september'],
        yield: 2,
        nutritionValue: { calories: 23, protein: 2.9, vitaminC: 28.1 },
        difficulty: 'beginner',
        localTips: ['Så kontinuerligt från mars', 'Frosthärdig och snabbväxande'],
        spaceRequired: 0.2, // 0.2m² for 5 plants (0.04m² per plant)
        costPerM2: 20
      },
      {
        crop: 'Rädisor',
        suitability: 'excellent',
        season: ['mars', 'april', 'maj', 'juni', 'juli', 'augusti'],
        yield: 4,
        nutritionValue: { calories: 16, protein: 0.7, vitaminC: 14.8 },
        difficulty: 'beginner',
        localTips: ['Så kontinuerligt från mars', 'Snabbväxande, redo på 3-4 veckor'],
        spaceRequired: 0.5, // 0.5m² for 20 plants (0.025m² per plant)
        costPerM2: 15
      },
      {
        crop: 'Kålrötter',
        suitability: 'good',
        season: ['april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober'],
        yield: 4,
        nutritionValue: { calories: 25, protein: 1.0, vitaminC: 35 },
        difficulty: 'intermediate',
        localTips: ['Så i april-maj', 'Kräver mycket vatten för god skörd'],
        spaceRequired: 1.5, // 1.5m² for 3 plants (0.5m² per plant)
        costPerM2: 45
      },
      {
        crop: 'Rödbetor',
        suitability: 'excellent',
        season: ['april', 'maj', 'juni', 'juli', 'augusti', 'september'],
        yield: 5,
        nutritionValue: { calories: 43, protein: 1.6, vitaminC: 4.9 },
        difficulty: 'beginner',
        localTips: ['Så i april-maj', 'Lätt att odla och förvara'],
        spaceRequired: 2.0,
        costPerM2: 40
      },
      {
        crop: 'Squash',
        suitability: 'good',
        season: ['maj', 'juni', 'juli', 'augusti', 'september', 'oktober'],
        yield: 3,
        nutritionValue: { calories: 34, protein: 1.0, vitaminC: 17 },
        difficulty: 'beginner',
        localTips: ['Så i maj', 'Stor skörd, bra för förvaring'],
        spaceRequired: 1.0,
        costPerM2: 45
      },
      {
        crop: 'Körvel',
        suitability: 'excellent',
        season: ['mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september'],
        yield: 1,
        nutritionValue: { calories: 22, protein: 3.5, vitaminC: 50 },
        difficulty: 'beginner',
        localTips: ['Så kontinuerligt från mars', 'Krydda och grönsak'],
        spaceRequired: 0.2, // 0.2m² for 5 plants (0.04m² per plant)
        costPerM2: 25
      },
      {
        crop: 'Persilja',
        suitability: 'excellent',
        season: ['mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september'],
        yield: 1,
        nutritionValue: { calories: 36, protein: 3.0, vitaminC: 133 },
        difficulty: 'beginner',
        localTips: ['Flerårig krydda', 'Så i mars-april'],
        spaceRequired: 0.2, // 0.2m² for 5 plants (0.04m² per plant)
        costPerM2: 20
      }
    ]
  };

  // Load crop recommendations when step changes to 'crops'
  useEffect(() => {
    if (currentStep === 'crops') {
      const loadCrops = async () => {
        // Start with pre-added crops
        setCropRecommendations(cropLibrary.preAdded as CropRecommendation[]);
        
        // Load climate-based recommendations and filter out duplicates
        const climateCrops = await getCropRecommendations();
        const preAddedNames = cropLibrary.preAdded.map(crop => crop.crop);
        const uniqueClimateCrops = climateCrops.filter(crop => 
          !preAddedNames.includes(crop.crop)
        );
        
        setCropRecommendations(prev => {
          const newCrops = [...prev, ...uniqueClimateCrops];
          console.log('Loaded crops:', newCrops);
          return newCrops;
        });
      };
      loadCrops();
    }
  }, [currentStep]);

  // Fetch nutrition data for custom crops via AI
  const fetchCropNutritionData = async (cropName: string): Promise<CropRecommendation> => {
    setIsFetchingNutrition(true);
    try {
      // For now, return fallback data to avoid build errors
      // TODO: Implement proper AI integration for custom crops
      const nutritionData: CropRecommendation = {
        crop: cropName,
        suitability: 'good' as const,
        season: ['maj', 'juni', 'juli', 'augusti'],
        yield: 4,
        nutritionValue: { calories: 30, protein: 1.5, vitaminC: 20 },
        difficulty: 'intermediate' as const,
        localTips: ['Anpassa för svenska förhållanden'],
        spaceRequired: 0.4,
        costPerM2: 70
      };

      return nutritionData;
    } catch (error) {
      console.error('Error fetching nutrition data:', error);
      // Return fallback data
      return {
        crop: cropName,
        suitability: 'good',
        season: ['maj', 'juni', 'juli', 'augusti'],
        yield: 4,
        nutritionValue: { calories: 30, protein: 1.5, vitaminC: 20 },
        difficulty: 'intermediate',
        localTips: ['Anpassa för svenska förhållanden'],
        spaceRequired: 4.0, // 4m² for 10 plants (0.4m² per plant)
        costPerM2: 70
      };
    } finally {
      setIsFetchingNutrition(false);
    }
  };

  // Add custom crop
  const addCustomCrop = async () => {
    if (!newCropName.trim()) return;
    
    const nutritionData = await fetchCropNutritionData(newCropName.trim());
    setCropRecommendations(prev => [...prev, nutritionData]);
    setSelectedCrops(prev => [...prev, nutritionData.crop]); // Auto-select the added crop
    setNewCropName('');
    setShowAddCropModal(false);
  };

  // Add crop from library
  const addCropFromLibrary = (crop: CropRecommendation) => {
    setCropRecommendations(prev => [...prev, crop]);
    setSelectedCrops(prev => [...prev, crop.crop]); // Auto-select the added crop
    setShowCropLibraryModal(false);
  };

  // Check if crop is already added
  const isCropAlreadyAdded = (cropName: string) => {
    return cropRecommendations.some(crop => crop.crop === cropName);
  };
  
  // Profile-driven nutrition data
  const [nutritionProfile, setNutritionProfile] = useState<NutritionProfile>({
    householdSize: profile?.household_size || 3,
    ageGroups: {
      children: profile?.has_children ? 1 : 0,
      adults: profile?.household_size ? Math.max(1, profile.household_size - (profile.has_children ? 1 : 0)) : 2,
      elderly: profile?.has_elderly ? 1 : 0
    },
    activityLevel: 'moderate',
    specialNeeds: profile?.allergies ? profile.allergies.split(',').map(a => a.trim()) : [],
    crisisMode: false,
    targetSelfSufficiency: 30
  });

  // Update user profile in Supabase
  const updateUserProfile = async () => {
    if (!profile?.user_id) return;
    
    setSaving(true);
    try {
      // First, check if profile exists
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', profile.user_id)
        .maybeSingle();

      const profileData = {
        user_id: profile.user_id,
        household_size: profileUpdateData.household_size,
        has_children: profileUpdateData.has_children,
        has_elderly: profileUpdateData.has_elderly,
        has_pets: profileUpdateData.has_pets,
        city: profileUpdateData.city,
        county: profileUpdateData.county,
        address: profileUpdateData.address,
        allergies: profileUpdateData.allergies,
        special_needs: profileUpdateData.special_needs,
        updated_at: new Date().toISOString()
      };

      let result;
      if (existingProfile) {
        // Update existing profile
        result = await supabase
          .from('user_profiles')
          .update(profileData)
          .eq('user_id', profile.user_id);
      } else {
        // Create new profile
        result = await supabase
          .from('user_profiles')
          .insert([profileData]);
      }

      if (result.error) throw result.error;
      setSaveStatus('success');
      setShowProfileEditor(false);
      
      // Refresh profile data to show updated information
      await refreshProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  // Save cultivation profile to Supabase
  const saveCultivationProfile = async () => {
    if (!profile?.user_id) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('cultivation_profiles')
        .upsert({
          user_id: profile.user_id,
          household_size: nutritionProfile.householdSize,
          age_groups: nutritionProfile.ageGroups,
          activity_level: nutritionProfile.activityLevel,
          special_needs: nutritionProfile.specialNeeds,
          crisis_mode: nutritionProfile.crisisMode,
          target_self_sufficiency: nutritionProfile.targetSelfSufficiency,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      setSaveStatus('success');
    } catch (error) {
      console.error('Error saving cultivation profile:', error);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  // Load all saved cultivation plans
  const loadSavedPlans = async () => {
    if (!profile?.user_id) return;
    
    try {
      const { data, error } = await supabase
        .from('cultivation_plans')
        .select('*')
        .eq('user_id', profile.user_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading saved plans:', error);
        return;
      }

      if (data && data.length > 0) {
        setSavedPlans(data);
        
        // Load the most recent plan as existing plan
        const latestPlan = data[0];
        const plan: CultivationPlan = {
          id: latestPlan.plan_id,
          title: latestPlan.title,
          description: latestPlan.description,
          timeline: latestPlan.timeline,
          crops: latestPlan.crops || [],
          nutritionContribution: latestPlan.nutrition_contribution,
          gapAnalysis: latestPlan.gap_analysis,
          estimatedCost: latestPlan.estimated_cost,
          selfSufficiencyPercent: latestPlan.self_sufficiency_percent,
          nextSteps: latestPlan.next_steps,
          recommendations: latestPlan.recommendations
        };
        
        setExistingPlan(plan);
        setHasExistingPlan(true);
        setCultivationPlan(plan);
        
        // Load the plan data into the form
        if (latestPlan.crops && Array.isArray(latestPlan.crops)) {
          // Handle both old format (objects) and new format (strings)
          const cropNames = latestPlan.crops.map((crop: any) =>
            typeof crop === 'string' ? crop : crop.crop || crop.name || crop
          ).filter(Boolean);
          setSelectedCrops(cropNames);
          
          // Also load crop recommendations to show the selected crops properly
          const loadCropsForPlan = async () => {
            // Start with pre-added crops
            setCropRecommendations(cropLibrary.preAdded as CropRecommendation[]);
            
            // Load climate-based recommendations
            const climateCrops = await getCropRecommendations();
            const preAddedNames = cropLibrary.preAdded.map(crop => crop.crop);
            const uniqueClimateCrops = climateCrops.filter(crop => 
              !preAddedNames.includes(crop.crop)
            );
            
            setCropRecommendations(prev => [...prev, ...uniqueClimateCrops]);
          };
          
          loadCropsForPlan();
        }
      }
    } catch (error) {
      console.error('Error loading saved plans:', error);
    }
  };

  // Load existing cultivation plan (legacy function for backward compatibility)
  const loadExistingPlan = loadSavedPlans;

  // Save cultivation plan to Supabase with custom name
  const saveCultivationPlan = async (plan: CultivationPlan, customName?: string) => {
    if (!profile?.user_id) return;
    
    setSaving(true);
    try {
      const planData = {
        user_id: profile.user_id,
        plan_id: plan.id,
        title: customName || plan.title,
        description: plan.description,
        timeline: plan.timeline,
        crops: plan.crops,
        nutrition_contribution: plan.nutritionContribution,
        gap_analysis: plan.gapAnalysis,
        estimated_cost: plan.estimatedCost,
        self_sufficiency_percent: plan.selfSufficiencyPercent,
        next_steps: plan.nextSteps,
        recommendations: plan.recommendations,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Always insert as new plan (allow multiple plans)
      const { error } = await supabase
        .from('cultivation_plans')
        .insert(planData);
      
      if (error) throw error;

      // Also save to secure storage for dashboard
      if (typeof window !== 'undefined') {
        const { SecureStorage } = await import('@/lib/secure-storage');
        SecureStorage.setItem('cultivationPlan', plan);
      }
      
      // Reload saved plans
      await loadSavedPlans();
      
      setSaveStatus('success');
      setShowSavePlanModal(false);
      setPlanName('');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('Error saving cultivation plan:', error);
      setSaveStatus('error');
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 5000);
    } finally {
      setSaving(false);
    }
  };

  // Delete cultivation plan
  const deleteCultivationPlan = async (planId: string) => {
    if (!profile?.user_id) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('cultivation_plans')
        .delete()
        .eq('id', planId)
        .eq('user_id', profile.user_id);
      
      if (error) throw error;

      // Reload saved plans
      await loadSavedPlans();
      
      setSaveStatus('success');
      setShowDeleteModal(false);
      setPlanToDelete(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('Error deleting cultivation plan:', error);
      setSaveStatus('error');
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 5000);
    } finally {
      setSaving(false);
    }
  };

  // Auto-calculate nutrition needs based on profile
  const calculateNutritionNeeds = () => {
    const { householdSize, ageGroups, activityLevel } = nutritionProfile;
    
    const baseCalories = {
      children: 1200,
      adults: activityLevel === 'active' ? 2500 : activityLevel === 'moderate' ? 2200 : 1800,
      elderly: 1800
    };

    const totalCalories = 
      (ageGroups.children * baseCalories.children) +
      (ageGroups.adults * baseCalories.adults) +
      (ageGroups.elderly * baseCalories.elderly);

    return {
      dailyCalories: totalCalories,
      annualCalories: totalCalories * 365,
      protein: totalCalories * 0.15 / 4, // 15% protein
      carbohydrates: totalCalories * 0.55 / 4, // 55% carbs
      fat: totalCalories * 0.30 / 9, // 30% fat
      fiber: totalCalories * 0.014, // 14g per 1000 calories
      vitamins: {
        A: householdSize * 900, // RDA per person
        C: householdSize * 90,
        K: householdSize * 120,
        folate: householdSize * 400
      },
      minerals: {
        iron: householdSize * 18,
        calcium: householdSize * 1000,
        potassium: householdSize * 3500,
        magnesium: householdSize * 400
      }
    };
  };

  // Get cultivation profile data from Supabase
  const getCultivationProfile = async () => {
    if (!profile?.user_id) return null;
    
    try {
      const { data, error } = await supabase
        .from('cultivation_profiles')
        .select('*')
        .eq('user_id', profile.user_id)
        .single();
      
      if (error || !data) {
        console.log('No cultivation profile found, using defaults');
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching cultivation profile:', error);
      return null;
    }
  };

  // Get climate zone from cultivation profile
  const getClimateZone = async () => {
    const cultivationProfile = await getCultivationProfile();
    if (cultivationProfile?.climate_zone) {
      return cultivationProfile.climate_zone;
    }
    
    // Fallback to county-based detection from main profile
    const countyToClimateZone: Record<string, 'gotaland' | 'svealand' | 'norrland'> = {
      stockholm: 'svealand',
      uppsala: 'svealand',
      sodermanland: 'svealand',
      ostergotland: 'gotaland',
      jonkoping: 'gotaland',
      kronoberg: 'gotaland',
      kalmar: 'gotaland',
      blekinge: 'gotaland',
      skane: 'gotaland',
      halland: 'gotaland',
      vastra_gotaland: 'gotaland',
      varmland: 'svealand',
      orebro: 'svealand',
      vastmanland: 'svealand',
      dalarna: 'svealand',
      gavleborg: 'svealand',
      vasternorrland: 'norrland',
      jamtland: 'norrland',
      vasterbotten: 'norrland',
      norrbotten: 'norrland'
    };
    return countyToClimateZone[profile?.county || ''] || 'svealand';
  };

  // Auto-suggest crops based on location and conditions
  const getCropRecommendations = async (): Promise<CropRecommendation[]> => {
    const climateZone = await getClimateZone();
    const season = new Date().getMonth() + 1;
    
    const cropDatabase: Record<string, CropRecommendation[]> = {
      gotaland: [
        {
          crop: 'Tomater',
          suitability: 'excellent',
          season: ['maj', 'juni', 'juli', 'augusti', 'september'],
          yield: 8,
          nutritionValue: { calories: 18, protein: 0.9, vitaminC: 23 },
          difficulty: 'intermediate',
          localTips: ['Använd växthus för tidigare skörd', 'Välj korta sorter för utomhus'],
          spaceRequired: 1.0,
          costPerM2: 150
        },
        {
          crop: 'Gurka',
          suitability: 'excellent',
          season: ['maj', 'juni', 'juli', 'augusti', 'september'],
          yield: 6,
          nutritionValue: { calories: 16, protein: 0.7, vitaminC: 2.8 },
          difficulty: 'intermediate',
          localTips: ['Kräver mycket vatten', 'Träna upp på stöd'],
          spaceRequired: 1,
          costPerM2: 120
        },
        {
          crop: 'Morötter',
          suitability: 'excellent',
          season: ['april', 'maj', 'juni', 'juli', 'augusti', 'september'],
          yield: 4,
          nutritionValue: { calories: 41, protein: 0.9, vitaminA: 16706 },
          difficulty: 'beginner',
          localTips: ['Så direkt i jorden', 'Undvik övervattning'],
          spaceRequired: 1.5, // 1.5m² for 3 plants (0.5m² per plant)
          costPerM2: 50
        },
        {
          crop: 'Potatis',
          suitability: 'excellent',
          season: ['april', 'maj', 'juni', 'juli', 'augusti', 'september'],
          yield: 3,
          nutritionValue: { calories: 77, protein: 2, vitaminC: 20 },
          difficulty: 'beginner',
          localTips: ['Plantera efter frost', 'Hög med jord'],
          spaceRequired: 4.0, // 4m² for 10 plants (0.4m² per plant)
          costPerM2: 80
        },
        {
          crop: 'Kål',
          suitability: 'excellent',
          season: ['april', 'maj', 'juni', 'juli', 'augusti', 'september'],
          yield: 5,
          nutritionValue: { calories: 25, protein: 1.3, vitaminC: 36.6 },
          difficulty: 'beginner',
          localTips: ['Välj tidiga sorter', 'Skydd mot kålflugor'],
          spaceRequired: 4.0, // 4m² for 10 plants (0.4m² per plant)
          costPerM2: 60
        },
        {
          crop: 'Lök',
          suitability: 'excellent',
          season: ['mars', 'april', 'maj', 'juni', 'juli', 'augusti'],
          yield: 6,
          nutritionValue: { calories: 40, protein: 1.1, vitaminC: 7.4 },
          difficulty: 'beginner',
          localTips: ['Så tidigt på våren', 'Undvik övervattning'],
          spaceRequired: 2.0,
          costPerM2: 40
        },
        {
          crop: 'Sallad',
          suitability: 'excellent',
          season: ['mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september'],
          yield: 8,
          nutritionValue: { calories: 15, protein: 1.4, vitaminA: 7405 },
          difficulty: 'beginner',
          localTips: ['Så successivt', 'Skydd mot sniglar'],
          spaceRequired: 0.2, // 0.2m² for 5 plants (0.04m² per plant)
          costPerM2: 30
        },
        {
          crop: 'Rädisor',
          suitability: 'excellent',
          season: ['mars', 'april', 'maj', 'juni', 'juli', 'augusti'],
          yield: 10,
          nutritionValue: { calories: 16, protein: 0.7, vitaminC: 14.8 },
          difficulty: 'beginner',
          localTips: ['Så tidigt', 'Undvik övervattning'],
          spaceRequired: 0.2, // 0.2m² for 5 plants (0.04m² per plant)
          costPerM2: 25
        },
        {
          crop: 'Ärtor',
          suitability: 'excellent',
          season: ['april', 'maj', 'juni', 'juli'],
          yield: 4,
          nutritionValue: { calories: 81, protein: 5.4, vitaminC: 40 },
          difficulty: 'beginner',
          localTips: ['Så tidigt på våren', 'Träna upp på stöd'],
          spaceRequired: 1.5, // 1.5m² for 3 plants (0.5m² per plant)
          costPerM2: 45
        },
        {
          crop: 'Bönor',
          suitability: 'excellent',
          season: ['maj', 'juni', 'juli', 'augusti', 'september'],
          yield: 3,
          nutritionValue: { calories: 31, protein: 1.8, vitaminC: 12.2 },
          difficulty: 'beginner',
          localTips: ['Så efter frost', 'Träna upp på stöd'],
          spaceRequired: 2.0,
          costPerM2: 35
        },
        {
          crop: 'Kryddörter',
          suitability: 'excellent',
          season: ['maj', 'juni', 'juli', 'augusti', 'september'],
          yield: 12,
          nutritionValue: { calories: 22, protein: 3.2, vitaminC: 32 },
          difficulty: 'beginner',
          localTips: ['Så i krukor eller rabatter', 'Skörda regelbundet'],
          spaceRequired: 0.2, // 0.2m² for 5 plants (0.04m² per plant)
          costPerM2: 20
        },
        {
          crop: 'Spenat',
          suitability: 'excellent',
          season: ['mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september'],
          yield: 6,
          nutritionValue: { calories: 23, protein: 2.9, vitaminA: 469 },
          difficulty: 'beginner',
          localTips: ['Så successivt', 'Skydd mot sniglar'],
          spaceRequired: 2.0,
          costPerM2: 35
        }
      ],
      svealand: [
        {
          crop: 'Potatis',
          suitability: 'excellent',
          season: ['april', 'maj', 'juni', 'juli', 'augusti', 'september'],
          yield: 3,
          nutritionValue: { calories: 77, protein: 2, vitaminC: 20 },
          difficulty: 'beginner',
          localTips: ['Plantera efter frost', 'Hög med jord'],
          spaceRequired: 4.0, // 4m² for 10 plants (0.4m² per plant)
          costPerM2: 80
        },
        {
          crop: 'Kål',
          suitability: 'good',
          season: ['maj', 'juni', 'juli', 'augusti', 'september', 'oktober'],
          yield: 2,
          nutritionValue: { calories: 25, protein: 1.3, vitaminC: 36 },
          difficulty: 'intermediate',
          localTips: ['Skydd mot kålfluga', 'Regelbunden vattning'],
          spaceRequired: 1.0, // 1m² for 2 plants (0.5m² per plant)
          costPerM2: 100
        }
      ],
      norrland: [
        {
          crop: 'Potatis',
          suitability: 'excellent',
          season: ['maj', 'juni', 'juli', 'augusti', 'september'],
          yield: 2.5,
          nutritionValue: { calories: 77, protein: 2, vitaminC: 20 },
          difficulty: 'beginner',
          localTips: ['Välj tidiga sorter', 'Skydd mot frost'],
          spaceRequired: 4.0, // 4m² for 10 plants (0.4m² per plant)
          costPerM2: 90
        },
        {
          crop: 'Morötter',
          suitability: 'good',
          season: ['maj', 'juni', 'juli', 'augusti', 'september'],
          yield: 3,
          nutritionValue: { calories: 41, protein: 0.9, vitaminA: 16706 },
          difficulty: 'beginner',
          localTips: ['Korta sorter', 'Varmare läge'],
          spaceRequired: 1.5, // 1.5m² for 3 plants (0.5m² per plant)
          costPerM2: 60
        }
      ]
    };

    return cropDatabase[climateZone] || cropDatabase.svealand;
  };

  // Generate comprehensive cultivation plan
  const generateCultivationPlan = async () => {
    setLoading(true);
    try {
      // Check if any crops are selected
      if (selectedCrops.length === 0) {
        alert('Välj minst en gröda innan du genererar planen.');
        setLoading(false);
        return;
      }
      
      console.log('Generating plan with selected crops:', selectedCrops);
      
      const nutritionNeeds = calculateNutritionNeeds();
      const climateZone = await getClimateZone();
      const cultivationProfile = await getCultivationProfile();
      
      // Use only the crops that the user has actually selected
      const selectedCropData = cropRecommendations.filter(crop => 
        selectedCrops.includes(crop.crop)
      );
      
      console.log('Selected crops for plan:', selectedCrops);
      console.log('Selected crop data:', selectedCropData);
      
      const userProfile = {
        climateZone,
        householdSize: nutritionProfile.householdSize,
        ageGroups: nutritionProfile.ageGroups,
        specialNeeds: nutritionProfile.specialNeeds,
        crisisMode: nutritionProfile.crisisMode,
        location: profile?.city || 'Okänd plats',
        county: profile?.county || 'stockholm',
        // Include cultivation profile data
        experienceLevel: cultivationProfile?.experience_level || 'beginner',
        gardenSize: cultivationProfile?.garden_size || 'medium',
        gardenType: cultivationProfile?.garden_type || 'outdoor',
        soilType: cultivationProfile?.soil_type || 'unknown',
        sunExposure: cultivationProfile?.sun_exposure || 'partial',
        waterAccess: cultivationProfile?.water_access || 'good',
        timeAvailable: cultivationProfile?.time_available || 'moderate',
        budget: cultivationProfile?.budget || 'medium',
        goals: cultivationProfile?.goals || [],
        preferences: cultivationProfile?.preferences || [],
        challenges: cultivationProfile?.challenges || [],
        currentCrops: selectedCrops
      };

      // Use AI to generate comprehensive plan with selected crops
      console.log('Generating AI plan with:', { userProfile, nutritionNeeds, selectedCropData });
      const aiPlan = await OpenAIService.generateCultivationPlan(
        userProfile,
        nutritionNeeds,
        selectedCropData
      );
      console.log('AI plan generated:', aiPlan);
      console.log('AI plan gapAnalysis:', aiPlan.gapAnalysis);
      console.log('AI plan timeline:', aiPlan.timeline);
      console.log('AI plan title:', aiPlan.title);

      if (!aiPlan) {
        console.error('AI plan generation failed, using fallback');
        // Use fallback plan
        const plan: CultivationPlan = {
          id: 'fallback-plan-' + Date.now(),
          title: `Personlig odlingsplan för ${nutritionProfile.householdSize} personer`,
          description: 'En grundläggande odlingsplan anpassad för din familj.',
          timeline: 'Januari: Planering och förberedelser\nFebruari: Beställ frön och jord\nMars: Förbered jorden och såbäddar\nApril: Så kalla grödor\nMaj: Plantera värmeälskande grödor\nJuni-Juli: Skötsel och vattning\nAugusti-September: Skörd',
          crops: selectedCropData,
          nutritionContribution: {},
          gapAnalysis: {
            nutritionalGaps: [
              { nutrient: 'Protein', current: 35, needed: 50, gap: 15.2, solutions: ['Kött', 'Fisk', 'Ägg'] },
              { nutrient: 'Vitamin C', current: 41.5, needed: 50, gap: 8.5, solutions: ['Citrusfrukter', 'Grönsaker'] }
            ],
            groceryNeeds: [
              { item: 'Kött/Fisk', quantity: 2, unit: 'kg/vecka', estimatedCost: 200, priority: 'high' as const, alternatives: ['Fisk', 'Kyckling'] },
              { item: 'Mjölkprodukter', quantity: 3, unit: 'liter/vecka', estimatedCost: 150, priority: 'medium' as const, alternatives: ['Ost', 'Yoghurt'] }
            ],
            totalEstimatedCost: 530,
            costBreakdown: [
              { category: 'Protein', amount: 200, percentage: 38 },
              { category: 'Dairy', amount: 150, percentage: 28 }
            ]
          },
          estimatedCost: calculateSummary().totalCost,
          selfSufficiencyPercent: 30,
          nextSteps: [
            'Beställ frön och jord i januari',
            'Förbered odlingsbäddar i februari-mars',
            'Börja såning av kalla grödor i mars',
            'Plantera värmeälskande grödor i maj'
          ],
          recommendations: [
            'Börja med enkla grödor som potatis och morötter',
            'Använd kompost för bättre jordkvalitet',
            'Vattna regelbundet men undvik övervattning',
            'Rotera grödor årligen för bättre jordkvalitet'
          ]
        };
        setCultivationPlan(plan);
        return;
      }

      const plan: CultivationPlan = {
        id: aiPlan.id || 'plan-' + Date.now(),
        title: aiPlan.title ? `🤖 ${aiPlan.title}` : `📋 Personlig odlingsplan för ${nutritionProfile.householdSize} personer`,
        description: aiPlan.description ? `🤖 AI-genererad: ${aiPlan.description}` : '📋 En skräddarsydd odlingsplan baserad på din familj och lokala förhållanden.',
        timeline: aiPlan.timeline ? `🤖 AI-genererad tidslinje:\n${aiPlan.timeline}` : '📋 Planering pågår...',
        crops: selectedCropData,
        nutritionContribution: aiPlan.nutritionContribution || {},
        gapAnalysis: aiPlan.gapAnalysis ? {
          ...aiPlan.gapAnalysis,
          nutritionalGaps: aiPlan.gapAnalysis.nutritionalGaps?.map((gap: any) => ({
            ...gap,
            nutrient: `🤖 ${gap.nutrient}`
          })) || [],
          groceryNeeds: aiPlan.gapAnalysis.groceryNeeds?.map((purchase: any) => ({
            ...purchase,
            item: `🤖 ${purchase.item}`
          })) || []
        } : {
          nutritionalGaps: [
            { nutrient: '📋 Protein', gap: 15.2 },
            { nutrient: '📋 Vitamin C', gap: 8.5 },
            { nutrient: '📋 Kalcium', gap: 12.1 },
            { nutrient: '📋 Järn', gap: 3.2 }
          ],
          groceryNeeds: [
            { item: '📋 Kött/Fisk', quantity: 2, unit: 'kg/vecka', estimatedCost: 200 },
            { item: '📋 Mjölkprodukter', quantity: 3, unit: 'liter/vecka', estimatedCost: 150 },
            { item: '📋 Frukt', quantity: 1.5, unit: 'kg/vecka', estimatedCost: 100 },
            { item: '📋 Kornprodukter', quantity: 2, unit: 'kg/vecka', estimatedCost: 80 }
          ],
          totalEstimatedCost: 530,
          costBreakdown: [
            { category: '📋 Protein', cost: 200 },
            { category: '📋 Dairy', cost: 150 },
            { category: '📋 Fruits', cost: 100 },
            { category: '📋 Grains', cost: 80 }
          ]
        },
        estimatedCost: aiPlan.estimatedCost || calculateSummary().totalCost,
        selfSufficiencyPercent: aiPlan.selfSufficiencyPercent || 30,
        nextSteps: aiPlan.nextSteps?.map((step: any) => `🤖 ${step}`) || [],
        recommendations: aiPlan.recommendations?.map((rec: any) => `🤖 ${rec}`) || []
      };

      console.log('Final plan created:', plan);
      console.log('Final plan timeline:', plan.timeline);
      console.log('Final plan gapAnalysis:', plan.gapAnalysis);
      console.log('Final plan nutritionalGaps:', plan.gapAnalysis?.nutritionalGaps);
      console.log('Final plan groceryNeeds:', plan.gapAnalysis?.groceryNeeds);
      console.log('Final plan nutritionalGaps details:', JSON.stringify(plan.gapAnalysis?.nutritionalGaps, null, 2));
      console.log('Final plan groceryNeeds details:', JSON.stringify(plan.gapAnalysis?.groceryNeeds, null, 2));
      
      setCultivationPlan(plan);
      setCurrentStep('plan');
      
      // Save plan to Supabase
      await saveCultivationPlan(plan);
    } catch (error) {
      console.error('Error generating cultivation plan:', error);
      // Fallback plan
      setCultivationPlan({
        id: 'fallback-plan',
        title: 'Grundläggande odlingsplan',
        description: 'En enkel odlingsplan baserad på dina profiluppgifter.',
        timeline: 'Planering pågår...',
        crops: [],
        nutritionContribution: {},
        gapAnalysis: {
          nutritionalGaps: [],
          groceryNeeds: [],
          totalEstimatedCost: 0,
          costBreakdown: []
        },
        estimatedCost: 0,
        selfSufficiencyPercent: 30,
        nextSteps: ['Komplettera din profil', 'Välj grödor', 'Planera odlingsbäddar'],
        recommendations: ['Börja med enkla grödor', 'Använd kompost', 'Vattna regelbundet']
      });
      setCurrentStep('plan');
    } finally {
      setLoading(false);
    }
  };

  // Render profile step
  const renderProfileStep = () => (
    <div className="space-y-6">
      <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--bg-olive-light)' }}>
        <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
          <Users className="w-5 h-5" />
          <span>Familj & plats</span>
        </h3>
        
        {/* Saved Plans Section */}
        {savedPlans.length > 0 && (
          <div className="mb-6 p-4 rounded-lg border" style={{ 
            backgroundColor: 'var(--color-success)10',
            borderColor: 'var(--color-success)'
          }}>
            <div className="flex items-center space-x-3 mb-4">
              <CheckCircle className="w-5 h-5" style={{ color: 'var(--color-success)' }} />
              <div>
                <div className="font-medium" style={{ color: 'var(--color-success)' }}>
                  Dina sparade odlingsplaner ({savedPlans.length})
                </div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Klicka på en plan för att visa eller redigera den
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              {savedPlans.slice(0, 3).map((plan, index) => (
                <div key={plan.id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'white' }}>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: 'var(--color-sage)', color: 'white' }}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{plan.title}</div>
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {plan.crops?.length || 0} grödor • {plan.self_sufficiency_percent}% självförsörjning • 
                        {new Date(plan.created_at).toLocaleDateString('sv-SE')}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        // Handle both old format (objects) and new format (strings) for crops
                        const cropNames = (plan.crops || []).map((crop: any) =>
                          typeof crop === 'string' ? crop : crop.crop || crop.name || crop
                        ).filter(Boolean);
                        
                        const planData: CultivationPlan = {
                          id: plan.plan_id,
                          title: plan.title,
                          description: plan.description,
                          timeline: plan.timeline,
                          crops: cropNames,
                          nutritionContribution: plan.nutrition_contribution,
                          gapAnalysis: plan.gap_analysis,
                          estimatedCost: plan.estimated_cost,
                          selfSufficiencyPercent: plan.self_sufficiency_percent,
                          nextSteps: plan.next_steps,
                          recommendations: plan.recommendations
                        };
                        setCultivationPlan(planData);
                        setCurrentStep('plan');
                      }}
                      className="px-3 py-1 rounded text-sm font-medium transition-all duration-200 hover:shadow-md"
                      style={{ 
                        backgroundColor: 'var(--color-sage)', 
                        color: 'white' 
                      }}
                    >
                      Visa
                    </button>
                    <button
                      onClick={() => {
                        setCurrentStep('crops');
                      }}
                      className="px-3 py-1 rounded text-sm font-medium transition-all duration-200 hover:shadow-md border"
                      style={{ 
                        backgroundColor: 'white',
                        color: 'var(--color-sage)',
                        borderColor: 'var(--color-sage)'
                      }}
                    >
                      Redigera
                    </button>
                    <button
                      onClick={() => {
                        setPlanToDelete(plan);
                        setShowDeleteModal(true);
                      }}
                      className="px-3 py-1 rounded text-sm font-medium transition-all duration-200 hover:shadow-md"
                      style={{ 
                        backgroundColor: 'var(--color-danger)', 
                        color: 'white' 
                      }}
                    >
                      Ta bort
                    </button>
                  </div>
                </div>
              ))}
              
              {savedPlans.length > 3 && (
                <div className="text-center pt-2">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    + {savedPlans.length - 3} fler planer
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Family Information */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm" style={{ color: 'var(--text-secondary)' }}>FAMILJ</h4>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-lg" style={{ backgroundColor: 'white' }}>
                <span className="text-sm font-medium">Hushållsstorlek</span>
                <span className="font-semibold">{profile?.household_size || 'Inte angivet'} personer</span>
              </div>
              
              <div className="flex justify-between items-center p-3 rounded-lg" style={{ backgroundColor: 'white' }}>
                <span className="text-sm font-medium">Barn</span>
                <span className="font-semibold">{profile?.has_children ? 'Ja' : 'Nej'}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 rounded-lg" style={{ backgroundColor: 'white' }}>
                <span className="text-sm font-medium">Äldre</span>
                <span className="font-semibold">{profile?.has_elderly ? 'Ja' : 'Nej'}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 rounded-lg" style={{ backgroundColor: 'white' }}>
                <span className="text-sm font-medium">Husdjur</span>
                <span className="font-semibold">{profile?.has_pets ? 'Ja' : 'Nej'}</span>
              </div>
            </div>
          </div>
          
          {/* Location Information */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm" style={{ color: 'var(--text-secondary)' }}>PLATS</h4>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-lg" style={{ backgroundColor: 'white' }}>
                <span className="text-sm font-medium">Stad</span>
                <span className="font-semibold">{profile?.city || 'Inte angivet'}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 rounded-lg" style={{ backgroundColor: 'white' }}>
                <span className="text-sm font-medium">Län</span>
                <span className="font-semibold">{profile?.county || 'Inte angivet'}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 rounded-lg" style={{ backgroundColor: 'white' }}>
                <span className="text-sm font-medium">Adress</span>
                <span className="font-semibold text-right">{profile?.address || 'Inte angivet'}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Special Needs */}
        {profile?.allergies && (
          <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
            <h4 className="font-medium text-sm mb-2" style={{ color: '#dc2626' }}>SÄRSKILDA BEHOV</h4>
            <div className="text-sm">
              <span className="font-medium">Allergier:</span> {profile.allergies}
            </div>
            {profile.special_needs && (
              <div className="text-sm mt-1">
                <span className="font-medium">Särskilda behov:</span> {profile.special_needs}
              </div>
            )}
          </div>
        )}
        
        {/* Crisis Mode Toggle */}
        <div className="mt-6">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={nutritionProfile.crisisMode}
              onChange={(e) => setNutritionProfile(prev => ({ 
                ...prev, 
                crisisMode: e.target.checked 
              }))}
              className="rounded"
            />
            <span className="text-sm">Krisläge - Planera för 6 månaders självförsörjning</span>
          </label>
        </div>
        
        {/* Profile Update Notice */}
        <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
          <div className="flex items-start space-x-2">
            <div className="w-5 h-5 rounded-full flex items-center justify-center mt-0.5" style={{ backgroundColor: '#3b82f6' }}>
              <span className="text-white text-xs">i</span>
            </div>
            <div className="text-sm flex-1">
              <p className="font-medium" style={{ color: '#1e40af' }}>Information från din profil</p>
              <p style={{ color: 'var(--text-secondary)' }}>
                Denna information kommer från din profil. Om något saknas eller behöver uppdateras, 
                klicka på knappen nedan för att redigera direkt här.
              </p>
            </div>
          </div>
        </div>
        
        {/* Quick Profile Update Button */}
        <div className="mt-4">
          <button
            onClick={() => setShowProfileEditor(true)}
            className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-md border"
            style={{ 
              backgroundColor: 'white',
              color: 'var(--color-sage)',
              borderColor: 'var(--color-sage)'
            }}
          >
            <Edit3 className="w-4 h-4 inline mr-2" />
            Uppdatera
          </button>
        </div>
      </div>
      
        {/* Nutrition Section */}
        <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--bg-olive-light)' }}>
          <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <Calculator className="w-5 h-5" />
            <span>Näringsbehov</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg group relative" style={{ backgroundColor: 'white' }}>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-sage)' }}>
                {Math.round(calculateNutritionNeeds().dailyCalories)}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Kalorier/dag
              </div>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 w-48">
                Dagligt kaloriebehov för hela familjen. Beräknas baserat på ålder, kön och aktivitetsnivå.
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
              </div>
            </div>
            
            <div className="p-4 border rounded-lg group relative" style={{ backgroundColor: 'white' }}>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-sage)' }}>
                {Math.round(calculateNutritionNeeds().protein)}g
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Protein/dag
              </div>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 w-48">
                Dagligt proteinbehov för familjen. Viktigt för muskelbyggnad och immunförsvar.
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
              </div>
            </div>
            
            <div className="p-4 border rounded-lg group relative" style={{ backgroundColor: 'white' }}>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-sage)' }}>
                {Math.round(calculateNutritionNeeds().fiber)}g
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Fiber/dag
              </div>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 w-48">
                Dagligt fiberbehov för familjen. Viktigt för matsmältning och hjärtkärlsjukdomar.
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-4 border rounded-lg" style={{ backgroundColor: 'white' }}>
            <h4 className="font-medium mb-2">Vitaminer & mineraler (dagligt behov)</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Vitamin A: {calculateNutritionNeeds().vitamins.A} μg</div>
              <div>Vitamin C: {calculateNutritionNeeds().vitamins.C} mg</div>
              <div>Vitamin K: {calculateNutritionNeeds().vitamins.K} μg</div>
              <div>Kalcium: {calculateNutritionNeeds().minerals.calcium} mg</div>
              <div>Järn: {calculateNutritionNeeds().minerals.iron} mg</div>
              <div>Magnesium: {calculateNutritionNeeds().minerals.magnesium} mg</div>
              <div>Folat: {calculateNutritionNeeds().vitamins.folate} μg</div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={() => setCurrentStep('crops')}
            className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
            style={{ 
              backgroundColor: 'var(--color-sage)', 
              color: 'white' 
            }}
          >
            Nästa: Grödval
          </button>
        </div>
    </div>
  );

  // Render nutrition step
  const renderNutritionStep = () => {
    const nutritionNeeds = calculateNutritionNeeds();
    
    return (
      <div className="space-y-6">
        <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--bg-olive-light)' }}>
          <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <Calculator className="w-5 h-5" />
            <span>Näringsbehov</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg group relative" style={{ backgroundColor: 'white' }}>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-sage)' }}>
                {Math.round(nutritionNeeds.dailyCalories)}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Kalorier/dag
              </div>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 w-48">
                Dagligt kaloriebehov för hela familjen. Beräknas baserat på ålder, kön och aktivitetsnivå.
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
              </div>
            </div>
            
            <div className="p-4 border rounded-lg group relative" style={{ backgroundColor: 'white' }}>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-sage)' }}>
                {Math.round(nutritionNeeds.protein)}g
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Protein/dag
              </div>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 w-48">
                Dagligt proteinbehov för familjen. Viktigt för muskelbyggnad och immunförsvar.
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
              </div>
            </div>
            
            <div className="p-4 border rounded-lg group relative" style={{ backgroundColor: 'white' }}>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-sage)' }}>
                {Math.round(nutritionNeeds.fiber)}g
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Fiber/dag
              </div>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 w-48">
                Dagligt fiberbehov för familjen. Viktigt för matsmältning och hjärtkärlsjukdomar.
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-4 border rounded-lg" style={{ backgroundColor: 'white' }}>
            <h4 className="font-medium mb-2">Vitaminer & mineraler (dagligt behov)</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Vitamin A: {nutritionNeeds.vitamins.A} μg</div>
              <div>Vitamin C: {nutritionNeeds.vitamins.C} mg</div>
              <div>Järn: {nutritionNeeds.minerals.iron} mg</div>
              <div>Kalcium: {nutritionNeeds.minerals.calcium} mg</div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between">
          <button
            onClick={() => setCurrentStep('profile')}
            className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-md border"
            style={{ 
              backgroundColor: 'white',
              color: 'var(--text-primary)',
              borderColor: 'var(--color-sage)'
            }}
          >
            Tillbaka
          </button>
          <button
            onClick={() => setCurrentStep('crops')}
            className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
            style={{ 
              backgroundColor: 'var(--color-sage)', 
              color: 'white' 
            }}
          >
            Nästa: Grödval
          </button>
        </div>
      </div>
    );
  };

  // Get suggested amount for a crop based on family size
  const getSuggestedAmount = (cropName: string): number => {
    const familySize = profile?.household_size || 1;
    
    // Base amounts per person for different crops (realistic for Swedish growing)
    const baseAmounts: Record<string, number> = {
      'Potatis': 10, // 10 plants per person (0.4m² each)
      'Tomater': 3,  // 3 plants per person (0.5m² each)
      'Morötter': 20, // 20 plants per person (0.1m² each)
      'Kål': 2,      // 2 plants per person (0.5m² each)
      'Sallat': 10,  // 10 plants per person (0.04m² each)
      'Gurka': 2,    // 2 plants per person (0.5m² each)
      'Lök': 20,     // 20 plants per person (0.02m² each)
      'Vitlök': 20,  // 20 plants per person (0.05m² each)
      'Spinat': 10,  // 10 plants per person (0.05m² each)
      'Bönor': 5,    // 5 plants per person (0.2m² each)
      'Ärtor': 5,    // 5 plants per person (0.2m² each)
      'Rädisor': 20, // 20 plants per person (0.025m² each)
      'Rödbetor': 10, // 10 plants per person (0.1m² each)
      'Broccoli': 2, // 2 plants per person (0.5m² each)
      'Blomkål': 2,  // 2 plants per person (0.5m² each)
    };
    
    const baseAmount = baseAmounts[cropName] || 5;
    return Math.max(1, Math.round(baseAmount * familySize));
  };

  // Update crop amount
  const updateCropAmount = (cropName: string, amount: number) => {
    setCropAmounts(prev => ({
      ...prev,
      [cropName]: Math.max(1, amount)
    }));
  };

  // Get effective space and cost for a crop based on amount
  const getCropSpaceAndCost = (crop: CropRecommendation, amount: number) => {
    // Add safety checks
    if (!crop || !crop.crop) {
      console.error('Invalid crop object:', crop);
      return { space: 0, cost: 0 };
    }
    
    const suggestedAmount = getSuggestedAmount(crop.crop);
    
    // Calculate space per plant based on realistic spacing
    // Base space is for suggested amount, so we calculate per plant
    const spacePerPlant = (crop.spaceRequired || 0) / suggestedAmount;
    const actualSpace = spacePerPlant * amount;
    const actualCost = (crop.costPerM2 || 0) * actualSpace;
    
    return {
      space: Math.round(actualSpace * 10) / 10,
      cost: Math.round(actualCost)
    };
  };

  // Crop icon mapping
  const getDefaultUnit = (itemName: string): string => {
    const unitMap: Record<string, string> = {
      'Kött': 'kg',
      'Fisk': 'kg', 
      'Kyckling': 'kg',
      'Korv': 'kg',
      'Skinka': 'kg',
      'Mjölkprodukter': 'liter',
      'Mjölk': 'liter',
      'Yoghurt': 'liter',
      'Ost': 'kg',
      'Smör': 'kg',
      'Frukt': 'kg',
      'Äpplen': 'kg',
      'Bananer': 'kg',
      'Apelsiner': 'kg',
      'Grönsaker': 'kg',
      'Morötter': 'kg',
      'Potatis': 'kg',
      'Lök': 'kg',
      'Kornprodukter': 'kg',
      'Bröd': 'kg',
      'Pasta': 'kg',
      'Ris': 'kg',
      'Havregryn': 'kg',
      'C-vitamin tillskott': 'förpackning',
      'Vitaminer': 'förpackning',
      'Tillskott': 'förpackning'
    };
    
    // Check for exact matches first
    if (unitMap[itemName]) {
      return unitMap[itemName];
    }
    
    // Check for partial matches
    for (const [key, unit] of Object.entries(unitMap)) {
      if (itemName.toLowerCase().includes(key.toLowerCase())) {
        return unit;
      }
    }
    
    // Default to 'st' for items not in the map
    return 'st';
  };

  const getCropIcon = (cropName: string): string => {
    const iconMap: Record<string, string> = {
      'Potatis': '🥔',
      'Tomater': '🍅',
      'Morötter': '🥕',
      'Kål': '🥬',
      'Sallat': '🥬',
      'Gurka': '🥒',
      'Lök': '🧅',
      'Vitlök': '🧄',
      'Spinat': '🥬',
      'Bönor': '🫘',
      'Ärtor': '🫘',
      'Rädisor': '🥕',
      'Rödbetor': '🥕',
      'Kålrot': '🥬',
      'Broccoli': '🥦',
      'Blomkål': '🥦',
      'Kålrabbi': '🥬',
      'Salladskål': '🥬',
      'Ruccola': '🥬',
      'Persilja': '🌿',
      'Basilika': '🌿',
      'Oregano': '🌿',
      'Timmjan': '🌿',
      'Rosmarin': '🌿',
      'Körvel': '🌿',
      'Dill': '🌿',
      'Kruspersilja': '🌿',
      'Koriander': '🌿',
      'Mynta': '🌿',
      'Salladslök': '🧅',
      'Purjolök': '🧅',
      'Jordärtskocka': '🥬',
      'Sparris': '🥬',
      'Rabarber': '🥬',
      'Jordgubbar': '🍓',
      'Hallon': '🫐',
      'Vinbär': '🫐',
      'Krusbär': '🫐',
      'Körsbär': '🍒',
      'Plommon': '🍑',
      'Äpplen': '🍎',
      'Päron': '🍐',
      'Kvitten': '🍐'
    };
    
    return iconMap[cropName] || '🌱';
  };

  // Calculate live summary data
  const calculateSummary = () => {
    const totalSpace = selectedCrops.reduce((total, cropName) => {
      const crop = cropRecommendations.find(c => c.crop === cropName);
      if (!crop) return total;
      const amount = cropAmounts[cropName] || getSuggestedAmount(cropName);
      const { space } = getCropSpaceAndCost(crop, amount);
      return total + space;
    }, 0);

    const totalCost = selectedCrops.reduce((total, cropName) => {
      const crop = cropRecommendations.find(c => c.crop === cropName);
      if (!crop) return total;
      const amount = cropAmounts[cropName] || getSuggestedAmount(cropName);
      const { cost } = getCropSpaceAndCost(crop, amount);
      return total + cost;
    }, 0);

    // Calculate annual calories from crops (calories per 100g × yield kg/m² × area m²)
    const totalCalories = selectedCrops.reduce((total, cropName) => {
      const crop = cropRecommendations.find(c => c.crop === cropName);
      if (!crop) return total;
      
      const amount = cropAmounts[cropName] || getSuggestedAmount(cropName);
      const { space } = getCropSpaceAndCost(crop, amount);
      
      // calories per 100g × yield kg/m² × area m² × 10 (to convert to per 100g)
      const annualCalories = (crop.nutritionValue?.calories || 0) * (crop.yield || 0) * space * 10;
      return total + annualCalories;
    }, 0);

    // Calculate annual family calorie needs (daily × 365)
    const nutritionNeeds = calculateNutritionNeeds();
    const annualFamilyCalories = nutritionNeeds.dailyCalories * 365;
    
    // Calculate self-sufficiency percentage
    const selfSufficiency = Math.min(100, (totalCalories / annualFamilyCalories) * 100);

    return {
      totalSpace: Math.round(totalSpace * 10) / 10,
      totalCost: Math.round(totalCost),
      totalCalories: Math.round(totalCalories),
      selfSufficiency: Math.round(selfSufficiency),
      selectedCropCount: selectedCrops.length
    };
  };

  // Render summary component
  const renderSummary = () => {
    const summary = calculateSummary();
    
    return (
      <div className="mb-6 p-4 rounded-lg border" style={{ 
        backgroundColor: 'var(--bg-olive-light)', 
        borderColor: 'var(--color-sage)' 
      }}>
        <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
          <Target className="w-5 h-5" />
          <span>Sammanfattning</span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center group relative">
            <div className="text-2xl font-bold" style={{ color: 'var(--color-sage)' }}>
              {summary.selectedCropCount}
            </div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Valda Grödor
            </div>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 w-48">
              Antal grödor du har valt att odla. Klicka på grödor för att välja/bortvälja.
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
            </div>
          </div>
          <div className="text-center group relative">
            <div className="text-2xl font-bold" style={{ color: 'var(--color-sage)' }}>
              {summary.totalSpace}m²
            </div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Total Yta
            </div>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 w-48">
              Summan av all yta som behövs för dina valda grödor. Beräknas som: Σ(gröda × m² per gröda)
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
            </div>
          </div>
          <div className="text-center group relative">
            <div className="text-2xl font-bold" style={{ color: 'var(--color-sage)' }}>
              {summary.totalCost} kr
            </div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Uppskattad Kostnad
            </div>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 w-48">
              Total kostnad för frön, jord, gödning och utrustning. Beräknas som: Σ(gröda × m² × kr/m²)
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
            </div>
          </div>
          <div className="text-center group relative">
            <div className="text-2xl font-bold" style={{ color: 'var(--color-sage)' }}>
              {summary.selfSufficiency}%
            </div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Självförsörjning
            </div>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 w-48">
              Hur stor del av familjens näringsbehov som täcks av odlingen. Beräknas som: (Producerade kalorier / Behov kalorier) × 100
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render crop selection step
  const renderCropStep = () => {
    
    return (
      <div className="space-y-6">
        <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--bg-olive-light)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <Sprout className="w-5 h-5" />
              <span>Välj grödor</span>
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowCropLibraryModal(true)}
                className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-md border"
                style={{ 
                  backgroundColor: 'white',
                  borderColor: 'var(--color-sage)',
                  color: 'var(--color-sage)'
                }}
              >
                📚 Bläddra i bibliotek
              </button>
              <button
                onClick={() => setShowAddCropModal(true)}
                className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
                style={{ 
                  backgroundColor: 'var(--color-sage)', 
                  color: 'white' 
                }}
              >
                + Lägg till egen gröda
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cropRecommendations && cropRecommendations.length > 0 ? cropRecommendations.map((crop, index) => {
              // Safety check for invalid crops
              if (!crop || !crop.crop) {
                console.error('Invalid crop in recommendations:', crop);
                return null;
              }
              
              const isSelected = selectedCrops.includes(crop.crop);
              return (
              <div key={index} className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                isSelected ? 'ring-2 ring-green-500' : 'hover:shadow-md'
              }`} style={{ backgroundColor: 'white' }}
              onClick={() => {
                if (isSelected) {
                  setSelectedCrops(prev => prev.filter(c => c !== crop.crop));
                } else {
                  setSelectedCrops(prev => [...prev, crop.crop]);
                }
              }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{getCropIcon(crop.crop)}</span>
                    <h4 className="font-medium">{crop.crop}</h4>
                  </div>
                  <div className="flex items-center space-x-2">
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-sage)' }}>
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                    <span className={`px-2 py-1 rounded text-xs ${
                      crop.suitability === 'excellent' ? 'bg-green-100 text-green-800' :
                      crop.suitability === 'good' ? 'bg-blue-100 text-blue-800' :
                      crop.suitability === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {crop.suitability === 'excellent' ? 'Utmärkt' :
                       crop.suitability === 'good' ? 'Bra' :
                       crop.suitability === 'moderate' ? 'Måttlig' : 'Utmanande'}
                    </span>
                  </div>
                </div>
                
                <div className="text-sm space-y-1">
                  <div>Skörd: {crop.yield} kg/m²</div>
                  <div>Kalorier: {crop.nutritionValue?.calories || 0} kcal/100g</div>
                  <div>Protein: {crop.nutritionValue?.protein || 0}g/100g</div>
                  <div>Svårighet: {crop.difficulty === 'beginner' ? 'Nybörjare' : 
                                  crop.difficulty === 'intermediate' ? 'Mellan' : 'Avancerad'}</div>
                  
                  {isSelected && (
                    <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-olive-light)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Antal (klicka för att skriva):</span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const currentAmount = cropAmounts[crop.crop] || getSuggestedAmount(crop.crop);
                              updateCropAmount(crop.crop, currentAmount - 1);
                            }}
                            className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold"
                            style={{ backgroundColor: 'var(--color-sage)', color: 'white' }}
                          >
                            -
                          </button>
                          <input
                            type="number"
                            value={cropAmounts[crop.crop] || getSuggestedAmount(crop.crop)}
                            onChange={(e) => {
                              e.stopPropagation();
                              const amount = parseInt(e.target.value) || 1;
                              updateCropAmount(crop.crop, amount);
                            }}
                            onFocus={(e) => e.target.select()}
                            className="w-20 text-center border rounded px-2 py-1 text-sm font-medium"
                            style={{ borderColor: 'var(--color-sage)' }}
                            min="1"
                            placeholder="Antal"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const currentAmount = cropAmounts[crop.crop] || getSuggestedAmount(crop.crop);
                              updateCropAmount(crop.crop, currentAmount + 1);
                            }}
                            className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold"
                            style={{ backgroundColor: 'var(--color-sage)', color: 'white' }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                      
                      {(() => {
                        if (!crop || !crop.crop) {
                          return (
                            <div className="text-xs text-red-500">
                              Fel: Ogiltig gröda
                            </div>
                          );
                        }
                        
                        const amount = cropAmounts[crop.crop] || getSuggestedAmount(crop.crop);
                        const { space, cost } = getCropSpaceAndCost(crop, amount);
                        return (
                          <div className="text-xs space-y-1">
                            <div>Utrymme: {space} m²</div>
                            <div>Kostnad: {cost} kr</div>
                            <div className="text-gray-600">
                              Föreslaget: {getSuggestedAmount(crop.crop)} st
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                  
                  {!isSelected && (
                    <div className="text-xs text-gray-500">
                      Utrymme: {crop.spaceRequired} m² • Kostnad: {crop.costPerM2} kr/m²
                    </div>
                  )}
                </div>
                
                <div className="mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {crop.localTips[0]}
                </div>
                </div>
              );
            }) : (
              <div className="col-span-2 text-center py-8">
                <div className="text-gray-500">Laddar grödor...</div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-between">
          <button
            onClick={() => setCurrentStep('nutrition')}
            className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-md border"
            style={{ 
              backgroundColor: 'white',
              color: 'var(--text-primary)',
              borderColor: 'var(--color-sage)'
            }}
          >
            Tillbaka
          </button>
          <button
            onClick={generateCultivationPlan}
            disabled={loading}
            className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-md disabled:opacity-50"
            style={{ 
              backgroundColor: 'var(--color-sage)', 
              color: 'white' 
            }}
          >
            {loading ? 'Genererar plan...' : 'Generera odlingsplan'}
          </button>
        </div>
      </div>
    );
  };

  // Render crop library modal
  const renderCropLibraryModal = () => {
    if (!showCropLibraryModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">Grödbibliotek</h3>
            <button
              onClick={() => setShowCropLibraryModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cropLibrary.library.map((crop, index) => {
              const isAlreadyAdded = isCropAlreadyAdded(crop.crop);
              return (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    isAlreadyAdded 
                      ? 'bg-gray-100 border-gray-300 opacity-50' 
                      : 'bg-white border-gray-200 hover:border-green-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{getCropIcon(crop.crop)}</span>
                      <h4 className="font-semibold text-lg">{crop.crop}</h4>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      crop.suitability === 'excellent' ? 'bg-green-100 text-green-800' :
                      crop.suitability === 'good' ? 'bg-blue-100 text-blue-800' :
                      crop.suitability === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {crop.suitability === 'excellent' ? 'Utmärkt' :
                       crop.suitability === 'good' ? 'Bra' :
                       crop.suitability === 'moderate' ? 'Måttlig' : 'Utmanande'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Skörd:</span>
                      <span className="font-medium">{crop.yield} kg/m²</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kalorier:</span>
                      <span className="font-medium">{crop.nutritionValue.calories} kcal/100g</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Protein:</span>
                      <span className="font-medium">{crop.nutritionValue.protein}g/100g</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Svårighet:</span>
                      <span className="font-medium">
                        {crop.difficulty === 'beginner' ? 'Nybörjare' :
                         crop.difficulty === 'intermediate' ? 'Medel' : 'Avancerad'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kostnad:</span>
                      <span className="font-medium">{crop.costPerM2} kr/m²</span>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <p className="text-xs text-gray-600 mb-2">{crop.localTips[0]}</p>
                    <button
                      onClick={() => addCropFromLibrary(crop as CropRecommendation)}
                      disabled={isAlreadyAdded}
                      className={`w-full py-2 px-3 rounded-lg font-medium transition-all duration-200 ${
                        isAlreadyAdded
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {isAlreadyAdded ? 'Redan tillagd' : 'Lägg till'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="flex justify-end mt-6">
            <button
              onClick={() => setShowCropLibraryModal(false)}
              className="px-6 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-md border"
              style={{ 
                backgroundColor: 'white',
                borderColor: 'var(--color-secondary)',
                color: 'var(--text-primary)'
              }}
            >
              Stäng
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render add crop modal
  const renderAddCropModal = () => {
    if (!showAddCropModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-lg font-semibold mb-4">Lägg till egen gröda</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Namn på grödan
              </label>
              <input
                type="text"
                value={newCropName}
                onChange={(e) => setNewCropName(e.target.value)}
                placeholder="t.ex. Paprika, Aubergine, Zucchini..."
                className="w-full p-3 border rounded-lg"
                style={{ borderColor: 'var(--color-secondary)' }}
              />
            </div>
            
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              <p>💡 Vi hämtar automatiskt näringsdata och odlingsinformation via AI för din gröda.</p>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => {
                setShowAddCropModal(false);
                setNewCropName('');
              }}
              className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-md border"
              style={{ 
                backgroundColor: 'white',
                borderColor: 'var(--color-secondary)',
                color: 'var(--text-primary)'
              }}
            >
              Avbryt
            </button>
            <button
              onClick={addCustomCrop}
              disabled={!newCropName.trim() || isFetchingNutrition}
              className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-md disabled:opacity-50"
              style={{ 
                backgroundColor: 'var(--color-sage)', 
                color: 'white' 
              }}
            >
              {isFetchingNutrition ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block mr-2"></div>
                  Hämtar data...
                </>
              ) : (
                'Lägg till gröda'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render plan step
  const renderPlanStep = () => {
    if (!cultivationPlan) return null;
    
    return (
      <div className="space-y-6">
        <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--bg-olive-light)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <Brain className="w-5 h-5" />
              <span>Din Personliga Odlingsplan</span>
            </h3>
            {hasExistingPlan && (
              <div className="flex items-center space-x-2">
                <span className="text-sm px-3 py-1 rounded-full" style={{ 
                  backgroundColor: 'var(--color-success)', 
                  color: 'white' 
                }}>
                  Sparad
                </span>
                <button
                  onClick={() => {
                    setCurrentStep('crops');
                  }}
                  className="text-sm px-3 py-1 rounded-lg border transition-all duration-200 hover:shadow-md"
                  style={{ 
                    backgroundColor: 'white',
                    color: 'var(--color-sage)',
                    borderColor: 'var(--color-sage)'
                  }}
                >
                  Redigera
                </button>
              </div>
            )}
          </div>
          
          {/* Success/Error Messages */}
          {saveStatus === 'success' && (
            <div className="mb-4 p-3 rounded-lg flex items-center space-x-2" style={{ 
              backgroundColor: 'var(--color-success)20',
              borderColor: 'var(--color-success)',
              border: '1px solid'
            }}>
              <CheckCircle className="w-5 h-5" style={{ color: 'var(--color-success)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--color-success)' }}>
                {hasExistingPlan ? 'Plan uppdaterad!' : 'Plan sparad!'}
              </span>
            </div>
          )}
          
          {saveStatus === 'error' && (
            <div className="mb-4 p-3 rounded-lg flex items-center space-x-2" style={{ 
              backgroundColor: 'var(--color-danger)20',
              borderColor: 'var(--color-danger)',
              border: '1px solid'
            }}>
              <AlertTriangle className="w-5 h-5" style={{ color: 'var(--color-danger)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--color-danger)' }}>
                Ett fel uppstod vid sparning. Försök igen.
              </span>
            </div>
          )}
          
          {/* Plan Location Information */}
          <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'white' }}>
            <h4 className="font-medium mb-3 flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span>Planerad för din plats</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Klimatzon:</span>
                <span className="ml-2" style={{ color: 'var(--color-sage)' }}>
                  {(() => {
                    const countyToClimateZone: Record<string, string> = {
                      stockholm: 'Svealand',
                      uppsala: 'Svealand',
                      sodermanland: 'Svealand',
                      ostergotland: 'Götaland',
                      jonkoping: 'Götaland',
                      kronoberg: 'Götaland',
                      kalmar: 'Götaland',
                      blekinge: 'Götaland',
                      skane: 'Götaland',
                      halland: 'Götaland',
                      vastra_gotaland: 'Götaland',
                      varmland: 'Svealand',
                      orebro: 'Svealand',
                      vastmanland: 'Svealand',
                      dalarna: 'Svealand',
                      gavleborg: 'Svealand',
                      vasternorrland: 'Norrland',
                      jamtland: 'Norrland',
                      vasterbotten: 'Norrland',
                      norrbotten: 'Norrland'
                    };
                    return countyToClimateZone[profile?.county || ''] || 'Svealand';
                  })()}
                </span>
              </div>
              <div>
                <span className="font-medium">Familj:</span>
                <span className="ml-2" style={{ color: 'var(--color-sage)' }}>
                  {profile?.household_size || 1} personer
                </span>
              </div>
            </div>
          </div>
          
          {/* Selected Crops Section */}
          {selectedCrops.length > 0 && (
            <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'white' }}>
              <h4 className="font-medium mb-3 flex items-center space-x-2">
                <Leaf className="w-4 h-4" />
                <span>Valda grödor ({selectedCrops.length})</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedCrops.map((cropName, index) => (
                  <div key={index} className="flex items-center space-x-2 px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--bg-olive-light)' }}>
                    <span className="text-lg">{getCropIcon(cropName)}</span>
                    <span className="text-sm font-medium">{cropName}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 border rounded-lg group relative" style={{ backgroundColor: 'white' }}>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-sage)' }}>
                {cultivationPlan.selfSufficiencyPercent}%
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Självförsörjning
              </div>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 w-48">
                Hur stor del av familjens näringsbehov som täcks av odlingen. Baserat på kalorier från valda grödor.
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
              </div>
            </div>
            
            <div className="p-4 border rounded-lg group relative" style={{ backgroundColor: 'white' }}>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-sage)' }}>
                {cultivationPlan.crops.length}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Grödtyper
              </div>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 w-48">
                Antal olika grödtyper som ingår i din odlingsplan. Varje gröda har olika näringsvärden och odlingskrav.
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
              </div>
            </div>
            
            <div className="p-4 border rounded-lg group relative" style={{ backgroundColor: 'white' }}>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-sage)' }}>
                {cultivationPlan.estimatedCost.toLocaleString()} kr
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Uppskattad kostnad
              </div>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 w-48">
                Total kostnad för frön, jord, gödning och utrustning. Beräknas baserat på valda grödor och deras ytbehov.
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Valda Grödor</h4>
              <div className="flex flex-wrap gap-2">
                {cultivationPlan.crops && cultivationPlan.crops.length > 0 ? (
                  cultivationPlan.crops.map((crop, index) => (
                    <span key={index} className="px-3 py-1 rounded-full text-sm flex items-center space-x-1" 
                          style={{ backgroundColor: 'var(--color-sage)', color: 'white' }}>
                      <span>{getCropIcon(crop.crop)}</span>
                      <span>{crop.crop}</span>
                    </span>
                  ))
                ) : (
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Inga grödor valda
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Nästa steg</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {cultivationPlan.nextSteps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        
        {/* Monthly Timeline Section */}
        <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--bg-olive-light)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Månadsvis Odlingsplan</span>
            </h3>
            <button
              onClick={() => {
                // Add all timeline items to calendar
                if (!cultivationPlan.timeline) return;
                
                const timelineItems = cultivationPlan.timeline.split('\n')
                  .filter(line => line.trim())
                  .map((line, index) => {
                    const match = line.match(/^([^:]+):\s*(.+)$/);
                    if (!match) return null;
                    
                    return {
                      id: `timeline-${Date.now()}-${index}`,
                      title: `${match[1].trim()}: ${match[2].trim()}`,
                      date: new Date(),
                      type: 'timeline',
                      source: 'ai-plan'
                    };
                  })
                  .filter(item => item !== null);
                
                // Store all items in localStorage
                const existingItems = JSON.parse(localStorage.getItem('cultivationCalendarItems') || '[]');
                const updatedItems = [...existingItems, ...timelineItems];
                localStorage.setItem('cultivationCalendarItems', JSON.stringify(updatedItems));
                
                // Show success message
                alert(`${timelineItems.length} aktiviteter tillagda i Min odlingskalender!`);
              }}
              className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
              style={{ 
                backgroundColor: 'var(--color-sage)', 
                color: 'white' 
              }}
            >
              + Lägg till alla
            </button>
          </div>
          
          <div className="space-y-4">
            {cultivationPlan.timeline && cultivationPlan.timeline.split('\n').map((line, index) => {
              if (!line.trim()) return null;
              
              // Parse timeline format: "Month: Description"
              const match = line.match(/^([^:]+):\s*(.+)$/);
              if (!match) return null;
              
              const month = match[1].trim();
              const description = match[2].trim();
              
              return (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg" style={{ backgroundColor: 'white' }}>
                  <div className="flex-1">
                    <div className="font-medium text-lg" style={{ color: 'var(--color-sage)' }}>
                      {month}
                    </div>
                    <div className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                      {description}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      // Add to calendar functionality
                      const calendarItem = {
                        id: `timeline-${Date.now()}-${index}`,
                        title: `${month}: ${description}`,
                        date: new Date(),
                        type: 'timeline',
                        source: 'ai-plan'
                      };
                      
                      // Store in localStorage
                      const existingItems = JSON.parse(localStorage.getItem('cultivationCalendarItems') || '[]');
                      existingItems.push(calendarItem);
                      localStorage.setItem('cultivationCalendarItems', JSON.stringify(existingItems));
                      
                      // Show success message
                      alert('Tillagd i Min odlingskalender!');
                    }}
                    className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
                    style={{ 
                      backgroundColor: 'var(--color-sage)', 
                      color: 'white' 
                    }}
                  >
                    + Kalender
                  </button>
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
            <div className="flex items-start space-x-2">
              <div className="w-5 h-5 rounded-full flex items-center justify-center mt-0.5" style={{ backgroundColor: '#3b82f6' }}>
                <span className="text-white text-xs">i</span>
              </div>
              <div className="text-sm flex-1">
                <p className="font-medium" style={{ color: '#1e40af' }}>Lägg till i Min odlingskalender</p>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Klicka på "+ Kalender" för att lägga till specifika månadsaktiviteter i din personliga odlingskalender.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between">
          <button
            onClick={() => setCurrentStep('crops')}
            className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-md border"
            style={{ 
              backgroundColor: 'white',
              color: 'var(--text-primary)',
              borderColor: 'var(--color-sage)'
            }}
          >
            Tillbaka
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={() => setShowSavePlanModal(true)}
              disabled={saving}
              className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-md disabled:opacity-50"
              style={{ 
                backgroundColor: 'var(--color-khaki)', 
                color: 'white' 
              }}
            >
              {saving ? 'Sparar...' : 'Spara plan'}
            </button>
            
            <button
              onClick={() => setCurrentStep('gaps')}
              className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
              style={{ 
                backgroundColor: 'var(--color-sage)', 
                color: 'white' 
              }}
            >
              Nästa: Gap-analys
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render gaps step
  const renderGapsStep = () => {
    if (!cultivationPlan) return null;
    
    return (
      <div className="space-y-6">
        <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--bg-olive-light)' }}>
          <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5" />
            <span>Gap-analys & Kostnadsuppskattning</span>
          </h3>
          
          <div className="space-y-4">
            <div className="p-4 border rounded-lg" style={{ backgroundColor: 'white' }}>
              <h4 className="font-medium mb-3 flex items-center space-x-2">
                <span>Näringsgap som behöver fyllas</span>
                <div className="group relative">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center cursor-help" style={{ backgroundColor: 'var(--color-sage)', color: 'white' }}>
                    <span className="text-xs font-bold">i</span>
                  </div>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 w-64">
                    Näringsämnen som din odling inte täcker fullt ut. Dessa behöver kompletteras med köpta livsmedel för att säkerställa fullständig näring.
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                  </div>
                </div>
              </h4>
              <div className="space-y-2">
                {(() => {
                  console.log('Rendering gap analysis:', cultivationPlan.gapAnalysis);
                  console.log('Nutritional gaps:', cultivationPlan.gapAnalysis?.nutritionalGaps);
                  console.log('Nutritional gaps details:', JSON.stringify(cultivationPlan.gapAnalysis?.nutritionalGaps, null, 2));
                  console.log('Gap analysis length check:', cultivationPlan.gapAnalysis?.nutritionalGaps?.length);
                  return null;
                })()}
                {(() => {
                  const hasGaps = cultivationPlan.gapAnalysis.nutritionalGaps && cultivationPlan.gapAnalysis.nutritionalGaps.length > 0;
                  console.log('Condition check - hasGaps:', hasGaps);
                  console.log('Condition check - nutritionalGaps exists:', !!cultivationPlan.gapAnalysis.nutritionalGaps);
                  console.log('Condition check - nutritionalGaps length:', cultivationPlan.gapAnalysis.nutritionalGaps?.length);
                  return null;
                })()}
                {cultivationPlan.gapAnalysis.nutritionalGaps && cultivationPlan.gapAnalysis.nutritionalGaps.length > 0 ? (
                  cultivationPlan.gapAnalysis.nutritionalGaps.map((gap, index) => (
                    <div key={index} className="flex justify-between items-center p-2 rounded" 
                         style={{ backgroundColor: 'var(--bg-olive-light)' }}>
                      <span className="font-medium">{gap.nutrient}</span>
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Gap: {gap.gap.toFixed(1)}g
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4" style={{ color: 'var(--text-secondary)' }}>
                    Ingen gap-analys tillgänglig
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 border rounded-lg" style={{ backgroundColor: 'white' }}>
              <h4 className="font-medium mb-3 flex items-center space-x-2">
                <span>Rekommenderade inköp</span>
                <div className="group relative">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center cursor-help" style={{ backgroundColor: 'var(--color-sage)', color: 'white' }}>
                    <span className="text-xs font-bold">i</span>
                  </div>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 w-64">
                    Specifika livsmedel och kvantiteter som rekommenderas för att fylla näringsgapen. Baserat på vad din odling inte kan tillhandahålla.
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                  </div>
                </div>
              </h4>
              <div className="space-y-2">
                {cultivationPlan.gapAnalysis.groceryNeeds && cultivationPlan.gapAnalysis.groceryNeeds.length > 0 ? (
                  cultivationPlan.gapAnalysis.groceryNeeds.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-2 rounded" 
                         style={{ backgroundColor: 'var(--bg-olive-light)' }}>
                      <div>
                        <span className="font-medium">{item.item}</span>
                        <span className="text-sm ml-2" style={{ color: 'var(--text-secondary)' }}>
                          {item.quantity} {item.unit || getDefaultUnit(item.item)}
                        </span>
                      </div>
                      <span className="font-medium">{item.estimatedCost} kr</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4" style={{ color: 'var(--text-secondary)' }}>
                    Ingen kostnadsuppskattning tillgänglig
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 border rounded-lg group relative" style={{ backgroundColor: 'white' }}>
              <h4 className="font-medium mb-3 flex items-center space-x-2">
                <span>Total Kostnadsuppskattning</span>
                <div className="group relative">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center cursor-help" style={{ backgroundColor: 'var(--color-sage)', color: 'white' }}>
                    <span className="text-xs font-bold">i</span>
                  </div>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 w-64">
                    Veckokostnad för att fylla näringsgap med köpta livsmedel. Baserat på rekommenderade inköp ovan.
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                  </div>
                </div>
              </h4>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-sage)' }}>
                {cultivationPlan.gapAnalysis.totalEstimatedCost ?
                  cultivationPlan.gapAnalysis.totalEstimatedCost.toLocaleString() + ' kr/vecka' :
                  'Kostnad beräknas...'
                }
              </div>
              <div className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                Veckokostnad för kompletterande livsmedel
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between">
          <button
            onClick={() => setCurrentStep('plan')}
            className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-md border"
            style={{ 
              backgroundColor: 'white',
              color: 'var(--text-primary)',
              borderColor: 'var(--color-sage)'
            }}
          >
            Tillbaka
          </button>
          <button
            onClick={() => setCurrentStep('profile')}
            className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
            style={{ 
              backgroundColor: 'var(--color-sage)', 
              color: 'white' 
            }}
          >
            Börja om
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-sage)' }}>
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Min odling
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Personlig odlingsplan baserad på din familj och lokala förhållanden
          </p>
        </div>
      </div>

      {/* Live Summary - shows on all steps */}
      {renderSummary()}

      {/* Step Navigation */}
      <div className="flex space-x-1 mb-8 p-1 rounded-lg" style={{ backgroundColor: 'var(--bg-olive-light)' }}>
        {[
          { id: 'profile', label: '1. Profil & Näring', icon: Users },
          { id: 'crops', label: '2. Grödval', icon: Sprout },
          { id: 'plan', label: '3. Plan', icon: Brain },
          { id: 'gaps', label: '4. Gap-analys', icon: ShoppingCart }
        ].map(step => {
          const StepIcon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = ['profile', 'crops', 'plan'].indexOf(currentStep) > ['profile', 'crops', 'plan'].indexOf(step.id);
          
          return (
            <button
              key={step.id}
              onClick={() => setCurrentStep(step.id as any)}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                isActive ? 'shadow-sm' : 'hover:shadow-sm'
              }`}
              style={{
                backgroundColor: isActive ? 'var(--bg-card)' : isCompleted ? 'rgba(135, 169, 107, 0.1)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : isCompleted ? 'var(--color-sage)' : 'var(--text-secondary)'
              }}
            >
              <StepIcon className="w-4 h-4" />
              <span className="hidden sm:inline">{step.label}</span>
            </button>
          );
        })}
      </div>

      {/* Error Notifications */}
      
      {saveStatus === 'error' && (
        <div className="fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50" style={{ backgroundColor: '#ef4444', color: 'white' }}>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5" />
            <span>Fel vid sparande till Supabase</span>
          </div>
        </div>
      )}

      {/* Content */}
      {currentStep === 'profile' && renderProfileStep()}
      {currentStep === 'crops' && renderCropStep()}
      {currentStep === 'plan' && renderPlanStep()}
      {currentStep === 'gaps' && renderGapsStep()}

      {/* Profile Editor Modal */}
      {showProfileEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Uppdatera
                </h3>
                <button
                  onClick={() => setShowProfileEditor(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>

              <div className="space-y-6">
                {/* Family Information */}
                <div>
                  <h4 className="font-medium mb-4" style={{ color: 'var(--text-primary)' }}>Familj</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Hushållsstorlek</label>
                      <input
                        type="number"
                        value={profileUpdateData.household_size}
                        onChange={(e) => setProfileUpdateData(prev => ({ 
                          ...prev, 
                          household_size: parseInt(e.target.value) || 1 
                        }))}
                        className="w-full px-3 py-2 border rounded-lg"
                        min="1"
                        max="20"
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={profileUpdateData.has_children}
                          onChange={(e) => setProfileUpdateData(prev => ({ 
                            ...prev, 
                            has_children: e.target.checked 
                          }))}
                          className="rounded"
                        />
                        <span className="text-sm">Har barn</span>
                      </label>
                      
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={profileUpdateData.has_elderly}
                          onChange={(e) => setProfileUpdateData(prev => ({ 
                            ...prev, 
                            has_elderly: e.target.checked 
                          }))}
                          className="rounded"
                        />
                        <span className="text-sm">Har äldre</span>
                      </label>
                      
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={profileUpdateData.has_pets}
                          onChange={(e) => setProfileUpdateData(prev => ({ 
                            ...prev, 
                            has_pets: e.target.checked 
                          }))}
                          className="rounded"
                        />
                        <span className="text-sm">Har husdjur</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Location Information */}
                <div>
                  <h4 className="font-medium mb-4" style={{ color: 'var(--text-primary)' }}>Lokalisation</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Stad</label>
                      <input
                        type="text"
                        value={profileUpdateData.city}
                        onChange={(e) => setProfileUpdateData(prev => ({ 
                          ...prev, 
                          city: e.target.value 
                        }))}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="Ange stad"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Län</label>
                      <select
                        value={profileUpdateData.county}
                        onChange={(e) => setProfileUpdateData(prev => ({ 
                          ...prev, 
                          county: e.target.value 
                        }))}
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="">Välj län</option>
                        <option value="stockholm">Stockholm</option>
                        <option value="uppsala">Uppsala</option>
                        <option value="sodermanland">Södermanland</option>
                        <option value="ostergotland">Östergötland</option>
                        <option value="jonkoping">Jönköping</option>
                        <option value="kronoberg">Kronoberg</option>
                        <option value="kalmar">Kalmar</option>
                        <option value="blekinge">Blekinge</option>
                        <option value="skane">Skåne</option>
                        <option value="halland">Halland</option>
                        <option value="vastra_gotaland">Västra Götaland</option>
                        <option value="varmland">Värmland</option>
                        <option value="orebro">Örebro</option>
                        <option value="vastmanland">Västmanland</option>
                        <option value="dalarna">Dalarna</option>
                        <option value="gavleborg">Gävleborg</option>
                        <option value="vasternorrland">Västernorrland</option>
                        <option value="jamtland">Jämtland</option>
                        <option value="vasterbotten">Västerbotten</option>
                        <option value="norrbotten">Norrbotten</option>
                      </select>
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">Adress</label>
                      <input
                        type="text"
                        value={profileUpdateData.address}
                        onChange={(e) => setProfileUpdateData(prev => ({ 
                          ...prev, 
                          address: e.target.value 
                        }))}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="Ange adress"
                      />
                    </div>
                  </div>
                </div>

                {/* Special Needs */}
                <div>
                  <h4 className="font-medium mb-4" style={{ color: 'var(--text-primary)' }}>Särskilda behov</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Allergier</label>
                      <input
                        type="text"
                        value={profileUpdateData.allergies}
                        onChange={(e) => setProfileUpdateData(prev => ({ 
                          ...prev, 
                          allergies: e.target.value 
                        }))}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="Ange allergier (kommaseparerade)"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Särskilda behov</label>
                      <textarea
                        value={profileUpdateData.special_needs}
                        onChange={(e) => setProfileUpdateData(prev => ({ 
                          ...prev, 
                          special_needs: e.target.value 
                        }))}
                        className="w-full px-3 py-2 border rounded-lg"
                        rows={3}
                        placeholder={t('cultivation_planning.enter_plan_name')}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowProfileEditor(false)}
                  className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-md border"
                  style={{ 
                    backgroundColor: 'white',
                    color: 'var(--text-primary)',
                    borderColor: 'var(--color-secondary)'
                  }}
                >
                  Avbryt
                </button>
                <button
                  onClick={updateUserProfile}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-md disabled:opacity-50"
                  style={{ 
                    backgroundColor: 'var(--color-sage)', 
                    color: 'white' 
                  }}
                >
                  {saving ? 'Sparar...' : 'Spara Profil'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Crop Modal */}
      {renderAddCropModal()}
      
      {/* Crop Library Modal */}
      {renderCropLibraryModal()}
      
      {/* Save Plan Modal */}
      {showSavePlanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Spara odlingsplan</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Namn på planen
                </label>
                <input
                  type="text"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder="t.ex. Vårplan 2024, Familjens odling..."
                  className="w-full p-3 border rounded-lg"
                  style={{ borderColor: 'var(--color-secondary)' }}
                  autoFocus
                />
              </div>
              
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                <p>💡 Ge din plan ett beskrivande namn så du enkelt kan hitta den senare.</p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowSavePlanModal(false);
                  setPlanName('');
                }}
                className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-md border"
                style={{ 
                  backgroundColor: 'white',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--color-secondary)'
                }}
              >
                Avbryt
              </button>
              <button
                onClick={async () => {
                  if (cultivationPlan && planName.trim()) {
                    await saveCultivationPlan(cultivationPlan, planName.trim());
                  }
                }}
                disabled={saving || !planName.trim()}
                className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-md disabled:opacity-50"
                style={{ 
                  backgroundColor: 'var(--color-sage)', 
                  color: 'white' 
                }}
              >
                {saving ? 'Sparar...' : 'Spara plan'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Plan Modal */}
      {showDeleteModal && planToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-danger)' }}>
              Ta bort odlingsplan
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-olive-light)' }}>
                <div className="font-medium">{planToDelete.title}</div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {planToDelete.crops?.length || 0} grödor • {planToDelete.self_sufficiency_percent}% självförsörjning
                </div>
              </div>
              
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                <p>⚠️ Denna åtgärd kan inte ångras. Planen kommer att tas bort permanent.</p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setPlanToDelete(null);
                }}
                className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-md border"
                style={{ 
                  backgroundColor: 'white',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--color-secondary)'
                }}
              >
                Avbryt
              </button>
              <button
                onClick={async () => {
                  if (planToDelete?.id) {
                    await deleteCultivationPlan(planToDelete.id);
                  }
                }}
                disabled={saving}
                className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-md disabled:opacity-50"
                style={{ 
                  backgroundColor: 'var(--color-danger)', 
                  color: 'white' 
                }}
              >
                {saving ? 'Tar bort...' : 'Ta bort plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
