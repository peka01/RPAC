'use client';

import { PersonalResourceInventory } from './personal-resource-inventory';

interface ResourceManagementHubProps {
  user: { id: string; email?: string };
}

export function ResourceManagementHub({ user }: ResourceManagementHubProps) {
  return (
    <div className="space-y-6">
      {/* Personal Resource Inventory */}
      {user?.id && <PersonalResourceInventory userId={user.id} />}
    </div>
  );
}

