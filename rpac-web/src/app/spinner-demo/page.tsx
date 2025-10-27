'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SpinnerDemoPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new spinner test page
    router.replace('/spinner-test');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4" style={{ color: '#3D4A2B' }}>
          Redirecting to Spinner Test...
        </h1>
        <p className="text-gray-600">
          The spinner demo has been moved to a new location.
        </p>
      </div>
    </div>
  );
}
