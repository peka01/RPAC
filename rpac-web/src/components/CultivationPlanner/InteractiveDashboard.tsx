import { Settings, Target, Leaf, Calendar, Save, RefreshCw, Plus } from 'lucide-react';
import { DashboardStats } from './DashboardStats';
import { OptimizationControls } from './OptimizationControls';
import { CropSelection } from './CropSelection';
import { MonthlyTasks } from './MonthlyTasks';

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

interface InteractiveDashboardProps {
  profileData: UserProfile;
  gardenPlan: GardenPlan | null;
  realTimeStats: {
    gardenProduction: number;
    selfSufficiencyPercent: number;
    caloriesFromGroceries: number;
    totalCost: number;
    totalSpace: number;
  } | null;
  adjustableGardenSize: number;
  setAdjustableGardenSize: (size: number) => void;
  cultivationIntensity: 'low' | 'medium' | 'high';
  setCultivationIntensity: (intensity: 'low' | 'medium' | 'high') => void;
  showIntensityTooltip: boolean;
  setShowIntensityTooltip: (show: boolean) => void;
  selectedCrops: string[];
  setSelectedCrops: (crops: string[]) => void;
  cropVolumes: Record<string, number>;
  setCropVolumes: (volumes: Record<string, number>) => void;
  onEditProfile: () => void;
  onSavePlan: () => void;
  onNewPlan: () => void;
  onAddCustomCrop: () => void;
  onEditCustomCrop: (crop: any) => void;
  onUpdateCrop: (crop: any) => void;
  onDeleteCustomCrop: (crop: any) => void;
  generateMonthlyTasks: () => any[];
  loadedPlanName?: string;
}

export function InteractiveDashboard({
  profileData,
  gardenPlan,
  realTimeStats,
  adjustableGardenSize,
  setAdjustableGardenSize,
  cultivationIntensity,
  setCultivationIntensity,
  showIntensityTooltip,
  setShowIntensityTooltip,
  selectedCrops,
  setSelectedCrops,
  cropVolumes,
  setCropVolumes,
  onEditProfile,
  onSavePlan,
  onNewPlan,
  onAddCustomCrop,
  onEditCustomCrop,
  onUpdateCrop,
  onDeleteCustomCrop,
  generateMonthlyTasks,
  loadedPlanName
}: InteractiveDashboardProps) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {loadedPlanName || 'Din personliga odlingsplan'}
          </h1>
          <p className="text-lg mt-2" style={{ color: 'var(--text-secondary)' }}>
            Skräddarsydd för {profileData.city}, {profileData.county}
          </p>
        </div>
        <button
          onClick={onEditProfile}
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
        <DashboardStats 
          gardenPlan={gardenPlan}
          realTimeStats={realTimeStats}
          adjustableGardenSize={adjustableGardenSize}
        />
      )}

      <OptimizationControls
        adjustableGardenSize={adjustableGardenSize}
        setAdjustableGardenSize={setAdjustableGardenSize}
        cultivationIntensity={cultivationIntensity}
        setCultivationIntensity={setCultivationIntensity}
        showIntensityTooltip={showIntensityTooltip}
        setShowIntensityTooltip={setShowIntensityTooltip}
      />

      <CropSelection
        gardenPlan={gardenPlan}
        selectedCrops={selectedCrops}
        setSelectedCrops={setSelectedCrops}
        cropVolumes={cropVolumes}
        setCropVolumes={setCropVolumes}
        adjustableGardenSize={adjustableGardenSize}
        onAddCustomCrop={onAddCustomCrop}
        onEditCustomCrop={onEditCustomCrop}
        onUpdateCrop={onUpdateCrop}
        onDeleteCustomCrop={onDeleteCustomCrop}
      />

      <MonthlyTasks generateMonthlyTasks={generateMonthlyTasks} />

      <div className="flex flex-wrap gap-4">
        <button
          onClick={onSavePlan}
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
          onClick={onNewPlan}
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
}


