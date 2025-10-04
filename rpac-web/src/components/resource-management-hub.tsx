'use client';

import { useState, useEffect } from 'react';
import { resourceService, Resource } from '@/lib/supabase';
import { PersonalResourceInventory } from './personal-resource-inventory';
import { BulkResourceShareModal } from './bulk-resource-share-modal';

interface ResourceManagementHubProps {
  user: { id: string; email?: string };
}

export function ResourceManagementHub({ user }: ResourceManagementHubProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBulkShareModal, setShowBulkShareModal] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadResources();
    }
  }, [user?.id]);

  const loadResources = async () => {
    try {
      setLoading(true);
      const data = await resourceService.getResources(user.id);
      setResources(data);
    } catch (error) {
      console.error('Error loading resources:', error);
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#3D4A2B' }}></div>
          <p className="text-gray-600">Laddar din beredskapsstatus...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Personal Resource Inventory */}
      {user?.id && <PersonalResourceInventory userId={user.id} />}

      {/* Bulk Share Modal */}
      <BulkResourceShareModal
        isOpen={showBulkShareModal}
        onClose={() => setShowBulkShareModal(false)}
        resources={resources}
        userId={user.id}
        onSuccess={loadResources}
      />
    </div>
  );
}

