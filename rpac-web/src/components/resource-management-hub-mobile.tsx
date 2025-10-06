'use client';

import { PersonalResourceInventory } from './personal-resource-inventory';

interface ResourceManagementHubMobileProps {
  user: { id: string; email?: string };
}

export function ResourceManagementHubMobile({ user }: ResourceManagementHubMobileProps) {
  return (
    <div className="space-y-6">
      {/* Personal Resource Inventory - new compact accordion design works great on mobile */}
      {user?.id && <PersonalResourceInventory userId={user.id} />}
    </div>
  );
}
