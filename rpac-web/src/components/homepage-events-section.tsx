'use client';

import { t } from '@/lib/locales';
import { Calendar, Clock, MapPin, Edit3, Plus, X, Trash2, Check } from 'lucide-react';
import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface CommunityEvent {
  id: string;
  title: string;
  description?: string;
  event_date: string;
  event_end_date?: string;
  location?: string;
  is_recurring: boolean;
  show_on_homepage: boolean;
}

interface HomepageEventsSectionProps {
  communityId: string;
  events: CommunityEvent[];
  onEventsChange: (events: CommunityEvent[]) => void;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function HomepageEventsSection({
  communityId,
  events,
  onEventsChange,
  isEditing,
  onEdit,
  onSave,
  onCancel
}: HomepageEventsSectionProps) {
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CommunityEvent | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    event_end_date: '',
    location: '',
    is_recurring: false,
    show_on_homepage: true
  });
  const supabase = createClientComponentClient();

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      event_date: '',
      event_end_date: '',
      location: '',
      is_recurring: false,
      show_on_homepage: true
    });
    setEditingEvent(null);
    setShowEventForm(false);
  };

  const handleAddEvent = () => {
    setShowEventForm(true);
    setEditingEvent(null);
    resetForm();
  };

  const handleEditEvent = (event: CommunityEvent) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      event_date: event.event_date.substring(0, 16), // Format for datetime-local
      event_end_date: event.event_end_date?.substring(0, 16) || '',
      location: event.location || '',
      is_recurring: event.is_recurring,
      show_on_homepage: event.show_on_homepage
    });
    setShowEventForm(true);
  };

  const handleSaveEvent = async () => {
    if (!formData.title || !formData.event_date) {
      alert('Titel och datum måste fyllas i');
      return;
    }

    try {
      if (editingEvent) {
        // Update existing event
        const { data, error } = await supabase
          .from('community_events')
          .update({
            title: formData.title,
            description: formData.description,
            event_date: new Date(formData.event_date).toISOString(),
            event_end_date: formData.event_end_date ? new Date(formData.event_end_date).toISOString() : null,
            location: formData.location,
            is_recurring: formData.is_recurring,
            show_on_homepage: formData.show_on_homepage,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingEvent.id)
          .select()
          .single();

        if (error) throw error;
        if (data) {
          onEventsChange(events.map(e => e.id === data.id ? data : e));
        }
      } else {
        // Create new event
        const { data, error } = await supabase
          .from('community_events')
          .insert({
            community_id: communityId,
            title: formData.title,
            description: formData.description,
            event_date: new Date(formData.event_date).toISOString(),
            event_end_date: formData.event_end_date ? new Date(formData.event_end_date).toISOString() : null,
            location: formData.location,
            is_recurring: formData.is_recurring,
            show_on_homepage: formData.show_on_homepage
          })
          .select()
          .single();

        if (error) throw error;
        if (data) {
          onEventsChange([...events, data]);
        }
      }

      resetForm();
    } catch (error) {
      console.error('Save event error:', error);
      alert('Kunde inte spara event. Försök igen.');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Ta bort detta event?')) return;

    try {
      const { error } = await supabase
        .from('community_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
      onEventsChange(events.filter(e => e.id !== eventId));
    } catch (error) {
      console.error('Delete event error:', error);
      alert('Kunde inte ta bort event. Försök igen.');
    }
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('sv-SE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatEventTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('sv-SE', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const upcomingEvents = events
    .filter(e => new Date(e.event_date) >= new Date() && e.show_on_homepage)
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());

  if (isEditing) {
    return (
      <div className="bg-white mx-8 mt-8 rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">📅 {t('homespace.editor.events_section')}</h2>
        
        {/* Add event button */}
        {!showEventForm && (
          <button
            onClick={handleAddEvent}
            className="mb-6 px-4 py-2 bg-[#5C6B47] text-white rounded-lg hover:bg-[#4A5239] flex items-center gap-2"
          >
            <Plus size={16} />
            {t('homespace.editor.add_event')}
          </button>
        )}

        {/* Event form */}
        {showEventForm && (
          <div className="mb-6 p-6 bg-gray-50 rounded-lg border-2 border-[#5C6B47]">
            <h3 className="text-lg font-semibold mb-4">
              {editingEvent ? t('homespace.editor.edit_event') : t('homespace.editor.add_event')}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  {t('homespace.editor.event_title')} *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="T.ex. Månatligt möte, Övning, Workshop"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#5C6B47] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  {t('homespace.editor.event_description')}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Beskriv eventet..."
                  rows={3}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#5C6B47] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    {t('homespace.editor.event_date')} *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#5C6B47] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    {t('homespace.editor.event_end_date')}
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.event_end_date}
                    onChange={(e) => setFormData({ ...formData, event_end_date: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#5C6B47] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  {t('homespace.editor.event_location')}
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="T.ex. Folkets Hus, Online via Zoom"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#5C6B47] focus:outline-none"
                />
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_recurring}
                    onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">{t('homespace.editor.recurring_event')}</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.show_on_homepage}
                    onChange={(e) => setFormData({ ...formData, show_on_homepage: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">{t('homespace.editor.show_on_homepage')}</span>
                </label>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleSaveEvent}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Check size={16} />
                  Spara event
                </button>
                <button
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Avbryt
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Events list */}
        {events.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Alla event ({events.length})</h3>
            {events.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()).map(event => (
              <div key={event.id} className="p-4 bg-gray-50 rounded-lg border hover:border-[#5C6B47] transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{event.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{formatEventDate(event.event_date)}</p>
                    {event.location && (
                      <p className="text-sm text-gray-500 mt-1">📍 {event.location}</p>
                    )}
                    {!event.show_on_homepage && (
                      <span className="inline-block mt-2 px-2 py-1 bg-gray-200 text-xs rounded">Dold på hemsidan</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditEvent(event)}
                      className="p-2 text-[#5C6B47] hover:bg-[#5C6B47] hover:text-white rounded transition-all"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="p-2 text-red-600 hover:bg-red-600 hover:text-white rounded transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Inga event planerade än</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-6 border-t mt-6">
          <button
            onClick={onSave}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Klar
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Stäng
          </button>
        </div>
      </div>
    );
  }

  // Display mode
  if (upcomingEvents.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-[#5C6B47]/10 to-[#4A5239]/5 mx-8 mt-8 rounded-2xl shadow-lg p-8 border-2 border-[#5C6B47]/30 group">
      <div className="flex items-start justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">📅 Kommande event</h2>
        <button
          onClick={onEdit}
          className="opacity-0 group-hover:opacity-100 p-2 bg-[#3D4A2B] text-white rounded-lg hover:bg-[#2A331E] transition-all"
        >
          <Edit3 size={16} />
        </button>
      </div>

      {upcomingEvents.length > 0 ? (
        <div className="space-y-4">
          {upcomingEvents.map(event => (
          <div key={event.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 bg-[#5C6B47] text-white p-3 rounded-lg text-center min-w-[60px]">
                <div className="text-2xl font-bold">{new Date(event.event_date).getDate()}</div>
                <div className="text-xs uppercase">{new Date(event.event_date).toLocaleDateString('sv-SE', { month: 'short' })}</div>
              </div>
              
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{event.title}</h3>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-2">
                  <div className="flex items-center gap-2">
                    <Clock size={16} />
                    {formatEventTime(event.event_date)}
                    {event.event_end_date && ` - ${formatEventTime(event.event_end_date)}`}
                  </div>
                  
                  {event.location && (
                    <div className="flex items-center gap-2">
                      <MapPin size={16} />
                      {event.location}
                    </div>
                  )}
                </div>

                {event.description && (
                  <p className="text-gray-700 mt-3 whitespace-pre-line">{event.description}</p>
                )}

                {event.is_recurring && (
                  <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 bg-[#5C6B47]/10 text-[#3D4A2B] text-sm rounded-full">
                    <Calendar size={14} />
                    Återkommande event
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Calendar size={48} className="mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Inga event än</h3>
          <p className="text-gray-500 mb-4">Klicka på pennikonen för att lägga till kommande event</p>
          <button
            onClick={onEdit}
            className="px-4 py-2 bg-[#3D4A2B] text-white rounded-lg hover:bg-[#2A331E] transition-colors"
          >
            Lägg till event
          </button>
        </div>
      )}
    </div>
  );
}

