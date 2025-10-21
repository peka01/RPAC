'use client';

import { SuperAdminGuard } from '@/components/super-admin/super-admin-guard';
import { usePathname } from 'next/navigation';

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Don't apply guard to login page (with or without trailing slash)
  if (pathname === '/super-admin/login' || pathname === '/super-admin/login/') {
    return <>{children}</>;
  }

  return (
    <SuperAdminGuard>
      {children}
    </SuperAdminGuard>
  );
}

