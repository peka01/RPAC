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
  Info,
  Settings,
  Save,
  Trash2,
  Loader2,
  Sparkles,
  BarChart3,
  PieChart,
  Calendar as CalendarIcon,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  User,
  Home,
  TreePine,
  X,
  Plus
} from 'lucide-react';
import { ProfileEditorModal } from './profile-editor-modal';

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
  crops: CropRecommendation[];
  monthlyTasks: MonthlyTask[];
  totalSpace: number;
  estimatedCost: number;
}

interface CropRecommendation {
  name: string;
  scientificName: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  sowingMonths: string[];
  harvestingMonths: string[];
  spaceRequired: number;
  yield: number;
  calories: number;
  nutritionalHighlights: string[];
  spacePerPlant?: number;
  color: string;
  icon?: string;
}

interface MonthlyTask {
  month: string;
  tasks: string[];
  priority: 'low' | 'medium' | 'high';
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

  // Planning management
  const [savedPlans, setSavedPlans] = useState<any[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [showPlanSelector, setShowPlanSelector] = useState(false);
  
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


  // Delete a saved plan
  const deletePlan = async (planId: string) => {
    try {
      const { error } = await supabase
        .from('cultivation_plans')
        .delete()
        .eq('id', planId);

      if (error) {
        console.error('Error deleting plan:', error);
        return;
      }

      // Remove from local state
      setSavedPlans(prev => prev.filter(p => p.id !== planId));
      console.log('Plan deleted successfully');
    } catch (error) {
      console.error('Error deleting plan:', error);
    }
  };

  const saveToCalendarEntries = async () => {
    try {
      if (!gardenPlan || !selectedCrops.length) return;

      // First, clear existing entries for this user to prevent duplicates
      const { error: deleteError } = await supabase
        .from('cultivation_calendar')
        .delete()
        .eq('user_id', user?.id);

      if (deleteError) {
        console.error('Error clearing existing calendar entries:', deleteError);
        return;
      }

      const calendarEntries: Array<{
        title: string;
        description: string;
        date: string;
        type: string;
        crop_name: string;
        plant_count: number;
        user_id: string | undefined;
      }> = [];
      const monthNames = [
        'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
        'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'
      ];
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1; // 1-based month

      // Generate calendar entries for each selected crop
      selectedCrops.forEach(cropName => {
        const crop = gardenPlan.crops.find(c => c.name === cropName);
        const volume = cropVolumes[cropName] || 0;
        
        if (crop && volume > 0) {
          // Sowing entries - use last day of month for monthly overview
          crop.sowingMonths.forEach(month => {
            const monthNumber = monthNames.indexOf(month) + 1;
            if (monthNumber > 0) {
              // Determine if we should use current year or next year
              let targetYear = currentYear;
              if (monthNumber < currentMonth) {
                targetYear = currentYear + 1; // Use next year if month has passed
              }
              
              // Use last day of month for monthly due date
              const date = new Date(targetYear, monthNumber, 0); // Last day of month
              
              // Only create entry if it's in the future
              if (date > currentDate && !isNaN(date.getTime())) {
                calendarEntries.push({
                  title: `Så ${cropName} (${volume} plantor)`,
                  description: `Så ${cropName} enligt din odlingsplan - månadsvis deadline`,
                  date: date.toISOString().split('T')[0],
                  type: 'sowing',
                  crop_name: cropName,
                  plant_count: volume,
                  user_id: user?.id
                });
              }
            }
          });

          // Harvesting entries - use last day of month for monthly overview
          crop.harvestingMonths.forEach(month => {
            const monthNumber = monthNames.indexOf(month) + 1;
            if (monthNumber > 0) {
              // Determine if we should use current year or next year
              let targetYear = currentYear;
              if (monthNumber < currentMonth) {
                targetYear = currentYear + 1; // Use next year if month has passed
              }
              
              // Use last day of month for monthly due date
              const date = new Date(targetYear, monthNumber, 0); // Last day of month
              
              // Only create entry if it's in the future
              if (date > currentDate && !isNaN(date.getTime())) {
                calendarEntries.push({
                  title: `Skörda ${cropName} (${volume} plantor)`,
                  description: `Skörda ${cropName} enligt din odlingsplan - månadsvis deadline`,
                  date: date.toISOString().split('T')[0],
                  type: 'harvesting',
                  crop_name: cropName,
                  plant_count: volume,
                  user_id: user?.id
                });
              }
            }
          });
        }
      });

      // Save to Supabase
      if (calendarEntries.length > 0) {
        const { error } = await supabase
          .from('cultivation_calendar')
          .insert(calendarEntries);

        if (error) {
          console.error('Error saving to calendar:', error);
        } else {
          console.log('Calendar entries saved successfully:', calendarEntries.length);
        }
      }

    } catch (error) {
      console.error('Error saving to calendar:', error);
    }
  };

  const saveRemindersToCalendar = async () => {
    try {
      if (!gardenPlan || !selectedCrops.length) return;

      const reminders: Array<{
        user_id: string | undefined;
        reminder_type: string;
        reminder_date: string;
        is_completed: boolean;
        title: string;
        description: string;
        crop_name: string;
        plant_count: number;
        notes: string;
      }> = [];
      const monthNames = [
        'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
        'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'
      ];
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1; // 1-based month

      // Generate reminders for each selected crop
      selectedCrops.forEach(cropName => {
        const crop = gardenPlan.crops.find(c => c.name === cropName);
        const volume = cropVolumes[cropName] || 0;
        
        if (crop && volume > 0) {
          // Sowing reminders (1 week before)
          crop.sowingMonths.forEach(month => {
            const monthNumber = monthNames.indexOf(month) + 1;
            if (monthNumber > 0) {
              // Determine if we should use current year or next year
              let targetYear = currentYear;
              if (monthNumber < currentMonth) {
                targetYear = currentYear + 1; // Use next year if month has passed
              }
              
              const sowingDate = new Date(targetYear, monthNumber - 1, 1);
              const reminderDate = new Date(sowingDate);
              reminderDate.setDate(reminderDate.getDate() - 7); // 1 week before
              
              // Only create reminder if it's in the future
              if (reminderDate > currentDate && !isNaN(reminderDate.getTime())) {
                reminders.push({
                  user_id: user?.id,
                  reminder_type: 'sowing',
                  reminder_date: reminderDate.toISOString().split('T')[0],
                  is_completed: false,
                  title: `Så ${cropName} (${volume} plantor)`,
                  description: `Kom ihåg att så ${cropName} (${volume} plantor) nästa vecka enligt din odlingsplan`,
                  crop_name: cropName,
                  plant_count: volume,
                  notes: `Så ${cropName} enligt din odlingsplan`
                });
              }
            }
          });

          // Harvesting reminders (1 week before)
          crop.harvestingMonths.forEach(month => {
            const monthNumber = monthNames.indexOf(month) + 1;
            if (monthNumber > 0) {
              // Determine if we should use current year or next year
              let targetYear = currentYear;
              if (monthNumber < currentMonth) {
                targetYear = currentYear + 1; // Use next year if month has passed
              }
              
              const harvestDate = new Date(targetYear, monthNumber - 1, 15);
              const reminderDate = new Date(harvestDate);
              reminderDate.setDate(reminderDate.getDate() - 7); // 1 week before
              
              // Only create reminder if it's in the future
              if (reminderDate > currentDate && !isNaN(reminderDate.getTime())) {
                reminders.push({
                  user_id: user?.id,
                  reminder_type: 'harvesting',
                  reminder_date: reminderDate.toISOString().split('T')[0],
                  is_completed: false,
                  title: `Skörda ${cropName} (${volume} plantor)`,
                  description: `Kom ihåg att skörda ${cropName} (${volume} plantor) nästa vecka enligt din odlingsplan`,
                  crop_name: cropName,
                  plant_count: volume,
                  notes: `Skörda ${cropName} enligt din odlingsplan`
                });
              }
            }
          });
        }
      });

      // Clear old reminders from previous plans before saving new ones
      if (reminders.length > 0) {
        // First, delete all existing reminders for this user
        const { error: deleteError } = await supabase
          .from('cultivation_reminders')
          .delete()
          .eq('user_id', user?.id);

        if (deleteError) {
          console.error('Error clearing old reminders:', deleteError);
          return;
        }

        // Then insert the new reminders
        const { error } = await supabase
          .from('cultivation_reminders')
          .insert(reminders);

        if (error) {
          console.error('Error saving reminders:', error);
        } else {
          console.log('Old reminders cleared and new reminders saved successfully');
        }
      }

    } catch (error) {
      console.error('Error saving reminders:', error);
    }
  };

  // Update profile data when profile changes
  useEffect(() => {
    if (profile) {
      const getClimateZoneFromCounty = (county: string): 'Götaland' | 'Svealand' | 'Norrland' => {
        const countyToClimateZone: Record<string, 'Götaland' | 'Svealand' | 'Norrland'> = {
          'stockholm': 'Svealand',
          'uppsala': 'Svealand', 
          'sodermanland': 'Svealand',
          'ostergotland': 'Götaland',
          'jonkoping': 'Götaland',
          'kronoberg': 'Götaland',
          'kalmar': 'Götaland',
          'blekinge': 'Götaland',
          'skane': 'Götaland',
          'halland': 'Götaland',
          'vastra_gotaland': 'Götaland',
          'varmland': 'Svealand',
          'orebro': 'Svealand',
          'vastmanland': 'Svealand',
          'dalarna': 'Svealand',
          'gavleborg': 'Svealand',
          'vasternorrland': 'Norrland',
          'jamtland': 'Norrland',
          'vasterbotten': 'Norrland',
          'norrbotten': 'Norrland'
        };
        return countyToClimateZone[county] || 'Svealand';
      };

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
        const production = calculateGardenProduction(selectedCrops, adjustableGardenSize, cultivationIntensity, cropVolumes);
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
      const plan = await generateAIGardenPlan(profileData);
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
      const fallbackPlan = await generateAIGardenPlan(profileData);
      setGardenPlan(fallbackPlan);
      setCurrentStep('dashboard');
    } finally {
      setLoading(false);
    }
  };

  const generateAIGardenPlan = async (profile: UserProfile): Promise<GardenPlan> => {
    let aiPlan: any = null;

    try {
      // 1. Build AI prompt
      const prompt = `Du är en expert på svensk odling och självförsörjning. Skapa en personlig odlingsplan för:

PROFIL:
- Hushåll: ${profile.household_size} personer
- Ort: ${profile.city}, ${profile.county}
- Klimatzon: ${profile.climate_zone}
- Erfarenhet: ${profile.experience_level}
- Trädgårdsstorlek: ${adjustableGardenSize} m²
- Allergier: ${profile.allergies || 'Inga'}
- Särskilda behov: ${profile.special_needs || 'Inga'}

UPPGIFT:
Skapa en detaljerad odlingsplan som maximerar självförsörjningen för detta hushåll. Inkludera:

1. Rekommenderade grödor (EXAKT 20 stycken - INTE FÄRRE) med:
   - Namn och vetenskapligt namn
   - Beskrivning
   - Svårighetsgrad (beginner/intermediate/advanced)
   - Såmånader och skördemånader
   - Utrymme per planta (m²) - VIKTIGT: Ange exakt m² per planta
   - Förväntad skörd (kg) - VIKTIGT: Ange total skörd i kg
   - Kalorier per kg
   - Näringshöjdpunkter
   - Färgkod (hex-färg)
   - Emoji-ikon (lämplig emoji för grödan)

VIKTIGT: Inkludera en mångfaldig mix av grödor:
- Rotgrönsaker (potatis, morötter, lök, rödbetor)
- Bladgrönsaker (spenat, sallad, kål)
- Fruktgrönsaker (tomater, paprika, gurka)
- Baljväxter (bönor, ärtor)
- Kryddor (persilja, basilika, timjan)
- Stärkelserika grödor (korn, havre)

2. Månadsvisa aktiviteter för hela året

3. Kostnadsuppskattning

4. Förslag på kompletterande köp

VIKTIGT: Du MÅSTE inkludera EXAKT 20 olika grödor i "crops" arrayen. INTE FÄRRE. Lista alla 20 grödor med fullständig information för varje.

Svara ENDAST med en JSON-struktur enligt detta format:
{
  "crops": [
    {
      "name": "Grödnamn",
      "scientificName": "Vetenskapligt namn",
      "description": "Beskrivning",
      "difficulty": "beginner/intermediate/advanced",
      "sowingMonths": ["Månad1", "Månad2"],
      "harvestingMonths": ["Månad1", "Månad2"],
      "spaceRequired": 10, // Total m² needed for this crop
      "yield": 20,
      "calories": 8000,
      "nutritionalHighlights": ["Näring1", "Näring2"],
      "color": "#hexfärg",
      "icon": "🥔"
    }
  ],
  "monthlyTasks": [
    {
      "month": "Januari",
      "tasks": ["Uppgift1", "Uppgift2"],
      "priority": "low/medium/high"
    }
  ],
  "grocerySuggestions": ["Förslag1", "Förslag2"],
  "estimatedCost": 500
}`;

      // 2. Call API
      const response = await fetch('https://api.beready.se', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'RPAC-CultivationPlanner/1.0'
        },
        body: JSON.stringify({
          prompt: prompt,
          type: 'cultivation-plan'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('AI API error details:', errorData);
        throw new Error(`AI API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }

      const aiResponse = await response.json();
      const content = aiResponse.choices?.[0]?.message?.content || '{}';

      // 3. Clean JSON from AI
      let cleanedContent = content
        .replace(/\/\/.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/,(\s*[}\]])/g, '$1')
        .replace(/([{,]\s*)(\w+):/g, '$1"$2":')
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']')
        .trim();

      try {
        aiPlan = JSON.parse(cleanedContent);
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        aiPlan = null; // fallback later
      }

      // 4. Build crops list (AI or fallback)
      let crops = aiPlan?.crops || [
        {
          name: "Potatis",
          scientificName: "Solanum tuberosum",
          description: "Grundläggande kolhydratkälla med hög kaloritetthet",
          difficulty: "beginner" as const,
          sowingMonths: ["Mars", "April"],
          harvestingMonths: ["Augusti", "September", "Oktober"],
          spaceRequired: 20,
          yield: 80,
          calories: 64000,
          nutritionalHighlights: ["Kolhydrater", "Kalium", "Vitamin C"],
          color: "#8B4513",
          icon: "🥔"
        },
        {
          name: "Morötter",
          scientificName: "Daucus carota",
          description: "Rik på betakaroten och vitamin A",
          difficulty: "beginner" as const,
          sowingMonths: ["Mars", "April", "Maj"],
          harvestingMonths: ["Juli", "Augusti", "September", "Oktober"],
          spaceRequired: 8,
          yield: 24,
          calories: 9600,
          nutritionalHighlights: ["Vitamin A", "Betakaroten", "Fiber"],
          color: "#FF8C00",
          icon: "🥕"
        },
        {
          name: "Tomater",
          scientificName: "Solanum lycopersicum",
          description: "Rika på lykopen och vitamin C",
          difficulty: "intermediate" as const,
          sowingMonths: ["Mars", "April"],
          harvestingMonths: ["Juli", "Augusti", "September"],
          spaceRequired: 12,
          yield: 30,
          calories: 5400,
          nutritionalHighlights: ["Vitamin C", "Lykopen", "Kalium"],
          color: "#FF4444",
          icon: "🍅"
        },
        {
          name: "Kål",
          scientificName: "Brassica oleracea",
          description: "Rik på vitamin K och folsyra",
          difficulty: "beginner" as const,
          sowingMonths: ["April", "Maj"],
          harvestingMonths: ["September", "Oktober", "November"],
          spaceRequired: 15,
          yield: 25,
          calories: 6250,
          nutritionalHighlights: ["Vitamin K", "Folsyra", "Fiber"],
          color: "#90EE90",
          icon: "🥬"
        },
        {
          name: "Lök",
          scientificName: "Allium cepa",
          description: "Grundläggande krydda med antibakteriella egenskaper",
          difficulty: "beginner" as const,
          sowingMonths: ["Mars", "April"],
          harvestingMonths: ["Juli", "Augusti", "September"],
          spaceRequired: 6,
          yield: 20,
          calories: 8000,
          nutritionalHighlights: ["Kväve", "Sulfider", "Vitamin C"],
          color: "#F0E68C",
          icon: "🧅"
        },
        {
          name: "Spenat",
          scientificName: "Spinacia oleracea",
          description: "Rik på järn och folsyra",
          difficulty: "beginner" as const,
          sowingMonths: ["Mars", "April", "Augusti"],
          harvestingMonths: ["Maj", "Juni", "September", "Oktober"],
          spaceRequired: 4,
          yield: 8,
          calories: 1800,
          nutritionalHighlights: ["Järn", "Folsyra", "Vitamin K"],
          color: "#228B22",
          icon: "🥬"
        },
        {
          name: "Gurka",
          scientificName: "Cucumis sativus",
          description: "Hög vattenhalt och vitamin K",
          difficulty: "intermediate" as const,
          sowingMonths: ["Maj", "Juni"],
          harvestingMonths: ["Juli", "Augusti", "September"],
          spaceRequired: 10,
          yield: 15,
          calories: 2250,
          nutritionalHighlights: ["Vatten", "Vitamin K", "Kalium"],
          color: "#32CD32",
          icon: "🥒"
        },
        {
          name: "Paprika",
          scientificName: "Capsicum annuum",
          description: "Rik på vitamin C och antioxidanter",
          difficulty: "intermediate" as const,
          sowingMonths: ["Mars", "April"],
          harvestingMonths: ["Juli", "Augusti", "September"],
          spaceRequired: 8,
          yield: 12,
          calories: 3600,
          nutritionalHighlights: ["Vitamin C", "Antioxidanter", "Fiber"],
          color: "#FF6347",
          icon: "🫑"
        },
        {
          name: "Bönor",
          scientificName: "Phaseolus vulgaris",
          description: "Hög proteinhalt och fiber",
          difficulty: "beginner" as const,
          sowingMonths: ["Maj", "Juni"],
          harvestingMonths: ["Augusti", "September"],
          spaceRequired: 12,
          yield: 18,
          calories: 6300,
          nutritionalHighlights: ["Protein", "Fiber", "Folsyra"],
          color: "#8B4513",
          icon: "🫘"
        },
        {
          name: "Ärtor",
          scientificName: "Pisum sativum",
          description: "Rika på protein och vitamin K",
          difficulty: "beginner" as const,
          sowingMonths: ["Mars", "April"],
          harvestingMonths: ["Juni", "Juli"],
          spaceRequired: 8,
          yield: 12,
          calories: 4200,
          nutritionalHighlights: ["Protein", "Vitamin K", "Fiber"],
          color: "#90EE90",
          icon: "🫘"
        }
      ];

      // Add spacePerPlant field
      crops = crops.map((crop: any) => ({
        ...crop,
        spacePerPlant:
          crop.spaceRequired && crop.yield
            ? Math.round((crop.spaceRequired / Math.max(crop.yield, 1)) * 100) / 100
            : crop.spacePerPlant || 0.5
      }));

      // 5. Calculate production stats
      const dailyCaloriesPerPerson = 2000;
      const annualCalorieNeed = profile.household_size * dailyCaloriesPerPerson * 365;
      const production = calculateGardenProduction(
        selectedCrops,
        adjustableGardenSize,
        cultivationIntensity,
        cropVolumes
      );
      const caloriesFromGroceries = Math.max(0, annualCalorieNeed - production.calories);
      const selfSufficiencyPercent = Math.round((production.calories / annualCalorieNeed) * 100);

      // 6. Return GardenPlan
      return {
        selfSufficiencyPercent,
        caloriesFromGarden: Math.round(production.calories),
        caloriesFromGroceries: Math.round(caloriesFromGroceries),
        annualCalorieNeed: Math.round(annualCalorieNeed),
        gardenProduction: Math.round(production.calories),
        grocerySuggestions:
          aiPlan?.grocerySuggestions || [
            'Köp kompletterande proteiner som ägg och mejeriprodukter',
            'Lägg till nötter och frön för fett och mineraler',
            'Köp citrusfrukter för vitamin C under vintern'
          ],
        crops,
        monthlyTasks: aiPlan?.monthlyTasks || generateMonthlyTasks(),
        totalSpace: Math.round(production.spaceUsed),
        estimatedCost: aiPlan?.estimatedCost || Math.round(production.cost)
      };
    } catch (error) {
      console.error('Error generating AI garden plan:', error);

      // Fallback crops if AI fails
      const crops = [
        {
          name: "Potatis",
          scientificName: "Solanum tuberosum",
          description: "Grundläggande kolhydratkälla med hög kaloritetthet",
          difficulty: "beginner" as const,
          sowingMonths: ["Mars", "April"],
          harvestingMonths: ["Augusti", "September", "Oktober"],
          spaceRequired: 20,
          yield: 80,
          calories: 64000,
          nutritionalHighlights: ["Kolhydrater", "Kalium", "Vitamin C"],
          color: "#8B4513",
          icon: "🥔"
        },
        {
          name: "Morötter",
          scientificName: "Daucus carota",
          description: "Rik på betakaroten och vitamin A",
          difficulty: "beginner" as const,
          sowingMonths: ["Mars", "April", "Maj"],
          harvestingMonths: ["Juli", "Augusti", "September", "Oktober"],
          spaceRequired: 8,
          yield: 24,
          calories: 9600,
          nutritionalHighlights: ["Vitamin A", "Betakaroten", "Fiber"],
          color: "#FF8C00",
          icon: "🥕"
        },
        {
          name: "Tomater",
          scientificName: "Solanum lycopersicum",
          description: "Rika på lykopen och vitamin C",
          difficulty: "intermediate" as const,
          sowingMonths: ["Mars", "April"],
          harvestingMonths: ["Juli", "Augusti", "September"],
          spaceRequired: 12,
          yield: 30,
          calories: 5400,
          nutritionalHighlights: ["Vitamin C", "Lykopen", "Kalium"],
          color: "#FF4444",
          icon: "🍅"
        },
        {
          name: "Kål",
          scientificName: "Brassica oleracea",
          description: "Rik på vitamin K och folsyra",
          difficulty: "beginner" as const,
          sowingMonths: ["April", "Maj"],
          harvestingMonths: ["September", "Oktober", "November"],
          spaceRequired: 15,
          yield: 25,
          calories: 6250,
          nutritionalHighlights: ["Vitamin K", "Folsyra", "Fiber"],
          color: "#90EE90",
          icon: "🥬"
        },
        {
          name: "Lök",
          scientificName: "Allium cepa",
          description: "Grundläggande krydda med antibakteriella egenskaper",
          difficulty: "beginner" as const,
          sowingMonths: ["Mars", "April"],
          harvestingMonths: ["Juli", "Augusti", "September"],
          spaceRequired: 6,
          yield: 20,
          calories: 8000,
          nutritionalHighlights: ["Kväve", "Sulfider", "Vitamin C"],
          color: "#F0E68C",
          icon: "🧅"
        }
      ];

      const dailyCaloriesPerPerson = 2000;
      const annualCalorieNeed = profile.household_size * dailyCaloriesPerPerson * 365;
      const production = calculateGardenProduction(
        selectedCrops,
        adjustableGardenSize,
        cultivationIntensity,
        cropVolumes
      );
      const caloriesFromGroceries = Math.max(0, annualCalorieNeed - production.calories);
      const selfSufficiencyPercent = Math.round((production.calories / annualCalorieNeed) * 100);

      return {
        selfSufficiencyPercent,
        caloriesFromGarden: Math.round(production.calories),
        caloriesFromGroceries: Math.round(caloriesFromGroceries),
        annualCalorieNeed: Math.round(annualCalorieNeed),
        gardenProduction: Math.round(production.calories),
        grocerySuggestions: [
          'Köp kompletterande proteiner som ägg och mejeriprodukter',
          'Lägg till nötter och frön för fett och mineraler',
          'Köp citrusfrukter för vitamin C under vintern'
        ],
        crops,
        monthlyTasks: generateMonthlyTasks(),
        totalSpace: Math.round(production.spaceUsed),
        estimatedCost: Math.round(production.cost)
      };
    }
  };

  const getCropPrice = (cropName: string): number => {
    const cropPrices: Record<string, number> = {
      'Potatis': 2,
      'Morötter': 1,
      'Kål': 3,
      'Lökar': 0.5,
      'Tomater': 5,
      'Gurka': 4,
      'Sallat': 2,
      'Spinat': 1,
      'Bönor': 3,
      'Ärtor': 2,
      'Rädisor': 1,
      'Rotselleri': 4,
      'Lök': 0.5,
      'Sallad': 2,
      'Rödbeta': 2,
      'Morot': 1,
      'Salladslök': 1,
      'Tomat': 5,
      'Paprika': 4
    };
    return cropPrices[cropName] || 2; // Default price if crop not found
  };

  const calculateGardenProduction = (selectedCrops: string[], gardenSize: number, intensity: 'low' | 'medium' | 'high', volumes: Record<string, number>) => {
    const intensityMultiplier = intensity === 'low' ? 0.8 : intensity === 'medium' ? 1.0 : 1.3;
    
    let totalCalories = 0;
    let totalCost = 0;
    let totalSpaceUsed = 0;
    
    selectedCrops.forEach(cropName => {
      const plantCount = volumes[cropName] || 0;
      
      if (plantCount > 0 && gardenPlan?.crops) {
        // Find the crop in the garden plan
        const crop = gardenPlan.crops.find(c => c.name === cropName);
        
        if (crop) {
          // Calculate calories per plant from the crop's total calories and yield
          const caloriesPerPlant = crop.calories / Math.max(crop.yield, 1);
          const caloriesFromCrop = caloriesPerPlant * plantCount * intensityMultiplier;
          totalCalories += caloriesFromCrop;
          
          // Estimate cost per plant (rough estimate based on crop type)
          const costPerPlant = getCropPrice(cropName);
          const costFromCrop = costPerPlant * plantCount;
          totalCost += costFromCrop;
          
          // Calculate space used based on crop's space requirement
          const spacePerPlant = crop.spaceRequired / Math.max(crop.yield, 1);
          const spaceUsed = spacePerPlant * plantCount;
          totalSpaceUsed += spaceUsed;
        }
      }
    });

    return {
      calories: Math.round(totalCalories),
      cost: Math.round(totalCost),
      spaceUsed: Math.round(totalSpaceUsed * 10) / 10
    };
  };

  const generateIntelligentRecommendations = (profile: UserProfile, gardenSize: number) => {
    // Calculate target calories based on household size - more realistic targets
    const dailyCaloriesPerPerson = 2000;
    const annualCalorieNeed = profile.household_size * dailyCaloriesPerPerson * 365;
    // More realistic self-sufficiency: 5-15% for most gardens
    const targetSelfSufficiency = Math.min(0.15, Math.max(0.05, gardenSize / 500)); 
    const targetCalories = Math.round(annualCalorieNeed * targetSelfSufficiency);
    
    // Available crops with calorie density (calories per m²)
    const availableCrops = [
      { name: "Potatis", caloriesPerPlant: 800, spacePerPlant: 0.5, pricePerPlant: 2, caloriesPerM2: 1600 },
      { name: "Morötter", caloriesPerPlant: 400, spacePerPlant: 0.1, pricePerPlant: 1, caloriesPerM2: 4000 },
      { name: "Kål", caloriesPerPlant: 250, spacePerPlant: 0.3, pricePerPlant: 3, caloriesPerM2: 833 },
      { name: "Lök", caloriesPerPlant: 400, spacePerPlant: 0.05, pricePerPlant: 0.5, caloriesPerM2: 8000 },
      { name: "Tomater", caloriesPerPlant: 160, spacePerPlant: 0.2, pricePerPlant: 5, caloriesPerM2: 800 },
      { name: "Gurka", caloriesPerPlant: 150, spacePerPlant: 0.2, pricePerPlant: 4, caloriesPerM2: 750 },
      { name: "Spenat", caloriesPerPlant: 200, spacePerPlant: 0.1, pricePerPlant: 1, caloriesPerM2: 2000 },
      { name: "Bönor", caloriesPerPlant: 350, spacePerPlant: 0.1, pricePerPlant: 3, caloriesPerM2: 3500 },
      { name: "Ärtor", caloriesPerPlant: 350, spacePerPlant: 0.1, pricePerPlant: 2, caloriesPerM2: 3500 },
      { name: "Rädisor", caloriesPerPlant: 200, spacePerPlant: 0.05, pricePerPlant: 1, caloriesPerM2: 4000 },
      { name: "Rödbetor", caloriesPerPlant: 300, spacePerPlant: 0.1, pricePerPlant: 2, caloriesPerM2: 3000 },
      { name: "Kålrot", caloriesPerPlant: 400, spacePerPlant: 0.2, pricePerPlant: 3, caloriesPerM2: 2000 }
    ];

    // Sort crops by calorie density (calories per m²) - highest first
    const sortedCrops = availableCrops.sort((a, b) => b.caloriesPerM2 - a.caloriesPerM2);

    const selectedCrops: string[] = [];
    const volumes: Record<string, number> = {};
    let totalCalories = 0;
    let totalSpaceUsed = 0;
    let totalCost = 0;
    const maxBudget = 2000; // 2000 kr budget

    // Select crops to maximize calories per area while ensuring good variety
    for (const crop of sortedCrops) {
      // Stop if we've used 90% of space or have 8+ different crops
      if (totalSpaceUsed >= gardenSize * 0.9 || selectedCrops.length >= 8) break;
      
      const remainingSpace = gardenSize - totalSpaceUsed;
      const remainingBudget = maxBudget - totalCost;
      
      // Calculate how many plants we can fit
      const maxPlantsForSpace = Math.floor(remainingSpace / crop.spacePerPlant);
      const maxPlantsForBudget = Math.floor(remainingBudget / crop.pricePerPlant);
      const maxPlants = Math.min(maxPlantsForSpace, maxPlantsForBudget, 30); // Cap at 30 per crop
      
      if (maxPlants > 0) {
        // Use a more reasonable plant count based on crop type and available space
        let plantCount;
        
        if (crop.caloriesPerM2 >= 3000) {
          // High-density crops: use more plants
          plantCount = Math.min(maxPlants, Math.max(5, Math.floor(remainingSpace * 0.1 / crop.spacePerPlant)));
        } else if (crop.caloriesPerM2 >= 1000) {
          // Medium-density crops: moderate amount
          plantCount = Math.min(maxPlants, Math.max(3, Math.floor(remainingSpace * 0.05 / crop.spacePerPlant)));
        } else {
          // Low-density crops: fewer plants
          plantCount = Math.min(maxPlants, Math.max(2, Math.floor(remainingSpace * 0.02 / crop.spacePerPlant)));
        }
        
        // Ensure we have at least 2 plants and not more than 30
        plantCount = Math.max(2, Math.min(plantCount, 30));
        
        if (plantCount > 0) {
          selectedCrops.push(crop.name);
          volumes[crop.name] = plantCount;
          totalCalories += crop.caloriesPerPlant * plantCount;
          totalSpaceUsed += crop.spacePerPlant * plantCount;
          totalCost += crop.pricePerPlant * plantCount;
        }
      }
    }

    // Ensure we have at least 5 different crops for good variety
    const essentialCrops = ["Potatis", "Morötter", "Kål", "Tomater", "Lök", "Spenat", "Bönor", "Ärtor"];
    essentialCrops.forEach(cropName => {
      if (!selectedCrops.includes(cropName) && selectedCrops.length < 6) {
        const crop = availableCrops.find(c => c.name === cropName);
        if (crop) {
          const defaultQuantity = getDefaultCropQuantity(cropName, gardenSize);
          selectedCrops.push(cropName);
          volumes[cropName] = defaultQuantity;
        }
      }
    });

    console.log('Intelligent recommendations:', {
      selectedCrops,
      volumes,
      totalCalories,
      totalSpaceUsed,
      totalCost,
      targetCalories
    });

    return {
      crops: selectedCrops,
      volumes: volumes
    };
  };

  const getDefaultCropQuantity = (cropName: string, gardenSize: number): number => {
    // Default quantities based on crop type and garden size
    const cropDefaults: Record<string, { base: number, perM2: number, max: number }> = {
      'Potatis': { base: 5, perM2: 0.3, max: 20 },
      'Morötter': { base: 8, perM2: 0.4, max: 30 },
      'Kål': { base: 3, perM2: 0.2, max: 8 },
      'Tomater': { base: 2, perM2: 0.1, max: 6 },
      'Lök': { base: 6, perM2: 0.3, max: 15 },
      'Spenat': { base: 10, perM2: 0.5, max: 25 },
      'Gurka': { base: 2, perM2: 0.1, max: 4 },
      'Paprika': { base: 2, perM2: 0.1, max: 4 },
      'Bönor': { base: 6, perM2: 0.3, max: 12 },
      'Ärtor': { base: 8, perM2: 0.4, max: 15 },
      'Sallad': { base: 10, perM2: 0.5, max: 20 },
      'Broccoli': { base: 3, perM2: 0.2, max: 6 },
      'Blomkål': { base: 2, perM2: 0.1, max: 4 },
      'Rädisor': { base: 15, perM2: 0.8, max: 30 },
      'Sockerärtor': { base: 8, perM2: 0.4, max: 15 },
      'Kålrot': { base: 4, perM2: 0.2, max: 8 },
      'Rödbetor': { base: 6, perM2: 0.3, max: 12 },
      'Salladslök': { base: 10, perM2: 0.5, max: 20 },
      'Persilja': { base: 3, perM2: 0.2, max: 6 },
      'Basilika': { base: 4, perM2: 0.2, max: 8 }
    };

    const cropConfig = cropDefaults[cropName];
    if (!cropConfig) {
      // Default for unknown crops
      return Math.max(3, Math.min(10, Math.floor(gardenSize / 5)));
    }

    // Calculate quantity based on garden size and crop characteristics
    const calculatedQuantity = Math.floor(cropConfig.base + (gardenSize * cropConfig.perM2));
    
    // Ensure reasonable bounds with crop-specific maximums
    return Math.max(2, Math.min(calculatedQuantity, cropConfig.max));
  };

  const validateCustomCropWithAI = async (cropName: string, description: string) => {
    setIsValidatingCrop(true);
    try {
      // First check if crop already exists in the garden plan
      if (gardenPlan?.crops) {
        const existingCrop = gardenPlan.crops.find(crop => 
          crop.name.toLowerCase() === cropName.toLowerCase()
        );
        
        if (existingCrop) {
          console.log('Crop already exists:', existingCrop);
          const existingData = {
            isValid: true,
            scientificName: existingCrop.scientificName,
            description: existingCrop.description,
            difficulty: existingCrop.difficulty,
            sowingMonths: existingCrop.sowingMonths,
            harvestingMonths: existingCrop.harvestingMonths,
            spaceRequired: existingCrop.spaceRequired,
            yield: existingCrop.yield,
            calories: existingCrop.calories,
            nutritionalHighlights: existingCrop.nutritionalHighlights,
            color: existingCrop.color,
            suitability: "good",
            localTips: ["Denna gröda finns redan i systemet", "Du kan välja den från listan istället"]
          };
          setCustomCropData(existingData);
          setIsValidatingCrop(false);
          return existingData;
        }
      }

      // If crop doesn't exist, proceed with AI analysis
      const prompt = `Analysera denna gröda för svensk odling: "${cropName}". Beskrivning: "${description}".

Svara ENDAST med en giltig JSON-struktur utan kommentarer:
{
  "isValid": true,
  "scientificName": "Vetenskapligt namn",
  "description": "Beskrivning av grödan",
  "difficulty": "beginner",
  "sowingMonths": ["April", "Maj"],
  "harvestingMonths": ["Augusti", "September"],
  "spaceRequired": 10,
  "yield": 15,
  "calories": 2000,
  "nutritionalHighlights": ["Vitamin C", "Fiber"],
  "color": "#90EE90",
  "suitability": "good",
  "localTips": ["Praktiska råd för svensk odling"]
}

VIKTIGT: Inga kommentarer, inga // eller /* */ i JSON:en. Endast ren JSON.`;

      const response = await fetch('https://api.beready.se', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'RPAC-Client/1.0'
        },
        body: JSON.stringify({ prompt, type: 'general' }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.text();
      console.log('AI response for custom crop:', data);

      try {
        // Parse the response to get the actual content
        const responseData = JSON.parse(data);
        const content = responseData.choices?.[0]?.message?.content;
        
        if (content) {
          // Clean the content by removing comments and fixing common JSON issues
          const cleanedContent = content
            .replace(/\/\/.*$/gm, '') // Remove single-line comments
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
            .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
            .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Quote unquoted property names
            .replace(/,\s*}/g, '}') // Remove trailing commas before closing braces
            .replace(/,\s*]/g, ']') // Remove trailing commas before closing brackets
            .trim();
          
          // Parse the actual crop data from the cleaned content
          const cropData = JSON.parse(cleanedContent);
          setCustomCropData(cropData);
          return cropData;
        } else {
          throw new Error('No content found in AI response');
        }
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        // Fallback data for unknown crops
        const fallbackData = {
          isValid: true,
          scientificName: cropName,
          description: description || `Anpassad gröda: ${cropName}`,
          difficulty: "intermediate",
          sowingMonths: ["April", "Maj"],
          harvestingMonths: ["Augusti", "September"],
          spaceRequired: 10,
          yield: 15,
          calories: 2000,
          nutritionalHighlights: ["Vitaminer", "Mineraler"],
          color: "#90EE90",
          suitability: "good",
          localTips: ["Experimentera med denna gröda", "Anpassa efter lokala förhållanden"]
        };
        setCustomCropData(fallbackData);
        return fallbackData;
      }
    } catch (error) {
      console.error('Error validating custom crop:', error);
      // Fallback data on error
      const fallbackData = {
        isValid: true,
        scientificName: cropName,
        description: description || `Anpassad gröda: ${cropName}`,
        difficulty: "intermediate",
        sowingMonths: ["April", "Maj"],
        harvestingMonths: ["Augusti", "September"],
        spaceRequired: 10,
        yield: 15,
        calories: 2000,
        nutritionalHighlights: ["Vitaminer", "Mineraler"],
        color: "#90EE90",
        suitability: "good",
        localTips: ["Experimentera med denna gröda", "Anpassa efter lokala förhållanden"]
      };
      setCustomCropData(fallbackData);
      return fallbackData;
    } finally {
      setIsValidatingCrop(false);
    }
  };

  const addCustomCrop = () => {
    if (!customCropData || !customCropName.trim()) return;

    // Add the custom crop to the garden plan
    const newCrop = {
      name: customCropName,
      scientificName: customCropData.scientificName,
      description: customCropData.description,
      difficulty: customCropData.difficulty,
      sowingMonths: customCropData.sowingMonths,
      harvestingMonths: customCropData.harvestingMonths,
      spaceRequired: customCropData.spaceRequired,
      yield: customCropData.yield,
      calories: customCropData.calories,
      nutritionalHighlights: customCropData.nutritionalHighlights,
      color: customCropData.color
    };

    // Update garden plan with new crop
    if (gardenPlan) {
      setGardenPlan(prev => prev ? {
        ...prev,
        crops: [...prev.crops, newCrop]
      } : null);
    }

    // Add to selected crops with default quantity
    const defaultQuantity = getDefaultCropQuantity(customCropName, adjustableGardenSize);
    setSelectedCrops(prev => [...prev, customCropName]);
    setCropVolumes(prev => ({
      ...prev,
      [customCropName]: defaultQuantity
    }));

    // Close modal and reset
    setShowCustomCropModal(false);
    setCustomCropName('');
    setCustomCropDescription('');
    setCustomCropData(null);
  };

  const generateMonthlyTasks = () => {
    const months = [
      'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
      'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'
    ];

    const monthlyTasks = months.map((month, index) => {
      const tasks: string[] = [];
      const monthNumber = index + 1;

      selectedCrops.forEach(cropName => {
        const crop = gardenPlan?.crops.find(c => c.name === cropName);
        if (crop) {
          const volume = cropVolumes[cropName] || 0;
          
          if (crop.sowingMonths.includes(month)) {
            tasks.push(`Så ${cropName} (${volume} plantor)`);
          }
          
          if (crop.harvestingMonths.includes(month)) {
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

  const renderProfileSetup = () => (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" 
             style={{ backgroundColor: 'var(--color-sage)', color: 'white' }}>
          <TreePine className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Välkommen till din personliga odlingsplanerare
        </h1>
        <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
          Skapa en skräddarsydd odlingsplan baserad på dina behov, klimat och erfarenhet. 
          Vår AI hjälper dig att maximera din självförsörjning.
        </p>
      </div>

      <div className="mb-8">
        <div className="modern-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Din profil</span>
            </h2>
            <button
              onClick={() => setShowProfileEditor(true)}
              className="px-4 py-2 rounded-lg font-medium text-white hover:shadow-md transition-all duration-200"
              style={{ backgroundColor: 'var(--color-sage)' }}
            >
              Redigera profil
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" key={`profile-${profileData.household_size}-${profileData.city}-${profileData.county}`}>
            <div>
              <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Hushåll</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {profileData.household_size} personer
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Ort</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {profileData.city}, {profileData.county}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Klimatzon</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {profileData.climate_zone}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Erfarenhet</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {profileData.experience_level === 'beginner' ? 'Nybörjare' : 
                 profileData.experience_level === 'intermediate' ? 'Medel' : 'Avancerad'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="modern-card p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
            <Brain className="w-5 h-5" />
            <span>Vad får du</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" 
                   style={{ backgroundColor: 'var(--color-sage)', color: 'white' }}>
                <Target className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Personlig plan</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Skräddarsydd för ditt klimat och erfarenhet
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" 
                   style={{ backgroundColor: 'var(--color-khaki)', color: 'white' }}>
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Årsplan</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Månadsvisa aktiviteter och skördetider
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" 
                   style={{ backgroundColor: 'var(--color-warm-olive)', color: 'white' }}>
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Maximera avkastning</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Optimerad för högsta självförsörjning
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={generateGardenPlan}
            className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-lg"
            style={{ 
              backgroundColor: 'var(--color-sage)',
              color: 'white'
            }}
          >
            <Sparkles className="w-5 h-5" />
            <span>Generera min plan</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          
        </div>
      </div>
    </div>
  );

  const renderAIGeneration = () => (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 animate-pulse" 
             style={{ backgroundColor: 'var(--color-sage)', color: 'white' }}>
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
        <h1 className="text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          AI skapar din personliga plan
        </h1>
        <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
          Vår AI analyserar din profil och skapar en skräddarsydd odlingsplan för dig
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="modern-card p-8">
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center animate-pulse" 
                   style={{ backgroundColor: 'var(--color-sage)', color: 'white' }}>
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  AI analyserar din profil...
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Analyserar ditt klimat, erfarenhet och behov
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center animate-pulse" 
                   style={{ backgroundColor: 'var(--color-khaki)', color: 'white' }}>
                <Calculator className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Beräknar näringsbehov...
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Optimerar för din familjs kaloribehov
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center animate-pulse" 
                   style={{ backgroundColor: 'var(--color-warm-olive)', color: 'white' }}>
                <Target className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Skapar din personliga odlingsplan...
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Väljer optimala grödor för ditt klimat
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center animate-pulse" 
                   style={{ backgroundColor: 'var(--color-sage)', color: 'white' }}>
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Optimerar för svenska förhållanden...
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Anpassar så- och skördetider för Sverige
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center animate-pulse" 
                   style={{ backgroundColor: 'var(--color-khaki)', color: 'white' }}>
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Slutför planen...
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Genererar månadsvisa aktiviteter
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderInteractiveDashboard = () => {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Din personliga odlingsplan
            </h1>
            <p className="text-lg mt-2" style={{ color: 'var(--text-secondary)' }}>
              Skräddarsydd för {profileData.city}, {profileData.county}
            </p>
          </div>
          <button
            onClick={() => setShowProfileEditor(true)}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all duration-200 hover:shadow-md"
            style={{ 
              backgroundColor: 'white',
              color: 'var(--color-sage)',
              borderColor: 'var(--color-sage)'
            }}
          >
            <Settings className="w-4 h-4" />
            <span>Redigera profil</span>
          </button>
        </div>

        {gardenPlan && (
          <div className="sticky top-4 z-10 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border" style={{ borderColor: 'var(--border-color)' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="modern-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">Självförsörjning</h3>
                  <PieChart className="w-4 h-4" style={{ color: 'var(--color-sage)' }} />
                </div>
                <div className="text-2xl font-bold mb-2" style={{ color: 'var(--color-sage)' }}>
                  {realTimeStats?.selfSufficiencyPercent || gardenPlan.selfSufficiencyPercent}%
                </div>
                {/* Debug info - remove in production */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="text-xs text-gray-500">
                    Debug: {realTimeStats?.selfSufficiencyPercent ? 'realTimeStats' : 'gardenPlan'} = {realTimeStats?.selfSufficiencyPercent || gardenPlan.selfSufficiencyPercent}%
                  </div>
                )}
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full transition-all duration-500"
                    style={{ 
                      backgroundColor: 'var(--color-sage)',
                      width: `${Math.min(100, realTimeStats?.selfSufficiencyPercent || gardenPlan.selfSufficiencyPercent)}%`
                    }}
                  />
                </div>
              </div>

              <div className="modern-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">Årligt kaloribehov</h3>
                  <Apple className="w-4 h-4" style={{ color: 'var(--color-khaki)' }} />
                </div>
                <div className="text-2xl font-bold mb-2" style={{ color: 'var(--color-khaki)' }}>
                  {Math.round(gardenPlan.annualCalorieNeed / 1000)}k
                </div>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Kalorier per år
                </p>
              </div>

              <div className="modern-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">Trädgårdsproduktion</h3>
                  <Leaf className="w-4 h-4" style={{ color: 'var(--color-warm-olive)' }} />
                </div>
                <div className="text-2xl font-bold mb-2" style={{ color: 'var(--color-warm-olive)' }}>
                  {Math.round((realTimeStats?.gardenProduction || gardenPlan.gardenProduction) / 1000)}k
                </div>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Kalorier från trädgården
                </p>
              </div>

              <div className="modern-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">Kostnad</h3>
                  <DollarSign className="w-4 h-4" style={{ color: 'var(--color-sage)' }} />
                </div>
                <div className="text-2xl font-bold mb-2" style={{ color: 'var(--color-sage)' }}>
                  {Math.round(realTimeStats?.totalCost || gardenPlan.estimatedCost)} kr
                </div>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Uppskattad kostnad
                </p>
              </div>

              <div className="modern-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">Kaloribehov utöver odling</h3>
                  <ShoppingCart className="w-4 h-4" style={{ color: 'var(--color-khaki)' }} />
                </div>
                <div className="text-2xl font-bold mb-2" style={{ color: 'var(--color-khaki)' }}>
                  {Math.round((realTimeStats?.caloriesFromGroceries || gardenPlan.caloriesFromGroceries) / 1000)}k
                </div>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Kompletterande köp
                </p>
              </div>

              <div className="modern-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">Utrymme krävs</h3>
                  <MapPin className="w-4 h-4" style={{ color: 'var(--color-warm-olive)' }} />
                </div>
                <div className="text-2xl font-bold mb-2" style={{ color: 'var(--color-warm-olive)' }}>
                  {Math.round(realTimeStats?.totalSpace || gardenPlan.totalSpace)} m²
                </div>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  av {adjustableGardenSize} m² tillgängligt
                </p>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                  <div
                    className="h-1.5 rounded-full transition-all duration-500"
                    style={{ 
                      backgroundColor: 'var(--color-warm-olive)',
                      width: `${Math.min(100, ((realTimeStats?.totalSpace || gardenPlan.totalSpace) / adjustableGardenSize) * 100)}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Optimization Controls */}
        <div className="modern-card p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>Optimera din självförsörjning</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Trädgårdsstorlek: {adjustableGardenSize} m²
              </label>
              <input
                type="range"
                min="10"
                max="200"
                value={adjustableGardenSize}
                onChange={(e) => setAdjustableGardenSize(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                style={{ background: `linear-gradient(to right, var(--color-sage) 0%, var(--color-sage) ${(adjustableGardenSize / 200) * 100}%, #e5e7eb ${(adjustableGardenSize / 200) * 100}%, #e5e7eb 100%)` }}
              />
            </div>
            
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Odlingsintensitet
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onMouseEnter={() => setShowIntensityTooltip(true)}
                    onMouseLeave={() => setShowIntensityTooltip(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                  
                </div>
              </div>
              <div className="flex space-x-4">
                {(['low', 'medium', 'high'] as const).map((intensity) => (
                  <label key={intensity} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="intensity"
                      value={intensity}
                      checked={cultivationIntensity === intensity}
                      onChange={(e) => setCultivationIntensity(e.target.value as 'low' | 'medium' | 'high')}
                      className="w-4 h-4"
                    />
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {intensity === 'low' ? 'Låg' : intensity === 'medium' ? 'Medel' : 'Hög'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Crop Selection */}
        <div className="modern-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center space-x-2">
              <Leaf className="w-5 h-5" />
              <span>Välj dina grödor</span>
            </h2>
            <button
              onClick={() => setShowCustomCropModal(true)}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all duration-200 hover:shadow-md"
              style={{ 
                backgroundColor: 'white',
                color: 'var(--color-primary)',
                borderColor: 'var(--color-primary)'
              }}
            >
              <Plus className="w-4 h-4" />
              <span>Lägg till egen gröda</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gardenPlan?.crops?.map((crop) => (
              <div key={crop.name} className="border rounded-lg p-4" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedCrops.includes(crop.name)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCrops([...selectedCrops, crop.name]);
                          // Set default quantity based on crop type and garden size
                          const defaultQuantity = getDefaultCropQuantity(crop.name, adjustableGardenSize);
                          setCropVolumes(prev => ({
                            ...prev,
                            [crop.name]: defaultQuantity
                          }));
                        } else {
                          setSelectedCrops(selectedCrops.filter(c => c !== crop.name));
                          // Remove from cropVolumes when deselected
                          setCropVolumes(prev => {
                            const newVolumes = { ...prev };
                            delete newVolumes[crop.name];
                            return newVolumes;
                          });
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {crop.name}
                    </h3>
                  </div>
                  <span 
                    className="px-2 py-1 rounded text-xs font-medium"
                    style={{ 
                      backgroundColor: crop.difficulty === 'beginner' ? '#10b981' : 
                                     crop.difficulty === 'intermediate' ? '#f59e0b' : '#ef4444',
                      color: 'white'
                    }}
                  >
                    {crop.difficulty === 'beginner' ? 'Nybörjare' : 
                     crop.difficulty === 'intermediate' ? 'Medel' : 'Avancerad'}
                  </span>
                </div>
                
                {/* Crop Icon */}
                {crop.icon && (
                  <div className="mb-3 flex justify-center">
                    <div 
                      className="w-16 h-16 flex items-center justify-center rounded-lg text-3xl"
                      style={{ 
                        backgroundColor: `${crop.color}20`,
                        border: `2px solid ${crop.color}`
                      }}
                    >
                      {crop.icon}
                    </div>
                  </div>
                )}
                
                <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                  {crop.description}
                </p>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--text-secondary)' }}>Antal plantor:</span>
                    <span style={{ color: 'var(--text-primary)' }}>
                      {cropVolumes[crop.name] || 0}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--text-secondary)' }}>Utrymme per planta:</span>
                    <span style={{ color: 'var(--text-primary)' }}>
                      {crop.spacePerPlant || 0.5} m²
                    </span>
                  </div>
                  
                  {selectedCrops.includes(crop.name) && (
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="0"
                        max="200"
                        value={cropVolumes[crop.name] || 0}
                        onChange={(e) => setCropVolumes(prev => ({
                          ...prev,
                          [crop.name]: Number(e.target.value)
                        }))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span style={{ color: 'var(--text-secondary)' }}>Kostnad:</span>
                          <span className="block font-medium" style={{ color: 'var(--text-primary)' }}>
                            {Math.round((cropVolumes[crop.name] || 0) * 2)} kr
                          </span>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-secondary)' }}>Kalorier:</span>
                          <span className="block font-medium" style={{ color: 'var(--text-primary)' }}>
                            {Math.round((cropVolumes[crop.name] || 0) * 800)} cal
                          </span>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-secondary)' }}>Utrymme:</span>
                          <span className="block font-medium" style={{ color: 'var(--text-primary)' }}>
                            {Math.round((cropVolumes[crop.name] || 0) * (crop.spacePerPlant || 0.5))} m²
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Tasks */}
        <div className="modern-card p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Årsplan - Månadsvisa aktiviteter</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {generateMonthlyTasks().map((task) => (
              <div key={task.month} className="border rounded-lg p-4" style={{ borderColor: 'var(--border-color)' }}>
                <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                  {task.month}
                </h3>
                <ul className="space-y-1">
                  {task.tasks.map((taskItem, index) => (
                    <li key={index} className="text-sm flex items-start space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" 
                            style={{ backgroundColor: task.priority === 'high' ? '#ef4444' : 
                                                      task.priority === 'medium' ? '#f59e0b' : '#10b981' }} />
                      <span style={{ color: 'var(--text-secondary)' }}>{taskItem}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => {
              setPlanName(`Odlingsplan ${new Date().toLocaleDateString('sv-SE')}`);
              setShowSaveModal(true);
            }}
            className="flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-lg"
            style={{ 
              backgroundColor: 'var(--color-sage)',
              color: 'white'
            }}
          >
            <Save className="w-4 h-4" />
            <span>Spara plan</span>
          </button>
          
          
          <button
            onClick={() => setCurrentStep('profile')}
            className="flex items-center space-x-2 px-6 py-3 rounded-lg border transition-all duration-200 hover:shadow-md"
            style={{ 
              backgroundColor: 'white',
              color: 'var(--color-sage)',
              borderColor: 'var(--color-sage)'
            }}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Ny plan</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {currentStep === 'profile' && renderProfileSetup()}
        {currentStep === 'generating' && renderAIGeneration()}
        {currentStep === 'dashboard' && renderInteractiveDashboard()}
      </div>

      <ProfileEditorModal
        isOpen={showProfileEditor}
        onClose={() => setShowProfileEditor(false)}
        profile={profileData}
        onSave={handleProfileSave}
      />

      {/* Save Plan Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                Spara odlingsplan
              </h2>
              <button
                onClick={() => setShowSaveModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Namn på planen
                </label>
                <input
                  type="text"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ange namn för din odlingsplan"
                />
              </div>
              
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="saveToCalendar"
                  checked={saveToCalendar}
                  onChange={(e) => setSaveToCalendar(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="saveToCalendar" className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Spara till Odlingskalender och skriv över befintlig planering
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="saveReminders"
                  checked={saveReminders}
                  onChange={(e) => setSaveReminders(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="saveReminders" className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Spara påminnelser för odlingsaktiviteter
                </label>
              </div>
            </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Avbryt
              </button>
              <button
                onClick={() => savePlanning()}
                className="px-6 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-lg"
                style={{ 
                  backgroundColor: 'var(--color-sage)',
                  color: 'white'
                }}
              >
                Spara plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Plan Modal */}

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

      {/* Custom Crop Modal */}
      {showCustomCropModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                Lägg till egen gröda
              </h2>
              <button
                onClick={() => setShowCustomCropModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Grödans namn
                </label>
                <input
                  type="text"
                  value={customCropName}
                  onChange={(e) => setCustomCropName(e.target.value)}
                  placeholder="T.ex. Quinoa, Amarant, etc."
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: 'var(--border-color)' }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Beskrivning (valfritt)
                </label>
                <textarea
                  value={customCropDescription}
                  onChange={(e) => setCustomCropDescription(e.target.value)}
                  placeholder="Beskriv grödan, dess egenskaper eller varför du vill odla den..."
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: 'var(--border-color)' }}
                />
              </div>

              {customCropData && (
                <div className={`p-4 rounded-lg ${customCropData.localTips?.[0]?.includes('finns redan') ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'}`}>
                  <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                    {customCropData.localTips?.[0]?.includes('finns redan') ? 'Gröda hittades i systemet:' : 'AI-analys av grödan:'}
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Vetenskapligt namn:</strong> {customCropData.scientificName}</p>
                    <p><strong>Beskrivning:</strong> {customCropData.description}</p>
                    <p><strong>Svårighetsgrad:</strong> {customCropData.difficulty === 'beginner' ? 'Nybörjare' : customCropData.difficulty === 'intermediate' ? 'Medel' : 'Avancerad'}</p>
                    <p><strong>Lämplighet:</strong> {customCropData.suitability === 'excellent' ? 'Utmärkt' : customCropData.suitability === 'good' ? 'Bra' : customCropData.suitability === 'fair' ? 'Okej' : 'Dålig'}</p>
                    <p><strong>Såtid:</strong> {customCropData.sowingMonths?.join(', ')}</p>
                    <p><strong>Skördetid:</strong> {customCropData.harvestingMonths?.join(', ')}</p>
                    {customCropData.localTips && customCropData.localTips.length > 0 && (
                      <div>
                        <strong>Lokala tips:</strong>
                        <ul className="list-disc list-inside ml-2">
                          {customCropData.localTips.map((tip: string, index: number) => (
                            <li key={index}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCustomCropModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Avbryt
              </button>
              <button
                onClick={() => validateCustomCropWithAI(customCropName, customCropDescription)}
                disabled={!customCropName.trim() || isValidatingCrop}
                className="px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  backgroundColor: 'var(--color-sage)',
                  color: 'white'
                }}
              >
                {isValidatingCrop ? 'Analyserar...' : 'Analysera med AI'}
              </button>
              {customCropData && (
                <button
                  onClick={addCustomCrop}
                  className="px-4 py-2 rounded-lg transition-colors"
                  style={{ 
                    backgroundColor: 'var(--color-primary)',
                    color: 'white'
                  }}
                >
                  {customCropData.localTips?.[0]?.includes('finns redan') ? 'Lägg till ändå' : 'Lägg till gröda'}
                </button>
              )}
            </div>
          </div>
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
