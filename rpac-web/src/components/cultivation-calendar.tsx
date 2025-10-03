'use client';

import { useState, useEffect } from 'react';
import { t } from '@/lib/locales';
import { 
  Calendar,
  Leaf, 
  Sun, 
  Droplets,
  Thermometer,
  Clock,
  ChevronLeft,
  ChevronRight,
  Sprout,
  TreePine,
  AlertTriangle,
  CheckCircle,
  MapPin,
  Heart,
  Shield,
  HelpCircle
} from 'lucide-react';

// Swedish plant database with growing information
const swedishPlants = {
  potatoes: {
    name: 'cultivation.plants.potatoes',
    icon: '🥔',
    sowingMonths: [4, 5], // April-May
    harvestMonths: [8, 9, 10], // August-October
    growingTime: 16, // weeks
    difficulty: 'beginner',
    nutritionValue: 'high',
    crisisValue: 'excellent',
    climateZones: ['gotaland', 'svealand', 'norrland']
  },
  carrots: {
    name: 'cultivation.plants.carrots',
    icon: '🥕',
    sowingMonths: [4, 5, 6], // April-June
    harvestMonths: [8, 9, 10], // August-October
    growingTime: 12,
    difficulty: 'beginner',
    nutritionValue: 'high',
    crisisValue: 'good',
    climateZones: ['gotaland', 'svealand', 'norrland']
  },
  cabbage: {
    name: 'cultivation.plants.cabbage',
    icon: '🥬',
    sowingMonths: [3, 4, 5], // March-May
    harvestMonths: [8, 9, 10], // August-October
    growingTime: 14,
    difficulty: 'intermediate',
    nutritionValue: 'high',
    crisisValue: 'excellent',
    climateZones: ['gotaland', 'svealand']
  },
  lettuce: {
    name: 'cultivation.plants.lettuce',
    icon: '🥬',
    sowingMonths: [3, 4, 5, 6, 7, 8], // March-August
    harvestMonths: [5, 6, 7, 8, 9, 10], // May-October
    growingTime: 6,
    difficulty: 'beginner',
    nutritionValue: 'medium',
    crisisValue: 'good',
    climateZones: ['gotaland', 'svealand', 'norrland']
  },
  radishes: {
    name: 'cultivation.plants.radishes',
    icon: '🔴',
    sowingMonths: [3, 4, 5, 6, 7, 8], // March-August
    harvestMonths: [4, 5, 6, 7, 8, 9], // April-September
    growingTime: 4,
    difficulty: 'beginner',
    nutritionValue: 'medium',
    crisisValue: 'excellent', // Fast growing
    climateZones: ['gotaland', 'svealand', 'norrland']
  },
  spinach: {
    name: 'cultivation.plants.spinach',
    icon: '🥬',
    sowingMonths: [3, 4, 8, 9], // March-April, August-September
    harvestMonths: [5, 6, 9, 10], // May-June, September-October
    growingTime: 6,
    difficulty: 'beginner',
    nutritionValue: 'high',
    crisisValue: 'excellent',
    climateZones: ['gotaland', 'svealand', 'norrland']
  },
  kale: {
    name: 'cultivation.plants.kale',
    icon: '🥬',
    sowingMonths: [3, 4, 5], // March-May
    harvestMonths: [7, 8, 9, 10, 11], // July-November
    growingTime: 12,
    difficulty: 'beginner',
    nutritionValue: 'excellent',
    crisisValue: 'excellent',
    climateZones: ['gotaland', 'svealand', 'norrland']
  }
};

type ClimateZone = 'gotaland' | 'svealand' | 'norrland';

interface CultivationCalendarProps {
  climateZone?: ClimateZone;
  gardenSize?: 'small' | 'medium' | 'large';
  crisisMode?: boolean;
  aiCalendarItems?: any[];
}

