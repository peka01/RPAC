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
  return (
    <SideMenuResponsive hideMobileNav={hideMobileNav}>
      {children}
    </SideMenuResponsive>
  );
}

