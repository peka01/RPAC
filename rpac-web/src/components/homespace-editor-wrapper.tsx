'use client';

import { useState, useEffect } from 'react';
import { t } from '@/lib/locales';
import { Globe, ArrowLeft, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import HomespaceEditorLive from './homespace-editor-live';
import { ShieldProgressSpinner } from './ShieldProgressSpinner';

interface HomespaceEditorWrapperProps {
  communityId: string;
  userId: string;
  onClose: () => void;
}

export default function HomespaceEditorWrapper({ communityId, userId, onClose }: HomespaceEditorWrapperProps) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [homespaceData, setHomespaceData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHomespaceData();
  }, [communityId, userId]);

  const loadHomespaceData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user is admin
      const { data: community } = await supabase
        .from('local_communities')
        .select('created_by')
        .eq('id', communityId)
        .single();

      if (!community || community.created_by !== userId) {
        setIsAdmin(false);
        setError(t('community.not_admin'));
        setLoading(false);
        return;
      }

      setIsAdmin(true);

      // Load homespace data
      const { data: homespace, error: homespaceError } = await supabase
        .from('community_homespaces')
        .select(`
          *,
          communities:local_communities (
            id,
            community_name,
            county,
            description,
            created_at,
            member_count
          )
        `)
        .eq('community_id', communityId)
        .single();

      if (homespaceError) {
        console.error('Error loading homespace:', homespaceError);
        setError(t('homespace.errors.load_failed'));
      } else {
        // Normalize communities data
        setHomespaceData({
          ...homespace,
          communities: Array.isArray(homespace.communities) 
            ? homespace.communities[0] 
            : homespace.communities
        });
      }
    } catch (err: any) {
      console.error('Error in loadHomespaceData:', err);
      setError(err.message || t('homespace.errors.load_failed'));
    } finally {
      setLoading(false);
    }
  };

  // Full-screen modal wrapper for all states
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="fixed inset-0 bg-white overflow-y-auto">
        {/* Modal Header - Always visible */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-[#3D4A2B] to-[#2A331E] text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Globe size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">
                    🏡 {homespaceData?.communities?.community_name || 'Samhälle'}s hemsida
                  </h2>
                  <p className="text-white/80 text-sm">
                    {t('homespace.edit_content')}
                  </p>
                </div>
              </div>
              
              {/* Close Button - Always accessible */}
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors touch-manipulation"
                aria-label="Stäng"
              >
                <X size={24} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="min-h-[calc(100vh-80px)]">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <ShieldProgressSpinner variant="bounce" size="lg" color="olive" message="Laddar hemsida..." />
            </div>
          )}

          {!loading && !isAdmin && (
            <div className="max-w-2xl mx-auto px-6 py-12 text-center">
              <div className="bg-[#B8860B]/10 border-2 border-[#B8860B] rounded-2xl p-8">
                <div className="text-6xl mb-4">🔒</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {t('community.not_admin')}
                </h3>
                <p className="text-gray-700 mb-6">
                  {t('homespace.only_admin_edit')}
                </p>
                <button
                  onClick={onClose}
                  className="bg-[#3D4A2B] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#2A331E] transition-all flex items-center gap-2 mx-auto"
                >
                  <ArrowLeft size={20} />
                  {t('homespace.back_to_community')}
                </button>
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="max-w-2xl mx-auto px-6 py-12 text-center">
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8">
                <div className="text-6xl mb-4">⚠️</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {t('homespace.errors.load_failed')}
                </h3>
                <p className="text-gray-700 mb-6">{error}</p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => loadHomespaceData()}
                    className="bg-[#3D4A2B] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#2A331E] transition-all"
                  >
                    Försök igen
                  </button>
                  <button
                    onClick={onClose}
                    className="bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all flex items-center gap-2"
                  >
                    <ArrowLeft size={20} />
                    Stäng
                  </button>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && !homespaceData && (
            <div className="max-w-2xl mx-auto px-6 py-12 text-center">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-8">
                <div className="text-6xl mb-4">🏗️</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {t('homespace.creating_homepage')}
                </h3>
                <p className="text-gray-700 mb-6">
                  {t('homespace.homepage_creating')}
                </p>
                <button
                  onClick={() => loadHomespaceData()}
                  className="bg-[#3D4A2B] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#2A331E] transition-all"
                >
                  {t('homespace.try_again')}
                </button>
              </div>
            </div>
          )}

          {!loading && !error && homespaceData && (
            <HomespaceEditorLive communityId={communityId} initialData={homespaceData} />
          )}
        </div>
      </div>
    </div>
  );
}

