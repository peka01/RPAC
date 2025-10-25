'use client';

interface RPACLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function RPACLogo({ className = '', size = 'md' }: RPACLogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-auto',
    md: 'h-8 w-auto',
    lg: 'h-12 w-auto',
    xl: 'h-16 w-auto'
  };

  return (
    <img 
      src="/logga-beready.png" 
      alt="BE READY" 
      className={`${sizeClasses[size]} ${className}`}
    />
  );
}
