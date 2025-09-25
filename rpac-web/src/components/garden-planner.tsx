'use client';

import { useState, useCallback } from 'react';
import { t } from '@/lib/locales';
import { 
  Grid,
  Square,
  Plus,
  Minus,
  RotateCw,
  Save,
  Download,
  Upload,
  Maximize2,
  Move,
  Trash2,
  Info,
  Sun,
  Droplets,
  AlertCircle
} from 'lucide-react';

interface PlantSquare {
  id: string;
  plantType: string;
  plantName: string;
  icon: string;
  x: number;
  y: number;
  width: number;
  height: number;
  sowingMonth?: number;
  harvestMonth?: number;
  companion?: string[];
  antagonist?: string[];
}

interface GardenLayout {
  id: string;
  name: string;
  width: number; // in squares
  height: number; // in squares
  squareSize: number; // in cm
  plants: PlantSquare[];
  notes?: string;
}

const plantTemplates = {
  potatoes: {
    name: 'cultivation.plants.potatoes',
    icon: '🥔',
    defaultSize: { width: 2, height: 2 },
    spacing: 30, // cm
    companion: ['cabbage', 'beans'],
    antagonist: ['tomatoes'],
    sunRequirement: 'full',
    waterRequirement: 'medium'
  },
  tomatoes: {
    name: 'cultivation.plants.tomatoes',
    icon: '🍅',
    defaultSize: { width: 1, height: 1 },
    spacing: 40,
    companion: ['herbs', 'lettuce'],
    antagonist: ['potatoes'],
    sunRequirement: 'full',
    waterRequirement: 'high'
  },
  lettuce: {
    name: 'cultivation.plants.lettuce',
    icon: '🥬',
    defaultSize: { width: 1, height: 1 },
    spacing: 20,
    companion: ['tomatoes', 'carrots'],
    antagonist: [],
    sunRequirement: 'partial',
    waterRequirement: 'medium'
  },
  carrots: {
    name: 'cultivation.plants.carrots',
    icon: '🥕',
    defaultSize: { width: 1, height: 2 },
    spacing: 5,
    companion: ['lettuce', 'onions'],
    antagonist: [],
    sunRequirement: 'full',
    waterRequirement: 'medium'
  },
  herbs: {
    name: 'cultivation.plants.herbs',
    icon: '🌿',
    defaultSize: { width: 1, height: 1 },
    spacing: 15,
    companion: ['tomatoes'],
    antagonist: [],
    sunRequirement: 'partial',
    waterRequirement: 'low'
  },
  cabbage: {
    name: 'cultivation.plants.cabbage',
    icon: '🥬',
    defaultSize: { width: 1, height: 1 },
    spacing: 35,
    companion: ['potatoes'],
    antagonist: [],
    sunRequirement: 'full',
    waterRequirement: 'medium'
  }
};

interface GardenPlannerProps {
  onSave?: (layout: GardenLayout) => void;
  initialLayout?: GardenLayout;
  crisisMode?: boolean;
}

