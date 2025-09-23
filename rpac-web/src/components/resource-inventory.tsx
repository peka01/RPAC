'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Package, 
  Droplets, 
  Utensils, 
  Heart, 
  Zap,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { t } from '@/lib/locales';
import { resourceService, Resource } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

// Resource interface is now imported from supabase.ts

const categoryIcons = {
  food: Utensils,
  water: Droplets,
  medicine: Heart,
  energy: Zap,
  tools: Package,
};

const categoryColors = {
  food: 'var(--color-crisis-green)',
  water: 'var(--color-crisis-blue)',
  medicine: 'var(--color-crisis-red)',
  energy: 'var(--color-crisis-orange)',
  tools: 'var(--color-crisis-brown)',
};

export function ResourceInventory() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Get current user and load resources
  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (user) {
          const userResources = await resourceService.getResources(user.id);
          setResources(userResources);
        }
      } catch (error) {
        console.error('Error loading resources:', error);
        // Fallback to localStorage if Supabase fails
        const savedResources = localStorage.getItem('rpac-resources');
        if (savedResources) {
          const parsed = JSON.parse(savedResources);
          setResources(parsed.map((r: any) => ({
            ...r,
            lastUpdated: new Date(r.lastUpdated)
          })));
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const addResource = async (resource: Omit<Resource, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;
    
    try {
      const newResource = await resourceService.addResource({
        ...resource,
        user_id: user.id,
      });
      setResources(prev => [...prev, newResource]);
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding resource:', error);
      // Fallback to localStorage
      const fallbackResource = {
        ...resource,
        id: Date.now().toString(),
        daysRemaining: resource.days_remaining,
        lastUpdated: new Date(),
      };
      setResources(prev => [...prev, fallbackResource]);
      setShowAddForm(false);
    }
  };

  const updateResource = async (id: string, updates: Partial<Resource>) => {
    try {
      const updatedResource = await resourceService.updateResource(id, updates);
      setResources(prev => prev.map(r => 
        r.id === id ? updatedResource : r
      ));
      setEditingResource(null);
    } catch (error) {
      console.error('Error updating resource:', error);
      // Fallback to local update
      setResources(prev => prev.map(r => 
        r.id === id 
          ? { ...r, ...updates, lastUpdated: new Date() }
          : r
      ));
      setEditingResource(null);
    }
  };

  const deleteResource = async (id: string) => {
    try {
      await resourceService.deleteResource(id);
      setResources(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error deleting resource:', error);
      // Fallback to local delete
      setResources(prev => prev.filter(r => r.id !== id));
    }
  };

  const getStatusColor = (daysRemaining: number) => {
    if (daysRemaining < 3) return 'critical';
    if (daysRemaining < 7) return 'warning';
    return 'good';
  };

  const getStatusIcon = (daysRemaining: number) => {
    if (daysRemaining < 3) return AlertTriangle;
    return CheckCircle;
  };

  const getTotalDaysByCategory = (category: string) => {
    const categoryResources = resources.filter(r => r.category === category);
    if (categoryResources.length === 0) return 0;
    return Math.round(categoryResources.reduce((sum, r) => sum + r.days_remaining, 0) / categoryResources.length);
  };

  return (
    <div className="crisis-card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {t('individual.resource_inventory')}
        </h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="crisis-button"
          style={{ backgroundColor: 'var(--color-crisis-green)', color: 'white' }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Lägg till
        </button>
      </div>

      {/* Category Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Object.entries(categoryIcons).map(([category, Icon]) => {
          const days = getTotalDaysByCategory(category);
          const statusColor = getStatusColor(days);
          return (
            <div key={category} className="crisis-card p-3">
              <div className="flex items-center justify-between mb-2">
                <Icon className="w-5 h-5" style={{ color: categoryColors[category as keyof typeof categoryColors] }} />
                <span className={`status-indicator ${statusColor}`}>
                  {days} dagar
                </span>
              </div>
              <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                {t(`resources.${category}`)}
              </h3>
            </div>
          );
        })}
      </div>

      {/* Resources List */}
      <div className="space-y-3">
        {resources.length === 0 ? (
          <div className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Inga resurser registrerade än</p>
            <p className="text-sm">Lägg till din första resurs för att komma igång</p>
          </div>
        ) : (
          resources.map((resource) => {
            const Icon = categoryIcons[resource.category];
            const statusColor = getStatusColor(resource.days_remaining);
            const StatusIcon = getStatusIcon(resource.days_remaining);
            
            return (
              <div key={resource.id} className="crisis-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Icon className="w-5 h-5" style={{ color: categoryColors[resource.category] }} />
                    <div>
                      <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {resource.name}
                      </h3>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {resource.quantity} {resource.unit}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className={`status-indicator ${statusColor}`}>
                      <StatusIcon className="w-4 h-4" />
                      <span className="font-semibold">{resource.days_remaining} dagar</span>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingResource(resource)}
                        className="crisis-button"
                        style={{ backgroundColor: 'var(--color-crisis-blue)', color: 'white', padding: '8px' }}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteResource(resource.id)}
                        className="crisis-button"
                        style={{ backgroundColor: 'var(--color-crisis-red)', color: 'white', padding: '8px' }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add/Edit Resource Form */}
      {(showAddForm || editingResource) && (
        <ResourceForm
          resource={editingResource}
          onSave={editingResource ? updateResource : addResource}
          onCancel={() => {
            setShowAddForm(false);
            setEditingResource(null);
          }}
        />
      )}
    </div>
  );
}

interface ResourceFormProps {
  resource?: Resource | null;
  onSave: (resource: Omit<Resource, 'id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
}

function ResourceForm({ resource, onSave, onCancel }: ResourceFormProps) {
  const [formData, setFormData] = useState({
    name: resource?.name || '',
    category: resource?.category || 'food',
    quantity: resource?.quantity || 0,
    unit: resource?.unit || '',
    days_remaining: resource?.days_remaining || resource?.daysRemaining || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (resource) {
      onSave(resource.id, formData);
    } else {
      onSave(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="crisis-card max-w-md w-full">
        <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          {resource ? t('forms.edit') + ' resurs' : t('forms.add') + ' resurs'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              {t('forms.name')}
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full p-3 border-2 rounded-lg"
              style={{ borderColor: 'var(--color-crisis-grey)' }}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              {t('forms.category')}
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
              className="w-full p-3 border-2 rounded-lg"
              style={{ borderColor: 'var(--color-crisis-grey)' }}
            >
              <option value="food">{t('resources.food')}</option>
              <option value="water">{t('resources.water')}</option>
              <option value="medicine">{t('resources.medicine')}</option>
              <option value="energy">{t('resources.energy')}</option>
              <option value="tools">{t('resources.tools')}</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                {t('forms.quantity')}
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                className="w-full p-3 border-2 rounded-lg"
                style={{ borderColor: 'var(--color-crisis-grey)' }}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                {t('forms.unit')}
              </label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                className="w-full p-3 border-2 rounded-lg"
                style={{ borderColor: 'var(--color-crisis-grey)' }}
                placeholder={t('placeholders.enter_unit')}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              {t('forms.days_remaining')}
            </label>
            <input
              type="number"
              value={formData.days_remaining}
              onChange={(e) => setFormData(prev => ({ ...prev, days_remaining: Number(e.target.value) }))}
              className="w-full p-3 border-2 rounded-lg"
              style={{ borderColor: 'var(--color-crisis-grey)' }}
              required
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="crisis-button flex-1"
              style={{ backgroundColor: 'var(--color-crisis-green)', color: 'white' }}
            >
              {resource ? t('forms.update') : t('forms.add')}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="crisis-button flex-1"
              style={{ backgroundColor: 'var(--color-crisis-grey)', color: 'white' }}
            >
              {t('forms.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
