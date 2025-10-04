'use client';

import { useState } from 'react';
import { Pencil, Trash, Share2, Shield, CheckCircle, AlertTriangle, Calendar, Package } from 'lucide-react';
import { Resource } from '@/lib/supabase';

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const config = categoryConfig[resource.category as CategoryKey];
  
  const isExpiringSoon = resource.is_filled && resource.days_remaining < 30 && resource.days_remaining < 99999;
  const isExpired = resource.is_filled && resource.days_remaining <= 0;

  const handleDeleteClick = () => {
    if (showDeleteConfirm) {
      onDelete(resource);
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all border-2 border-gray-100 hover:border-gray-200">
      {/* Header */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="text-3xl flex-shrink-0">
              {config.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-gray-900 truncate">
                  {resource.name}
                </h3>
                {resource.is_msb_recommended && (
                  <div className="flex-shrink-0 bg-[#556B2F]/10 text-[#556B2F] px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                    <Shield size={12} />
                    MSB
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600">
                {config.label}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          {resource.is_filled && (
            <div className="flex-shrink-0 ml-3">
              {isExpired ? (
                <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                  <AlertTriangle size={12} />
                  Utgången
                </div>
              ) : isExpiringSoon ? (
                <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                  <AlertTriangle size={12} />
                  Utgår snart
                </div>
              ) : (
                <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                  <CheckCircle size={12} />
                  Ifylld
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="p-5">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              <Package size={12} />
              Antal
            </div>
            <div className="text-lg font-bold text-gray-900">
              {resource.quantity} {resource.unit}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              <Calendar size={12} />
              Hållbarhet
            </div>
            <div className="text-lg font-bold text-gray-900">
              {resource.days_remaining >= 99999 
                ? 'Obegränsad' 
                : `${resource.days_remaining} dagar`}
            </div>
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 pt-4 border-t border-gray-100">
            <button
              onClick={() => onEdit(resource)}
              className="flex-1 px-4 py-2 bg-[#3D4A2B] text-white rounded-lg font-medium hover:bg-[#2A331E] transition-colors flex items-center justify-center gap-2"
            >
              <Pencil size={16} />
              Redigera
            </button>
            
            {onShare && (
              <button
                onClick={() => onShare(resource)}
                className="px-4 py-2 bg-gradient-to-r from-[#556B2F] to-[#3D4A2B] text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
                title="Dela till samhälle"
              >
                <Share2 size={16} />
              </button>
            )}
            
            <button
              onClick={handleDeleteClick}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                showDeleteConfirm
                  ? 'bg-red-600 text-white'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
              title={showDeleteConfirm ? 'Klicka igen för att bekräfta' : 'Ta bort'}
            >
              <Trash size={16} />
              {showDeleteConfirm && <span className="text-xs">Bekräfta?</span>}
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const config = categoryConfig[resource.category as CategoryKey];
  
  const isExpiringSoon = resource.is_filled && resource.days_remaining < 30 && resource.days_remaining < 99999;
  const isExpired = resource.is_filled && resource.days_remaining <= 0;

  const handleDeleteClick = () => {
    if (showDeleteConfirm) {
      onDelete(resource);
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
      setTimeout(() => setShowDeleteConfirm(false), 3000);
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
          {resource.quantity} {resource.unit}
        </span>
      </td>

      {/* Expiry */}
      <td className="px-4 py-3 text-center">
        <span className="font-semibold text-gray-900">
          {resource.days_remaining >= 99999 ? '∞' : `${resource.days_remaining}d`}
        </span>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        {resource.is_filled && (
          isExpired ? (
            <div className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-medium">
              <AlertTriangle size={12} />
              Utgången
            </div>
          ) : isExpiringSoon ? (
            <div className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-medium">
              <AlertTriangle size={12} />
              Utgår snart
            </div>
          ) : (
            <div className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
              <CheckCircle size={12} />
              Ifylld
            </div>
          )
        )}
      </td>

      {/* Actions */}
      {showActions && (
        <td className="px-4 py-3">
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => onEdit(resource)}
              className="p-2 text-[#3D4A2B] hover:bg-[#3D4A2B]/10 rounded-lg transition-colors"
              title="Redigera"
            >
              <Pencil size={18} />
            </button>
            
            {onShare && (
              <button
                onClick={() => onShare(resource)}
                className="p-2 text-[#556B2F] hover:bg-[#556B2F]/10 rounded-lg transition-colors"
                title="Dela till samhälle"
              >
                <Share2 size={18} />
              </button>
            )}
            
            <button
              onClick={handleDeleteClick}
              className={`p-2 rounded-lg transition-colors ${
                showDeleteConfirm
                  ? 'bg-red-600 text-white'
                  : 'text-red-600 hover:bg-red-100'
              }`}
              title={showDeleteConfirm ? 'Klicka igen för att bekräfta' : 'Ta bort'}
            >
              <Trash size={18} />
            </button>
          </div>
        </td>
      )}
    </>
  );
}

