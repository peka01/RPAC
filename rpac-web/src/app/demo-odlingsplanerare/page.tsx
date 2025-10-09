'use client';

import { useState } from 'react';
import { SimpleCultivationResponsive } from '@/components/simple-cultivation-responsive';

export default function DemoOdlingsplanerarePage() {
  const [user] = useState({
    id: 'demo-user',
    email: 'demo@example.com'
  });

  return (
    <div>
      <SimpleCultivationResponsive userId={user.id} householdSize={2} />
    </div>
  );
}
