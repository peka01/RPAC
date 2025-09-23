'use client';

import { useState, useEffect } from 'react';
import { 
  Droplets, 
  Utensils, 
  Zap, 
  Heart,
  TrendingUp,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { t } from '@/lib/locales';

interface ResourceStatus {
  name: string;
  days: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  status: 'excellent' | 'good' | 'needs_improvement';
}

export function PreparednessOverview() {
  const [resources, setResources] = useState<ResourceStatus[]>([
    {
      name: t('resources.food'),
      days: 14,
      icon: Utensils,
      color: 'text-green-500',
      status: 'excellent'
    },
    {
      name: t('resources.water'),
      days: 7,
      icon: Droplets,
      color: 'text-blue-500',
      status: 'good'
    },
    {
      name: t('resources.energy'),
      days: 3,
      icon: Zap,
      color: 'text-orange-500',
      status: 'needs_improvement'
    },
    {
      name: t('resources.medicine'),
      days: 21,
      icon: Heart,
      color: 'text-red-500',
      status: 'excellent'
    }
  ]);

  const getOverallScore = () => {
    const totalDays = resources.reduce((sum, resource) => sum + resource.days, 0);
    const averageDays = totalDays / resources.length;
    
    if (averageDays >= 14) return { score: 'excellent', color: 'text-green-500', bgColor: 'bg-green-100 dark:bg-green-900' };
    if (averageDays >= 7) return { score: 'good', color: 'text-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-900' };
    return { score: 'needs_improvement', color: 'text-orange-500', bgColor: 'bg-orange-100 dark:bg-orange-900' };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
        return CheckCircle;
      case 'good':
        return TrendingUp;
      case 'needs_improvement':
        return AlertCircle;
      default:
        return CheckCircle;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'excellent':
        return t('preparedness.excellent');
      case 'good':
        return t('preparedness.good');
      case 'needs_improvement':
        return t('preparedness.needs_improvement');
      default:
        return t('preparedness.good');
    }
  };

  const overallScore = getOverallScore();
  const StatusIcon = getStatusIcon(overallScore.score);

  return (
    <div className="modern-card">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 flex items-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center mr-3">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          {t('ui.beredskapsoversikt')}
        </h2>
        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-green-600 animate-pulse"></div>
      </div>
      
      {/* Overall Score */}
      <div className={`status-${overallScore.score === 'excellent' ? 'good' : overallScore.score === 'good' ? 'warning' : 'critical'} rounded-lg p-4 mb-6`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <StatusIcon className="w-6 h-6" />
            <div>
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {t('preparedness.overall_score')}
              </h3>
              <p className="text-sm font-medium">
                {getStatusText(overallScore.score)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {Math.round(resources.reduce((sum, r) => sum + r.days, 0) / resources.length)}
            </p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              genomsnittliga dagar
            </p>
          </div>
        </div>
      </div>

      {/* Resource Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {resources.map((resource, index) => {
          const Icon = resource.icon;
          const StatusIcon = getStatusIcon(resource.status);
          
          return (
            <div
              key={index}
              className="modern-card p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className="w-5 h-5" style={{ color: resource.color }} />
                <StatusIcon className={`w-4 h-4 ${
                  resource.status === 'excellent' ? 'status-good' :
                  resource.status === 'good' ? 'status-warning' : 'status-critical'
                }`} />
              </div>
              <h3 className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
                {resource.name}
              </h3>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {resource.days}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {t('preparedness.food_days').replace('mat', resource.name.toLowerCase())}
              </p>
            </div>
          );
        })}
      </div>

      {/* Status Message */}
      <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800">
        <div className="flex items-center justify-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
          <p className="font-bold text-green-800 dark:text-green-200 text-center">
            {t('ui.du_ar_val_forberedd')}
          </p>
        </div>
      </div>
    </div>
  );
}
