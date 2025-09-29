import React from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';

export type WarningSeverity = 'info' | 'warning' | 'critical' | 'success';

interface WarningProps {
  severity: WarningSeverity;
  title: string;
  message: string;
  icon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

const severityConfig = {
  info: {
    bgColor: 'rgba(59, 130, 246, 0.05)', // Very light blue
    borderColor: '#3B82F6', // Blue
    textColor: '#1E40AF', // Dark blue
    iconColor: '#3B82F6',
    icon: AlertCircle,
    label: 'Information'
  },
  warning: {
    bgColor: 'rgba(245, 158, 11, 0.08)', // Very light amber
    borderColor: '#F59E0B', // Amber
    textColor: '#92400E', // Dark amber
    iconColor: '#F59E0B',
    icon: AlertTriangle,
    label: 'Varning'
  },
  critical: {
    bgColor: 'rgba(220, 38, 38, 0.08)', // Very light red
    borderColor: '#DC2626', // Red
    textColor: '#991B1B', // Dark red
    iconColor: '#DC2626',
    icon: AlertTriangle,
    label: 'Kritisk'
  },
  success: {
    bgColor: 'rgba(34, 197, 94, 0.08)', // Very light green
    borderColor: '#22C55E', // Green
    textColor: '#15803D', // Dark green
    iconColor: '#22C55E',
    icon: CheckCircle,
    label: 'Lyckades'
  }
};

export function WarningCard({ 
  severity, 
  title, 
  message, 
  icon, 
  className = '', 
  children 
}: WarningProps) {
  const config = severityConfig[severity];
  const IconComponent = icon || config.icon;

  return (
    <div 
      className={`border-l-4 p-4 rounded-r-lg ${className}`}
      style={{
        backgroundColor: config.bgColor,
        borderLeftColor: config.borderColor,
        borderLeftWidth: '4px'
      }}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {React.createElement(IconComponent as React.ComponentType<any>, {
            className: "w-5 h-5",
            style: { color: config.iconColor }
          })}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h3 
              className="font-semibold text-sm"
              style={{ color: config.textColor }}
            >
              {title}
            </h3>
            <span 
              className="text-xs px-2 py-1 rounded-full font-medium"
              style={{ 
                backgroundColor: config.borderColor,
                color: 'white'
              }}
            >
              {config.label}
            </span>
          </div>
          <p 
            className="text-sm leading-relaxed"
            style={{ color: config.textColor }}
          >
            {message}
          </p>
          {children}
        </div>
      </div>
    </div>
  );
}

// Specialized weather warning component
export function WeatherWarning({ 
  warnings, 
  className = '' 
}: { 
  warnings: Array<{ type: string; message: string; severity: WarningSeverity }>;
  className?: string;
}) {
  if (warnings.length === 0) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center space-x-2 mb-3">
        <AlertTriangle className="w-5 h-5" style={{ color: 'var(--color-warning)' }} />
        <h3 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
          Väderprognos - Viktiga varningar
        </h3>
      </div>
      {warnings.map((warning, index) => (
        <WarningCard
          key={index}
          severity={warning.severity}
          title={warning.type}
          message={warning.message}
        />
      ))}
    </div>
  );
}

// Priority badge component
export function PriorityBadge({ 
  priority, 
  className = '' 
}: { 
  priority: 'low' | 'medium' | 'high';
  className?: string;
}) {
  const config = {
    low: {
      bgColor: 'rgba(107, 114, 128, 0.1)',
      textColor: '#6B7280',
      label: 'Låg prioritet'
    },
    medium: {
      bgColor: 'rgba(245, 158, 11, 0.1)',
      textColor: '#F59E0B',
      label: 'Medium prioritet'
    },
    high: {
      bgColor: 'rgba(220, 38, 38, 0.1)',
      textColor: '#DC2626',
      label: 'Hög prioritet'
    }
  };

  const currentConfig = config[priority];

  return (
    <span 
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
      style={{
        backgroundColor: currentConfig.bgColor,
        color: currentConfig.textColor
      }}
    >
      {currentConfig.label}
    </span>
  );
}
