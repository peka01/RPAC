'use client';

import { Pencil, Trash, Share2, AlertTriangle, Users, CheckCircle, Clock, Image as ImageIcon } from 'lucide-react';
import { Resource } from '@/lib/supabase';
import { SharedResource } from '@/lib/resource-sharing-service';
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

interface ResourceMiniCardProps {
  resource: Resource;
  onEdit: (resource: Resource) => void;
  onDelete: (resource: Resource) => void;
  onShare?: (resource: Resource) => void;
  sharedResource?: SharedResource;
}

export function ResourceMiniCard({
  resource,
  onEdit,
  onDelete,
  onShare,
  sharedResource
}: ResourceMiniCardProps) {
  const config = categoryConfig[resource.category as CategoryKey];
  const isEmpty = resource.quantity === 0;
  const isExpiringSoon = resource.quantity > 0 && resource.days_remaining < 30 && resource.days_remaining < 99999;
  const isExpired = resource.quantity > 0 && resource.days_remaining <= 0;
  const isUrgent = isEmpty || isExpired;

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('🗑️ Mini card delete clicked for:', resource.name, {
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

  const getDurabilityDisplay = () => {
    if (resource.days_remaining >= 99999) return '∞';
    if (resource.days_remaining <= 0) return 'Utgången';
    if (resource.days_remaining < 30) return `${resource.days_remaining}d`;
    if (resource.days_remaining < 365) return `${Math.round(resource.days_remaining / 30)}mån`;
    return `${Math.round(resource.days_remaining / 365)}år`;
  };

  return (
    <div 
      className={`group flex items-center gap-2 px-3 py-2 mb-1.5 rounded-lg border transition-all hover:shadow-md relative ${
        isEmpty ? 'bg-gray-50 border-gray-300' : 'bg-white border-gray-200 hover:border-gray-300'
      }`}
      style={{ minHeight: '48px', fontSize: '0.9rem' }}
    >
      {/* Urgent indicator */}
      {isUrgent && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-l-lg" />
      )}


      {/* Name */}
      <div className="flex-1 min-w-0">
        <div className={`font-semibold truncate flex items-center gap-1.5 ${isEmpty ? 'text-gray-500' : 'text-gray-900'}`}>
          {resource.name}
          {resource.photo_url && (
            <ImagePreviewIcon imageUrl={resource.photo_url} size={12} />
          )}
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

      {/* Sharing Status Badge */}
      {sharedResource && (
        <div className={`flex-shrink-0 text-xs font-medium px-2 py-1 rounded flex items-center gap-1 ${
          sharedResource.status === 'available' 
            ? 'bg-green-100 text-green-700' 
            : sharedResource.status === 'requested'
            ? 'bg-yellow-100 text-yellow-700'
            : 'bg-blue-100 text-blue-700'
        }`}>
          {sharedResource.status === 'available' && <Users size={12} />}
          {sharedResource.status === 'requested' && <Clock size={12} />}
          {sharedResource.status === 'taken' && <CheckCircle size={12} />}
          <span>
            {sharedResource.status === 'available' ? 'Delad' :
             sharedResource.status === 'requested' ? 'Begärd' : 'Hämtad'}
          </span>
        </div>
      )}

      {/* Action Buttons - Always Visible */}
      <div className="flex items-center gap-1">
        {/* Edit Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(resource);
          }}
          className="flex-shrink-0 p-2 text-gray-400 hover:text-[#3D4A2B] hover:bg-[#3D4A2B]/10 rounded-lg transition-colors"
          aria-label={t('dashboard.click_to_edit')}
          title="Redigera"
        >
          <Pencil size={16} />
        </button>

        {/* Share Button */}
        {onShare && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare(resource);
            }}
            className="flex-shrink-0 p-2 text-gray-400 hover:text-[#556B2F] hover:bg-[#556B2F]/10 rounded-lg transition-colors"
            aria-label="Dela lokalt"
            title="Dela lokalt"
          >
            <Share2 size={16} />
          </button>
        )}

        {/* Delete Button */}
        <button
          onClick={handleDeleteClick}
          className="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          aria-label="Ta bort"
          title="Ta bort"
        >
          <Trash size={16} />
        </button>
      </div>
    </div>
  );
}

