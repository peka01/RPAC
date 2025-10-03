import { Target, Info } from 'lucide-react';

interface OptimizationControlsProps {
  adjustableGardenSize: number;
  setAdjustableGardenSize: (size: number) => void;
  cultivationIntensity: 'low' | 'medium' | 'high';
  setCultivationIntensity: (intensity: 'low' | 'medium' | 'high') => void;
  showIntensityTooltip: boolean;
  setShowIntensityTooltip: (show: boolean) => void;
}

export function OptimizationControls({
  adjustableGardenSize,
  setAdjustableGardenSize,
  cultivationIntensity,
  setCultivationIntensity,
  showIntensityTooltip,
  setShowIntensityTooltip
}: OptimizationControlsProps) {
  return (
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
  );
}


