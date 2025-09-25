'use client';

import { useState } from 'react';
import { 
  Droplets, 
  Utensils, 
  Zap, 
  Heart,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Shield,
  Radio,
  Battery
} from 'lucide-react';
import { t } from '@/lib/locales';

interface ResourceStatus {
  name: string;
  days: number;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  status: 'excellent' | 'good' | 'needs_improvement';
}

export function PreparednessOverview() {
  const [resources] = useState<ResourceStatus[]>([
    {
      name: 'Mat',
      days: 14,
      icon: Utensils,
      color: 'text-green-500',
      status: 'excellent'
    },
    {
      name: 'Vatten',
      days: 7,
      icon: Droplets,
      color: 'text-blue-500',
      status: 'good'
    },
    {
      name: 'Energi',
      days: 3,
      icon: Zap,
      color: 'text-orange-500',
      status: 'needs_improvement'
    },
    {
      name: 'Medicin',
      days: 21,
      icon: Heart,
      color: 'text-red-500',
      status: 'excellent'
    }
  ]);

  const [msbChecklistItems] = useState([
    { key: 'water_3_days', icon: Droplets, completed: false },
    { key: 'food_3_days', icon: Utensils, completed: false },
    { key: 'radio_battery', icon: Radio, completed: false },
    { key: 'flashlight', icon: Zap, completed: false },
    { key: 'first_aid', icon: Heart, completed: false },
    { key: 'medicines', icon: Heart, completed: false },
    { key: 'batteries', icon: Battery, completed: false },
    { key: 'important_papers', icon: Shield, completed: false }
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
        return 'Utmärkt';
      case 'good':
        return 'Bra';
      case 'needs_improvement':
        return 'Behöver förbättras';
      default:
        return 'Bra';
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
          {'Beredskapsöversikt'}
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
                {'Övergripande poäng'}
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
                {`${resource.name.toLowerCase()} dagar kvar`}
              </p>
            </div>
          );
        })}
      </div>

      {/* MSB Official Checklist */}
      <div className="mt-8">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center mr-3">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">
              {t('msb.official_checklist')}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {t('msb.basic_supplies.description')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {msbChecklistItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="flex items-center space-x-3 p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  item.completed 
                    ? 'bg-green-500 border-green-500' 
                    : 'border-slate-300 dark:border-slate-600'
                }`}>
                  {item.completed && <CheckCircle className="w-4 h-4 text-white" />}
                </div>
                <Icon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200 flex-1">
                  {t(`msb.basic_supplies.${item.key}`)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Digital Security Tips */}
      <div className="mt-8">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mr-3">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
            {t('msb.digital_security_tips.title')}
          </h3>
        </div>
        
        <div className="space-y-3">
          {[
            'verify_sources',
            'backup_contacts', 
            'charge_devices',
            'official_channels',
            'emergency_radio'
          ].map((tip, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
              <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                {t(`msb.digital_security_tips.${tip}`)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Status Message */}
      <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800">
        <div className="flex items-center justify-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
          <p className="font-bold text-green-800 dark:text-green-200 text-center">
            {'Du är väl förberedd'}
          </p>
        </div>
        <div className="mt-3 text-center">
          <p className="text-sm text-green-700 dark:text-green-300">
            {t('msb.official_guidance')} • {t('msb.crisis_preparedness')}
          </p>
        </div>
      </div>
    </div>
  );
}
