'use client';

import { useState } from 'react';
import { t } from '@/lib/locales';
import { Globe, Edit, Eye, ExternalLink, Lock, Unlock } from 'lucide-react';

interface HomespaceAdminCardProps {
  communityId: string;
  communityName: string;
  homespaceSlug?: string;
  isPublished?: boolean;
  onEditClick: () => void;
}

export default function HomespaceAdminCard({
  communityId,
  communityName,
  homespaceSlug,
  isPublished = false,
  onEditClick
}: HomespaceAdminCardProps) {

  return (
    <div className="bg-gradient-to-br from-[#5C6B47] to-[#3D4A2B] rounded-2xl shadow-lg p-6 text-white">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <Globe size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg">{t('homespace.title')}</h3>
            <p className="text-sm text-white/80">
              {isPublished ? (
                <span className="flex items-center gap-1">
                  <Unlock size={14} />
                  {t('homespace.published')}
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Lock size={14} />
                  {t('homespace.draft')}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      <p className="text-sm text-white/90 mb-6">
        {isPublished 
          ? t('homespace.homepage_live', { slug: homespaceSlug || '' })
          : t('homespace.create_homepage')
        }
      </p>

      <div className="flex gap-3">
        <button
          onClick={onEditClick}
          className="flex-1 bg-white text-[#3D4A2B] px-4 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
        >
          <Edit size={18} />
          {t('homespace.edit')}
        </button>

        {isPublished && homespaceSlug && (
          <a
            href={`/${homespaceSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-white/20 backdrop-blur-sm text-white px-4 py-3 rounded-xl font-semibold hover:bg-white/30 transition-all flex items-center justify-center gap-2 border border-white/30"
          >
            <Eye size={18} />
            {t('homespace.view_public')}
          </a>
        )}
      </div>

      {!isPublished && (
        <div className="mt-4 pt-4 border-t border-white/20">
          <p className="text-xs text-white/70">
            {t('homespace.homepage_benefit')}
          </p>
        </div>
      )}
    </div>
  );
}

