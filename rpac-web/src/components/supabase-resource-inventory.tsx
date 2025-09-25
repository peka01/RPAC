'use client';

import { useState, useEffect } from 'react';
import { resourceService, Resource } from '@/lib/supabase';
import { t } from '@/lib/locales';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Package, 
  Droplets, 
  Heart, 
  Zap, 
  Wrench,
  Shield,
  Sparkles,
  CheckCircle,
  Calendar,
  TrendingUp,
  Sun,
  Leaf
} from 'lucide-react';

interface SupabaseResourceInventoryProps {
  user: { id: string; email?: string; user_metadata?: { name?: string } };
}

const categoryIcons = {
  food: Package,
  water: Droplets,
  medicine: Heart,
  energy: Zap,
  tools: Wrench
};

const categoryLabels = {
  food: 'Mat',
  water: 'Vatten',
  medicine: 'Medicin',
  energy: 'Energi',
  tools: 'Verktyg'
};

export function SupabaseResourceInventory({ user }: SupabaseResourceInventoryProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'food' as Resource['category'],
    quantity: 1,
    unit: '',
    days_remaining: 30
  });

  useEffect(() => {
    if (user?.id) {
      loadResources();
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadResources = async () => {
    try {
      setLoading(true);
      
      // Use demo mode for all users for now (Supabase has columns= bug)
      if (true || user.id === 'demo-user') {
        // Load demo data from localStorage
        const demoResources = localStorage.getItem('rpac-demo-resources');
        if (demoResources) {
          setResources(JSON.parse(demoResources));
        } else {
          // Create some demo resources
          const demoData = [
            {
              id: 'demo-1',
              user_id: 'demo-user',
              name: 'Konserverad mat',
              category: 'food' as const,
              quantity: 20,
              unit: 'burkar',
              days_remaining: 365,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: 'demo-2',
              user_id: 'demo-user',
              name: 'Vatten',
              category: 'water' as const,
              quantity: 50,
              unit: 'liter',
              days_remaining: 30,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ];
          setResources(demoData);
          localStorage.setItem('rpac-demo-resources', JSON.stringify(demoData));
        }
      } else {
        // Note: Supabase integration temporarily disabled due to columns= bug
        
        const data = await resourceService.getResources(user.id);
        setResources(data);
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : t('resources.error_occurred'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (true || user.id === 'demo-user') {
        // Handle demo mode
        const newResource = {
          id: `demo-${Date.now()}`,
          user_id: user.id,
          ...formData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        if (editingResource) {
          const updatedResources = resources.map(r => 
            r.id === editingResource.id ? { ...r, ...formData, updated_at: new Date().toISOString() } : r
          );
          setResources(updatedResources);
          localStorage.setItem('rpac-demo-resources', JSON.stringify(updatedResources));
          setEditingResource(null);
        } else {
          const updatedResources = [...resources, newResource];
          setResources(updatedResources);
          localStorage.setItem('rpac-demo-resources', JSON.stringify(updatedResources));
        }
      } else {
        // Handle real Supabase mode
        if (editingResource?.id) {
          await resourceService.updateResource(editingResource!.id, formData);
          setEditingResource(null);
        } else {
          // Note: Supabase addResource disabled due to columns= bug
          const resourceData = {
            user_id: user.id,
            ...formData
          };
          await resourceService.addResource(resourceData);
        }
        loadResources();
      }

      setFormData({
        name: '',
        category: 'food',
        quantity: 1,
        unit: '',
        days_remaining: 30
      });
      setShowAddForm(false);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : t('resources.error_occurred'));
    }
  };

  const handleEdit = (resource: Resource) => {
    setEditingResource(resource);
    setFormData({
      name: resource.name,
      category: resource.category,
      quantity: resource.quantity,
      unit: resource.unit,
      days_remaining: resource.days_remaining
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('resources.confirm_delete'))) return;

    try {
      if (true || user.id === 'demo-user') {
        // Handle demo mode
        const updatedResources = resources.filter(r => r.id !== id);
        setResources(updatedResources);
        localStorage.setItem('rpac-demo-resources', JSON.stringify(updatedResources));
      } else {
        await resourceService.deleteResource(id);
        loadResources();
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : t('resources.error_occurred'));
    }
  };

  const getUrgencyColor = (days: number) => {
    if (days <= 7) return 'text-red-600 bg-red-100';
    if (days <= 30) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getResourceHealthScore = () => {
    if (resources.length === 0) return 0;
    const totalDays = resources.reduce((sum, resource) => sum + resource.days_remaining, 0);
    const avgDays = totalDays / resources.length;
    return Math.min(100, Math.round((avgDays / 30) * 100));
  };

  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case 'food': return '🍽️';
      case 'water': return '💧';
      case 'medicine': return '💊';
      case 'energy': return '⚡';
      case 'tools': return '🔧';
      default: return '📦';
    }
  };

  const getConfidenceMessage = () => {
    const healthScore = getResourceHealthScore();
    if (healthScore >= 80) return t('preparedness.health_messages.excellent');
    if (healthScore >= 60) return t('preparedness.health_messages.very_good');
    if (healthScore >= 40) return t('preparedness.health_messages.good');
    if (healthScore >= 20) return t('preparedness.health_messages.fair');
    return t('preparedness.health_messages.poor');
  };

  const resourceHealthScore = getResourceHealthScore();

  return (
    <div className="bg-white/95 rounded-xl p-6 border shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden" style={{ 
      backgroundColor: 'var(--bg-card)',
      borderColor: 'var(--color-khaki)'
    }}>
      {/* Professional Background Patterns */}
      <div className="absolute top-0 right-0 w-24 h-24 opacity-[0.02]">
        <div className="w-full h-full rounded-full" style={{ background: 'linear-gradient(135deg, var(--color-sage) 0%, var(--color-quaternary) 100%)' }}></div>
      </div>
      <div className="absolute bottom-0 left-0 w-20 h-20 opacity-[0.02]">
        <div className="w-full h-full rounded-full animate-pulse" style={{ 
          background: 'linear-gradient(135deg, var(--color-khaki) 0%, var(--color-warm-olive) 100%)',
          animationDelay: '2s' 
        }}></div>
      </div>

      {/* Resource Intelligence Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-lg flex items-center justify-center shadow-md" style={{ 
              background: 'linear-gradient(135deg, var(--color-khaki) 0%, var(--color-warm-olive) 100%)' 
            }}>
              <Shield className="w-7 h-7 text-white" />
            </div>
            {/* Resource Status Indicator */}
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full animate-pulse" style={{
              backgroundColor: resourceHealthScore > 70 ? 'var(--color-sage)' : 
                              resourceHealthScore > 40 ? 'var(--color-warning)' : 'var(--color-danger)'
            }}>
              <div className="absolute inset-0 rounded-full bg-current animate-ping opacity-50"></div>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('resources.storage_title')}</h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{
              resources.length
            } {t('resources.registered_units')}</p>
          </div>
        </div>
        
        {/* Resource Readiness Metrics */}
        <div className="text-center px-4 py-2 rounded-lg shadow-sm" style={{ backgroundColor: 'var(--bg-olive-light)' }}>
          <div className="text-2xl font-bold" style={{
            color: resourceHealthScore > 70 ? 'var(--color-sage)' : 
                   resourceHealthScore > 40 ? 'var(--color-warning)' : 'var(--color-danger)'
          }}>
            {resourceHealthScore}%
          </div>
          <div className="text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>BEREDSKAP</div>
        </div>
      </div>

      {/* Professional Resource Addition */}
      <button
        onClick={() => {
          setShowAddForm(true);
          setEditingResource(null);
          setFormData({
            name: '',
            category: 'food',
            quantity: 1,
            unit: '',
            days_remaining: 30
          });
        }}
        className="group w-full mb-6 text-white p-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, var(--color-sage) 0%, var(--color-quaternary) 100%)' }}
      >
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="relative flex items-center justify-center space-x-3">
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center group-hover:rotate-90 transition-transform duration-300">
            <Plus className="w-6 h-6" />
          </div>
          <div className="text-left">
            <div className="font-bold text-base">{t('buttons.register_resource')}</div>
          </div>
        </div>
      </button>

      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {showAddForm && (
        <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            {editingResource ? t('resources.edit_resource') : t('resources.add_new_resource')}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  Namn
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="t.ex. Konserverad mat"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  Kategori
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as Resource['category'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  Antal
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  Enhet
                </label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="t.ex. burkar, liter, kg"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  {t('resources.days_remaining')}
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.days_remaining}
                  onChange={(e) => setFormData({ ...formData, days_remaining: parseInt(e.target.value) || 1 })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {editingResource ? t('buttons.update') : t('buttons.add')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingResource(null);
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Avbryt
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {resources.map((resource) => {
          const IconComponent = categoryIcons[resource.category];
          return (
            <div
              key={resource.id}
              className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <IconComponent size={20} style={{ color: 'var(--text-primary)' }} />
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {categoryLabels[resource.category]}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(resource)}
                    className="p-1 hover:bg-white/20 rounded transition-colors"
                  >
                    <Edit size={16} style={{ color: 'var(--text-secondary)' }} />
                  </button>
                  <button
                    onClick={() => handleDelete(resource.id)}
                    className="p-1 hover:bg-red-500/20 rounded transition-colors"
                  >
                    <Trash2 size={16} className="text-red-500" />
                  </button>
                </div>
              </div>

              <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                {resource.name}
              </h3>

              <div className="space-y-2 text-sm">
                <div style={{ color: 'var(--text-secondary)' }}>
                  <span className="font-medium">Antal:</span> {resource.quantity} {resource.unit}
                </div>
                <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(resource.days_remaining)}`}>
                  {resource.days_remaining} dagar kvar
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {resources.length === 0 && (
        <div className="text-center py-8">
          <Package size={48} className="mx-auto mb-4 opacity-50" style={{ color: 'var(--text-secondary)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>
            {t('resources.no_resources_message')}
          </p>
        </div>
      )}
    </div>
  );
}
