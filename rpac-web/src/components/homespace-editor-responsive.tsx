'use client';

import { useState, useEffect } from 'react';
import HomespaceEditor from './homespace-editor';
import HomespaceEditorMobile from './homespace-editor-mobile';

interface HomespaceEditorResponsiveProps {
  communityId: string;
  initialData?: any;
  onClose?: () => void;
}

export default function HomespaceEditorResponsive({ 
  communityId, 
  initialData, 
  onClose 
}: HomespaceEditorResponsiveProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile ? (
    <HomespaceEditorMobile 
      communityId={communityId} 
      initialData={initialData} 
      onClose={onClose} 
    />
  ) : (
    <HomespaceEditor 
      communityId={communityId} 
      initialData={initialData} 
    />
  );
}

