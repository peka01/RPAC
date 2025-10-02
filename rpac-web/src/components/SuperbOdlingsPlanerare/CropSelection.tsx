import { Leaf, Plus } from 'lucide-react';
import { getDefaultCropQuantity } from '@/lib/cultivation/generateIntelligentRecommendations';

interface CropSelectionProps {
  gardenPlan: any;
  selectedCrops: string[];
  setSelectedCrops: (crops: string[]) => void;
  cropVolumes: Record<string, number>;
  setCropVolumes: (volumes: Record<string, number>) => void;
  adjustableGardenSize: number;
  onAddCustomCrop: () => void;
}

export function CropSelection({
  gardenPlan,
  selectedCrops,
  setSelectedCrops,
  cropVolumes,
  setCropVolumes,
  adjustableGardenSize,
  onAddCustomCrop
}: CropSelectionProps) {
  const handleCropToggle = (cropName: string, checked: boolean) => {
    if (checked) {
      setSelectedCrops([...selectedCrops, cropName]);
      // Set default quantity based on crop type and garden size
      const defaultQuantity = getDefaultCropQuantity(cropName, adjustableGardenSize);
      setCropVolumes({
        ...cropVolumes,
        [cropName]: defaultQuantity
      });
    } else {
      setSelectedCrops(selectedCrops.filter(c => c !== cropName));
      // Remove from cropVolumes when deselected
      const newVolumes = { ...cropVolumes };
      delete newVolumes[cropName];
      setCropVolumes(newVolumes);
    }
  };

  const handleVolumeChange = (cropName: string, volume: number) => {
    setCropVolumes({
      ...cropVolumes,
      [cropName]: volume
    });
  };

  return (
    <div className="modern-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center space-x-2">
          <Leaf className="w-5 h-5" />
          <span>Välj dina grödor</span>
        </h2>
        <button
          onClick={onAddCustomCrop}
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
        {gardenPlan?.crops?.map((crop: any) => (
          <div key={crop.name} className="border rounded-lg p-4 relative" style={{ borderColor: 'var(--border-color)' }}>
            {/* Crop Icon in top-left corner */}
            {crop.icon && (
              <div className="absolute top-3 left-3">
                <div 
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-lg"
                  style={{ 
                    backgroundColor: `${crop.color}20`,
                    border: `1px solid ${crop.color}`
                  }}
                >
                  {crop.icon}
                </div>
              </div>
            )}
            
            {/* Checkbox in top-right corner */}
            <div className="absolute top-3 right-3">
              <input
                type="checkbox"
                checked={selectedCrops.includes(crop.name)}
                onChange={(e) => handleCropToggle(crop.name, e.target.checked)}
                className="w-5 h-5 rounded border-2 focus:ring-2 focus:ring-green-500 cursor-pointer"
                style={{ 
                  accentColor: 'var(--color-sage)',
                  borderColor: selectedCrops.includes(crop.name) ? 'var(--color-sage)' : '#d1d5db'
                }}
              />
            </div>
            
            <div className="flex items-center justify-between mb-3 pl-10 pr-10">
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {crop.name}
              </h3>
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
                    onChange={(e) => handleVolumeChange(crop.name, Number(e.target.value))}
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
  );
}


