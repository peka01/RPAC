import React, { useState } from 'react';
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
  onEditCustomCrop: (crop: any) => void;
  onUpdateCrop: (crop: any) => void;
  onDeleteCustomCrop: (crop: any) => void;
}

export function CropSelection({
  gardenPlan,
  selectedCrops,
  setSelectedCrops,
  cropVolumes,
  setCropVolumes,
  adjustableGardenSize,
  onAddCustomCrop,
  onEditCustomCrop,
  onUpdateCrop,
  onDeleteCustomCrop
}: CropSelectionProps) {
  const [expandedNutrition, setExpandedNutrition] = useState<string | null>(null);
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
          <div 
            key={crop.name} 
            className="border rounded-lg p-4 relative transition-all duration-200 cursor-pointer hover:shadow-md" 
            onClick={() => handleCropToggle(crop.name, !selectedCrops.includes(crop.name))}
            style={{ 
              borderColor: selectedCrops.includes(crop.name) ? 'var(--color-sage)' : 'var(--border-color)',
              backgroundColor: selectedCrops.includes(crop.name) ? 'rgba(135, 169, 107, 0.12)' : 'white'
            }}
          >
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
            
            {/* Selection indicator in top-right corner */}
            <div className="absolute top-3 right-3">
              {selectedCrops.includes(crop.name) && (
                <div className="flex items-center space-x-1" style={{ color: 'var(--color-sage)' }}>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            
            
            <div className="flex items-center justify-between mb-3 pl-10 pr-10">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {crop.name}
                </h3>
                {crop.isCustom && (
                  <span 
                    className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
                    title="Anpassad gröda"
                  >
                    Anpassad
                  </span>
                )}
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
            
            <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
              {crop.description}
            </p>
            
            {/* Nutrition Data Dropdown */}
            <div className="mb-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedNutrition(crop.name === expandedNutrition ? null : crop.name);
                }}
                className="w-full flex items-center justify-between p-2 rounded-lg border transition-colors hover:bg-gray-50"
                style={{ 
                  borderColor: 'rgba(135, 169, 107, 0.3)',
                  backgroundColor: crop.nutritionData ? 'rgba(135, 169, 107, 0.08)' : 'rgba(139, 134, 78, 0.08)'
                }}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold" style={{ color: 'var(--color-sage)' }}>
                    🍎 Näringsvärden
                  </span>
                </div>
                <svg 
                  className={`w-4 h-4 transition-transform ${expandedNutrition === crop.name ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  style={{ color: 'var(--color-sage)' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {expandedNutrition === crop.name && (
                <div className="mt-2 p-3 rounded-lg border" style={{ 
                  backgroundColor: 'rgba(135, 169, 107, 0.08)', 
                  borderColor: 'rgba(135, 169, 107, 0.25)' 
                }}>
                  {crop.nutritionData ? (
                    <>
                      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                        <div>
                          <span style={{ color: 'var(--text-secondary)' }}>Kalorier/100g:</span>
                          <span className="block font-medium" style={{ color: 'var(--text-primary)' }}>
                            {crop.nutritionData.caloriesPer100g || 'N/A'} kcal
                          </span>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-secondary)' }}>Protein:</span>
                          <span className="block font-medium" style={{ color: 'var(--text-primary)' }}>
                            {crop.nutritionData.protein || 'N/A'} g
                          </span>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-secondary)' }}>C-vitamin:</span>
                          <span className="block font-medium" style={{ color: 'var(--text-primary)' }}>
                            {crop.nutritionData.vitamins?.vitaminC || 'N/A'} mg
                          </span>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-secondary)' }}>Fiber:</span>
                          <span className="block font-medium" style={{ color: 'var(--text-primary)' }}>
                            {crop.nutritionData.fiber || 'N/A'} g
                          </span>
                        </div>
                      </div>
                      {crop.nutritionData.healthBenefits && crop.nutritionData.healthBenefits.length > 0 && (
                        <div className="mb-3">
                          <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                            Hälsofördelar:
                          </span>
                          <p className="text-xs mt-1" style={{ color: 'var(--text-primary)' }}>
                            {crop.nutritionData.healthBenefits.join(', ')}
                          </p>
                        </div>
                      )}
                      <div className="flex justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateCrop(crop);
                          }}
                          className="flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium transition-colors"
                          style={{ 
                            backgroundColor: 'var(--color-sage)',
                            color: 'white'
                          }}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <span>Uppdatera</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Inga näringsdata tillgängliga
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateCrop(crop);
                        }}
                        className="mt-2 flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium transition-colors mx-auto"
                        style={{ 
                          backgroundColor: 'var(--color-sage)',
                          color: 'white'
                        }}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Hämta näringsdata</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            
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
                <div className="space-y-3">
                  {/* Manual input field */}
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Antal plantor:
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="200"
                      value={cropVolumes[crop.name] || 0}
                      onChange={(e) => {
                        e.stopPropagation();
                        const value = Math.max(0, Math.min(200, Number(e.target.value)));
                        handleVolumeChange(crop.name, value);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-20 px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      style={{ 
                        borderColor: 'var(--border-color)',
                        backgroundColor: 'white'
                      }}
                    />
                  </div>
                  
                  {/* Enhanced slider */}
                  <div className="relative">
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={cropVolumes[crop.name] || 0}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleVolumeChange(crop.name, Number(e.target.value));
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      style={{
                        background: `linear-gradient(to right, var(--color-sage) 0%, var(--color-sage) ${((cropVolumes[crop.name] || 0) / 200) * 100}%, #e5e7eb ${((cropVolumes[crop.name] || 0) / 200) * 100}%, #e5e7eb 100%)`
                      }}
                    />
                  </div>
                  
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
            
            {/* Edit and Delete buttons for custom crops - lower right corner on new row */}
            {crop.isCustom && (
              <div className="mt-4 flex justify-end space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditCustomCrop(crop);
                  }}
                  className="flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium transition-colors hover:scale-105"
                  style={{ 
                    backgroundColor: 'var(--color-primary)',
                    color: 'white'
                  }}
                  title="Redigera anpassad gröda"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Redigera</span>
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteCustomCrop(crop);
                  }}
                  className="flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium transition-colors hover:scale-105"
                  style={{ 
                    backgroundColor: '#dc2626',
                    color: 'white'
                  }}
                  title="Ta bort anpassad gröda"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Ta bort</span>
                </button>
              </div>
            )}
            
          </div>
        ))}
      </div>
    </div>
  );
}


