'use client';

import { useState } from 'react';
import { SuperbOdlingsplanerare } from '@/components/CultivationPlanner';

export default function DemoOdlingsplanerarePage() {
  const [user] = useState({
    id: 'demo-user',
    email: 'demo@example.com'
  });

  return (
    <div>
      <SuperbOdlingsplanerare user={user} />
    </div>
  );
}