export function GardenPlanner({ 
  onSave, 
  initialLayout,
  crisisMode = false 
}: GardenPlannerProps) {
  const [layout, setLayout] = useState<GardenLayout>(
    initialLayout || {
      id: 'garden-1',
      name: 'Min trädgård',
      width: 8,
      height: 6,
      squareSize: 50, // 50cm squares
      plants: []
    }
  );

  const [selectedPlant, setSelectedPlant] = useState<string | null>(null);
  const [draggedPlant, setDraggedPlant] = useState<PlantSquare | null>(null);
  const [isPlacing, setIsPlacing] = useState<string | false>(false);
  const [showInfo, setShowInfo] = useState<string | null>(null);

  // Add plant to garden
  const addPlant = useCallback((plantType: string, x: number, y: number) => {
    if (!plantTemplates[plantType as keyof typeof plantTemplates]) return;

    const template = plantTemplates[plantType as keyof typeof plantTemplates];
    const newPlant: PlantSquare = {
      id: `${plantType}-${Date.now()}`,
      plantType,
      plantName: t(template.name),
      icon: template.icon,
      x,
      y,
      width: template.defaultSize.width,
      height: template.defaultSize.height,
      companion: template.companion,
      antagonist: template.antagonist
    };

    setLayout(prev => ({
      ...prev,
      plants: [...prev.plants, newPlant]
    }));
  }, []);

  // Remove plant from garden
  const removePlant = useCallback((plantId: string) => {
    setLayout(prev => ({
      ...prev,
      plants: prev.plants.filter(p => p.id !== plantId)
    }));
  }, []);

  // Move plant to new position
  const movePlant = useCallback((plantId: string, newX: number, newY: number) => {
    setLayout(prev => ({
      ...prev,
      plants: prev.plants.map(p => 
        p.id === plantId ? { ...p, x: newX, y: newY } : p
      )
    }));
  }, []);

  // Check if square is occupied
  const isSquareOccupied = (x: number, y: number, excludeId?: string) => {
    return layout.plants.some(plant => {
      if (excludeId && plant.id === excludeId) return false;
      return x >= plant.x && x < plant.x + plant.width &&
             y >= plant.y && y < plant.y + plant.height;
    });
  };

  // Get companion planting feedback
  const getCompanionFeedback = (plant: PlantSquare) => {
    const feedback: { type: 'good' | 'bad' | 'neutral', message: string }[] = [];
    
    layout.plants.forEach(otherPlant => {
      if (otherPlant.id === plant.id) return;
      
      const distance = Math.sqrt(
        Math.pow(plant.x - otherPlant.x, 2) + Math.pow(plant.y - otherPlant.y, 2)
      );
      
      if (distance <= 2) { // Within 2 squares
        if (plant.companion?.includes(otherPlant.plantType)) {
          feedback.push({
            type: 'good',
            message: `Bra granne: ${otherPlant.plantName}`
          });
        } else if (plant.antagonist?.includes(otherPlant.plantType)) {
          feedback.push({
            type: 'bad',
            message: `Dålig granne: ${otherPlant.plantName}`
          });
        }
      }
    });
    
    return feedback;
  };

  // Calculate garden efficiency
  const getGardenStats = () => {
    const totalSquares = layout.width * layout.height;
    const usedSquares = layout.plants.reduce((sum, plant) => 
      sum + (plant.width * plant.height), 0
    );
    const efficiency = (usedSquares / totalSquares) * 100;
    
    const crisisSuitability = layout.plants.filter(plant => 
      ['lettuce', 'radishes', 'spinach', 'herbs'].includes(plant.plantType)
    ).length / layout.plants.length * 100;

    return {
      totalSquares,
      usedSquares,
      efficiency: Math.round(efficiency),
      crisisSuitability: Math.round(crisisSuitability)
    };
  };

  const stats = getGardenStats();

  return (
    <div className="rounded-lg p-6 border shadow-lg" style={{ 
      backgroundColor: 'var(--bg-card)',
      borderColor: 'var(--color-sage)'
    }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center shadow-sm" style={{ 
            background: 'linear-gradient(135deg, var(--color-sage) 0%, var(--color-secondary) 100%)' 
          }}>
            <Grid className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {t('cultivation.garden_planning')}
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {layout.width} × {layout.height} rutor ({layout.squareSize}cm per ruta)
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onSave?.(layout)}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg border hover:shadow-sm transition-all duration-200"
            style={{ 
              backgroundColor: 'var(--color-sage)',
              borderColor: 'var(--color-sage)',
              color: 'white'
            }}
          >
            <Save className="w-4 h-4" />
            <span className="text-sm">Spara</span>
          </button>
        </div>
      </div>

      {/* Garden Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-olive-light)' }}>
          <div className="text-lg font-bold" style={{ color: 'var(--color-sage)' }}>
            {stats.efficiency}%
          </div>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Utnyttjad yta
          </div>
        </div>
        
        <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-olive-light)' }}>
          <div className="text-lg font-bold" style={{ color: 'var(--color-sage)' }}>
            {layout.plants.length}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Växtyper
          </div>
        </div>

        <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-olive-light)' }}>
          <div className="text-lg font-bold" style={{ color: 'var(--color-sage)' }}>
            {stats.usedSquares}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Använda rutor
          </div>
        </div>

        {crisisMode && (
          <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(184, 134, 11, 0.1)' }}>
            <div className="text-lg font-bold" style={{ color: 'var(--color-warm-olive)' }}>
              {stats.crisisSuitability}%
            </div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Krisanpassad
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plant Palette */}
        <div className="space-y-4">
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            Växter att plantera
          </h3>
          
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(plantTemplates).map(([plantType, template]) => {
              const isCrisisFriendly = ['lettuce', 'herbs', 'carrots'].includes(plantType);
              
              return (
                <button
                  key={plantType}
                  onClick={() => setIsPlacing(isPlacing === plantType ? false : plantType)}
                  className={`p-3 rounded-lg border transition-all duration-200 ${
                    isPlacing === plantType ? 'shadow-md' : 'hover:shadow-sm'
                  }`}
                  style={{
                    backgroundColor: isPlacing === plantType ? 'var(--bg-olive-light)' : 'var(--bg-card)',
                    borderColor: isPlacing === plantType ? 'var(--color-sage)' : 'var(--color-secondary)'
                  }}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-1">{template.icon}</div>
                    <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                      {t(template.name)}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {template.defaultSize.width}×{template.defaultSize.height}
                    </div>
                    {crisisMode && isCrisisFriendly && (
                      <div className="w-2 h-2 rounded-full mx-auto mt-1" style={{
                        backgroundColor: 'var(--color-warm-olive)'
                      }}></div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Plant Requirements */}
          {selectedPlant && (
            <div className="p-4 rounded-lg border" style={{ 
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--color-secondary)'
            }}>
              <h4 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                Växtkrav
              </h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sun className="w-4 h-4" style={{ color: 'var(--color-khaki)' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>Ljus:</span>
                  </div>
                  <span style={{ color: 'var(--text-primary)' }}>
                    {plantTemplates[selectedPlant as keyof typeof plantTemplates]?.sunRequirement === 'full' ? 'Full sol' : 'Delvis skugga'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Droplets className="w-4 h-4" style={{ color: 'var(--color-cool-olive)' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>Vatten:</span>
                  </div>
                  <span style={{ color: 'var(--text-primary)' }}>
                    {(() => {
                      const req = plantTemplates[selectedPlant as keyof typeof plantTemplates]?.waterRequirement;
                      return req === 'high' ? 'Mycket' : req === 'medium' ? 'Måttligt' : 'Lite';
                    })()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Garden Grid */}
        <div className="lg:col-span-2">
          <div className="relative">
            <div 
              className="grid gap-1 p-4 rounded-lg border"
              style={{ 
                backgroundColor: 'var(--bg-olive-light)',
                borderColor: 'var(--color-secondary)',
                gridTemplateColumns: `repeat(${layout.width}, 1fr)`,
                gridTemplateRows: `repeat(${layout.height}, 1fr)`
              }}
            >
              {Array.from({ length: layout.width * layout.height }).map((_, index) => {
                const x = index % layout.width;
                const y = Math.floor(index / layout.width);
                const isOccupied = isSquareOccupied(x, y);
                const plantInSquare = layout.plants.find(plant => 
                  x >= plant.x && x < plant.x + plant.width &&
                  y >= plant.y && y < plant.y + plant.height
                );

                return (
                  <div
                    key={index}
                    className={`aspect-square border rounded cursor-pointer transition-all duration-200 ${
                      isPlacing ? 'hover:bg-opacity-50' : ''
                    }`}
                    style={{
                      backgroundColor: isOccupied 
                        ? 'transparent' 
                        : isPlacing 
                          ? 'var(--bg-card)' 
                          : 'var(--bg-card)',
                      borderColor: 'var(--color-secondary)',
                      borderWidth: '1px'
                    }}
                    onClick={() => {
                      if (isPlacing && typeof isPlacing === 'string' && !isOccupied) {
                        addPlant(isPlacing, x, y);
                        setIsPlacing(false);
                      } else if (plantInSquare) {
                        setSelectedPlant(plantInSquare.id);
                        setShowInfo(plantInSquare.id);
                      }
                    }}
                  >
                    {plantInSquare && x === plantInSquare.x && y === plantInSquare.y && (
                      <div 
                        className="w-full h-full flex items-center justify-center text-lg font-bold rounded relative group"
                        style={{ 
                          backgroundColor: selectedPlant === plantInSquare.id 
                            ? 'var(--color-sage)' 
                            : 'var(--bg-card)',
                          color: selectedPlant === plantInSquare.id ? 'white' : 'var(--text-primary)',
                          gridColumn: `span ${plantInSquare.width}`,
                          gridRow: `span ${plantInSquare.height}`
                        }}
                      >
                        <span>{plantInSquare.icon}</span>
                        
                        {/* Plant actions */}
                        {selectedPlant === plantInSquare.id && (
                          <div className="absolute top-1 right-1 flex space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowInfo(showInfo === plantInSquare.id ? null : plantInSquare.id);
                              }}
                              className="w-5 h-5 rounded bg-white/20 flex items-center justify-center hover:bg-white/30"
                            >
                              <Info className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removePlant(plantInSquare.id);
                                setSelectedPlant(null);
                              }}
                              className="w-5 h-5 rounded bg-white/20 flex items-center justify-center hover:bg-white/30"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Instructions */}
            <div className="mt-4 text-center">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {isPlacing 
                  ? 'Klicka på en tom ruta för att plantera'
                  : 'Välj en växt ovan för att börja planera din trädgård'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Plant Info Modal */}
      {showInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full" style={{ backgroundColor: 'var(--bg-card)' }}>
            {(() => {
              const plant = layout.plants.find(p => p.id === showInfo);
              if (!plant) return null;
              
              const feedback = getCompanionFeedback(plant);
              
              return (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                      {plant.icon} {plant.plantName}
                    </h3>
                    <button
                      onClick={() => setShowInfo(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ×
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                        Position
                      </h4>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Ruta {plant.x + 1}, {plant.y + 1} ({plant.width}×{plant.height})
                      </p>
                    </div>
                    
                    {feedback.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                          Grannskap
                        </h4>
                        <div className="space-y-1">
                          {feedback.map((f, i) => (
                            <div 
                              key={i} 
                              className={`text-sm flex items-center space-x-2`}
                              style={{ 
                                color: f.type === 'good' ? 'var(--color-sage)' : 
                                       f.type === 'bad' ? 'var(--color-warm-olive)' : 'var(--text-secondary)'
                              }}
                            >
                              {f.type === 'good' && <span>✓</span>}
                              {f.type === 'bad' && <AlertCircle className="w-4 h-4" />}
                              <span>{f.message}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
