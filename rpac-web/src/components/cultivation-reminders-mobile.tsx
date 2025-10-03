'use client';

import { useState, useEffect } from 'react';
import { 
  Bell,
  CheckCircle,
  Droplets,
  Sprout,
  Scissors,
  Sun,
  Calendar,
  Plus,
  X,
  Settings as SettingsIcon,
  ArrowRight,
  Edit
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface CultivationReminder {
  id: string;
  user_id: string;
  reminder_type: string;
  reminder_date: string;
  reminder_time?: string;
  title?: string;
  description?: string;
  crop_name?: string;
  plant_count?: number;
  notes?: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

interface CultivationRemindersMobileProps {
  user: { id: string };
  climateZone?: string;
}

const REMINDER_TYPES = [
  { value: 'sowing', label: 'Sådd', icon: Sprout, color: '#10B981', emoji: '🌱' },
  { value: 'watering', label: 'Vattning', icon: Droplets, color: '#3B82F6', emoji: '💧' },
  { value: 'harvesting', label: 'Skörd', icon: Scissors, color: '#F59E0B', emoji: '🌾' },
  { value: 'fertilizing', label: 'Gödsling', icon: Sun, color: '#EF4444', emoji: '☀️' },
  { value: 'general', label: 'Allmänt', icon: Calendar, color: '#6B7280', emoji: '📅' }
];

export function CultivationRemindersMobileComplete({ user, climateZone = 'Svealand' }: CultivationRemindersMobileProps) {
  const [reminders, setReminders] = useState<CultivationReminder[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'overdue'>('pending');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingReminder, setEditingReminder] = useState<CultivationReminder | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    reminder_type: 'general',
    title: '',
    description: '',
    crop_name: '',
    reminder_date: new Date().toISOString().split('T')[0],
    reminder_time: '09:00'
  });

  useEffect(() => {
    loadReminders();
  }, [user.id]);

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

      setReminders(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleComplete = async (reminder: CultivationReminder) => {
    try {
      const { error } = await supabase
        .from('cultivation_reminders')
        .update({ 
          is_completed: !reminder.is_completed,
          updated_at: new Date().toISOString()
        })
        .eq('id', reminder.id);

      if (error) return;

      setReminders(prev => prev.map(r => 
        r.id === reminder.id ? { ...r, is_completed: !r.is_completed } : r
      ));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const deleteReminder = async (reminderId: string) => {
    if (!confirm('Ta bort påminnelse?')) return;
    
    try {
      const { error } = await supabase
        .from('cultivation_reminders')
        .delete()
        .eq('id', reminderId);

      if (error) return;
      setReminders(prev => prev.filter(r => r.id !== reminderId));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const addReminder = async () => {
    if (!formData.title.trim()) {
      alert('Vänligen ange en titel');
      return;
    }

    try {
      const newReminder = {
        user_id: user.id,
        reminder_type: formData.reminder_type,
        reminder_date: formData.reminder_date,
        reminder_time: formData.reminder_time,
        title: formData.title,
        description: formData.description,
        crop_name: formData.crop_name,
        is_completed: false
      };

      const { data, error } = await supabase
        .from('cultivation_reminders')
        .insert(newReminder)
        .select()
        .single();

      if (error) {
        console.error('Error adding reminder:', error);
        alert('Kunde inte skapa påminnelse');
        return;
      }

      setReminders(prev => [...prev, data]);
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const updateReminder = async () => {
    if (!editingReminder || !formData.title.trim()) {
      alert('Vänligen ange en titel');
      return;
    }

    try {
      const { error } = await supabase
        .from('cultivation_reminders')
        .update({
          reminder_type: formData.reminder_type,
          reminder_date: formData.reminder_date,
          reminder_time: formData.reminder_time,
          title: formData.title,
          description: formData.description,
          crop_name: formData.crop_name,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingReminder.id);

      if (error) {
        console.error('Error updating reminder:', error);
        alert('Kunde inte uppdatera påminnelse');
        return;
      }

      setReminders(prev => prev.map(r => 
        r.id === editingReminder.id ? { ...r, ...formData } : r
      ));
      setShowEditModal(false);
      setEditingReminder(null);
      resetForm();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const openEditModal = (reminder: CultivationReminder) => {
    setEditingReminder(reminder);
    setFormData({
      reminder_type: reminder.reminder_type,
      title: reminder.title || '',
      description: reminder.description || '',
      crop_name: reminder.crop_name || '',
      reminder_date: reminder.reminder_date.split('T')[0],
      reminder_time: reminder.reminder_time || '09:00'
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      reminder_type: 'general',
      title: '',
      description: '',
      crop_name: '',
      reminder_date: new Date().toISOString().split('T')[0],
      reminder_time: '09:00'
    });
  };

  const getFilteredReminders = () => {
    const now = new Date();
    return reminders.filter(r => {
      switch (filter) {
        case 'pending':
          return !r.is_completed;
        case 'completed':
          return r.is_completed;
        case 'overdue':
          return !r.is_completed && new Date(r.reminder_date) < now;
        default:
          return true;
      }
    });
  };

  const filteredReminders = getFilteredReminders();
  const upcomingCount = reminders.filter(r => !r.is_completed).length;
  const completedCount = reminders.filter(r => r.is_completed).length;
  const overdueCount = reminders.filter(r => !r.is_completed && new Date(r.reminder_date) < new Date()).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <Bell className="w-16 h-16 mx-auto mb-4 text-[#3D4A2B] animate-pulse" />
          <p className="text-gray-600 font-medium">Laddar påminnelser...</p>
        </div>
      </div>
    );
  }

  // Render Add/Edit Form Modal
  const renderFormModal = (isEdit: boolean) => {
    const show = isEdit ? showEditModal : showAddModal;
    const setShow = isEdit ? setShowEditModal : setShowAddModal;
    const submitFn = isEdit ? updateReminder : addReminder;

    if (!show) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end animate-fade-in">
        <div className="bg-white rounded-t-3xl p-6 w-full max-h-[90vh] overflow-y-auto animate-slide-in-bottom">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">
              {isEdit ? 'Redigera påminnelse' : 'Ny påminnelse'}
            </h3>
            <button
              onClick={() => {
                setShow(false);
                if (isEdit) setEditingReminder(null);
                resetForm();
              }}
              className="p-2 hover:bg-gray-100 rounded-full transition-all touch-manipulation"
            >
              <X size={24} />
            </button>
          </div>

          <div className="space-y-4">
            {/* Type Selection */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">Typ av påminnelse</label>
              <div className="grid grid-cols-2 gap-3">
                {REMINDER_TYPES.map(type => (
                  <button
                    key={type.value}
                    onClick={() => setFormData({ ...formData, reminder_type: type.value })}
                    className={`p-4 rounded-xl border-2 transition-all touch-manipulation active:scale-98 ${
                      formData.reminder_type === type.value
                        ? 'border-[#3D4A2B] bg-[#3D4A2B]/10'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-3xl mb-2">{type.emoji}</div>
                    <div className="text-sm font-medium text-gray-900">{type.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Titel *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="T.ex. Vattna tomaterna"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#3D4A2B] outline-none"
              />
            </div>

            {/* Crop Name */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Gröda (valfritt)</label>
              <input
                type="text"
                value={formData.crop_name}
                onChange={(e) => setFormData({ ...formData, crop_name: e.target.value })}
                placeholder="T.ex. Tomater"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#3D4A2B] outline-none"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Beskrivning (valfritt)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ytterligare information..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#3D4A2B] outline-none resize-none"
              />
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Datum *</label>
                <input
                  type="date"
                  value={formData.reminder_date}
                  onChange={(e) => setFormData({ ...formData, reminder_date: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#3D4A2B] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Tid</label>
                <input
                  type="time"
                  value={formData.reminder_time}
                  onChange={(e) => setFormData({ ...formData, reminder_time: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#3D4A2B] outline-none"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 mt-6">
            <button
              onClick={submitFn}
              className="w-full bg-gradient-to-r from-[#556B2F] to-[#3D4A2B] text-white py-4 px-6 rounded-xl font-bold hover:shadow-xl transition-all touch-manipulation active:scale-98"
            >
              {isEdit ? 'Uppdatera' : 'Skapa påminnelse'}
            </button>
            <button
              onClick={() => {
                setShow(false);
                if (isEdit) setEditingReminder(null);
                resetForm();
              }}
              className="w-full bg-gray-100 text-gray-700 py-4 px-6 rounded-xl font-bold hover:bg-gray-200 transition-all touch-manipulation active:scale-98"
            >
              Avbryt
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 to-purple-50/50 pb-32">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-[#3D4A2B] to-[#2A331E] text-white px-6 py-8 rounded-b-3xl shadow-2xl mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            <Bell size={32} className="text-white" strokeWidth={2} />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-1">Påminnelser</h1>
            <p className="text-white/80 text-sm">{climateZone}</p>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-all active:scale-95 touch-manipulation"
          >
            <SettingsIcon size={20} />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
            <div className="text-3xl font-bold mb-1">{upcomingCount}</div>
            <div className="text-white/80 text-xs">Kommande</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
            <div className="text-3xl font-bold mb-1">{completedCount}</div>
            <div className="text-white/80 text-xs">Klara</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
            <div className="text-3xl font-bold mb-1 text-red-200">{overdueCount}</div>
            <div className="text-white/80 text-xs">Försena</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-6 mb-6">
        <div className="bg-white rounded-2xl p-2 shadow-lg">
          <div className="grid grid-cols-4 gap-2">
            {(['pending', 'overdue', 'all', 'completed'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`py-3 px-2 rounded-xl font-medium text-sm transition-all touch-manipulation active:scale-95 ${
                  filter === f
                    ? 'bg-[#3D4A2B] text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {f === 'pending' && 'Kommande'}
                {f === 'overdue' && 'Försenade'}
                {f === 'all' && 'Alla'}
                {f === 'completed' && 'Klara'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reminders List */}
      <div className="px-6 space-y-3">
        {filteredReminders.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-[#3D4A2B]/10 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <Bell className="text-[#3D4A2B]" size={48} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Inga påminnelser</h3>
            <p className="text-gray-600 mb-6">
              {filter === 'pending' && 'Du har inga kommande påminnelser'}
              {filter === 'overdue' && 'Inga försenade påminnelser!'}
              {filter === 'completed' && 'Inga slutförda påminnelser än'}
              {filter === 'all' && 'Inga påminnelser skapade ännu'}
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-[#3D4A2B] text-white font-bold rounded-xl hover:bg-[#2A331E] transition-all touch-manipulation active:scale-95"
            >
              Skapa din första påminnelse
            </button>
          </div>
        ) : (
          filteredReminders.map(reminder => {
            const typeData = REMINDER_TYPES.find(t => t.value === reminder.reminder_type) || REMINDER_TYPES[4];
            const Icon = typeData.icon;
            const date = new Date(reminder.reminder_date);
            const isOverdue = date < new Date() && !reminder.is_completed;
            const isToday = date.toDateString() === new Date().toDateString();

            return (
              <div
                key={reminder.id}
                className={`bg-white rounded-2xl border-2 shadow-lg transition-all ${
                  reminder.is_completed
                    ? 'border-green-200 bg-green-50/50'
                    : isOverdue
                    ? 'border-red-200 bg-red-50/50'
                    : isToday
                    ? 'border-amber-200 bg-amber-50/50'
                    : 'border-gray-100'
                }`}
              >
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleComplete(reminder)}
                      className={`flex-shrink-0 w-10 h-10 rounded-full border-3 flex items-center justify-center transition-all touch-manipulation active:scale-95 ${
                        reminder.is_completed
                          ? 'bg-green-500 border-green-500'
                          : 'border-gray-300 hover:border-[#3D4A2B]'
                      }`}
                    >
                      {reminder.is_completed && <CheckCircle size={24} className="text-white" strokeWidth={2.5} />}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1"
                          style={{ 
                            backgroundColor: `${typeData.color}20`,
                            color: typeData.color
                          }}
                        >
                          <Icon size={16} />
                          <span>{typeData.label}</span>
                        </div>
                        {isToday && !reminder.is_completed && (
                          <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                            Idag!
                          </span>
                        )}
                        {isOverdue && !reminder.is_completed && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                            Försenad
                          </span>
                        )}
                      </div>

                      <h4 className={`font-bold text-lg mb-1 ${
                        reminder.is_completed ? 'text-gray-500 line-through' : 'text-gray-900'
                      }`}>
                        {reminder.title || reminder.crop_name || 'Påminnelse'}
                      </h4>

                      {reminder.crop_name && reminder.title !== reminder.crop_name && (
                        <p className="text-sm text-[#3D4A2B] mb-1 font-medium">
                          🌱 {reminder.crop_name}
                        </p>
                      )}

                      {reminder.description && (
                        <p className={`text-sm mb-2 ${
                          reminder.is_completed ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {reminder.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar size={14} />
                        <span>
                          {date.toLocaleDateString('sv-SE', { 
                            day: 'numeric', 
                            month: 'long',
                            year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                          })}
                          {reminder.reminder_time && ` kl ${reminder.reminder_time}`}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => openEditModal(reminder)}
                        className="p-2 text-gray-400 hover:text-[#3D4A2B] hover:bg-[#3D4A2B]/10 rounded-full transition-all touch-manipulation active:scale-95"
                      >
                        <Edit size={20} />
                      </button>
                      <button
                        onClick={() => deleteReminder(reminder.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all touch-manipulation active:scale-95"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Add Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-32 right-6 w-16 h-16 bg-gradient-to-br from-[#556B2F] to-[#3D4A2B] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all touch-manipulation active:scale-95 z-40"
      >
        <Plus size={32} strokeWidth={2.5} />
      </button>

      {/* Modals */}
      {renderFormModal(false)}
      {renderFormModal(true)}
    </div>
  );
}

