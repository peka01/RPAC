'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LocalPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to resources page as the default Lokalt landing
    router.replace('/local/resources/owned');
  }, [router]);

  return null;
}
