'use client';

import { useState, useEffect } from 'react';
import { SideMenuResponsive } from './side-menu-responsive';
import { KRISterAssistantResponsive } from './krister-assistant-responsive';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { SidebarProvider } from '@/contexts/SidebarContext';

interface ResponsiveLayoutWrapperProps {
  children: React.ReactNode;
  hideMobileNav?: boolean; // For pages that have their own mobile nav (like community hub)
}

export function ResponsiveLayoutWrapper({ children, hideMobileNav = false }: ResponsiveLayoutWrapperProps) {
  const pathname = usePathname();
  
  // List of app routes that should show the navigation menus
  const appRoutes = [
    '/',
    '/dashboard',
    '/individual',
    '/local',
    '/regional',
    '/settings',
    '/auth',
    '/demo',
    '/spinner',
    '/loading',
    '/shield',
    '/progressive',
    '/global',
    '/super-admin',
    '/help',
    '/invite',
    '/api',
    '/test',
  ];
  
  // Check if this is a public homespace page (e.g., /nykulla, /samhalle-name)
  // These routes should NOT show the app menus
  const isAppRoute = pathname && appRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  // If it's NOT an app route, treat it as a public homespace
  if (pathname && !isAppRoute) {
    return <>{children}</>;
  }
  
  // Otherwise, render with the normal menu system
  return (
    <SidebarProvider>
      {/* Allow global mobile nav to show; local page will now use hamburger sub-navigation instead of its own fixed bar. */}
      <SideMenuResponsive hideMobileNav={hideMobileNav}>
        {children}
      </SideMenuResponsive>
    </SidebarProvider>
  );
}