'use client';

import { useState, useEffect } from 'react';
import { CultivationReminders } from '@/components/cultivation-reminders';
import { CultivationRemindersMobileComplete } from '@/components/cultivation-reminders-mobile';
import { CrisisCultivation } from '@/components/crisis-cultivation';
import { CrisisCultivationMobile } from '@/components/crisis-cultivation-mobile';
import { PlantDiagnosis } from '@/components/plant-diagnosis';
import { PlantDiagnosisMobile } from '@/components/plant-diagnosis-mobile';

// Re-export for easier imports
export { CultivationRemindersMobileComplete, CrisisCultivationMobile, PlantDiagnosisMobile };

interface ResponsiveCultivationToolProps {
  user: { id: string };
  tool: 'reminders' | 'crisis' | 'diagnosis';
  climateZone?: string;
}

export function ResponsiveCultivationTool({ user, tool, climateZone }: ResponsiveCultivationToolProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (tool === 'reminders') {
    return isMobile ? (
      <CultivationRemindersMobileComplete user={user} climateZone={climateZone} />
    ) : (
      <CultivationReminders user={user} climateZone={climateZone as 'gotaland' | 'svealand' | 'norrland'} />
    );
  }

  if (tool === 'crisis') {
    return isMobile ? (
      <CrisisCultivationMobile user={user} />
    ) : (
      <CrisisCultivation urgencyLevel="medium" availableSpace="both" timeframe={30} />
    );
  }

  if (tool === 'diagnosis') {
    return isMobile ? (
      <PlantDiagnosisMobile />
    ) : (
      <PlantDiagnosis />
    );
  }

  return null;
}

