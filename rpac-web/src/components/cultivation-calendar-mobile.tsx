'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar,
  Sprout,
  Scissors,
  Wrench,
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
  TrendingUp,
  X
} from 'lucide-react';

// Swedish months with seasonal colors and gradients
const SWEDISH_MONTHS = [
  { name: 'Januari', short: 'Jan', season: 'winter', color: '#4A90E2', gradient: 'from-blue-400 to-blue-600', emoji: '❄️' },
  { name: 'Februari', short: 'Feb', season: 'winter', color: '#5B9BD5', gradient: 'from-blue-300 to-blue-500', emoji: '🌨️' },
  { name: 'Mars', short: 'Mar', season: 'spring', color: '#70AD47', gradient: 'from-green-400 to-green-600', emoji: '🌱' },
  { name: 'April', short: 'Apr', season: 'spring', color: '#7FB848', gradient: 'from-green-300 to-green-500', emoji: '🌷' },
  { name: 'Maj', short: 'Maj', season: 'spring', color: '#92C353', gradient: 'from-green-200 to-green-400', emoji: '🌸' },
  { name: 'Juni', short: 'Jun', season: 'summer', color: '#FFC000', gradient: 'from-yellow-300 to-yellow-500', emoji: '☀️' },
  { name: 'Juli', short: 'Jul', season: 'summer', color: '#FFD966', gradient: 'from-yellow-200 to-yellow-400', emoji: '🌻' },
  { name: 'Augusti', short: 'Aug', season: 'summer', color: '#FFE699', gradient: 'from-yellow-100 to-yellow-300', emoji: '🌾' },
  { name: 'September', short: 'Sep', season: 'autumn', color: '#ED7D31', gradient: 'from-orange-400 to-orange-600', emoji: '🍂' },
  { name: 'Oktober', short: 'Okt', season: 'autumn', color: '#E67E22', gradient: 'from-orange-500 to-orange-700', emoji: '🎃' },
  { name: 'November', short: 'Nov', season: 'autumn', color: '#D35400', gradient: 'from-orange-600 to-red-700', emoji: '🍁' },
  { name: 'December', short: 'Dec', season: 'winter', color: '#7B8AA2', gradient: 'from-gray-400 to-blue-600', emoji: '⛄' }
];

// Activity types with emojis
const ACTIVITY_TYPES = {
  sowing: { label: 'Sådd', color: '#92C353', emoji: '🌱', icon: Sprout },
  planting: { label: 'Plantering', color: '#70AD47', emoji: '🌿', icon: Sprout },
  harvesting: { label: 'Skörd', color: '#FFC000', emoji: '🌾', icon: Scissors },
  maintenance: { label: 'Underhåll', color: '#5B9BD5', emoji: '🔧', icon: Wrench }
};

interface CalendarItem {
  id: string;
  user_id: string;
  crop_name: string;
  crop_type: string;
  month: string;
  activity: string;
  climate_zone: string;
  garden_size: string;
  is_completed: boolean;
  completed_at?: string;
  notes?: string;
  created_at: string;
}

interface CultivationCalendarMobileProps {
  climateZone?: string;
  gardenSize?: string;
}

