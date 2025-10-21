'use client';

import { useState, useEffect } from 'react';
import { t } from '@/lib/locales';
import { Globe, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import HomespaceEditor from './homespace-editor';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ShieldProgressSpinner />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-12 text-center">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-[#3D4A2B] mb-4">
            {t('community.not_admin')}
          </h2>
          <p className="text-gray-600 mb-6">
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
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-12 text-center">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-[#3D4A2B] mb-4">
            {t('homespace.errors.load_failed')}
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={onClose}
            className="bg-[#3D4A2B] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#2A331E] transition-all flex items-center gap-2 mx-auto"
          >
            <ArrowLeft size={20} />
            {t('homespace.back_to_community')}
          </button>
        </div>
      </div>
    );
  }

  if (!homespaceData) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-12 text-center">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-6xl mb-4">🏗️</div>
          <h2 className="text-2xl font-bold text-[#3D4A2B] mb-4">
            {t('homespace.creating_homepage')}
          </h2>
          <p className="text-gray-600 mb-6">
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
    );
  }

  return <HomespaceEditor communityId={communityId} initialData={homespaceData} />;
}

