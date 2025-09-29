'use client';

import { useState, useEffect } from 'react';
import { t } from '@/lib/locales';
import { supabase } from '@/lib/supabase';
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
  user_id: string;
  plant_id?: string;
  reminder_type: string;
  reminder_date: string;
  reminder_time?: string;
  message: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
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
  user: { id: string; email?: string; user_metadata?: { name?: string } };
  climateZone?: 'gotaland' | 'svealand' | 'norrland';
  crisisMode?: boolean;
}

export function CultivationReminders({ 
  user,
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
  const [editingReminder, setEditingReminder] = useState<CultivationReminder | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'overdue'>('pending');

  // Generate Swedish seasonal reminders - temporarily disabled
  const generateSeasonalReminders = () => {
    // TODO: Update this function to use the new CultivationReminder interface
    return [];
  };

  // Load reminders from Supabase on component mount
  useEffect(() => {
    const loadReminders = async () => {
      try {
        const { data, error } = await supabase
          .from('cultivation_reminders')
          .select('*')
          .eq('user_id', user.id)
          .order('reminder_date', { ascending: true });

        if (error) {
          console.error('Error loading reminders:', error);
          return;
        }

        if (data && data.length > 0) {
          setReminders(data);
        } else {
          // No reminders exist yet - user can add their own
          setReminders([]);
        }
      } catch (error) {
        console.error('Error loading reminders:', error);
      }
    };

    loadReminders();
  }, [user.id]);

  // Save settings to localStorage (keeping this for now as it's UI preferences)
  useEffect(() => {
    localStorage.setItem('reminderSettings', JSON.stringify(settings));
  }, [settings]);

  // Filter reminders
  const getFilteredReminders = () => {
    const now = new Date();
    return reminders.filter(reminder => {
      switch (filter) {
        case 'pending':
          return !reminder.is_completed;
        case 'completed':
          return reminder.is_completed;
        case 'overdue':
          return !reminder.is_completed && new Date(reminder.reminder_date) < now;
        default:
          return true;
      }
    }).sort((a, b) => {
      if (a.is_completed !== b.is_completed) {
        return a.is_completed ? 1 : -1;
      }
      return new Date(a.reminder_date).getTime() - new Date(b.reminder_date).getTime();
    });
  };

  // Toggle reminder completion
  const toggleReminder = async (id: string) => {
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;

    try {
      const { error } = await supabase
        .from('cultivation_reminders')
        .update({ 
          is_completed: !reminder.is_completed,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating reminder:', error);
        return;
      }

      setReminders(prev => prev.map(r => {
        if (r.id === id) {
          return { ...r, is_completed: !r.is_completed, updated_at: new Date().toISOString() };
        }
        return r;
      }));
    } catch (error) {
      console.error('Error toggling reminder:', error);
    }
  };

  // Delete reminder
  const deleteReminder = async (id: string) => {
    try {
      const { error } = await supabase
        .from('cultivation_reminders')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting reminder:', error);
        return;
      }

      setReminders(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error deleting reminder:', error);
    }
  };

  // Add new reminder
  const addReminder = async (reminder: Partial<CultivationReminder>) => {
    try {
      const newReminder = {
        user_id: user.id,
        reminder_type: reminder.reminder_type || 'general',
        reminder_date: reminder.reminder_date || new Date().toISOString(),
        message: reminder.message || 'Ny påminnelse',
        is_completed: false
      };

      const { data, error } = await supabase
        .from('cultivation_reminders')
        .insert(newReminder)
        .select()
        .single();

      if (error) {
        console.error('Error adding reminder:', error);
        return;
      }

      setReminders(prev => [...prev, data]);
      setNewReminder(null);
    } catch (error) {
      console.error('Error adding reminder:', error);
    }
  };

  // Update existing reminder
  const updateReminder = async (updatedReminder: CultivationReminder) => {
    try {
      const { error } = await supabase
        .from('cultivation_reminders')
        .update({
          message: updatedReminder.message,
          reminder_date: updatedReminder.reminder_date,
          reminder_type: updatedReminder.reminder_type,
          updated_at: new Date().toISOString()
        })
        .eq('id', updatedReminder.id);

      if (error) {
        console.error('Error updating reminder:', error);
        return;
      }

      setReminders(prev => prev.map(r => 
        r.id === updatedReminder.id ? { ...updatedReminder, updated_at: new Date().toISOString() } : r
      ));
      setEditingReminder(null);
    } catch (error) {
      console.error('Error updating reminder:', error);
    }
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
  const pendingCount = reminders.filter(r => !r.is_completed).length;
  const overdueCount = reminders.filter(r => !r.is_completed && isOverdue(new Date(r.reminder_date))).length;

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
          { id: 'completed', label: 'Klara', count: reminders.filter(r => r.is_completed).length },
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
          const TypeIcon = getTypeIcon(reminder.reminder_type);
          const priorityColor = getPriorityColor('medium'); // Default priority
          const isReminderOverdue = !reminder.is_completed && isOverdue(new Date(reminder.reminder_date));
          
          return (
            <div
              key={reminder.id}
              className={`p-4 rounded-lg border transition-all duration-200 ${
                reminder.is_completed ? 'opacity-60' : ''
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
                    reminder.is_completed ? 'shadow-sm' : 'hover:shadow-sm'
                  }`}
                  style={{
                    backgroundColor: reminder.is_completed ? priorityColor : 'transparent',
                    borderColor: priorityColor
                  }}
                >
                  {reminder.is_completed && <CheckCircle className="w-4 h-4 text-white" />}
                </button>

                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <TypeIcon className="w-4 h-4" style={{ color: priorityColor }} />
                    <h3 className={`font-semibold text-sm ${reminder.is_completed ? 'line-through' : ''}`}
                        style={{ color: 'var(--text-primary)' }}>
                      {reminder.message}
                    </h3>
                  </div>
                  
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-xs">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" style={{ color: 'var(--text-tertiary)' }} />
                        <span style={{ 
                          color: isReminderOverdue ? 'var(--color-warm-olive)' : 'var(--text-tertiary)' 
                        }}>
                          {new Date(reminder.reminder_date).toLocaleDateString('sv-SE')}
                          {reminder.reminder_time && ` kl ${reminder.reminder_time}`}
                          {isReminderOverdue && ' (försenad)'}
                        </span>
                      </div>
                      
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => setEditingReminder(reminder)}
                        className="p-1 rounded hover:bg-blue-50 transition-colors duration-200"
                        title="Redigera påminnelse"
                      >
                        <Edit className="w-3 h-3 text-blue-500" />
                      </button>
                      <button
                        onClick={() => deleteReminder(reminder.id)}
                        className="p-1 rounded hover:bg-red-50 transition-colors duration-200"
                        title="Ta bort påminnelse"
                      >
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </button>
                    </div>
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

      {/* Edit Reminder Modal */}
      {editingReminder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full" style={{ backgroundColor: 'var(--bg-card)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                Redigera påminnelse
              </h3>
              <button
                onClick={() => setEditingReminder(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--text-primary)' }}>
                  Meddelande
                </label>
                <input
                  type="text"
                  value={editingReminder.message}
                  onChange={(e) => setEditingReminder(prev => prev ? { ...prev, message: e.target.value } : null)}
                  className="w-full p-2 border rounded"
                  style={{ borderColor: 'var(--color-secondary)' }}
                  placeholder="Påminnelsens titel..."
                />
              </div>
              
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--text-primary)' }}>
                  Typ
                </label>
                <select
                  value={editingReminder.reminder_type}
                  onChange={(e) => setEditingReminder(prev => prev ? { ...prev, reminder_type: e.target.value } : null)}
                  className="w-full p-2 border rounded"
                  style={{ borderColor: 'var(--color-secondary)' }}
                >
                  <option value="general">Allmän</option>
                  <option value="sowing">Sådd</option>
                  <option value="planting">Plantering</option>
                  <option value="watering">Vattning</option>
                  <option value="fertilizing">Gödsling</option>
                  <option value="harvesting">Skörd</option>
                  <option value="maintenance">Underhåll</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--text-primary)' }}>
                  Datum
                </label>
                <input
                  type="date"
                  value={editingReminder.reminder_date ? editingReminder.reminder_date.split('T')[0] : ''}
                  onChange={(e) => setEditingReminder(prev => prev ? { 
                    ...prev, 
                    reminder_date: new Date(e.target.value).toISOString() 
                  } : null)}
                  className="w-full p-2 border rounded"
                  style={{ borderColor: 'var(--color-secondary)' }}
                />
              </div>
              
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--text-primary)' }}>
                  Tid (valfritt)
                </label>
                <input
                  type="time"
                  value={editingReminder.reminder_time || ''}
                  onChange={(e) => setEditingReminder(prev => prev ? { 
                    ...prev, 
                    reminder_time: e.target.value 
                  } : null)}
                  className="w-full p-2 border rounded"
                  style={{ borderColor: 'var(--color-secondary)' }}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setEditingReminder(null)}
                  className="px-4 py-2 border rounded text-sm"
                  style={{ borderColor: 'var(--color-secondary)', color: 'var(--text-secondary)' }}
                >
                  Avbryt
                </button>
                <button
                  onClick={() => updateReminder(editingReminder)}
                  className="px-4 py-2 rounded text-sm text-white"
                  style={{ backgroundColor: 'var(--color-sage)' }}
                  disabled={!editingReminder.message || !editingReminder.reminder_date}
                >
                  Spara ändringar
                </button>
              </div>
            </div>
          </div>
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
                  value={newReminder.message || ''}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full p-2 border rounded"
                  style={{ borderColor: 'var(--color-secondary)' }}
                  placeholder={t('cultivation_reminders.placeholder')}
                />
              </div>
              
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--text-primary)' }}>
                  Typ
                </label>
                <select
                  value={newReminder.reminder_type || 'general'}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, reminder_type: e.target.value }))}
                  className="w-full p-2 border rounded"
                  style={{ borderColor: 'var(--color-secondary)' }}
                >
                  <option value="general">Allmän</option>
                  <option value="sowing">Sådd</option>
                  <option value="planting">Plantering</option>
                  <option value="watering">Vattning</option>
                  <option value="fertilizing">Gödsling</option>
                  <option value="harvesting">Skörd</option>
                  <option value="maintenance">Underhåll</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--text-primary)' }}>
                  Tid (valfritt)
                </label>
                <input
                  type="time"
                  value={newReminder.reminder_time || ''}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, reminder_time: e.target.value }))}
                  className="w-full p-2 border rounded"
                  style={{ borderColor: 'var(--color-secondary)' }}
                />
              </div>
              
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--text-primary)' }}>
                  Datum
                </label>
                <input
                  type="date"
                  value={newReminder.reminder_date ? newReminder.reminder_date.split('T')[0] : ''}
                  onChange={(e) => setNewReminder(prev => ({ 
                    ...prev, 
                    reminder_date: new Date(e.target.value).toISOString() 
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
                  disabled={!newReminder.message || !newReminder.reminder_date}
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
