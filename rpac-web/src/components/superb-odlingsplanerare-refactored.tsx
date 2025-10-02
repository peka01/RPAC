'use client';

import { useState, useEffect } from 'react';
import { useUserProfile } from '@/lib/useUserProfile';
import { supabase } from '@/lib/supabase';
import { getClimateZoneFromCounty } from '@/constants/climateZones';
import { generateAIGardenPlan } from '@/lib/ai/generateAIGardenPlan';
import { generateIntelligentRecommendations } from '@/lib/cultivation/generateIntelligentRecommendations';
import { calculateGardenProduction } from '@/lib/cultivation/calculateGardenProduction';
import { generateMonthlyTasks } from '@/lib/cultivation/generateMonthlyTasks';
import { ProfileEditorModal } from './profile-editor-modal';
import { SavePlanModal } from './Modals/SavePlanModal';
import { CustomCropModal } from './Modals/CustomCropModal';
import { ProfileSetup } from './SuperbOdlingsPlanerare/ProfileSetup';
import { AIGenerationView } from './SuperbOdlingsPlanerare/AIGenerationView';
import { InteractiveDashboard } from './SuperbOdlingsPlanerare/InteractiveDashboard';
import { CheckCircle } from 'lucide-react';

interface SuperbOdlingsplanerareProps {
  user: any;
  selectedPlan?: any;
}

interface UserProfile {
  household_size: number;
  has_children: boolean;
  has_elderly: boolean;
  has_pets: boolean;
  city: string;
  county: string;
  address: string;
  allergies: string;
  special_needs: string;
  garden_size: number;
  experience_level: 'beginner' | 'intermediate' | 'advanced';
  climate_zone: 'Götaland' | 'Svealand' | 'Norrland';
}

interface GardenPlan {
  selfSufficiencyPercent: number;
  caloriesFromGarden: number;
  caloriesFromGroceries: number;
  annualCalorieNeed: number;
  gardenProduction: number;
  grocerySuggestions: string[];
  crops: any[];
  monthlyTasks: any[];
  totalSpace: number;
  estimatedCost: number;
}

