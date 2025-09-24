'use client';

interface RPACLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function RPACLogo({ className = '', size = 'md' }: RPACLogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-xl',
    lg: 'w-16 h-16 text-2xl',
    xl: 'w-20 h-20 text-3xl'
  };

  return (
    <div 
      className={`${sizeClasses[size]} ${className} rounded-lg flex items-center justify-center font-bold text-white shadow-lg`}
      style={{ backgroundColor: 'var(--color-primary-dark)' }}
    >
      B
    </div>
  );
}
