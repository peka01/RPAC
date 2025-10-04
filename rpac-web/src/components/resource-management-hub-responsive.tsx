'use client';

import { useState, useEffect } from 'react';
import { ResourceManagementHub } from './resource-management-hub';
import { ResourceManagementHubMobile } from './resource-management-hub-mobile';

interface ResourceManagementHubResponsiveProps {
  user: { id: string; email?: string };
}

export function ResourceManagementHubResponsive({ user }: ResourceManagementHubResponsiveProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Prevent hydration mismatch by not rendering until client-side
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3D4A2B] mx-auto mb-4"></div>
          <p className="text-gray-600">Laddar...</p>
        </div>
      </div>
    );
  }

  return isMobile ? (
    <ResourceManagementHubMobile user={user} />
  ) : (
    <ResourceManagementHub user={user} />
  );
}

