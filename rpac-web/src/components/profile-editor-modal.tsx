'use client';

import { useState, useEffect } from 'react';
import { X, Save, User, Home, MapPin, Users, Target, Thermometer } from 'lucide-react';

interface UserProfile {
  household_size: number;
  has_children: boolean;
  has_elderly: boolean;
  has_pets: boolean;
  city: string;
  county: string;
  address: string;
  allergies: string;
  special_needs: string;
  garden_size: number;
  experience_level: 'beginner' | 'intermediate' | 'advanced';
  climate_zone: 'Götaland' | 'Svealand' | 'Norrland';
}

interface ProfileEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSave: (updatedProfile: UserProfile) => void;
}

export function ProfileEditorModal({ isOpen, onClose, profile, onSave }: ProfileEditorModalProps) {
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof UserProfile, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold flex items-center space-x-2">
            <User className="w-5 h-5" style={{ color: 'var(--color-sage)' }} />
            <span>Redigera profil</span>
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Household Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <Users className="w-5 h-5" style={{ color: 'var(--color-sage)' }} />
              <span>Hushållsinformation</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Antal personer i hushållet
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={formData.household_size}
                  onChange={(e) => handleInputChange('household_size', parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Trädgårdsstorlek (m²)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={formData.garden_size}
                  onChange={(e) => handleInputChange('garden_size', parseInt(e.target.value) || 50)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.has_children}
                  onChange={(e) => handleInputChange('has_children', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">Har barn</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.has_elderly}
                  onChange={(e) => handleInputChange('has_elderly', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">Har äldre</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.has_pets}
                  onChange={(e) => handleInputChange('has_pets', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">Har husdjur</span>
              </label>
            </div>
          </div>

          {/* Location Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <MapPin className="w-5 h-5" style={{ color: 'var(--color-sage)' }} />
              <span>Platsinformation</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Stad
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="T.ex. Stockholm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Län
                </label>
                <input
                  type="text"
                  value={formData.county}
                  onChange={(e) => handleInputChange('county', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="T.ex. Stockholms län"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Adress (valfritt)
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Din adress för mer exakt väderdata"
              />
            </div>
          </div>

          {/* Garden Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <Home className="w-5 h-5" style={{ color: 'var(--color-sage)' }} />
              <span>Odlingsinformation</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Erfarenhetsnivå
                </label>
                <select
                  value={formData.experience_level}
                  onChange={(e) => handleInputChange('experience_level', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="beginner">Nybörjare</option>
                  <option value="intermediate">Medel</option>
                  <option value="advanced">Avancerad</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Klimatzon (beräknas från län)
                </label>
                <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {formData.climate_zone}
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  Klimatzonen beräknas automatiskt baserat på ditt län
                </p>
              </div>
            </div>
          </div>

          {/* Special Needs */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <Target className="w-5 h-5" style={{ color: 'var(--color-sage)' }} />
              <span>Särskilda behov</span>
            </h3>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Allergier (valfritt)
              </label>
              <textarea
                value={formData.allergies}
                onChange={(e) => handleInputChange('allergies', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
                placeholder="T.ex. nötallergi, glutenfri kost..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Särskilda behov (valfritt)
              </label>
              <textarea
                value={formData.special_needs}
                onChange={(e) => handleInputChange('special_needs', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
                placeholder="T.ex. vegetarisk kost, höga proteinbehov..."
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Avbryt
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-lg disabled:opacity-50"
            style={{ 
              backgroundColor: 'var(--color-sage)',
              color: 'white'
            }}
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Sparar...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Spara profil</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
