'use client';

import React, { useState, useMemo } from 'react';
import { X, Shield, Plus, Check, Package, AlertTriangle } from 'lucide-react';
import { resourceService } from '@/lib/supabase';
import { t } from '@/lib/locales/sv.json';
import { msbRecommendations, categoryConfig } from './simple-add-resource-modal';

interface BulkMsbModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  existingResources: any[];
  onSuccess?: () => void;
}

interface MsbResourceSelection {
  name: string;
  category: string;
  unit: string;
  days_remaining: number;
  quantity: number;
  isSelected: boolean;
  existingId?: string; // If the resource already exists
  existingQuantity?: number;
}

export function BulkMsbModal({ isOpen, onClose, userId, existingResources, onSuccess }: BulkMsbModalProps) {
  const [selections, setSelections] = useState<MsbResourceSelection[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Initialize selections from MSB recommendations
  useMemo(() => {
    const allMsbResources: MsbResourceSelection[] = [];
    
    Object.entries(msbRecommendations).forEach(([category, items]) => {
      items.forEach(item => {
        if (item.is_msb) { // Only include MSB-recommended items
          // Check if this resource already exists
          const existing = existingResources.find(
            r => r.name?.toLowerCase() === item.name.toLowerCase() && 
                 r.category === category
          );
          
          allMsbResources.push({
            name: item.name,
            category,
            unit: item.unit,
            days_remaining: item.days_remaining,
            quantity: existing?.quantity || item.quantity,
            isSelected: false,
            existingId: existing?.id,
            existingQuantity: existing?.quantity || 0
          });
        }
      });
    });
    
    setSelections(allMsbResources);
  }, [existingResources]);

  const handleToggleSelection = (index: number) => {
    setSelections(prev => prev.map((item, i) => 
      i === index ? { ...item, isSelected: !item.isSelected } : item
    ));
  };

  const handleQuantityChange = (index: number, value: string) => {
    const numValue = parseInt(value) || 0;
    setSelections(prev => prev.map((item, i) => 
      i === index ? { ...item, quantity: Math.max(0, numValue) } : item
    ));
  };

  const handleSelectAll = (category?: string) => {
    setSelections(prev => prev.map(item => 
      (!category || item.category === category) 
        ? { ...item, isSelected: true }
        : item
    ));
  };

  const handleDeselectAll = () => {
    setSelections(prev => prev.map(item => ({ ...item, isSelected: false })));
  };

  const handleBulkAdd = async () => {
    const selectedItems = selections.filter(s => s.isSelected && s.quantity > 0);
    
    if (selectedItems.length === 0) {
      alert('Välj minst en resurs med kvantitet > 0');
      return;
    }

    setLoading(true);
    setSuccessMessage('');

    try {
      let addedCount = 0;
      let updatedCount = 0;

      for (const item of selectedItems) {
        if (item.existingId) {
          // Update existing resource
          await resourceService.updateResource(item.existingId, {
            quantity: item.quantity,
            days_remaining: item.days_remaining,
            is_filled: item.quantity > 0
          });
          updatedCount++;
        } else {
          // Add new resource
          await resourceService.addResource({
            user_id: userId,
            name: item.name,
            category: item.category,
            quantity: item.quantity,
            unit: item.unit,
            days_remaining: item.days_remaining,
            is_msb_recommended: true,
            msb_priority: 'high',
            is_filled: item.quantity > 0
          });
          addedCount++;
        }
      }

      setSuccessMessage(`✅ ${addedCount} nya resurser tillagda, ${updatedCount} uppdaterade!`);
      
      // Reset selections after 2 seconds and close
      setTimeout(() => {
        setSuccessMessage('');
        handleDeselectAll();
        onSuccess?.();
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Error bulk adding MSB resources:', error);
      alert('Ett fel uppstod när resurserna skulle läggas till');
    } finally {
      setLoading(false);
    }
  };

  // Filter selections by category
  const filteredSelections = useMemo(() => {
    if (filterCategory === 'all') return selections;
    return selections.filter(s => s.category === filterCategory);
  }, [selections, filterCategory]);

  // Calculate statistics
  const stats = useMemo(() => {
    const selected = selections.filter(s => s.isSelected);
    const categories = new Set(selected.map(s => s.category));
    return {
      totalSelected: selected.length,
      categoriesCovered: categories.size,
      totalItems: selections.length,
      existingItems: selections.filter(s => s.existingId).length
    };
  }, [selections]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3D4A2B] to-[#5C6B47] flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Lägg till MSB-resurser
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Välj och lägg till flera MSB-rekommenderade resurser samtidigt
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
              aria-label="Stäng"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Stats Bar */}
          <div className="mt-4 flex items-center gap-4 p-4 bg-gradient-to-r from-[#3D4A2B]/5 to-[#5C6B47]/5 rounded-xl">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-[#3D4A2B]" />
              <span className="text-sm font-medium text-gray-900">
                {stats.totalSelected} valda
              </span>
            </div>
            <div className="w-px h-6 bg-gray-300" />
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-[#5C6B47]" />
              <span className="text-sm font-medium text-gray-900">
                {stats.categoriesCovered}/6 kategorier
              </span>
            </div>
            <div className="w-px h-6 bg-gray-300" />
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <span className="text-sm font-medium text-gray-900">
                {stats.existingItems} redan tillagda
              </span>
            </div>
          </div>

          {/* Category Filter */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterCategory === 'all'
                  ? 'bg-[#3D4A2B] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Alla ({selections.length})
            </button>
            {Object.keys(categoryConfig).map((cat) => {
              const count = selections.filter(s => s.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterCategory === cat
                      ? 'bg-[#3D4A2B] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {categoryConfig[cat as keyof typeof categoryConfig].emoji}{' '}
                  {categoryConfig[cat as keyof typeof categoryConfig].label} ({count})
                </button>
              );
            })}
          </div>

          {/* Bulk Actions */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => handleSelectAll(filterCategory === 'all' ? undefined : filterCategory)}
              className="px-4 py-2 rounded-lg bg-[#5C6B47] text-white text-sm font-medium hover:bg-[#4A5239] transition-colors"
            >
              Välj alla {filterCategory !== 'all' && `(${categoryConfig[filterCategory as keyof typeof categoryConfig]?.label})`}
            </button>
            <button
              onClick={handleDeselectAll}
              className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-300 transition-colors"
            >
              Avmarkera alla
            </button>
          </div>
        </div>

        {/* Scrollable Table View */}
        <div className="flex-1 overflow-y-auto">
          {filteredSelections.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Inga MSB-resurser i denna kategori
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="w-12 px-4 py-3 text-left">
                    <div className="w-5 h-5" /> {/* Checkbox placeholder */}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Resurs
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Kategori
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-48">
                    Antal
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSelections.map((item, index) => {
                  const actualIndex = selections.findIndex(s => s === item);
                  return (
                    <tr
                      key={`${item.category}-${item.name}-${index}`}
                      className={`transition-colors ${
                        item.isSelected
                          ? 'bg-[#3D4A2B]/5 hover:bg-[#3D4A2B]/10'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleSelection(actualIndex)}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            item.isSelected
                              ? 'bg-[#3D4A2B] border-[#3D4A2B]'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {item.isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                        </button>
                      </td>

                      {/* Resource Name */}
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">
                          {item.name}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                          {categoryConfig[item.category as keyof typeof categoryConfig]?.emoji}
                          <span className="hidden sm:inline">
                            {categoryConfig[item.category as keyof typeof categoryConfig]?.label}
                          </span>
                        </span>
                      </td>

                      {/* Quantity Input */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-center">
                          <input
                            type="number"
                            min="0"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(actualIndex, e.target.value)}
                            className={`w-20 px-2 py-1.5 border rounded text-sm text-center focus:outline-none focus:ring-2 ${
                              item.isSelected
                                ? 'border-[#3D4A2B] focus:ring-[#3D4A2B]/20 bg-white'
                                : 'border-gray-300 focus:ring-gray-200 bg-gray-50'
                            }`}
                            disabled={!item.isSelected}
                          />
                          <span className="text-xs text-gray-600 min-w-[60px]">
                            {item.unit}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        {item.existingId ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">
                            <AlertTriangle className="w-3 h-3" />
                            <span className="hidden sm:inline">
                              Har {item.existingQuantity}
                            </span>
                            <span className="sm:hidden">
                              {item.existingQuantity}
                            </span>
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">
                            Ny
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex-shrink-0">
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm font-medium">
              {successMessage}
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Avbryt
            </button>
            <button
              onClick={handleBulkAdd}
              disabled={loading || stats.totalSelected === 0}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#3D4A2B] to-[#5C6B47] text-white font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Lägger till...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Lägg till {stats.totalSelected} resurser
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

