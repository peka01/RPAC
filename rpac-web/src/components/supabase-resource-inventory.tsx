'use client';

import { useState, useEffect } from 'react';
import { resourceService, Resource } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { Plus, Edit, Trash2, Package, Droplets, Heart, Zap, Wrench } from 'lucide-react';

interface SupabaseResourceInventoryProps {
  user: User;
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
      const data = await resourceService.getResources(user.id);
      setResources(data);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Ett oväntat fel inträffade');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (editingResource) {
        await resourceService.updateResource(editingResource.id, formData);
        setEditingResource(null);
      } else {
        await resourceService.addResource({
          ...formData,
          user_id: user.id
        });
      }

      setFormData({
        name: '',
        category: 'food',
        quantity: 1,
        unit: '',
        days_remaining: 30
      });
      setShowAddForm(false);
      loadResources();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Ett oväntat fel inträffade');
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
    if (!confirm('Är du säker på att du vill ta bort denna resurs?')) return;

    try {
      await resourceService.deleteResource(id);
      loadResources();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Ett oväntat fel inträffade');
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Resursinventering
        </h2>
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
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} />
          Lägg till resurs
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {showAddForm && (
        <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            {editingResource ? 'Redigera resurs' : 'Lägg till ny resurs'}
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
                  Dagar kvar (hållbarhet)
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
                {editingResource ? 'Uppdatera' : 'Lägg till'}
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
            Inga resurser registrerade än. Lägg till din första resurs för att komma igång.
          </p>
        </div>
      )}
    </div>
  );
}
