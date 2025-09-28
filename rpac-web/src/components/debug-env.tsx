'use client';

import { useEffect, useState } from 'react';

export function DebugEnv() {
  const [envInfo, setEnvInfo] = useState<any>(null);

  useEffect(() => {
    const info = {
      hasProcessEnv: !!process.env.NEXT_PUBLIC_OPENAI_API_KEY,
      hasWindow: typeof window !== 'undefined',
      availableKeys: Object.keys(process.env).filter(k => k.includes('OPENAI')),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      location: typeof window !== 'undefined' ? window.location.href : 'server',
    };
    setEnvInfo(info);
  }, []);

  if (process.env.NODE_ENV === 'production') {
    return null; // Don't show in production
  }

  return (
    <div className="fixed bottom-4 right-4 bg-red-100 border border-red-300 p-4 rounded-lg text-xs max-w-sm">
      <h3 className="font-bold text-red-800">Debug Info:</h3>
      <pre className="text-red-700 whitespace-pre-wrap">
        {JSON.stringify(envInfo, null, 2)}
      </pre>
    </div>
  );
}
