'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar,
  Sprout,
  TreePine,
  Scissors,
  Wrench,
  CheckCircle2,
  Circle,
  TrendingUp,
  MapPin,
  Thermometer,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2
} from 'lucide-react';

// Swedish months with seasonal colors
const SWEDISH_MONTHS = [
  { name: 'Januari', short: 'Jan', season: 'winter', color: '#4A90E2' },
  { name: 'Februari', short: 'Feb', season: 'winter', color: '#5B9BD5' },
  { name: 'Mars', short: 'Mar', season: 'spring', color: '#70AD47' },
  { name: 'April', short: 'Apr', season: 'spring', color: '#7FB848' },
  { name: 'Maj', short: 'Maj', season: 'spring', color: '#92C353' },
  { name: 'Juni', short: 'Jun', season: 'summer', color: '#FFC000' },
  { name: 'Juli', short: 'Jul', season: 'summer', color: '#FFD966' },
  { name: 'Augusti', short: 'Aug', season: 'summer', color: '#FFE699' },
  { name: 'September', short: 'Sep', season: 'autumn', color: '#ED7D31' },
  { name: 'Oktober', short: 'Okt', season: 'autumn', color: '#E67E22' },
  { name: 'November', short: 'Nov', season: 'autumn', color: '#D35400' },
  { name: 'December', short: 'Dec', season: 'winter', color: '#7B8AA2' }
];

// Activity types with icons and colors
const ACTIVITY_TYPES = {
  sowing: { 
    icon: Sprout, 
    label: 'Sådd', 
    color: '#92C353',
    emoji: '🌱'
  },
  planting: { 
    icon: TreePine, 
    label: 'Plantering', 
    color: '#70AD47',
    emoji: '🌿'
  },
  harvesting: { 
    icon: Scissors, 
    label: 'Skörd', 
    color: '#FFC000',
    emoji: '🌾'
  },
  maintenance: { 
    icon: Wrench, 
    label: 'Underhåll', 
    color: '#5B9BD5',
    emoji: '🔧'
  }
};

interface CalendarItem {
  id: string;
  user_id: string;
  crop_name: string;
  crop_type: string;
  month: string;
  activity: 'sowing' | 'planting' | 'harvesting' | 'maintenance';
  climate_zone: string;
  garden_size: string;
  is_completed: boolean;
  notes: string;
  created_at: string;
}

interface CultivationCalendarV2Props {
  climateZone?: string;
  gardenSize?: string;
}

