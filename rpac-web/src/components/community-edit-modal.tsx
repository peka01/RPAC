'use client';

import { useState, useEffect } from 'react';
import { X, Edit, Loader } from 'lucide-react';
import { communityService, type LocalCommunity, supabase } from '@/lib/supabase';
import { t } from '@/lib/locales';

interface CommunityEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  community: LocalCommunity;
  onUpdate: (updatedCommunity: LocalCommunity) => void;
}

export function CommunityEditModal({ isOpen, onClose, community, onUpdate }: CommunityEditModalProps) {
  const [updating, setUpdating] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    isPublic: true,
    accessType: 'öppet' as 'öppet' | 'stängt',
    autoApproveMembers: true,
    slug: ''
  });
  const [originalSlug, setOriginalSlug] = useState<string>('');
  const [justUpdated, setJustUpdated] = useState<boolean>(false);

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen && community && !justUpdated) {
      loadCurrentSlug();
    }
    // Reset the flag when modal closes
    if (!isOpen) {
      setJustUpdated(false);
    }
  }, [isOpen, community, justUpdated]);

  const loadCurrentSlug = async () => {
    if (!community?.id) return;
    
    console.log('🔍 Loading current slug for community:', community.id);
    try {
      // Add a longer delay to ensure database consistency
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Add cache-busting by using a timestamp parameter
      const cacheBuster = Date.now();
      const { data, error } = await supabase
        .from('community_homespaces')
        .select('slug')
        .eq('community_id', community.id)
        .single();
      
      console.log('🔍 Current slug query result:', { data, error });
      const currentSlug = data?.slug || '';
      console.log('🔍 Setting slug to:', currentSlug);
      setOriginalSlug(currentSlug); // Store the original slug for comparison
      
      const newForm = {
        name: community.community_name,
        description: community.description || '',
        isPublic: community.is_public ?? true,
        accessType: (community as any).access_type || 'öppet',
        autoApproveMembers: (community as any).auto_approve_members ?? true,
        slug: currentSlug
      };
      console.log('🔍 Setting edit form to:', newForm);
      setEditForm(newForm);
    } catch (error) {
      console.error('Error loading homespace slug:', error);
      setOriginalSlug(''); // No original slug if none exists
      // Set form with empty slug if error
      setEditForm({
        name: community.community_name,
        description: community.description || '',
        isPublic: community.is_public ?? true,
        accessType: (community as any).access_type || 'öppet',
        autoApproveMembers: (community as any).auto_approve_members ?? true,
        slug: ''
      });
    }
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 CommunityEditModal submitEdit called');
    console.log('🚀 Community:', community?.id);
    console.log('🚀 Form data:', editForm);
    
    if (!community) return;

    setUpdating(true);
    try {
      // Update community data
      await communityService.updateCommunity(community.id, {
        community_name: editForm.name,
        description: editForm.description,
        is_public: editForm.isPublic,
        access_type: editForm.accessType,
        auto_approve_members: editForm.autoApproveMembers
      });

      // Update homespace slug if it has changed
      if (editForm.slug.trim()) {
        console.log('🔍 Updating homespace slug:', editForm.slug.trim());
        // First check if a homespace already exists for this community
        const { data: existingHomespace, error: checkError } = await supabase
          .from('community_homespaces')
          .select('id, slug')
          .eq('community_id', community.id)
          .single();
        
        console.log('🔍 Existing homespace check:', { existingHomespace, checkError });
        
        let slugError;
        const newSlug = editForm.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
        console.log('🔍 New slug will be:', newSlug);
        
        if (existingHomespace) {
          console.log('🔍 Updating existing homespace with ID:', existingHomespace.id);
          // Update existing homespace
          const { error } = await supabase
            .from('community_homespaces')
            .update({
              slug: newSlug
            })
            .eq('community_id', community.id);
          slugError = error;
          console.log('🔍 Update result:', { error: slugError });
          
          // Update the form state directly with the new slug
          if (!slugError) {
            console.log('🔍 Updating form state with new slug:', newSlug);
            setEditForm(prev => ({
              ...prev,
              slug: newSlug
            }));
            setOriginalSlug(newSlug);
            setJustUpdated(true); // Prevent database query from overwriting
          }
        } else {
          console.log('🔍 Creating new homespace for community:', community.id);
          // Create new homespace
          const { error } = await supabase
            .from('community_homespaces')
            .insert({
              community_id: community.id,
              slug: newSlug
            });
          slugError = error;
          console.log('🔍 Insert result:', { error: slugError });
          
          // Update the form state directly with the new slug
          if (!slugError) {
            console.log('🔍 Updating form state with new slug:', newSlug);
            setEditForm(prev => ({
              ...prev,
              slug: newSlug
            }));
            setOriginalSlug(newSlug);
            setJustUpdated(true); // Prevent database query from overwriting
          }
        }
        
        if (slugError) {
          console.error('Error updating homespace slug:', slugError);
          if (slugError.code === '23505') {
            alert('Denna URL är redan upptagen av ett annat samhälle. Välj en annan URL.');
          } else {
            alert(`Fel vid uppdatering av hemsida URL: ${slugError.message}`);
          }
          setUpdating(false);
          return;
        }
      }

      // Update the community object with new data
      const updatedCommunity = {
        ...community,
        community_name: editForm.name,
        description: editForm.description,
        is_public: editForm.isPublic,
        access_type: editForm.accessType,
        auto_approve_members: editForm.autoApproveMembers
      };

      onUpdate(updatedCommunity);
      onClose();
    } catch (error) {
      console.error('Error updating community:', error);
      alert('Ett fel uppstod vid uppdatering av samhälle');
    } finally {
      setUpdating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>

        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          {t('community.edit_community_title')}
        </h3>

        <form onSubmit={submitEdit} className="space-y-4">
          {/* Community Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('community.community_name')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              placeholder={t('community.community_name_placeholder')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B]"
              maxLength={100}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('community.community_description')}
            </label>
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              placeholder={t('community.community_description_placeholder')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] resize-none"
              rows={4}
              maxLength={500}
            />
          </div>

          {/* Homespace Slug */}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">beready.se/</span>
              <input
                type="text"
                value={editForm.slug}
                onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                placeholder="t.ex. nykulla-beredskap"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B]"
                maxLength={50}
              />
            </div>
            
            {/* Warning when slug is being changed (only if there was an original slug) */}
            {editForm.slug && editForm.slug !== originalSlug && originalSlug && (
              <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <div className="text-amber-600 mt-0.5">⚠️</div>
                  <div className="text-sm">
                    <p className="font-medium text-amber-800 mb-2">Varning: Du ändrar hemsidans URL</p>
                    <ul className="text-amber-700 space-y-1 list-disc list-inside">
                      <li>Den gamla URL:en kommer att sluta fungera</li>
                      <li>Bokmärken och delade länkar blir trasiga</li>
                      <li>Sökmotorer behöver uppdatera sina index</li>
                      <li>Medlemmar behöver informeras om den nya URL:en</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Access Type (Öppet/Stängt) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {t('community.access_type')} <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                style={{
                  borderColor: editForm.accessType === 'öppet' ? '#3D4A2B' : '#D1D5DB',
                  backgroundColor: editForm.accessType === 'öppet' ? '#F0F4F0' : 'white'
                }}
              >
                <input
                  type="radio"
                  name="editAccessType"
                  value="öppet"
                  checked={editForm.accessType === 'öppet'}
                  onChange={(e) => setEditForm({ 
                    ...editForm, 
                    accessType: 'öppet',
                    autoApproveMembers: true 
                  })}
                  className="mt-1 w-4 h-4 text-[#3D4A2B] border-gray-300 focus:ring-[#3D4A2B]"
                />
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">
                    🌍 {t('community.open_community')}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {t('community.open_community_description')}
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                style={{
                  borderColor: editForm.accessType === 'stängt' ? '#3D4A2B' : '#D1D5DB',
                  backgroundColor: editForm.accessType === 'stängt' ? '#F0F4F0' : 'white'
                }}
              >
                <input
                  type="radio"
                  name="editAccessType"
                  value="stängt"
                  checked={editForm.accessType === 'stängt'}
                  onChange={(e) => setEditForm({ ...editForm, accessType: 'stängt' })}
                  className="mt-1 w-4 h-4 text-[#3D4A2B] border-gray-300 focus:ring-[#3D4A2B]"
                />
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">
                    🔒 {t('community.closed_community')}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {t('community.closed_community_description')}
                  </div>
                  {editForm.accessType === 'stängt' && (
                    <label className="flex items-center gap-2 mt-3 p-2 bg-blue-50 rounded">
                      <input
                        type="checkbox"
                        checked={editForm.autoApproveMembers}
                        onChange={(e) => setEditForm({ ...editForm, autoApproveMembers: e.target.checked })}
                        className="w-4 h-4 text-[#3D4A2B] border-gray-300 rounded focus:ring-[#3D4A2B]"
                      />
                      <span className="text-sm text-gray-700">
                        {t('community.auto_approve')}
                      </span>
                    </label>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Public Toggle */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="editIsPublic"
              checked={editForm.isPublic}
              onChange={(e) => setEditForm({ ...editForm, isPublic: e.target.checked })}
              className="mt-1 w-4 h-4 text-[#3D4A2B] border-gray-300 rounded focus:ring-[#3D4A2B]"
            />
            <label htmlFor="editIsPublic" className="flex-1">
              <div className="font-medium text-gray-900">{t('community.make_public')}</div>
              <div className="text-sm text-gray-600">{t('community.public_community_help')}</div>
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={updating}
            >
              {t('community.cancel')}
            </button>
            <button
              type="submit"
              disabled={updating || !editForm.name.trim()}
              className="flex-1 px-4 py-2 bg-[#B8860B] text-white rounded-lg hover:bg-[#8B6508] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {updating ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  {t('community.updating')}
                </>
              ) : (
                <>
                  <Edit size={20} />
                  {t('community.update')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
