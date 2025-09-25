'use client';

import { useState, useEffect } from 'react';
import { t } from '@/lib/locales';
import { 
  Bell,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Droplets,
  Sprout,
  Scissors,
  Sun,
  BellRing,
  Settings,
  Plus,
  Trash2,
  Edit
} from 'lucide-react';

interface CultivationReminder {
  id: string;
  type: 'sowing' | 'planting' | 'watering' | 'fertilizing' | 'harvesting' | 'general';
  plantType: string;
  plantName: string;
  title: string;
  description: string;
  dueDate: Date;
  isCompleted: boolean;
  isRecurring: boolean;
  recurringDays?: number;
  priority: 'high' | 'medium' | 'low';
  icon: string;
  createdAt: Date;
}

interface NotificationSettings {
  enabled: boolean;
  soundEnabled: boolean;
  advanceDays: number; // How many days in advance to show reminders
  quietHours: {
    start: string;
    end: string;
  };
}

interface CultivationRemindersProps {
  climateZone?: 'gotaland' | 'svealand' | 'norrland';
  crisisMode?: boolean;
}

export function CultivationReminders({ 
  climateZone = 'svealand',
  crisisMode = false 
}: CultivationRemindersProps) {
  const [reminders, setReminders] = useState<CultivationReminder[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    soundEnabled: false,
    advanceDays: 3,
    quietHours: {
      start: '22:00',
      end: '07:00'
    }
  });
  const [showSettings, setShowSettings] = useState(false);
  const [newReminder, setNewReminder] = useState<Partial<CultivationReminder> | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'overdue'>('pending');

  // Generate Swedish seasonal reminders
  const generateSeasonalReminders = () => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const seasonalReminders: Partial<CultivationReminder>[] = [];

    // Climate zone adjustments
    const climateAdjustment = {
      gotaland: 0, // Reference zone
      svealand: 7, // 1 week later
      norrland: 21 // 3 weeks later
    };

    const adjustment = climateAdjustment[climateZone];

    // Spring reminders (March-May)
    if (currentMonth >= 3 && currentMonth <= 5) {
      seasonalReminders.push({
        type: 'sowing',
        plantType: 'potatoes',
        plantName: t('cultivation.plants.potatoes'),
        title: 'Dags att förgrodd potatis',
        description: 'Lägg potatis i ljus, sval plats 4-6 veckor innan plantering',
        dueDate: new Date(currentYear, 2, 15 + adjustment), // March 15 + adjustment
        priority: 'high',
        icon: '🥔',
        isRecurring: true,
        recurringDays: 365
      });

      seasonalReminders.push({
        type: 'sowing',
        plantType: 'lettuce',
        plantName: t('cultivation.plants.lettuce'),
        title: 'Första salladsåningen',
        description: 'Så sallad i växthus eller på fönsterbrädan',
        dueDate: new Date(currentYear, 2, 1 + adjustment),
        priority: 'medium',
        icon: '🥬',
        isRecurring: true,
        recurringDays: 21 // Every 3 weeks
      });

      seasonalReminders.push({
        type: 'general',
        plantType: 'garden',
        plantName: 'Trädgård',
        title: 'Förbered odlingsbäddar',
        description: 'Tillsätt kompost och förbered jorden för säsongen',
        dueDate: new Date(currentYear, 3, 1 + adjustment), // April 1
        priority: 'high',
        icon: '🌱'
      });
    }

    // Summer reminders (June-August)
    if (currentMonth >= 6 && currentMonth <= 8) {
      seasonalReminders.push({
        type: 'watering',
        plantType: 'all',
        plantName: 'Alla växter',
        title: 'Daglig vattenkontroll',
        description: 'Kontrollera jordfuktighet och vattna vid behov',
        dueDate: now,
        priority: 'high',
        icon: '💧',
        isRecurring: true,
        recurringDays: 1
      });

      seasonalReminders.push({
        type: 'harvesting',
        plantType: 'lettuce',
        plantName: t('cultivation.plants.lettuce'),
        title: 'Skörda sallad',
        description: 'Skörda ytterbladen för kontinuerlig tillväxt',
        dueDate: new Date(currentYear, 5, 15), // June 15
        priority: 'medium',
        icon: '🥬',
        isRecurring: true,
        recurringDays: 14
      });
    }

    // Autumn reminders (September-November)
    if (currentMonth >= 9 && currentMonth <= 11) {
      seasonalReminders.push({
        type: 'harvesting',
        plantType: 'potatoes',
        plantName: t('cultivation.plants.potatoes'),
        title: 'Potatisskörd',
        description: 'Skörda potatis innan första frosten',
        dueDate: new Date(currentYear, 8, 15 - adjustment), // Sept 15 - adjustment
        priority: 'high',
        icon: '🥔'
      });

      seasonalReminders.push({
        type: 'harvesting',
        plantType: 'carrots',
        plantName: t('cultivation.plants.carrots'),
        title: 'Morotsskörd',
        description: 'Skörda morötter för vinterlagring',
        dueDate: new Date(currentYear, 9, 1 - adjustment), // October 1
        priority: 'high',
        icon: '🥕'
      });

      seasonalReminders.push({
        type: 'general',
        plantType: 'garden',
        plantName: 'Trädgård',
        title: 'Förbered för vinter',
        description: 'Täck odlingsbäddar med löv eller halm',
        dueDate: new Date(currentYear, 10, 1), // November 1
        priority: 'medium',
        icon: '🍂'
      });
    }

    // Crisis mode specific reminders
    if (crisisMode) {
      seasonalReminders.push({
        type: 'sowing',
        plantType: 'radishes',
        plantName: t('cultivation.plants.radishes'),
        title: 'Snabbodling: Rädisor',
        description: 'Så rädisor för skörd inom 4 veckor',
        dueDate: now,
        priority: 'high',
        icon: '🔴',
        isRecurring: true,
        recurringDays: 28
      });

      seasonalReminders.push({
        type: 'sowing',
        plantType: 'spinach',
        plantName: t('cultivation.plants.spinach'),
        title: 'Snabbodling: Spenat',
        description: 'Så spenat för näringsrik skörd inom 6 veckor',
        dueDate: now,
        priority: 'high',
        icon: '🥬',
        isRecurring: true,
        recurringDays: 42
      });
    }

    return seasonalReminders.map(reminder => ({
      id: `seasonal-${Date.now()}-${Math.random()}`,
      isCompleted: false,
      createdAt: now,
      ...reminder
    } as CultivationReminder));
  };

  // Load reminders on component mount
  useEffect(() => {
    const savedReminders = localStorage.getItem('cultivationReminders');
    const savedSettings = localStorage.getItem('reminderSettings');
    
    if (savedReminders) {
      const parsed = JSON.parse(savedReminders).map((r: any) => ({
        ...r,
        dueDate: new Date(r.dueDate),
        createdAt: new Date(r.createdAt)
      }));
      setReminders(parsed);
    } else {
      // Generate initial seasonal reminders
      const seasonal = generateSeasonalReminders();
      setReminders(seasonal);
    }

    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []); // Remove dependencies to prevent unnecessary re-renders

  // Save reminders to localStorage
  useEffect(() => {
    localStorage.setItem('cultivationReminders', JSON.stringify(reminders));
  }, [reminders]);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('reminderSettings', JSON.stringify(settings));
  }, [settings]);

  // Filter reminders
  const getFilteredReminders = () => {
    const now = new Date();
    return reminders.filter(reminder => {
      switch (filter) {
        case 'pending':
          return !reminder.isCompleted;
        case 'completed':
          return reminder.isCompleted;
        case 'overdue':
          return !reminder.isCompleted && reminder.dueDate < now;
        default:
          return true;
      }
    }).sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1;
      }
      return a.dueDate.getTime() - b.dueDate.getTime();
    });
  };

  // Toggle reminder completion
  const toggleReminder = (id: string) => {
    setReminders(prev => prev.map(reminder => {
      if (reminder.id === id) {
        const updated = { ...reminder, isCompleted: !reminder.isCompleted };
        
        // If completing a recurring reminder, create next occurrence
        if (!reminder.isCompleted && reminder.isRecurring && reminder.recurringDays) {
          const nextDue = new Date(reminder.dueDate);
          nextDue.setDate(nextDue.getDate() + reminder.recurringDays);
          
          const nextReminder: CultivationReminder = {
            ...reminder,
            id: `${reminder.id}-${Date.now()}`,
            dueDate: nextDue,
            isCompleted: false,
            createdAt: new Date()
          };
          
          // Add the next occurrence
          setTimeout(() => {
            setReminders(current => [...current, nextReminder]);
          }, 100);
        }
        
        return updated;
      }
      return reminder;
    }));
  };

  // Delete reminder
  const deleteReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  // Add new reminder
  const addReminder = (reminder: Partial<CultivationReminder>) => {
    const newRem: CultivationReminder = {
      id: `custom-${Date.now()}`,
      type: 'general',
      plantType: 'custom',
      plantName: 'Anpassad',
      title: 'Ny påminnelse',
      description: '',
      dueDate: new Date(),
      isCompleted: false,
      isRecurring: false,
      priority: 'medium',
      icon: '📝',
      createdAt: new Date(),
      ...reminder
    };
    
    setReminders(prev => [...prev, newRem]);
    setNewReminder(null);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sowing': return Sprout;
      case 'planting': return Sprout;
      case 'watering': return Droplets;
      case 'fertilizing': return Sun;
      case 'harvesting': return Scissors;
      default: return Bell;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'var(--color-warm-olive)';
      case 'medium': return 'var(--color-sage)';
      case 'low': return 'var(--color-cool-olive)';
      default: return 'var(--color-sage)';
    }
  };

  const isOverdue = (dueDate: Date) => {
    return dueDate < new Date() && dueDate.toDateString() !== new Date().toDateString();
  };

  const filteredReminders = getFilteredReminders();
  const pendingCount = reminders.filter(r => !r.isCompleted).length;
  const overdueCount = reminders.filter(r => !r.isCompleted && isOverdue(r.dueDate)).length;

  return (
    <div className="rounded-lg p-6 border shadow-lg" style={{ 
      backgroundColor: 'var(--bg-card)',
      borderColor: crisisMode ? 'var(--color-warm-olive)' : 'var(--color-sage)'
    }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center shadow-sm" style={{ 
            background: `linear-gradient(135deg, ${crisisMode ? 'var(--color-warm-olive)' : 'var(--color-sage)'} 0%, var(--color-secondary) 100%)` 
          }}>
            <BellRing className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Odlingspåminnelser
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {pendingCount} väntande • {overdueCount} försenade
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg border hover:shadow-sm transition-all duration-200"
            style={{ 
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--color-secondary)',
              color: 'var(--text-secondary)'
            }}
          >
            <Settings className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setNewReminder({})}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg border hover:shadow-sm transition-all duration-200"
            style={{ 
              backgroundColor: 'var(--color-sage)',
              borderColor: 'var(--color-sage)',
              color: 'white'
            }}
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm">Lägg till</span>
          </button>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex space-x-2 mb-6">
        {[
          { id: 'pending', label: 'Väntande', count: pendingCount },
          { id: 'overdue', label: 'Försenade', count: overdueCount },
          { id: 'completed', label: 'Klara', count: reminders.filter(r => r.isCompleted).length },
          { id: 'all', label: 'Alla', count: reminders.length }
        ].map(filterOption => (
          <button
            key={filterOption.id}
            onClick={() => setFilter(filterOption.id as any)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              filter === filterOption.id ? 'shadow-sm' : 'hover:shadow-sm'
            }`}
            style={{
              backgroundColor: filter === filterOption.id ? 'var(--color-sage)' : 'var(--bg-olive-light)',
              color: filter === filterOption.id ? 'white' : 'var(--text-primary)'
            }}
          >
            {filterOption.label} ({filterOption.count})
          </button>
        ))}
      </div>

      {/* Reminders List */}
      <div className="space-y-3">
        {filteredReminders.map(reminder => {
          const TypeIcon = getTypeIcon(reminder.type);
          const priorityColor = getPriorityColor(reminder.priority);
          const isReminderOverdue = !reminder.isCompleted && isOverdue(reminder.dueDate);
          
          return (
            <div
              key={reminder.id}
              className={`p-4 rounded-lg border transition-all duration-200 ${
                reminder.isCompleted ? 'opacity-60' : ''
              }`}
              style={{ 
                backgroundColor: isReminderOverdue ? 'rgba(184, 134, 11, 0.1)' : 'var(--bg-card)',
                borderColor: isReminderOverdue ? 'var(--color-warm-olive)' : 'var(--color-secondary)'
              }}
            >
              <div className="flex items-start space-x-3">
                <button
                  onClick={() => toggleReminder(reminder.id)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                    reminder.isCompleted ? 'shadow-sm' : 'hover:shadow-sm'
                  }`}
                  style={{
                    backgroundColor: reminder.isCompleted ? priorityColor : 'transparent',
                    borderColor: priorityColor
                  }}
                >
                  {reminder.isCompleted && <CheckCircle className="w-4 h-4 text-white" />}
                </button>

                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <TypeIcon className="w-4 h-4" style={{ color: priorityColor }} />
                    <h3 className={`font-semibold text-sm ${reminder.isCompleted ? 'line-through' : ''}`} 
                        style={{ color: 'var(--text-primary)' }}>
                      {reminder.title}
                    </h3>
                    <span className="text-lg">{reminder.icon}</span>
                    
                    {reminder.isRecurring && (
                      <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{
                        backgroundColor: 'var(--color-cool-olive)'
                      }}>
                        <Clock className="w-2 h-2 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                    {reminder.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-xs">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" style={{ color: 'var(--text-tertiary)' }} />
                        <span style={{ 
                          color: isReminderOverdue ? 'var(--color-warm-olive)' : 'var(--text-tertiary)' 
                        }}>
                          {reminder.dueDate.toLocaleDateString('sv-SE')}
                          {isReminderOverdue && ' (försenad)'}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <span style={{ color: 'var(--text-tertiary)' }}>
                          {reminder.plantName}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => deleteReminder(reminder.id)}
                      className="p-1 rounded hover:bg-red-50 transition-colors duration-200"
                    >
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredReminders.length === 0 && (
        <div className="text-center py-8">
          <Bell className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--color-secondary)' }} />
          <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Inga påminnelser
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {filter === 'pending' ? 'Alla påminnelser är klara!' : 
             filter === 'completed' ? 'Inga påminnelser är markerade som klara.' :
             'Lägg till din första påminnelse för att komma igång.'}
          </p>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full" style={{ backgroundColor: 'var(--bg-card)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                Påminnelseinställningar
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm" style={{ color: 'var(--text-primary)' }}>
                  Aktivera påminnelser
                </label>
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => setSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="rounded"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm" style={{ color: 'var(--text-primary)' }}>
                  Ljudpåminnelser
                </label>
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) => setSettings(prev => ({ ...prev, soundEnabled: e.target.checked }))}
                  className="rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--text-primary)' }}>
                  Visa påminnelser (dagar i förväg)
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={settings.advanceDays}
                  onChange={(e) => setSettings(prev => ({ ...prev, advanceDays: parseInt(e.target.value) }))}
                  className="w-full p-2 border rounded"
                  style={{ borderColor: 'var(--color-secondary)' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Reminder Modal */}
      {newReminder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full" style={{ backgroundColor: 'var(--bg-card)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                Ny påminnelse
              </h3>
              <button
                onClick={() => setNewReminder(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--text-primary)' }}>
                  Titel
                </label>
                <input
                  type="text"
                  value={newReminder.title || ''}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-2 border rounded"
                  style={{ borderColor: 'var(--color-secondary)' }}
                  placeholder="Vad ska du komma ihåg?"
                />
              </div>
              
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--text-primary)' }}>
                  Beskrivning
                </label>
                <textarea
                  value={newReminder.description || ''}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-2 border rounded h-20"
                  style={{ borderColor: 'var(--color-secondary)' }}
                  placeholder="Detaljer om uppgiften..."
                />
              </div>
              
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--text-primary)' }}>
                  Datum
                </label>
                <input
                  type="date"
                  value={newReminder.dueDate ? newReminder.dueDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => setNewReminder(prev => ({ 
                    ...prev, 
                    dueDate: new Date(e.target.value) 
                  }))}
                  className="w-full p-2 border rounded"
                  style={{ borderColor: 'var(--color-secondary)' }}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setNewReminder(null)}
                  className="px-4 py-2 border rounded text-sm"
                  style={{ borderColor: 'var(--color-secondary)', color: 'var(--text-secondary)' }}
                >
                  Avbryt
                </button>
                <button
                  onClick={() => addReminder(newReminder)}
                  className="px-4 py-2 rounded text-sm text-white"
                  style={{ backgroundColor: 'var(--color-sage)' }}
                  disabled={!newReminder.title || !newReminder.dueDate}
                >
                  Lägg till
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
