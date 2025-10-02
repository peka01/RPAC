import { PieChart, Apple, Leaf, DollarSign, ShoppingCart, MapPin } from 'lucide-react';

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

interface DashboardStatsProps {
  gardenPlan: GardenPlan;
  realTimeStats: {
    gardenProduction: number;
    selfSufficiencyPercent: number;
    caloriesFromGroceries: number;
    totalCost: number;
    totalSpace: number;
  } | null;
  adjustableGardenSize: number;
}

export function DashboardStats({ gardenPlan, realTimeStats, adjustableGardenSize }: DashboardStatsProps) {
  // Helper function to format large numbers for better readability
  const formatNumber = (num: number, suffix: string = '') => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M${suffix}`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k${suffix}`;
    }
    return `${Math.round(num)}${suffix}`;
  };

  return (
    <div className="sticky top-4 z-10 bg-white/95 backdrop-blur-sm rounded-lg p-3 sm:p-4 shadow-lg border" style={{ borderColor: 'var(--border-color)' }}>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Self-sufficiency card */}
        <div className="modern-card p-3 sm:p-4 min-h-[100px] flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs sm:text-sm font-semibold leading-tight">Självförsörjning</h3>
            <PieChart className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" style={{ color: 'var(--color-sage)' }} />
          </div>
          <div className="text-xl sm:text-2xl font-bold mb-2" style={{ color: 'var(--color-sage)' }}>
            {realTimeStats?.selfSufficiencyPercent || gardenPlan.selfSufficiencyPercent}%
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-auto">
            <div
              className="h-1.5 rounded-full transition-all duration-500"
              style={{ 
                backgroundColor: 'var(--color-sage)',
                width: `${Math.min(100, realTimeStats?.selfSufficiencyPercent || gardenPlan.selfSufficiencyPercent)}%`
              }}
            />
          </div>
        </div>

        {/* Annual calorie need card */}
        <div className="modern-card p-3 sm:p-4 min-h-[100px] flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs sm:text-sm font-semibold leading-tight">Årligt kaloribehov</h3>
            <Apple className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" style={{ color: 'var(--color-khaki)' }} />
          </div>
          <div className="text-xl sm:text-2xl font-bold mb-2" style={{ color: 'var(--color-khaki)' }}>
            {formatNumber(gardenPlan.annualCalorieNeed)}
          </div>
          <p className="text-xs leading-tight" style={{ color: 'var(--text-secondary)' }}>
            Kalorier per år
          </p>
        </div>

        {/* Garden production card */}
        <div className="modern-card p-3 sm:p-4 min-h-[100px] flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs sm:text-sm font-semibold leading-tight">Trädgårdsproduktion</h3>
            <Leaf className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" style={{ color: 'var(--color-warm-olive)' }} />
          </div>
          <div className="text-xl sm:text-2xl font-bold mb-2" style={{ color: 'var(--color-warm-olive)' }}>
            {formatNumber(realTimeStats?.gardenProduction || gardenPlan.gardenProduction)}
          </div>
          <p className="text-xs leading-tight" style={{ color: 'var(--text-secondary)' }}>
            Kalorier från trädgården
          </p>
        </div>

        {/* Cost card */}
        <div className="modern-card p-3 sm:p-4 min-h-[100px] flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs sm:text-sm font-semibold leading-tight">Kostnad</h3>
            <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" style={{ color: 'var(--color-sage)' }} />
          </div>
          <div className="text-xl sm:text-2xl font-bold mb-2" style={{ color: 'var(--color-sage)' }}>
            {formatNumber(realTimeStats?.totalCost || gardenPlan.estimatedCost, ' kr')}
          </div>
          <p className="text-xs leading-tight" style={{ color: 'var(--text-secondary)' }}>
            Uppskattad kostnad
          </p>
        </div>

        {/* Grocery needs card */}
        <div className="modern-card p-3 sm:p-4 min-h-[100px] flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs sm:text-sm font-semibold leading-tight">Köpbehov</h3>
            <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" style={{ color: 'var(--color-khaki)' }} />
          </div>
          <div className="text-xl sm:text-2xl font-bold mb-2" style={{ color: 'var(--color-khaki)' }}>
            {formatNumber(realTimeStats?.caloriesFromGroceries || gardenPlan.caloriesFromGroceries)}
          </div>
          <p className="text-xs leading-tight" style={{ color: 'var(--text-secondary)' }}>
            Kompletterande köp
          </p>
        </div>

        {/* Space requirements card */}
        <div className="modern-card p-3 sm:p-4 min-h-[100px] flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs sm:text-sm font-semibold leading-tight">Utrymme krävs</h3>
            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" style={{ color: 'var(--color-warm-olive)' }} />
          </div>
          <div className="text-xl sm:text-2xl font-bold mb-2" style={{ color: 'var(--color-warm-olive)' }}>
            {Math.round(realTimeStats?.totalSpace || gardenPlan.totalSpace)} m²
          </div>
          <p className="text-xs leading-tight" style={{ color: 'var(--text-secondary)' }}>
            av {adjustableGardenSize} m² tillgängligt
          </p>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-auto">
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
  );
}