export function SuperbOdlingsplanerare({ user, selectedPlan }: SuperbOdlingsplanerareProps) {
  const { profile, refreshProfile } = useUserProfile(user);
  const [currentStep, setCurrentStep] = useState<'profile' | 'generating' | 'dashboard'>('profile');
  const [loading, setLoading] = useState(false);
  const [gardenPlan, setGardenPlan] = useState<GardenPlan | null>(null);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [profileData, setProfileData] = useState<UserProfile>({
    household_size: 1,
    has_children: false,
    has_elderly: false,
    has_pets: false,
    city: '',
    county: '',
    address: '',
    allergies: '',
    special_needs: '',
    garden_size: 50,
    experience_level: 'beginner',
    climate_zone: 'Svealand'
  });

  // Interactive parameters for self-sufficiency optimization
  const [adjustableGardenSize, setAdjustableGardenSize] = useState(50);
  const [selectedCrops, setSelectedCrops] = useState<string[]>([]);
  const [cultivationIntensity, setCultivationIntensity] = useState<'low' | 'medium' | 'high'>('medium');
  const [cropVolumes, setCropVolumes] = useState<Record<string, number>>({});
  const [realTimeStats, setRealTimeStats] = useState<{
    gardenProduction: number;
    selfSufficiencyPercent: number;
    caloriesFromGroceries: number;
    totalCost: number;
    totalSpace: number;
  } | null>(null);

  // Save plan modal
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [planName, setPlanName] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveToCalendar, setSaveToCalendar] = useState(false);
  const [saveReminders, setSaveReminders] = useState(false);

  // Custom crop modal
  const [showCustomCropModal, setShowCustomCropModal] = useState(false);
  const [customCropName, setCustomCropName] = useState('');
  const [customCropDescription, setCustomCropDescription] = useState('');
  const [isValidatingCrop, setIsValidatingCrop] = useState(false);
  const [customCropData, setCustomCropData] = useState<any>(null);
  const [showIntensityTooltip, setShowIntensityTooltip] = useState(false);
  const [profileUpdateSuccess, setProfileUpdateSuccess] = useState(false);

  const handleProfileSave = async (updatedProfile: UserProfile) => {
    try {
      console.log('Saving profile:', updatedProfile);
      setProfileData(updatedProfile);
      
      // Update the profile in Supabase
      if (user?.id) {
        const { error } = await supabase
          .from('user_profiles')
          .update({
            household_size: updatedProfile.household_size,
            has_children: updatedProfile.has_children,
            has_elderly: updatedProfile.has_elderly,
            has_pets: updatedProfile.has_pets,
            city: updatedProfile.city,
            county: updatedProfile.county,
            address: updatedProfile.address,
            allergies: updatedProfile.allergies,
            special_needs: updatedProfile.special_needs,
            experience_level: updatedProfile.experience_level,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (error) {
          console.error('Error updating profile in database:', error);
        } else {
          console.log('Profile updated successfully in database');
          setProfileUpdateSuccess(true);
          setTimeout(() => setProfileUpdateSuccess(false), 3000);
        }
      }
      
      // Force refresh of profile data
      if (profile && refreshProfile) {
        await refreshProfile();
      }
      
      // Update the profile data state to reflect changes immediately
      setProfileData(updatedProfile);
      
      // If on dashboard, regenerate plan with new profile data
      if (currentStep === 'dashboard') {
        setCurrentStep('generating');
        await generateGardenPlan();
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const savePlanning = async (customName?: string) => {
    try {
      if (!gardenPlan) return;

      const planNameToUse = customName || planName || `Odlingsplan ${new Date().toLocaleDateString('sv-SE')}`;
      
      const planData = {
        plan_data: {
          name: planNameToUse,
          profile: profileData,
          gardenPlan: gardenPlan,
          selectedCrops: selectedCrops,
          cropVolumes: cropVolumes,
          adjustableGardenSize: adjustableGardenSize,
          cultivationIntensity: cultivationIntensity,
          realTimeStats: realTimeStats, // Save the current real-time stats
          created_at: new Date().toISOString()
        },
        user_id: user?.id
      };

      // Debug: Log what we're saving
      console.log('Saving plan with realTimeStats:', {
        realTimeStats: realTimeStats,
        selfSufficiencyPercent: realTimeStats?.selfSufficiencyPercent,
        gardenPlanSelfSufficiency: gardenPlan?.selfSufficiencyPercent
      });

      // Save to Supabase
      const { data, error } = await supabase
        .from('cultivation_plans')
        .insert([planData])
        .select()
        .single();

      if (error) {
        console.error('Error saving plan:', error);
        return;
      }

      console.log('Plan saved successfully:', data);
      setSaveSuccess(true);
      
      // Auto-dismiss success message
      setTimeout(() => {
        setSaveSuccess(false);
        setShowSaveModal(false);
        setPlanName('');
        setSaveToCalendar(false);
        setSaveReminders(false);
      }, 3000);

      // Save to calendar if requested
      if (saveToCalendar) {
        await saveToCalendarEntries();
      }
      
      if (saveReminders) {
        await saveRemindersToCalendar();
      }

    } catch (error) {
      console.error('Error saving planning:', error);
    }
  };

  const saveToCalendarEntries = async () => {
    // Implementation for saving to calendar
    console.log('Saving to calendar entries...');
  };

  const saveRemindersToCalendar = async () => {
    // Implementation for saving reminders
    console.log('Saving reminders to calendar...');
  };

  // Update profile data when profile changes
  useEffect(() => {
    if (profile) {
      const updatedProfileData = {
        household_size: profile.household_size || 1,
        has_children: profile.has_children || false,
        has_elderly: profile.has_elderly || false,
        has_pets: profile.has_pets || false,
        city: profile.city || '',
        county: profile.county || '',
        address: profile.address || '',
        allergies: profile.allergies || '',
        special_needs: profile.special_needs || '',
        garden_size: 50,
        experience_level: (profile.experience_level as 'beginner' | 'intermediate' | 'advanced') || 'beginner',
        climate_zone: profile.county ? getClimateZoneFromCounty(profile.county) : 'Svealand'
      };

      console.log('Profile updated from useUserProfile:', updatedProfileData);
      setProfileData(updatedProfileData);
      setAdjustableGardenSize(50);
    }
  }, [profile]);

  // Real-time calculation when parameters change
  useEffect(() => {
    if (profileData.household_size > 0 && gardenPlan?.crops && gardenPlan.crops.length > 0) {
      try {
        const dailyCaloriesPerPerson = 2000;
        const annualCalorieNeed = profileData.household_size * dailyCaloriesPerPerson * 365;
        const production = calculateGardenProduction(
          selectedCrops,
          adjustableGardenSize,
          cultivationIntensity,
          cropVolumes,
          gardenPlan
        );
        const caloriesFromGroceries = Math.max(0, annualCalorieNeed - production.calories);
        const selfSufficiencyPercent = Math.round((production.calories / annualCalorieNeed) * 100);

        setRealTimeStats({
          gardenProduction: production.calories,
          selfSufficiencyPercent,
          caloriesFromGroceries,
          totalCost: production.cost,
          totalSpace: production.spaceUsed
        });
      } catch (error) {
        console.error('Error in real-time calculation:', error);
        // Set default stats to prevent infinite loop
        setRealTimeStats({
          gardenProduction: 0,
          selfSufficiencyPercent: 0,
          caloriesFromGroceries: profileData.household_size * 2000 * 365,
          totalCost: 0,
          totalSpace: 0
        });
      }
    }
  }, [selectedCrops, adjustableGardenSize, cultivationIntensity, cropVolumes, profileData.household_size, gardenPlan]);

  // Load selected plan when provided
  useEffect(() => {
    if (selectedPlan && selectedPlan.plan_data) {
      loadSelectedPlanData(selectedPlan.plan_data);
    }
  }, [selectedPlan]);

  const loadSelectedPlanData = (planData: any) => {
    try {
      console.log('Loading selected plan data:', planData);
      
      // Show loading state briefly
      setLoading(true);
      
      // Load the plan data into the component state
      if (planData.profile) {
        setProfileData(planData.profile);
      }
      
      if (planData.gardenPlan) {
        setGardenPlan(planData.gardenPlan);
      }
      
      if (planData.selectedCrops) {
        setSelectedCrops(planData.selectedCrops);
      }
      
      if (planData.cropVolumes) {
        setCropVolumes(planData.cropVolumes);
      }
      
      if (planData.adjustableGardenSize) {
        setAdjustableGardenSize(planData.adjustableGardenSize);
      }
      
      if (planData.cultivationIntensity) {
        setCultivationIntensity(planData.cultivationIntensity);
      }

      // Load the saved realTimeStats if available
      if (planData.realTimeStats) {
        setRealTimeStats(planData.realTimeStats);
        console.log('Loaded realTimeStats from saved plan:', planData.realTimeStats);
      }

      // Move to dashboard to show the loaded plan
      setCurrentStep('dashboard');
      
      // Hide loading state
      setTimeout(() => {
        setLoading(false);
      }, 1000);
      
      console.log('Plan loaded successfully');
    } catch (error) {
      console.error('Error loading plan:', error);
      setLoading(false);
    }
  };

  const generateGardenPlan = async () => {
    setCurrentStep('generating');
    setLoading(true);

    try {
      // Show AI processing steps with realistic timing
      const steps = [
        { text: "AI analyserar din profil...", duration: 2000 },
        { text: "Beräknar näringsbehov...", duration: 1500 },
        { text: "Skapar din personliga odlingsplan...", duration: 3000 },
        { text: "Optimerar för svenska förhållanden...", duration: 2000 },
        { text: "Slutför planen...", duration: 1000 }
      ];

      for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, step.duration));
      }

      // Generate AI plan
      console.log('Starting AI garden plan generation...');
      const plan = await generateAIGardenPlan(
        profileData,
        adjustableGardenSize,
        selectedCrops,
        cultivationIntensity,
        cropVolumes
      );
      setGardenPlan(plan);
      
      // Generate intelligent recommendations for initial crop selection
      const recommendations = generateIntelligentRecommendations(profileData, adjustableGardenSize);
      setSelectedCrops(recommendations.crops);
      setCropVolumes(recommendations.volumes);
      
      console.log('AI garden plan generated successfully:', plan);
      setCurrentStep('dashboard');
    } catch (error) {
      console.error('Error generating garden plan:', error);
      // Still show dashboard with fallback data
      const fallbackPlan = await generateAIGardenPlan(
        profileData,
        adjustableGardenSize,
        selectedCrops,
        cultivationIntensity,
        cropVolumes
      );
      setGardenPlan(fallbackPlan);
      setCurrentStep('dashboard');
    } finally {
      setLoading(false);
    }
  };

  const generateMonthlyTasksHandler = () => {
    return generateMonthlyTasks(selectedCrops, gardenPlan, cropVolumes);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {currentStep === 'profile' && (
          <ProfileSetup
            profileData={profileData}
            onEditProfile={() => setShowProfileEditor(true)}
            onGeneratePlan={generateGardenPlan}
          />
        )}
        {currentStep === 'generating' && <AIGenerationView />}
        {currentStep === 'dashboard' && (
          <InteractiveDashboard
            profileData={profileData}
            gardenPlan={gardenPlan}
            realTimeStats={realTimeStats}
            adjustableGardenSize={adjustableGardenSize}
            setAdjustableGardenSize={setAdjustableGardenSize}
            cultivationIntensity={cultivationIntensity}
            setCultivationIntensity={setCultivationIntensity}
            showIntensityTooltip={showIntensityTooltip}
            setShowIntensityTooltip={setShowIntensityTooltip}
            selectedCrops={selectedCrops}
            setSelectedCrops={setSelectedCrops}
            cropVolumes={cropVolumes}
            setCropVolumes={setCropVolumes}
            onEditProfile={() => setShowProfileEditor(true)}
            onSavePlan={() => {
              setPlanName(`Odlingsplan ${new Date().toLocaleDateString('sv-SE')}`);
              setShowSaveModal(true);
            }}
            onNewPlan={() => setCurrentStep('profile')}
            onAddCustomCrop={() => setShowCustomCropModal(true)}
            generateMonthlyTasks={generateMonthlyTasksHandler}
          />
        )}
      </div>

      <ProfileEditorModal
        isOpen={showProfileEditor}
        onClose={() => setShowProfileEditor(false)}
        profile={profileData}
        onSave={handleProfileSave}
      />

      <SavePlanModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        planName={planName}
        setPlanName={setPlanName}
        saveToCalendar={saveToCalendar}
        setSaveToCalendar={setSaveToCalendar}
        saveReminders={saveReminders}
        setSaveReminders={setSaveReminders}
        onSave={savePlanning}
      />

      <CustomCropModal
        isOpen={showCustomCropModal}
        onClose={() => setShowCustomCropModal(false)}
        customCropName={customCropName}
        setCustomCropName={setCustomCropName}
        customCropDescription={customCropDescription}
        setCustomCropDescription={setCustomCropDescription}
        customCropData={customCropData}
        isValidatingCrop={isValidatingCrop}
        onValidate={() => {
          // Implementation for validating custom crop
          console.log('Validating custom crop...');
        }}
        onAdd={() => {
          // Implementation for adding custom crop
          console.log('Adding custom crop...');
        }}
      />

      {/* Save Success Message */}
      {saveSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2">
          <CheckCircle className="w-5 h-5" />
          <span>Odlingsplan sparad framgångsrikt!</span>
        </div>
      )}

      {/* Profile Update Success Message */}
      {profileUpdateSuccess && (
        <div className="fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2">
          <CheckCircle className="w-5 h-5" />
          <span>Profil uppdaterad framgångsrikt!</span>
        </div>
      )}

      {/* Intensity Tooltip - positioned outside stacking context */}
      {showIntensityTooltip && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-80 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg" style={{ zIndex: 9999 }}>
          <div className="font-semibold mb-2">Odlingsintensitet</div>
          <div className="space-y-2">
            <div>
              <strong>Låg (80%):</strong> Minimal vård, naturlig tillväxt. Lämpligt för nybörjare eller begränsad tid.
            </div>
            <div>
              <strong>Medel (100%):</strong> Standard vård och näring. Balanserad approach för de flesta odlare.
            </div>
            <div>
              <strong>Hög (130%):</strong> Intensiv vård, optimal näring och bevattning. Maximerar skörd men kräver mer tid.
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-700 text-gray-300">
            Högre intensitet = fler kalorier per planta men högre kostnad och mer arbete.
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
}


