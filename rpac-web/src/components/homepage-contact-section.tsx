'use client';

import { t } from '@/lib/locales';
import { Mail, Phone, MapPin, Facebook, Instagram, Link as LinkIcon, Edit3, Check, X } from 'lucide-react';
import { useState } from 'react';

interface ContactInfo {
  email?: string;
  phone?: string;
  address?: string;
  facebook?: string;
  instagram?: string;
  other_social?: string;
}

interface HomepageContactSectionProps {
  contactInfo: ContactInfo;
  onUpdate: (info: ContactInfo) => void;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function HomepageContactSection({
  contactInfo,
  onUpdate,
  isEditing,
  onEdit,
  onSave,
  onCancel
}: HomepageContactSectionProps) {
  
  if (isEditing) {
    return (
      <div className="bg-white mx-8 mt-8 rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">📞 {t('homespace.editor.contact_section')}</h2>
        
        <div className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-900">
              <Mail size={16} className="inline mr-2" />
              {t('homespace.editor.contact_email')}
            </label>
            <input
              type="email"
              value={contactInfo.email || ''}
              onChange={(e) => onUpdate({ ...contactInfo, email: e.target.value })}
              placeholder="kontakt@exempel.se"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#5C6B47] focus:outline-none"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-900">
              <Phone size={16} className="inline mr-2" />
              {t('homespace.editor.contact_phone')}
            </label>
            <input
              type="tel"
              value={contactInfo.phone || ''}
              onChange={(e) => onUpdate({ ...contactInfo, phone: e.target.value })}
              placeholder="070-123 45 67"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#5C6B47] focus:outline-none"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-900">
              <MapPin size={16} className="inline mr-2" />
              {t('homespace.editor.contact_address')}
            </label>
            <textarea
              value={contactInfo.address || ''}
              onChange={(e) => onUpdate({ ...contactInfo, address: e.target.value })}
              placeholder="Folkets Hus, Stora gatan 1, 123 45 Staden"
              rows={2}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#5C6B47] focus:outline-none"
            />
          </div>

          {/* Social Media */}
          <div className="border-t pt-4 mt-4">
            <h3 className="text-sm font-semibold mb-3 text-gray-900">{t('homespace.editor.social_media')}</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1 text-gray-700">
                  <Facebook size={14} className="inline mr-1" />
                  Facebook
                </label>
                <input
                  type="url"
                  value={contactInfo.facebook || ''}
                  onChange={(e) => onUpdate({ ...contactInfo, facebook: e.target.value })}
                  placeholder="https://facebook.com/ditt-samhalle"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#5C6B47] focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1 text-gray-700">
                  <Instagram size={14} className="inline mr-1" />
                  Instagram
                </label>
                <input
                  type="url"
                  value={contactInfo.instagram || ''}
                  onChange={(e) => onUpdate({ ...contactInfo, instagram: e.target.value })}
                  placeholder="https://instagram.com/ditt-samhalle"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#5C6B47] focus:outline-none text-sm"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <button
              onClick={onSave}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Check size={16} />
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
      </div>
    );
  }

  // Display mode
  const hasAnyContact = contactInfo.email || contactInfo.phone || contactInfo.address || 
                        contactInfo.facebook || contactInfo.instagram;

  return (
    <div className="bg-gradient-to-br from-[#5C6B47]/10 to-[#4A5239]/5 mx-8 mt-8 rounded-2xl shadow-lg p-8 border-2 border-[#5C6B47]/30 group">
      <div className="flex items-start justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900">📞 Kontakta oss</h2>
        <button
          onClick={onEdit}
          className="opacity-0 group-hover:opacity-100 p-2 bg-[#3D4A2B] text-white rounded-lg hover:bg-[#2A331E] transition-all"
        >
          <Edit3 size={16} />
        </button>
      </div>

      {hasAnyContact ? (
        <div className="space-y-4">
          {contactInfo.email && (
            <div className="flex items-start gap-3">
              <Mail size={20} className="text-[#5C6B47] flex-shrink-0 mt-1" />
              <div>
                <div className="text-sm text-gray-600">E-post</div>
                <a href={`mailto:${contactInfo.email}`} className="text-gray-900 hover:text-[#5C6B47] font-medium">
                  {contactInfo.email}
                </a>
              </div>
            </div>
          )}

          {contactInfo.phone && (
            <div className="flex items-start gap-3">
              <Phone size={20} className="text-[#5C6B47] flex-shrink-0 mt-1" />
              <div>
                <div className="text-sm text-gray-600">Telefon</div>
                <a href={`tel:${contactInfo.phone}`} className="text-gray-900 hover:text-[#5C6B47] font-medium">
                  {contactInfo.phone}
                </a>
              </div>
            </div>
          )}

          {contactInfo.address && (
            <div className="flex items-start gap-3">
              <MapPin size={20} className="text-[#5C6B47] flex-shrink-0 mt-1" />
              <div>
                <div className="text-sm text-gray-600">Adress / Mötesplats</div>
                <div className="text-gray-900 whitespace-pre-line">{contactInfo.address}</div>
              </div>
            </div>
          )}

          {(contactInfo.facebook || contactInfo.instagram) && (
            <div className="flex items-start gap-3 pt-4 border-t border-[#5C6B47]/20">
              <LinkIcon size={20} className="text-[#5C6B47] flex-shrink-0 mt-1" />
              <div className="space-y-2">
                <div className="text-sm text-gray-600">Sociala medier</div>
                <div className="flex gap-3">
                  {contactInfo.facebook && (
                    <a 
                      href={contactInfo.facebook} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-gray-900 hover:text-[#5C6B47] font-medium"
                    >
                      <Facebook size={18} />
                      Facebook
                    </a>
                  )}
                  {contactInfo.instagram && (
                    <a 
                      href={contactInfo.instagram} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-gray-900 hover:text-[#5C6B47] font-medium"
                    >
                      <Instagram size={18} />
                      Instagram
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-gray-500 italic">Klicka på pennikonen för att lägga till kontaktinformation...</p>
      )}
    </div>
  );
}

