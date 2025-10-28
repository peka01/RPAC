import { SMHIWarningSeverity } from '@/types/weather';
import { cn } from '@/lib/utils';
import { AlertTriangle, AlertOctagon, AlertCircle } from 'lucide-react';

interface WarningSeverityBadgeProps {
  severity: SMHIWarningSeverity;
  className?: string;
}

export function WarningSeverityBadge({ severity, className }: WarningSeverityBadgeProps) {
  // Use our olive-green theme colors but with varying intensities
  const severityStyles = {
    1: {
      bg: 'bg-[#3D4A2B]/10',
      text: 'text-[#3D4A2B]',
      label: 'Klass 1',
      icon: AlertCircle
    },
    2: {
      bg: 'bg-[#3D4A2B]/20',
      text: 'text-[#3D4A2B]',
      label: 'Klass 2',
      icon: AlertTriangle
    },
    3: {
      bg: 'bg-[#3D4A2B]/30',
      text: 'text-[#3D4A2B] font-medium',
      label: 'Klass 3',
      icon: AlertOctagon
    },
    4: { // For information/notices
      bg: 'bg-[#3D4A2B]/5',
      text: 'text-[#3D4A2B]',
      label: 'Information',
      icon: AlertCircle
    }
  };

  const style = severityStyles[severity];
  const Icon = style.icon;

  return (
    <div className={cn(
      'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs',
      style.bg,
      style.text,
      className
    )}>
      <Icon className="w-3 h-3" />
      <span>{style.label}</span>
    </div>
  );
}