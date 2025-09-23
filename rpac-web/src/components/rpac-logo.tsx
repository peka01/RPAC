'use client';

import Image from 'next/image';

interface RPACLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function RPACLogo({ className = '', size = 'md' }: RPACLogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  return (
    <div className={`${sizeClasses[size]} ${className} relative`}>
      <Image
        src="/beredd-logga.png"
        alt="RPAC Logo"
        fill
        className="object-contain"
        priority
      />
    </div>
  );
}
