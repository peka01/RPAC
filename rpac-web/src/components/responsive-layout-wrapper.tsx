'use client';

import { useState, useEffect } from 'react';
import { SideMenuResponsive } from './side-menu-responsive';
import { KRISterAssistantResponsive } from './krister-assistant-responsive';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface ResponsiveLayoutWrapperProps {
  children: React.ReactNode;
  hideMobileNav?: boolean; // For pages that have their own mobile nav (like community hub)
}

export function ResponsiveLayoutWrapper({ children, hideMobileNav = false }: ResponsiveLayoutWrapperProps) {
  const pathname = usePathname();
  
  // Check if this is a public homespace page (e.g., /nykulla, /samhalle-name)
  // These routes should NOT show the app menus
  const isPublicHomespace = pathname && 
    pathname !== '/' && 
    !pathname.startsWith('/dashboard') &&
    !pathname.startsWith('/individual') &&
    !pathname.startsWith('/local') &&
    !pathname.startsWith('/regional') &&
    !pathname.startsWith('/settings') &&
    !pathname.startsWith('/auth') &&
    !pathname.startsWith('/demo') &&
    !pathname.startsWith('/spinner') &&
    !pathname.startsWith('/loading') &&
    !pathname.startsWith('/shield') &&
    !pathname.startsWith('/progressive') &&
    !pathname.startsWith('/global');
  
  // If it's a public homespace, render children without menus
  if (isPublicHomespace) {
    return <>{children}</>;
  }
  
  // Otherwise, render with the normal menu system
  return (
    <SideMenuResponsive hideMobileNav={hideMobileNav}>
      {children}
    </SideMenuResponsive>
  );
}

