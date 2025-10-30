'use client';

import { useState } from 'react';
import { Pencil, Trash, Share2, Shield, CheckCircle, AlertTriangle, Calendar, Package, HelpCircle, Image as ImageIcon } from 'lucide-react';
import { Resource } from '@/lib/supabase';
import { t } from '@/lib/locales';
import { ImagePreviewIcon } from './image-preview-icon';

const categoryConfig = {
  food: { emoji: '🍞', label: 'Mat' },
  water: { emoji: '💧', label: 'Vatten' },
  medicine: { emoji: '💊', label: 'Medicin' },
  energy: { emoji: '⚡', label: 'Energi' },
  tools: { emoji: '🔧', label: 'Verktyg' },
  machinery: { emoji: '🚜', label: 'Maskiner' },
  other: { emoji: '✨', label: 'Övrigt' }
};

type CategoryKey = keyof typeof categoryConfig;

interface ResourceCardWithActionsProps {
  resource: Resource;
  onEdit: (resource: Resource) => void;
  onDelete: (resource: Resource) => void;
  onShare?: (resource: Resource) => void;
  showActions?: boolean;
}

export function ResourceCardWithActions({
  resource,
  onEdit,
  onDelete,
  onShare,
  showActions = true
}: ResourceCardWithActionsProps) {
  const config = categoryConfig[resource.category as CategoryKey];
  
  const isExpiringSoon = resource.quantity > 0 && resource.days_remaining < 30 && resource.days_remaining < 99999;
  const isExpired = resource.quantity > 0 && resource.days_remaining <= 0;
  const isEmpty = resource.quantity === 0;

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    console.log('🗑️ Delete button clicked for:', resource.name, {
      resourceId: resource.id
    });
    
    // Use native confirm dialog for better reliability
    if (window.confirm(`Är du säker på att du vill ta bort ${resource.name}?`)) {
      console.log('✅ User confirmed delete for:', resource.name);
      onDelete(resource);
    } else {
      console.log('❌ User cancelled delete for:', resource.name);
    }
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (onShare) onShare(resource);
  };

  // Make entire card clickable to edit
  const handleCardClick = () => {
    onEdit(resource);
  };

  return (
    <div
      className={`relative rounded-xl shadow-md hover:shadow-xl transition-all border hover:border-[#3D4A2B] cursor-pointer ${
        isEmpty 
          ? 'bg-gray-50 border-gray-300' 
          : 'bg-white border-gray-200'
      }`}
    >
      {/* Clickable overlay to make entire card clickable */}
      <div
        onClick={handleCardClick}
        className="absolute inset-0 z-0 cursor-pointer"
        role="button"
        tabIndex={0}
        aria-label={`${resource.name}: ${resource.quantity} ${resource.unit}. ${t('dashboard.click_to_edit')}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCardClick();
          }
        }}
      />
      {/* Subtle Empty Indicator */}
      {isEmpty && (
        <div className="absolute top-3 right-3 bg-gray-200 text-gray-500 p-2 rounded-lg z-10">
          <AlertTriangle size={16} strokeWidth={2} />
        </div>
      )}

      {/* Subtle pattern overlay for color-blind accessibility - below all content */}
      {isEmpty && (
        <div className="absolute inset-0 opacity-3 pointer-events-none rounded-xl z-0" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, #ccc 0, #ccc 1px, transparent 1px, transparent 12px)'
        }}></div>
      )}

      {/* Header */}
      <div className="p-6 border-b border-gray-100 relative z-20">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="text-4xl flex-shrink-0">
              {config.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <h3 className="font-bold text-lg text-gray-900 break-words min-w-0">
                  {resource.name}
                </h3>
                {resource.photo_url && (
                  <ImagePreviewIcon imageUrl={resource.photo_url} size={14} />
                )}
                {resource.is_msb_recommended && (
                  <div className="flex-shrink-0 bg-[#556B2F]/10 text-[#556B2F] px-2 py-1 rounded text-xs font-bold flex items-center gap-1 relative group/tooltip whitespace-nowrap">
                    <Shield size={12} />
                    MSB
                    {/* Tooltip */}
                    <div className="absolute left-0 top-full mt-1 w-64 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-20 pointer-events-none">
                      {t('individual.msb_tooltip')}
                    </div>
                  </div>
                )}
              </div>
              <p className="text-sm font-medium text-gray-600">
                {config.label}
              </p>
            </div>
          </div>

          {/* Status Badge - Only show warnings */}
          {resource.quantity > 0 && (isExpired || isExpiringSoon) && (
            <div className="flex-shrink-0 ml-3">
              {isExpired ? (
                <div className="bg-[#8B4513]/10 text-[#8B4513] px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm whitespace-nowrap">
                  <AlertTriangle size={12} />
                  Utgången
                </div>
              ) : (
                <div className="bg-[#B8860B]/10 text-[#B8860B] px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm whitespace-nowrap">
                  <AlertTriangle size={12} />
                  Utgår snart
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="p-6 relative z-20">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-xs text-gray-500 font-semibold mb-1.5 flex items-center gap-1">
              <Package size={14} />
              Antal
            </div>
            <div className="text-xl font-black text-gray-900">
              {resource.quantity} {resource.unit.replace(/stycken/gi, 'st').replace(/styck/gi, 'st')}
            </div>
          </div>
          <div className="relative group/tooltip">
            <div className="text-xs text-gray-500 font-semibold mb-1.5 flex items-center gap-1">
              <Calendar size={14} />
              Hållbarhet
              <HelpCircle size={12} className="text-gray-400" />
            </div>
            <div className="text-xl font-black text-gray-900">
              {resource.days_remaining >= 99999 
                ? 'Obegränsad' 
                : `${resource.days_remaining} dagar`}
            </div>
            {/* Tooltip */}
            <div className="absolute left-0 top-full mt-1 w-64 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-20">
              {t('dashboard.days_remaining_tooltip')}
            </div>
          </div>
        </div>

        {/* Soft Empty State Message */}
        {isEmpty && (
          <div className="mb-4 p-3 bg-gray-100 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-600 font-medium">
              {t('dashboard.add_to_improve_preparedness')}
            </p>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 pt-4 border-t border-gray-100 relative z-20">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(resource); }}
              className="flex-1 px-5 py-3 bg-[#3D4A2B] text-white rounded-lg font-bold hover:bg-[#2A331E] transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg min-h-[48px]"
              aria-label="Redigera resurs"
            >
              <Pencil size={18} />
              Redigera
            </button>
            
            {onShare && (
              <button
                onClick={handleShareClick}
                className="px-5 py-3 bg-gradient-to-r from-[#556B2F] to-[#3D4A2B] text-white rounded-lg font-bold hover:shadow-xl transition-all flex items-center justify-center gap-2 shadow-md min-h-[48px]"
                title="Dela till samhälle"
                aria-label="Dela resurs till samhälle"
              >
                <Share2 size={18} />
              </button>
            )}
            
            <button
              onClick={handleDeleteClick}
              className="px-5 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 min-h-[48px] bg-[#8B4513]/10 text-[#8B4513] hover:bg-[#8B4513]/20 shadow-md hover:shadow-lg"
              title="Ta bort"
              aria-label="Ta bort resurs"
            >
              <Trash size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Table row version for ResourceListView
export function ResourceTableRow({
  resource,
  onEdit,
  onDelete,
  onShare,
  showActions = true
}: ResourceCardWithActionsProps) {
  const config = categoryConfig[resource.category as CategoryKey];
  
  const isExpiringSoon = resource.quantity > 0 && resource.days_remaining < 30 && resource.days_remaining < 99999;
  const isExpired = resource.quantity > 0 && resource.days_remaining <= 0;

  const handleDeleteClick = () => {
    console.log('🗑️ Table delete button clicked for:', resource.name, {
      resourceId: resource.id
    });
    
    // Use native confirm dialog for better reliability
    if (window.confirm(`Är du säker på att du vill ta bort ${resource.name}?`)) {
      console.log('✅ User confirmed delete for:', resource.name);
      onDelete(resource);
    } else {
      console.log('❌ User cancelled delete for:', resource.name);
    }
  };

  return (
    <>
      {/* Category */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{config.emoji}</span>
          <span className="text-sm font-medium text-gray-700">{config.label}</span>
        </div>
      </td>

      {/* Name */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-900">{resource.name}</span>
          {resource.photo_url && (
            <ImagePreviewIcon imageUrl={resource.photo_url} size={14} />
          )}
          {resource.is_msb_recommended && (
            <div className="bg-[#556B2F]/10 text-[#556B2F] px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1">
              <Shield size={10} />
              MSB
            </div>
          )}
        </div>
      </td>

      {/* Quantity */}
      <td className="px-4 py-3 text-center">
        <span className="font-semibold text-gray-900">
          {resource.quantity} {resource.unit.replace(/stycken/gi, 'st').replace(/styck/gi, 'st')}
        </span>
      </td>

      {/* Expiry */}
      <td className="px-4 py-3 text-center">
        <span className="font-semibold text-gray-900">
          {resource.days_remaining >= 99999 ? '∞' : `${resource.days_remaining}d`}
        </span>
      </td>

      {/* Status - Only show warnings */}
      <td className="px-4 py-3">
        {resource.quantity > 0 && (
          isExpired ? (
            <div className="inline-flex items-center gap-1 bg-[#8B4513]/10 text-[#8B4513] px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">
              <AlertTriangle size={12} />
              Utgången
            </div>
          ) : isExpiringSoon ? (
            <div className="inline-flex items-center gap-1 bg-[#B8860B]/10 text-[#B8860B] px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">
              <AlertTriangle size={12} />
              Utgår snart
            </div>
          ) : null
        )}
      </td>

      {/* Actions */}
      {showActions && (
        <td className="px-4 py-3">
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => onEdit(resource)}
              className="p-3 text-[#3D4A2B] hover:bg-[#3D4A2B]/10 rounded-lg transition-all shadow-sm hover:shadow-md min-w-[48px] min-h-[48px] flex items-center justify-center"
              title="Redigera"
              aria-label="Redigera resurs"
            >
              <Pencil size={20} />
            </button>
            
            {onShare && (
              <button
                onClick={() => onShare(resource)}
                className="p-3 text-[#556B2F] hover:bg-[#556B2F]/10 rounded-lg transition-all shadow-sm hover:shadow-md min-w-[48px] min-h-[48px] flex items-center justify-center"
                title="Dela till samhälle"
                aria-label="Dela resurs till samhälle"
              >
                <Share2 size={20} />
              </button>
            )}
            
            <button
              onClick={handleDeleteClick}
              className="p-3 rounded-lg transition-all min-w-[48px] min-h-[48px] flex items-center justify-center text-[#8B4513] hover:bg-[#8B4513]/10 shadow-sm hover:shadow-md"
              title="Ta bort"
              aria-label="Ta bort resurs"
            >
              <Trash size={20} />
            </button>
          </div>
        </td>
      )}
    </>
  );
}

