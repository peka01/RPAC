'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  ArrowRight,
  Droplets,
  Zap,
  Wrench,
  Pill,
  Utensils
} from 'lucide-react';
import { t } from '@/lib/locales';

interface ResourceSummaryCardProps {
  user: any;
}

export function ResourceSummaryCard({ user }: ResourceSummaryCardProps) {
  const router = useRouter();
  const [resourceStats, setResourceStats] = useState({
    totalResources: 0,
    criticalItems: 0,
    lowStock: 0,
    healthyItems: 0,
    categories: {
      food: { count: 0, status: 'critical' },
      water: { count: 0, status: 'critical' },
      medicine: { count: 0, status: 'critical' },
      energy: { count: 0, status: 'critical' },
      tools: { count: 0, status: 'critical' }
    }
  });

  useEffect(() => {
    // Simulate resource data - in real app, this would come from Supabase
    setResourceStats({
      totalResources: 0,
      criticalItems: 5,
      lowStock: 0,
      healthyItems: 0,
      categories: {
        food: { count: 0, status: 'critical' },
        water: { count: 0, status: 'critical' },
        medicine: { count: 0, status: 'critical' },
        energy: { count: 0, status: 'critical' },
        tools: { count: 0, status: 'critical' }
      }
    });
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'var(--color-sage)';
      case 'low': return 'var(--color-warning)';
      case 'critical': return 'var(--color-danger)';
      default: return 'var(--color-muted)';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'healthy': return 'Bra';
      case 'low': return 'Låg';
      case 'critical': return 'Kritisk';
      default: return 'Okänd';
    }
  };

  const handleViewFullResources = () => {
    router.push('/individual');
  };

  return (
    <div className="modern-card">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-md" style={{ 
              background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)' 
            }}>
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {t('dashboard.resource_summary')}
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {t('dashboard.resource_summary_description')}
              </p>
            </div>
          </div>
          <button
            onClick={handleViewFullResources}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 hover:shadow-md"
            style={{ 
              backgroundColor: 'var(--bg-olive-light)',
              color: 'var(--text-primary)'
            }}
          >
            <span className="text-sm font-medium">{t('dashboard.view_full_resources')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Critical Alert */}
        {resourceStats.criticalItems > 0 && (
          <div className="mb-6 p-4 rounded-lg border-l-4" style={{ 
            backgroundColor: 'rgba(220, 38, 38, 0.05)',
            borderLeftColor: 'var(--color-danger)'
          }}>
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="w-5 h-5" style={{ color: 'var(--color-danger)' }} />
              <span className="font-semibold" style={{ color: 'var(--color-danger)' }}>
                {t('dashboard.critical_resources_alert')}
              </span>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {t('dashboard.critical_resources_description', { count: resourceStats.criticalItems })}
            </p>
          </div>
        )}

        {/* Resource Categories */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {Object.entries(resourceStats.categories).map(([key, category]) => {
            const icons = {
              food: Utensils,
              water: Droplets,
              medicine: Pill,
              energy: Zap,
              tools: Wrench
            };
            const Icon = icons[key as keyof typeof icons];
            const labels = {
              food: 'Mat',
              water: 'Vatten',
              medicine: 'Mediciner',
              energy: 'Energi',
              tools: 'Verktyg'
            };

            return (
              <div key={key} className="text-center p-3 rounded-lg" style={{ 
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--color-quaternary)'
              }}>
                <div className="flex justify-center mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{
                    backgroundColor: getStatusColor(category.status) + '20',
                    color: getStatusColor(category.status)
                  }}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  {labels[key as keyof typeof labels]}
                </div>
                <div className="text-xs" style={{ 
                  color: getStatusColor(category.status),
                  fontWeight: '600'
                }}>
                  {getStatusText(category.status)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: 'var(--color-danger)' }}>
              {resourceStats.criticalItems}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {t('dashboard.critical_items')}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: 'var(--color-warning)' }}>
              {resourceStats.lowStock}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {t('dashboard.low_stock')}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: 'var(--color-sage)' }}>
              {resourceStats.healthyItems}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {t('dashboard.healthy_items')}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleViewFullResources}
          className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
          style={{ 
            backgroundColor: 'var(--color-primary)',
            color: 'white'
          }}
        >
          <Package className="w-4 h-4" />
          <span>{t('dashboard.manage_resources')}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