export function CultivationCalendarV2({ 
  climateZone = 'Svealand', 
  gardenSize = '50'
}: CultivationCalendarV2Props) {
  const [calendarItems, setCalendarItems] = useState<CalendarItem[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');

  // Load calendar items from database
  useEffect(() => {
    loadCalendarItems();
  }, []);

  const loadCalendarItems = async () => {
    try {
      setLoading(true);
      const { supabase } = await import('@/lib/supabase');
      const { data, error } = await supabase
        .from('cultivation_calendar')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading calendar:', error);
        setCalendarItems([]);
        return;
      }

      setCalendarItems(data || []);
    } catch (error) {
      console.error('Error loading calendar:', error);
      setCalendarItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Toggle completion status
  const toggleComplete = async (item: CalendarItem) => {
    try {
      const { supabase } = await import('@/lib/supabase');
      const { error } = await supabase
        .from('cultivation_calendar')
        .update({ 
          is_completed: !item.is_completed,
          completed_at: !item.is_completed ? new Date().toISOString() : null
        })
        .eq('id', item.id);

      if (error) {
        console.error('Error updating item:', error);
        return;
      }

      // Update local state
      setCalendarItems(prev => prev.map(i => 
        i.id === item.id ? { ...i, is_completed: !i.is_completed } : i
      ));
    } catch (error) {
      console.error('Error toggling complete:', error);
    }
  };

  // Delete item
  const deleteItem = async (item: CalendarItem) => {
    if (!confirm(`Ta bort "${item.notes}"?`)) return;

    try {
      const { supabase } = await import('@/lib/supabase');
      const { error } = await supabase
        .from('cultivation_calendar')
        .delete()
        .eq('id', item.id);

      if (error) {
        console.error('Error deleting item:', error);
        return;
      }

      setCalendarItems(prev => prev.filter(i => i.id !== item.id));
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  // Get items for specific month
  const getItemsForMonth = (monthName: string) => {
    return calendarItems.filter(item => item.month === monthName);
  };

  // Calculate monthly stats
  const getMonthStats = (monthName: string) => {
    const items = getItemsForMonth(monthName);
    const completed = items.filter(i => i.is_completed).length;
    const total = items.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { completed, total, percentage };
  };

  // Calculate overall progress
  const getOverallProgress = () => {
    const completed = calendarItems.filter(i => i.is_completed).length;
    const total = calendarItems.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { completed, total, percentage };
  };

  // Get items by activity type
  const getItemsByActivity = (activity: string) => {
    return calendarItems.filter(i => i.activity === activity);
  };

  const currentMonthData = SWEDISH_MONTHS[selectedMonth];
  const currentMonthItems = getItemsForMonth(currentMonthData.name);
  const monthStats = getMonthStats(currentMonthData.name);
  const overallProgress = getOverallProgress();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <Calendar className="w-12 h-12 mx-auto mb-4 animate-pulse" style={{ color: 'var(--color-sage)' }} />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Laddar odlingskalender...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Progress */}
      <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 border-2" style={{ 
        borderColor: currentMonthData.color,
        background: `linear-gradient(135deg, ${currentMonthData.color}15 0%, ${currentMonthData.color}25 100%)`
      }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ 
              backgroundColor: currentMonthData.color 
            }}>
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Odlingskalender
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {climateZone} • {gardenSize}m² trädgård
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-3xl font-bold" style={{ color: currentMonthData.color }}>
              {overallProgress.percentage}%
            </div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {overallProgress.completed} av {overallProgress.total} klara
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-white rounded-full h-3 overflow-hidden shadow-inner">
          <div 
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{ 
              width: `${overallProgress.percentage}%`,
              backgroundColor: currentMonthData.color
            }}
          />
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('month')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              viewMode === 'month' ? 'shadow-md' : 'hover:bg-gray-100'
            }`}
            style={{ 
              backgroundColor: viewMode === 'month' ? currentMonthData.color : 'white',
              color: viewMode === 'month' ? 'white' : 'var(--text-primary)'
            }}
          >
            Månadsvy
          </button>
          <button
            onClick={() => setViewMode('year')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              viewMode === 'year' ? 'shadow-md' : 'hover:bg-gray-100'
            }`}
            style={{ 
              backgroundColor: viewMode === 'year' ? currentMonthData.color : 'white',
              color: viewMode === 'year' ? 'white' : 'var(--text-primary)'
            }}
          >
            Årsöversikt
          </button>
        </div>
      </div>

      {/* MONTH VIEW */}
      {viewMode === 'month' && (
        <>
          {/* Month Navigation */}
          <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border" style={{ borderColor: 'var(--color-quaternary)' }}>
            <button
              onClick={() => setSelectedMonth(prev => (prev - 1 + 12) % 12)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: currentMonthData.color }}>
                {currentMonthData.name}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {monthStats.total} aktiviteter • {monthStats.completed} klara
              </div>
            </div>
            
            <button
              onClick={() => setSelectedMonth(prev => (prev + 1) % 12)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Activity Type Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(ACTIVITY_TYPES).map(([key, activity]) => {
              const items = currentMonthItems.filter(i => i.activity === key);
              const completed = items.filter(i => i.is_completed).length;
              const ActivityIcon = activity.icon;
              
              return (
                <div 
                  key={key}
                  className="bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow"
                  style={{ borderColor: 'var(--color-quaternary)' }}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ 
                      backgroundColor: `${activity.color}20`
                    }}>
                      <ActivityIcon className="w-4 h-4" style={{ color: activity.color }} />
                    </div>
                    <span className="text-2xl">{activity.emoji}</span>
                  </div>
                  <div className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                    {activity.label}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {completed}/{items.length} klara
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tasks List */}
          <div className="space-y-2">
            <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
              Aktiviteter för {currentMonthData.name}
            </h3>
            
            {currentMonthItems.length === 0 ? (
              <div className="bg-white rounded-lg p-8 text-center shadow-sm border" style={{ borderColor: 'var(--color-quaternary)' }}>
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Inga aktiviteter planerade för {currentMonthData.name}
                </p>
                <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
                  Skapa en odlingsplan för att lägga till aktiviteter
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {currentMonthItems.map((item) => {
                  const activity = ACTIVITY_TYPES[item.activity as keyof typeof ACTIVITY_TYPES];
                  const ActivityIcon = activity.icon;
                  
                  return (
                    <div
                      key={item.id}
                      className={`bg-white rounded-lg p-4 shadow-sm border transition-all hover:shadow-md ${
                        item.is_completed ? 'opacity-60' : ''
                      }`}
                      style={{ borderColor: 'var(--color-quaternary)' }}
                    >
                      <div className="flex items-start space-x-3">
                        {/* Completion Checkbox */}
                        <button
                          onClick={() => toggleComplete(item)}
                          className="mt-0.5 flex-shrink-0 focus:outline-none"
                        >
                          {item.is_completed ? (
                            <CheckCircle2 
                              className="w-6 h-6 transition-all"
                              style={{ color: activity.color }}
                            />
                          ) : (
                            <Circle 
                              className="w-6 h-6 text-gray-300 hover:text-gray-400 transition-colors"
                            />
                          )}
                        </button>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0" style={{ 
                              backgroundColor: `${activity.color}20`
                            }}>
                              <ActivityIcon className="w-3.5 h-3.5" style={{ color: activity.color }} />
                            </div>
                            <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ 
                              backgroundColor: `${activity.color}15`,
                              color: activity.color
                            }}>
                              {activity.label}
                            </span>
                            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                              {item.crop_name}
                            </span>
                          </div>
                          
                          <p className={`text-sm ${item.is_completed ? 'line-through' : ''}`} style={{ 
                            color: 'var(--text-secondary)' 
                          }}>
                            {item.notes}
                          </p>
                        </div>

                        {/* Delete Button */}
                        <button
                          onClick={() => deleteItem(item)}
                          className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* YEAR VIEW */}
      {viewMode === 'year' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SWEDISH_MONTHS.map((month, index) => {
            const items = getItemsForMonth(month.name);
            const stats = getMonthStats(month.name);
            const isCurrentMonth = index === new Date().getMonth();
            
            return (
              <button
                key={month.name}
                onClick={() => {
                  setSelectedMonth(index);
                  setViewMode('month');
                }}
                className="bg-white rounded-lg p-5 shadow-sm border hover:shadow-lg transition-all text-left relative overflow-hidden group"
                style={{ borderColor: 'var(--color-quaternary)' }}
              >
                {/* Background Gradient */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity"
                  style={{ backgroundColor: month.color }}
                />
                
                {/* Current Month Indicator */}
                {isCurrentMonth && (
                  <div 
                    className="absolute top-0 right-0 w-16 h-16 transform translate-x-6 -translate-y-6 rounded-full"
                    style={{ backgroundColor: `${month.color}20` }}
                  />
                )}
                
                <div className="relative">
                  {/* Month Name */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: month.color }} />
                      <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                        {month.name}
                      </h3>
                    </div>
                    {isCurrentMonth && (
                      <span className="text-xs font-medium px-2 py-1 rounded" style={{ 
                        backgroundColor: `${month.color}20`,
                        color: month.color
                      }}>
                        Denna månad
                      </span>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {items.length} aktiviteter
                      </span>
                      <span className="font-bold" style={{ color: month.color }}>
                        {stats.percentage}%
                      </span>
                    </div>
                    
                    {/* Mini Progress Bar */}
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-300"
                        style={{ 
                          width: `${stats.percentage}%`,
                          backgroundColor: month.color
                        }}
                      />
                    </div>

                    {/* Activity Type Breakdown */}
                    {items.length > 0 && (
                      <div className="flex items-center space-x-1 pt-2">
                        {Object.entries(ACTIVITY_TYPES).map(([key, activity]) => {
                          const count = items.filter(i => i.activity === key).length;
                          if (count === 0) return null;
                          
                          return (
                            <div
                              key={key}
                              className="flex items-center space-x-1 text-xs px-2 py-1 rounded"
                              style={{ 
                                backgroundColor: `${activity.color}10`,
                                color: activity.color
                              }}
                            >
                              <span>{activity.emoji}</span>
                              <span>{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex items-center justify-between bg-white rounded-lg p-4 shadow-sm border" style={{ borderColor: 'var(--color-quaternary)' }}>
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5" style={{ color: 'var(--color-sage)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Din odlingssäsong är {overallProgress.percentage}% klar
          </span>
        </div>
        <button
          onClick={loadCalendarItems}
          className="px-4 py-2 rounded-lg font-medium transition-all hover:shadow-md"
          style={{ 
            backgroundColor: 'var(--color-sage)',
            color: 'white'
          }}
        >
          Uppdatera
        </button>
      </div>
    </div>
  );
}