export function CultivationCalendarMobile({ 
  climateZone = 'Svealand', 
  gardenSize = '50'
}: CultivationCalendarMobileProps) {
  const [calendarItems, setCalendarItems] = useState<CalendarItem[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [loading, setLoading] = useState(true);

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

      setCalendarItems(prev => prev.map(i => 
        i.id === item.id ? { ...i, is_completed: !i.is_completed } : i
      ));
    } catch (error) {
      console.error('Error toggling complete:', error);
    }
  };

  const deleteItem = async (item: CalendarItem) => {
    try {
      const { supabase } = await import('@/lib/supabase');
      const { error } = await supabase
        .from('cultivation_calendar')
        .delete()
        .eq('id', item.id);

      if (error) return;
      setCalendarItems(prev => prev.filter(i => i.id !== item.id));
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const getItemsForMonth = (monthName: string) => {
    return calendarItems.filter(item => item.month === monthName);
  };

  const getMonthStats = (monthName: string) => {
    const items = getItemsForMonth(monthName);
    const completed = items.filter(i => i.is_completed).length;
    const total = items.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  };

  const getOverallProgress = () => {
    const completed = calendarItems.filter(i => i.is_completed).length;
    const total = calendarItems.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  };

  const currentMonthData = SWEDISH_MONTHS[selectedMonth];
  const currentMonthItems = getItemsForMonth(currentMonthData.name);
  const monthStats = getMonthStats(currentMonthData.name);
  const overallProgress = getOverallProgress();

  const goToPrevMonth = () => {
    setSelectedMonth((prev) => (prev === 0 ? 11 : prev - 1));
  };

  const goToNextMonth = () => {
    setSelectedMonth((prev) => (prev === 11 ? 0 : prev + 1));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#5C6B47]/10 to-[#707C5F]/10">
        <div className="text-center">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-[#3D4A2B] animate-pulse" />
          <p className="text-gray-600 font-medium">Laddar odlingskalender...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#5C6B47]/5 to-[#707C5F]/5">
      {/* Hero Header with Progress */}
      <div className={`bg-gradient-to-br ${currentMonthData.gradient} text-white px-6 py-8 rounded-b-3xl shadow-2xl mb-6`}>
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={goToPrevMonth}
            className="p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-all active:scale-95 touch-manipulation"
          >
            <ChevronLeft size={24} strokeWidth={2.5} />
          </button>
          
          <div className="text-center flex-1">
            <div className="text-6xl mb-2">{currentMonthData.emoji}</div>
            <h1 className="text-3xl font-bold mb-1">{currentMonthData.name}</h1>
            <p className="text-white/80 text-sm">
              {climateZone} • {gardenSize}m²
            </p>
          </div>
          
          <button
            onClick={goToNextMonth}
            className="p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-all active:scale-95 touch-manipulation"
          >
            <ChevronRight size={24} strokeWidth={2.5} />
          </button>
        </div>

        {/* Progress Ring */}
        <div className="flex items-center justify-center gap-8 mb-4">
          <div className="relative">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="white"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${(overallProgress.percentage / 100) * 352} 352`}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl font-bold">{overallProgress.percentage}%</div>
                <div className="text-xs text-white/80">Genomfört</div>
              </div>
            </div>
          </div>

          <div className="text-left space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={20} className="text-white" />
              <span className="font-medium">{overallProgress.completed} klara</span>
            </div>
            <div className="flex items-center gap-2">
              <Circle size={20} className="text-white/60" />
              <span className="font-medium">{overallProgress.total - overallProgress.completed} kvar</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp size={20} className="text-white" />
              <span className="font-medium">{overallProgress.total} totalt</span>
            </div>
          </div>
        </div>

        {/* Month Stats */}
        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Denna månad</span>
            <span className="font-bold">{monthStats.completed} / {monthStats.total}</span>
          </div>
          <div className="mt-2 bg-white/20 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-white h-full rounded-full transition-all duration-500"
              style={{ width: `${monthStats.percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="px-4 space-y-3">
        {currentMonthItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-[#5C6B47]/10 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <Calendar className="text-[#5C6B47]" size={48} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Inga aktiviteter</h3>
            <p className="text-gray-600">
              Inga planerade odlingsaktiviteter för {currentMonthData.name.toLowerCase()}
            </p>
          </div>
        ) : (
          currentMonthItems.map((item) => {
            const activityType = ACTIVITY_TYPES[item.activity as keyof typeof ACTIVITY_TYPES] || ACTIVITY_TYPES.maintenance;
            const Icon = activityType.icon;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border-2 shadow-lg transition-all ${
                  item.is_completed 
                    ? 'border-green-200 bg-green-50/50' 
                    : 'border-gray-100'
                }`}
              >
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleComplete(item)}
                      className={`flex-shrink-0 w-10 h-10 rounded-full border-3 flex items-center justify-center transition-all touch-manipulation active:scale-95 ${
                        item.is_completed
                          ? 'bg-green-500 border-green-500'
                          : 'border-gray-300 hover:border-[#3D4A2B]'
                      }`}
                    >
                      {item.is_completed && <CheckCircle2 size={24} className="text-white" strokeWidth={2.5} />}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div 
                          className="px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1"
                          style={{ 
                            backgroundColor: `${activityType.color}20`,
                            color: activityType.color
                          }}
                        >
                          <span>{activityType.emoji}</span>
                          <span>{activityType.label}</span>
                        </div>
                      </div>

                      <h4 className={`font-bold text-lg mb-1 ${
                        item.is_completed ? 'text-gray-500 line-through' : 'text-gray-900'
                      }`}>
                        {item.crop_name}
                      </h4>

                      {item.notes && (
                        <p className={`text-sm ${
                          item.is_completed ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {item.notes}
                        </p>
                      )}

                      {item.is_completed && item.completed_at && (
                        <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                          <CheckCircle2 size={14} />
                          Klar {new Date(item.completed_at).toLocaleDateString('sv-SE', { 
                            day: 'numeric', 
                            month: 'short' 
                          })}
                        </p>
                      )}
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => deleteItem(item)}
                      className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all touch-manipulation active:scale-95"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>


      {/* Month Picker - Swipeable */}
      <div className="fixed bottom-16 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 px-4 py-3 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2">
          {SWEDISH_MONTHS.map((month, index) => (
            <button
              key={month.name}
              onClick={() => setSelectedMonth(index)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl font-medium transition-all touch-manipulation active:scale-95 ${
                index === selectedMonth
                  ? 'bg-[#3D4A2B] text-white scale-105 shadow-lg'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <div className="text-lg mb-1">{month.emoji}</div>
              <div className="text-xs">{month.short}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