export function CultivationCalendar({ 
  climateZone = 'svealand', 
  gardenSize = 'medium',
  crisisMode = false,
  aiCalendarItems = []
}: CultivationCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [selectedPlant, setSelectedPlant] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'calendar' | 'planning' | 'tips'>('calendar');
  const [storedCalendarItems, setStoredCalendarItems] = useState<any[]>([]);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ period: '', description: '' });

  // Function to refresh calendar items
  const refreshCalendarItems = async () => {
    if (typeof window === 'undefined') return;
    
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data: dbItems, error } = await supabase
        .from('cultivation_calendar')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading calendar from database:', error);
        setStoredCalendarItems([]);
        return;
      }

      console.log('Loaded planning activities from database:', dbItems?.length || 0, 'entries');
      setStoredCalendarItems(dbItems || []);
    } catch (dbError) {
      console.error('Database not available:', dbError);
      setStoredCalendarItems([]);
    }
  };

  // Function to clear calendar and generate new plan
  const clearCalendarAndGenerateNew = async () => {
    if (!confirm('Är du säker på att du vill rensa kalendern och skapa en ny plan? Detta kommer att ta bort alla befintliga aktiviteter.')) {
      return;
    }

    try {
      // Clear calendar from database
      const { supabase } = await import('@/lib/supabase');
      const { error } = await supabase
        .from('cultivation_calendar')
        .delete()
        .neq('id', 0); // Delete all records

      if (error) {
        console.error('Error clearing calendar:', error);
        alert('Fel vid rensning av kalender. Försök igen.');
        return;
      }

      // Clear localStorage as well
      localStorage.removeItem('cultivationCalendarItems');
      
      // Refresh the calendar display
      setStoredCalendarItems([]);
      
      // Navigate to planner
      window.location.href = '/individual?section=cultivation&subsection=ai-planner';
      
    } catch (error) {
      console.error('Error clearing calendar:', error);
      alert('Fel vid rensning av kalender. Försök igen.');
    }
  };

  // Load AI calendar items from secure storage and regular localStorage
  useEffect(() => {
    refreshCalendarItems();
  }, []);

  // Listen for storage changes to refresh when planning data is added
  useEffect(() => {
    const handleStorageChange = () => {
      refreshCalendarItems();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Use stored items if no props provided
  const displayCalendarItems = aiCalendarItems.length > 0 ? aiCalendarItems : storedCalendarItems;

  // Edit functions
  const startEdit = (item: any) => {
    setEditingItem(item.id);
    setEditForm({ period: item.period, description: item.description });
  };

  const saveEdit = () => {
    if (!editingItem) return;
    
    const updatedItems = storedCalendarItems.map(item => 
      item.id === editingItem 
        ? { ...item, period: editForm.period, description: editForm.description }
        : item
    );
    
    setStoredCalendarItems(updatedItems);
    if (typeof window !== 'undefined') {
      const { SecureStorage } = require('@/lib/secure-storage');
      SecureStorage.setItem('ai-calendar-items', updatedItems);
      SecureStorage.setItem('cultivationCalendarItems', updatedItems);
    }
    setEditingItem(null);
    setEditForm({ period: '', description: '' });
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditForm({ period: '', description: '' });
  };

  const deleteItem = (itemId: string) => {
    const updatedItems = storedCalendarItems.filter(item => item.id !== itemId);
    setStoredCalendarItems(updatedItems);
    if (typeof window !== 'undefined') {
      const { SecureStorage } = require('@/lib/secure-storage');
      SecureStorage.setItem('ai-calendar-items', updatedItems);
      SecureStorage.setItem('cultivationCalendarItems', updatedItems);
    }
  };

  // Get current season
  const getCurrentSeason = () => {
    if (currentMonth >= 3 && currentMonth <= 5) return 'spring';
    if (currentMonth >= 6 && currentMonth <= 8) return 'summer';
    if (currentMonth >= 9 && currentMonth <= 11) return 'autumn';
    return 'winter';
  };

  // Get plants suitable for current month and climate zone
  const getCurrentMonthPlants = () => {
    return Object.entries(swedishPlants).filter(([_, plant]) => {
      const isInClimateZone = plant.climateZones.includes(climateZone);
      const canSowNow = plant.sowingMonths.includes(currentMonth);
      const canHarvestNow = plant.harvestMonths.includes(currentMonth);
      
      if (crisisMode) {
        return isInClimateZone && (canSowNow || canHarvestNow) && plant.crisisValue === 'excellent';
      }
      
      return isInClimateZone && (canSowNow || canHarvestNow);
    });
  };

  // Get month name
  const getMonthName = (month: number) => {
    const monthNames = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ];
    return t(`cultivation.months.${monthNames[month - 1]}`);
  };

  // Get seasonal color
  const getSeasonalColor = () => {
    const season = getCurrentSeason();
    switch (season) {
      case 'spring': return 'var(--color-sage)';
      case 'summer': return 'var(--color-khaki)';
      case 'autumn': return 'var(--color-warm-olive)';
      case 'winter': return 'var(--color-cool-olive)';
    }
  };

  return (
    <div className="rounded-lg p-6 border shadow-lg" style={{ 
      backgroundColor: 'var(--bg-card)',
      borderColor: crisisMode ? 'var(--color-warm-olive)' : 'var(--color-sage)'
    }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center shadow-sm" style={{ 
            background: `linear-gradient(135deg, ${getSeasonalColor()} 0%, var(--color-secondary) 100%)` 
          }}>
            <Leaf className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {crisisMode ? t('cultivation.crisis_cultivation') : t('cultivation.title')}
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {t(`cultivation.climate_zones.${climateZone}`)} • {getMonthName(currentMonth)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              console.log('Manual refresh clicked');
              refreshCalendarItems();
            }}
            className="px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md"
            style={{ 
              backgroundColor: 'var(--color-sage)', 
              color: 'white' 
            }}
          >
            🔄 Uppdatera
          </button>
          
          {crisisMode && (
            <div className="flex items-center space-x-2 px-3 py-1 rounded-full border" style={{
              backgroundColor: 'rgba(184, 134, 11, 0.1)',
              borderColor: 'var(--color-warm-olive)'
            }}>
              <AlertTriangle className="w-4 h-4" style={{ color: 'var(--color-warm-olive)' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--color-warm-olive)' }}>
                {t('cultivation.quick_growing')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Planning Activities - Main Content */}
      {displayCalendarItems && displayCalendarItems.length > 0 ? (
        <div className="mb-6 p-4 rounded-lg border-2" style={{ 
          backgroundColor: 'var(--bg-olive-light)',
          borderColor: 'var(--color-sage)'
        }}>
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-sage)' }}>
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
              Min odlingsplan ({displayCalendarItems.length} aktiviteter)
            </h3>
          </div>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            Dessa aktiviteter är skräddarsydda för din familj baserat på din personliga odlingsplan.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {displayCalendarItems.map((item, index) => (
              <div key={item.id} className="flex items-start space-x-3 p-3 rounded-lg border" style={{ 
                backgroundColor: 'white',
                borderColor: 'var(--color-sage)'
              }}>
                <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: 'var(--color-sage)' }} />
                <div className="flex-1">
                  {editingItem === item.id ? (
                    // Edit mode
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editForm.period}
                        onChange={(e) => setEditForm(prev => ({ ...prev, period: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border rounded"
                        placeholder="Period (t.ex. Mars)"
                      />
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border rounded"
                        placeholder="Beskrivning"
                        rows={2}
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={saveEdit}
                          className="px-3 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700"
                        >
                          Spara
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-3 py-1 text-xs rounded bg-gray-500 text-white hover:bg-gray-600"
                        >
                          Avbryt
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <>
                      <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                        {item.period || item.title}
                      </div>
                      <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                        {item.description || item.title}
                      </div>
                      {item.date && (
                        <div className="text-xs mt-1 font-medium" style={{ color: 'var(--color-sage)' }}>
                          📅 {new Date(item.date).toLocaleDateString('sv-SE')}
                        </div>
                      )}
                      <div className="flex items-center space-x-2 mt-2">
                        <div className="px-2 py-1 rounded text-xs" style={{ 
                          backgroundColor: 'var(--color-sage)', 
                          color: 'white' 
                        }}>
                          Planerad
                        </div>
                        {item.type && (
                          <div className="px-2 py-1 rounded text-xs" style={{ 
                            backgroundColor: 'var(--bg-olive-light)', 
                            color: 'var(--text-secondary)' 
                          }}>
                            {item.type === 'sowing' ? 'Så' : item.type === 'harvesting' ? 'Skörda' : item.type}
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2 mt-2">
                        <button
                          onClick={() => startEdit(item)}
                          className="px-2 py-1 text-xs rounded bg-blue-500 text-white hover:bg-blue-600"
                        >
                          Redigera
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="px-2 py-1 text-xs rounded bg-red-500 text-white hover:bg-red-600"
                        >
                          Ta bort
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        // No planning activities - show helpful message
        <div className="mb-6 p-6 rounded-lg border-2 border-dashed text-center" style={{ 
          backgroundColor: 'var(--bg-olive-light)',
          borderColor: 'var(--color-sage)'
        }}>
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-sage)' }}>
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Ingen odlingsplan än
          </h3>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            Skapa din personliga odlingsplan för att se skräddarsydda aktiviteter här.
          </p>
          <button
            onClick={() => {
              // Navigate to planning system
              window.location.href = '/individual?section=cultivation&subsection=ai-planner';
            }}
            className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
            style={{ 
              backgroundColor: 'var(--color-sage)', 
              color: 'white' 
            }}
          >
            🎯 Skapa odlingsplan
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex space-x-1 mb-6 p-1 rounded-lg" style={{ backgroundColor: 'var(--bg-olive-light)' }}>
        {[
          { id: 'calendar', icon: Calendar, label: t('cultivation.calendar_title') },
          { id: 'planning', icon: Sprout, label: t('cultivation.garden_planning') },
          { id: 'tips', icon: Sun, label: t('cultivation.seasonal_tips') }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
              activeTab === tab.id 
                ? 'shadow-sm' 
                : 'hover:shadow-sm'
            }`}
            style={{
              backgroundColor: activeTab === tab.id ? 'var(--bg-card)' : 'transparent',
              color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)'
            }}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Planning Calendar View */}
      {activeTab === 'calendar' && (
        <div className="space-y-6">
          {/* Enhanced Month Navigation with Cultivation Focus */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentMonth(currentMonth === 1 ? 12 : currentMonth - 1)}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg border hover:shadow-md transition-all duration-200"
              style={{ 
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--color-sage)',
                color: 'var(--text-primary)'
              }}
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-sm font-medium">{getMonthName(currentMonth === 1 ? 12 : currentMonth - 1)}</span>
            </button>

            <div className="text-center flex-1 mx-4">
              <div className="flex items-center justify-center space-x-3 mb-2">
                <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {getMonthName(currentMonth)}
                </h3>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  getCurrentSeason() === 'spring' ? 'bg-green-100 text-green-800' :
                  getCurrentSeason() === 'summer' ? 'bg-yellow-100 text-yellow-800' :
                  getCurrentSeason() === 'autumn' ? 'bg-orange-100 text-orange-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {getCurrentSeason() === 'spring' ? '🌸 Vår' :
                   getCurrentSeason() === 'summer' ? '☀️ Sommar' :
                   getCurrentSeason() === 'autumn' ? '🍂 Höst' :
                   '❄️ Vinter'}
                </div>
              </div>
              
              {/* Monthly Activity Summary */}
              <div className="flex items-center justify-center space-x-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
                {(() => {
                  const monthActivities = displayCalendarItems.filter(item => {
                    if (!item.date) return false;
                    const itemDate = new Date(item.date);
                    return itemDate.getMonth() === currentMonth - 1;
                  });
                  
                  const sowingCount = monthActivities.filter(item => 
                    item.type === 'sowing' || item.title?.toLowerCase().includes('så')
                  ).length;
                  
                  const harvestCount = monthActivities.filter(item => 
                    item.type === 'harvesting' || item.title?.toLowerCase().includes('skörda')
                  ).length;
                  
                  return (
                    <>
                      {sowingCount > 0 && (
                        <span className="flex items-center space-x-1">
                          <span>🌱</span>
                          <span>{sowingCount} såaktiviteter</span>
                        </span>
                      )}
                      {harvestCount > 0 && (
                        <span className="flex items-center space-x-1">
                          <span>🍅</span>
                          <span>{harvestCount} skördeaktiviteter</span>
                        </span>
                      )}
                      {monthActivities.length === 0 && (
                        <span>Inga planerade aktiviteter denna månad</span>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            <button
              onClick={() => setCurrentMonth(currentMonth === 12 ? 1 : currentMonth + 1)}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg border hover:shadow-md transition-all duration-200"
              style={{ 
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--color-sage)',
                color: 'var(--text-primary)'
              }}
            >
              <span className="text-sm font-medium">{getMonthName(currentMonth === 12 ? 1 : currentMonth + 1)}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Month Navigation for Months with Activities */}
          {displayCalendarItems && displayCalendarItems.length > 0 && (() => {
            const monthsWithActivities = [];
            for (let month = 1; month <= 12; month++) {
              const monthActivities = displayCalendarItems.filter(item => {
                if (!item.date) return false;
                const itemDate = new Date(item.date);
                return itemDate.getMonth() === month - 1;
              });
              if (monthActivities.length > 0) {
                monthsWithActivities.push({ month, count: monthActivities.length });
              }
            }
            
            if (monthsWithActivities.length > 1) {
              return (
                <div className="mb-4 p-3 rounded-lg border" style={{ 
                  backgroundColor: 'var(--bg-olive-light)',
                  borderColor: 'var(--color-sage)'
                }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      📅 Månader med aktiviteter
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Klicka för att hoppa till månad
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {monthsWithActivities.map(({ month, count }) => (
                      <button
                        key={month}
                        onClick={() => setCurrentMonth(month)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                          month === currentMonth 
                            ? 'bg-green-500 text-white shadow-md' 
                            : 'bg-white text-gray-700 hover:bg-green-50 hover:text-green-700'
                        }`}
                        style={{ 
                          borderColor: month === currentMonth ? 'var(--color-sage)' : 'var(--color-secondary)',
                          borderWidth: '1px'
                        }}
                      >
                        {getMonthName(month)} ({count})
                      </button>
                    ))}
                  </div>
                </div>
              );
            }
            return null;
          })()}


          {/* Monthly Overview - Cultivation Activities by Month */}
          {displayCalendarItems && displayCalendarItems.length > 0 && (() => {
            // Group activities by month
            const activitiesByMonth: Record<number, any[]> = {};
            displayCalendarItems.forEach(activity => {
              if (activity.date) {
                const activityDate = new Date(activity.date);
                const month = activityDate.getMonth() + 1;
                if (!activitiesByMonth[month]) {
                  activitiesByMonth[month] = [];
                }
                activitiesByMonth[month].push(activity);
              }
            });

            return (
              <div className="mb-6 p-4 rounded-lg border" style={{ 
                backgroundColor: 'var(--bg-olive-light)',
                borderColor: 'var(--color-sage)'
              }}>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-sage)' }}>
                    <span className="text-white text-sm">📅</span>
                  </div>
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Månadsvis Odlingsöversikt
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(activitiesByMonth).map(([month, activities]) => {
                    const monthNumber = parseInt(month);
                    const monthName = getMonthName(monthNumber);
                    const sowingActivities = activities.filter(a => a.type === 'sowing');
                    const harvestActivities = activities.filter(a => a.type === 'harvesting');
                    
                    return (
                      <div key={month} className="p-4 rounded-lg border bg-white" style={{ borderColor: 'var(--color-sage)' }}>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {monthName}
                          </h4>
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100" style={{ color: 'var(--text-secondary)' }}>
                            {activities.length} aktiviteter
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          {sowingActivities.length > 0 && (
                            <div className="flex items-center space-x-2">
                              <span className="text-green-600">🌱</span>
                              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                Såning ({sowingActivities.length})
                              </span>
                            </div>
                          )}
                          
                          {harvestActivities.length > 0 && (
                            <div className="flex items-center space-x-2">
                              <span className="text-orange-600">🍅</span>
                              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                Skörd ({harvestActivities.length})
                              </span>
                            </div>
                          )}
                          
                          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            {activities.map(activity => activity.crop_name).filter((name, index, arr) => arr.indexOf(name) === index).join(', ')}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Planning Activities Calendar View */}
          {displayCalendarItems && displayCalendarItems.length > 0 ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Min odlingsplan ({displayCalendarItems.length} aktiviteter)
                </h4>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm px-2 py-1 rounded-full" style={{ 
                      backgroundColor: 'rgba(135, 169, 107, 0.15)',
                      color: 'var(--color-sage)'
                    }}>
                      🌱 Så
                    </span>
                    <span className="text-sm px-2 py-1 rounded-full" style={{ 
                      backgroundColor: 'rgba(160, 142, 90, 0.15)',
                      color: 'var(--color-khaki)'
                    }}>
                      🍅 Skörda
                    </span>
                  </div>
                  <button
                    onClick={clearCalendarAndGenerateNew}
                    className="px-4 py-2 rounded-lg font-medium text-white hover:shadow-md transition-all duration-200 flex items-center space-x-2"
                    style={{ backgroundColor: 'var(--color-warm-olive)' }}
                  >
                    <span>🗑️</span>
                    <span>Rensa & Skapa ny plan</span>
                  </button>
                </div>
              </div>


              {/* Activity Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border" style={{ 
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--color-sage)'
                }}>
                  <h5 className="font-semibold mb-2 flex items-center" style={{ color: 'var(--text-primary)' }}>
                    🌱 Såaktiviteter
                  </h5>
                  <div className="space-y-2">
                    {displayCalendarItems
                      .filter(item => item.type === 'sowing')
                      .slice(0, 5)
                      .map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span style={{ color: 'var(--text-secondary)' }}>
                            {item.title}
                          </span>
                          <div className="flex flex-col items-end">
                            <span className="text-xs text-gray-500 mb-1">Senast</span>
                            <span className="text-xs px-2 py-1 rounded" style={{ 
                              backgroundColor: 'var(--color-sage)',
                              color: 'white'
                            }}>
                              {new Date(item.date).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="p-4 rounded-lg border" style={{ 
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--color-khaki)'
                }}>
                  <h5 className="font-semibold mb-2 flex items-center" style={{ color: 'var(--text-primary)' }}>
                    🍅 Skördeaktiviteter
                  </h5>
                  <div className="space-y-2">
                    {displayCalendarItems
                      .filter(item => item.type === 'harvesting')
                      .slice(0, 5)
                      .map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span style={{ color: 'var(--text-secondary)' }}>
                            {item.title}
                          </span>
                          <div className="flex flex-col items-end">
                            <span className="text-xs text-gray-500 mb-1">Senast</span>
                            <span className="text-xs px-2 py-1 rounded" style={{ 
                              backgroundColor: 'var(--color-khaki)',
                              color: 'white'
                            }}>
                              {new Date(item.date).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{
                backgroundColor: 'var(--color-sage)',
                color: 'white'
              }}>
                📅
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Ingen odlingsplan än
              </h3>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                Skapa en odlingsplan för att se dina aktiviteter här
              </p>
              <button
                onClick={() => window.location.href = '/individual?section=cultivation&subsection=ai-planner'}
                className="px-4 py-2 rounded-lg font-medium text-white hover:shadow-md transition-all duration-200"
                style={{ backgroundColor: 'var(--color-sage)' }}
              >
                🎯 Skapa odlingsplan
              </button>
            </div>
          )}

          {/* Planning-focused calendar - no general plants shown */}
          <div className="hidden">
            {getCurrentMonthPlants().map(([plantKey, plant]) => {
              const canSow = plant.sowingMonths.includes(currentMonth);
              const canHarvest = plant.harvestMonths.includes(currentMonth);
              
              return (
                <div
                  key={plantKey}
                  className="group relative rounded-xl border-2 hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
                  style={{ 
                    backgroundColor: 'var(--bg-card)',
                    borderColor: selectedPlant === plantKey ? getSeasonalColor() : 'var(--color-secondary)',
                    boxShadow: selectedPlant === plantKey ? `0 0 0 3px ${getSeasonalColor()}20` : 'none'
                  }}
                  onClick={() => setSelectedPlant(selectedPlant === plantKey ? null : plantKey)}
                >
                  {/* Card Header with Gradient */}
                  <div className="relative p-4 pb-2" style={{
                    background: `linear-gradient(135deg, ${getSeasonalColor()}15 0%, ${getSeasonalColor()}05 100%)`
                  }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg" style={{
                          background: `linear-gradient(135deg, ${getSeasonalColor()} 0%, ${getSeasonalColor()}80 100%)`
                        }}>
                          <span className="text-2xl">{plant.icon}</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                            {t(plant.name)}
                          </h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs px-2 py-1 rounded-full font-medium" style={{
                              backgroundColor: plant.difficulty === 'beginner' ? 'rgba(135, 169, 107, 0.2)' :
                                             plant.difficulty === 'intermediate' ? 'rgba(160, 142, 90, 0.2)' :
                                             'rgba(184, 134, 11, 0.2)',
                              color: plant.difficulty === 'beginner' ? 'var(--color-sage)' :
                                     plant.difficulty === 'intermediate' ? 'var(--color-khaki)' :
                                     'var(--color-warm-olive)'
                            }}>
                              {t(`cultivation.difficulty.${plant.difficulty}`)}
                            </span>
                            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                              {plant.growingTime} veckor
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {plant.crisisValue === 'excellent' && (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-md" style={{
                          backgroundColor: crisisMode ? 'var(--color-warm-olive)' : 'var(--color-sage)'
                        }}>
                          <AlertTriangle className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Badges */}
                  <div className="px-4 pb-4">
                    <div className="flex space-x-2">
                      {canSow && (
                        <div className="flex items-center space-x-1 px-3 py-2 rounded-full text-xs font-semibold shadow-sm" style={{
                          backgroundColor: 'rgba(135, 169, 107, 0.15)',
                          color: 'var(--color-sage)',
                          border: '1px solid rgba(135, 169, 107, 0.3)'
                        }}>
                          <Sprout className="w-3 h-3" />
                          <span>{t('cultivation.actions.sow')}</span>
                        </div>
                      )}
                      
                      {canHarvest && (
                        <div className="flex items-center space-x-1 px-3 py-2 rounded-full text-xs font-semibold shadow-sm" style={{
                          backgroundColor: 'rgba(160, 142, 90, 0.15)',
                          color: 'var(--color-khaki)',
                          border: '1px solid rgba(160, 142, 90, 0.3)'
                        }}>
                          <CheckCircle className="w-3 h-3" />
                          <span>{t('cultivation.actions.harvest')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {selectedPlant === plantKey && (
                    <div className="border-t px-4 py-4 space-y-4" style={{ 
                      borderColor: 'var(--color-secondary)',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)'
                    }}>
                      {/* Quick Stats */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{
                            backgroundColor: plant.nutritionValue === 'high' ? 'var(--color-sage)' :
                                           plant.nutritionValue === 'medium' ? 'var(--color-khaki)' :
                                           'var(--color-cool-olive)'
                          }}>
                            <Heart className="w-3 h-3 text-white" />
                          </div>
                          <div>
                            <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                              Näringsvärde
                            </div>
                            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                              {plant.nutritionValue === 'high' ? 'Högt' : 
                               plant.nutritionValue === 'medium' ? 'Medel' : 'Lågt'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{
                            backgroundColor: plant.crisisValue === 'excellent' ? 'var(--color-sage)' :
                                           plant.crisisValue === 'good' ? 'var(--color-khaki)' :
                                           'var(--color-cool-olive)'
                          }}>
                            <Shield className="w-3 h-3 text-white" />
                          </div>
                          <div>
                            <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                              Krisvärde
                            </div>
                            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                              {plant.crisisValue === 'excellent' ? 'Utmärkt' : 
                               plant.crisisValue === 'good' ? 'Bra' : 'Lågt'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Climate Zones */}
                      <div>
                        <div className="text-xs font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                          Lämpliga klimatzoner:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {plant.climateZones.map(zone => (
                            <span 
                              key={zone} 
                              className="text-xs px-2 py-1 rounded-full"
                              style={{
                                backgroundColor: zone === climateZone ? getSeasonalColor() : 'var(--bg-olive-light)',
                                color: zone === climateZone ? 'white' : 'var(--text-secondary)'
                              }}
                            >
                              {t(`cultivation.climate_zones.${zone}`)}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      {crisisMode && (
                        <div className="p-3 rounded-lg" style={{
                          backgroundColor: 'rgba(184, 134, 11, 0.1)',
                          border: '1px solid rgba(184, 134, 11, 0.2)'
                        }}>
                          <div className="flex items-center space-x-2 mb-1">
                            <AlertTriangle className="w-4 h-4" style={{ color: 'var(--color-warm-olive)' }} />
                            <span className="text-xs font-semibold" style={{ color: 'var(--color-warm-olive)' }}>
                              Krisodling
                            </span>
                          </div>
                          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            {t('cultivation.tips.crisis_focus')}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Hover Indicator */}
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{
                      backgroundColor: getSeasonalColor()
                    }}>
                      <HelpCircle className="w-3 h-3 text-white" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {getCurrentMonthPlants().length === 0 && (
            <div className="text-center py-8">
              <TreePine className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--color-secondary)' }} />
              <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                {getCurrentSeason() === 'winter' ? 'Vintervila' : 'Inga aktiviteter denna månad'}
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {getCurrentSeason() === 'winter' 
                  ? t('cultivation.tips.winter_planning')
                  : 'Planera för nästa säsong eller fokusera på inomhusodling'
                }
              </p>
            </div>
          )}
        </div>
      )}

      {/* Planning View */}
      {activeTab === 'planning' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Garden Size Selection */}
            <div className="space-y-4">
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {t('cultivation.garden_sizes.small').split(' ')[0]} {/* "Liten" */}
              </h3>
              
              {Object.keys(swedishPlants).slice(0, 3).map(plantKey => {
                const plant = swedishPlants[plantKey as keyof typeof swedishPlants];
                return (
                  <div key={plantKey} className="flex items-center space-x-3 p-3 rounded-lg" style={{
                    backgroundColor: 'var(--bg-olive-light)'
                  }}>
                    <span className="text-xl">{plant.icon}</span>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {t(plant.name)}
                      </h4>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {plant.growingTime} veckor • {t(`cultivation.difficulty.${plant.difficulty}`)}
                      </p>
                    </div>
                    <div className="text-xs px-2 py-1 rounded" style={{
                      backgroundColor: plant.crisisValue === 'excellent' ? 'var(--color-sage)' : 'var(--color-secondary)',
                      color: 'white'
                    }}>
                      {plant.crisisValue === 'excellent' ? 'Kris' : 'Normal'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Climate Zone Info */}
            <div className="space-y-4">
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {t(`cultivation.climate_zones.${climateZone}`)}
              </h3>
              
              <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-olive-light)' }}>
                <div className="flex items-center space-x-2 mb-3">
                  <MapPin className="w-4 h-4" style={{ color: 'var(--color-sage)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Växtsäsong
                  </span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>Sista frost:</span>
                    <span style={{ color: 'var(--text-primary)' }}>
                      {climateZone === 'norrland' ? 'Mitten av juni' : 
                       climateZone === 'svealand' ? 'Slutet av maj' : 'Början av maj'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>Första frost:</span>
                    <span style={{ color: 'var(--text-primary)' }}>
                      {climateZone === 'norrland' ? 'Slutet av augusti' : 
                       climateZone === 'svealand' ? 'Mitten av september' : 'Början av oktober'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tips View */}
      {activeTab === 'tips' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Seasonal Tip */}
            <div className="p-4 rounded-lg border" style={{ 
              backgroundColor: 'var(--bg-card)',
              borderColor: getSeasonalColor()
            }}>
              <div className="flex items-center space-x-2 mb-3">
                <Sun className="w-5 h-5" style={{ color: getSeasonalColor() }} />
                <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {t(`cultivation.seasons.${getCurrentSeason()}`)}tips
                </h3>
              </div>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {t(`cultivation.tips.${getCurrentSeason()}_${getCurrentSeason() === 'spring' ? 'preparation' : 
                    getCurrentSeason() === 'summer' ? 'watering' : 
                    getCurrentSeason() === 'autumn' ? 'harvest' : 'planning'}`)}
              </p>
            </div>

            {/* Crisis Tip */}
            {crisisMode && (
              <div className="p-4 rounded-lg border" style={{ 
                backgroundColor: 'rgba(184, 134, 11, 0.1)',
                borderColor: 'var(--color-warm-olive)'
              }}>
                <div className="flex items-center space-x-2 mb-3">
                  <AlertTriangle className="w-5 h-5" style={{ color: 'var(--color-warm-olive)' }} />
                  <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {t('cultivation.crisis_cultivation')}
                  </h3>
                </div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {t('cultivation.tips.crisis_focus')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
