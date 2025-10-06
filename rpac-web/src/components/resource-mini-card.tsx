'use client';

import { useState } from 'react';
import { Pencil, Trash, Share2, MoreVertical, AlertTriangle } from 'lucide-react';
import { Resource } from '@/lib/supabase';
import { t } from '@/lib/locales';

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

interface ResourceMiniCardProps {
  resource: Resource;
  onEdit: (resource: Resource) => void;
  onDelete: (resource: Resource) => void;
  onShare?: (resource: Resource) => void;
}

export function ResourceMiniCard({
  resource,
  onEdit,
  onDelete,
  onShare
}: ResourceMiniCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const config = categoryConfig[resource.category as CategoryKey];
  const isEmpty = resource.quantity === 0;
  const isExpiringSoon = resource.quantity > 0 && resource.days_remaining < 30 && resource.days_remaining < 99999;
  const isExpired = resource.quantity > 0 && resource.days_remaining <= 0;
  const isUrgent = isEmpty || isExpired;

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showDeleteConfirm) {
      onDelete(resource);
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
    setShowMenu(false);
  };

  const getDurabilityDisplay = () => {
    if (resource.days_remaining >= 99999) return '∞';
    if (resource.days_remaining <= 0) return 'Utgången';
    if (resource.days_remaining < 30) return `${resource.days_remaining}d`;
    if (resource.days_remaining < 365) return `${Math.round(resource.days_remaining / 30)}mån`;
    return `${Math.round(resource.days_remaining / 365)}år`;
  };

  return (
    <div 
      className={`group flex items-center gap-3 px-3 py-2 mb-1.5 rounded-lg border transition-all hover:shadow-md relative ${
        isEmpty ? 'bg-gray-50 border-gray-300' : 'bg-white border-gray-200 hover:border-gray-300'
      }`}
      style={{ minHeight: '48px', fontSize: '0.9rem' }}
    >
      {/* Urgent indicator */}
      {isUrgent && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-l-lg" />
      )}

      {/* Icon */}
      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-xl">
        {config.emoji}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <div className={`font-semibold truncate ${isEmpty ? 'text-gray-500' : 'text-gray-900'}`}>
          {resource.name}
        </div>
      </div>

      {/* Quantity */}
      <div className={`flex-shrink-0 font-bold text-sm ${isEmpty ? 'text-gray-400' : 'text-gray-900'}`}>
        {resource.quantity} {resource.unit.replace(/stycken/gi, 'st').replace(/styck/gi, 'st')}
      </div>

      {/* Durability */}
      <div 
        className={`flex-shrink-0 text-xs font-medium px-2 py-1 rounded ${
          isExpired 
            ? 'bg-red-100 text-red-700' 
            : isExpiringSoon 
            ? 'bg-amber-100 text-amber-700' 
            : 'bg-gray-100 text-gray-600'
        }`}
      >
        {getDurabilityDisplay()}
      </div>

      {/* MSB Badge (subtle) */}
      {resource.is_msb_recommended && (
        <div className="flex-shrink-0 text-xs font-medium px-1.5 py-0.5 rounded bg-[#3D4A2B]/10 text-[#3D4A2B]">
          MSB
        </div>
      )}

      {/* Quick Edit Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit(resource);
        }}
        className="flex-shrink-0 p-2 text-gray-400 hover:text-[#3D4A2B] hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
        aria-label={t('dashboard.click_to_edit')}
      >
        <Pencil size={16} />
      </button>

      {/* More Actions Menu */}
      <div className="relative flex-shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
          aria-label="Fler alternativ"
        >
          <MoreVertical size={16} />
        </button>

        {/* Dropdown Menu */}
        {showMenu && (
          <>
            <div 
              className="fixed inset-0 z-[100]"
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-[110]">
              {onShare && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onShare(resource);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Share2 size={14} />
                  Dela lokalt
                </button>
              )}
              <button
                onClick={handleDeleteClick}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash size={14} />
                {showDeleteConfirm ? 'Bekräfta radering' : 'Radera'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

