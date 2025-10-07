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
  Utensils,
  ChevronRight
} from 'lucide-react';
import { t } from '@/lib/locales';

interface ResourceSummaryCardProps {
  user: { id: string };
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
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center shadow-md" style={{ 
              background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)' 
            }}>
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {t('dashboard.resource_summary')}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {t('dashboard.resource_summary_description')}
              </p>
            </div>
          </div>
          <button
            onClick={handleViewFullResources}
            className="hidden md:flex items-center space-x-2 px-5 py-2.5 rounded-lg transition-all duration-200 hover:shadow-md min-h-[44px] touch-manipulation active:scale-98"
            style={{ 
              backgroundColor: 'var(--bg-olive-light)',
              color: '#3D4A2B',
              fontWeight: 600
            }}
            aria-label="Visa alla dina resurser och förnödenheter"
          >
            <span className="text-sm font-semibold">{t('dashboard.view_full_resources')}</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Critical Alert */}
        {resourceStats.criticalItems > 0 && (
          <div className="mb-8 p-5 rounded-lg border-l-4" style={{ 
            backgroundColor: 'rgba(220, 38, 38, 0.08)',
            borderLeftColor: 'var(--color-danger)'
          }}>
            <div className="flex items-center space-x-2 mb-3">
              <AlertTriangle className="w-5 h-5" style={{ color: 'var(--color-danger)' }} />
              <span className="font-bold text-base" style={{ color: 'var(--color-danger)' }}>
                {t('dashboard.critical_resources_alert')}
              </span>
            </div>
            <p className="text-sm leading-relaxed pl-7" style={{ color: 'var(--text-secondary)' }}>
              {t('dashboard.critical_resources_description', { count: resourceStats.criticalItems })}
            </p>
          </div>
        )}

        {/* Resource Categories */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
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
              <div key={key} className="text-center p-4 rounded-lg" style={{ 
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--color-quaternary)'
              }}>
                <div className="flex justify-center mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{
                    backgroundColor: getStatusColor(category.status) + '20',
                    color: getStatusColor(category.status)
                  }}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                  {labels[key as keyof typeof labels]}
                </div>
                <div className="text-xs font-bold" style={{ 
                  color: getStatusColor(category.status)
                }}>
                  {getStatusText(category.status)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="text-center p-4 rounded-lg min-h-[80px] flex flex-col justify-center" style={{ backgroundColor: 'var(--bg-card)' }}>
            <div className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: 'var(--color-danger)' }}>
              {resourceStats.criticalItems}
            </div>
            <div className="text-sm font-medium leading-tight" style={{ color: 'var(--text-secondary)' }}>
              {t('dashboard.critical_items')}
            </div>
          </div>
          <div className="text-center p-4 rounded-lg min-h-[80px] flex flex-col justify-center" style={{ backgroundColor: 'var(--bg-card)' }}>
            <div className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: 'var(--color-warning)' }}>
              {resourceStats.lowStock}
            </div>
            <div className="text-sm font-medium leading-tight" style={{ color: 'var(--text-secondary)' }}>
              {t('dashboard.low_stock')}
            </div>
          </div>
          <div className="text-center p-4 rounded-lg min-h-[80px] flex flex-col justify-center" style={{ backgroundColor: 'var(--bg-card)' }}>
            <div className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: 'var(--color-sage)' }}>
              {resourceStats.healthyItems}
            </div>
            <div className="text-sm font-medium leading-tight" style={{ color: 'var(--text-secondary)' }}>
              {t('dashboard.healthy_items')}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleViewFullResources}
          className="w-full flex items-center justify-center space-x-2 py-4 px-6 rounded-lg font-semibold text-base transition-all duration-200 hover:shadow-lg border-2 min-h-[56px] touch-manipulation active:scale-98"
          style={{ 
            backgroundColor: '#3D4A2B',
            borderColor: '#3D4A2B',
            color: 'white'
          }}
          aria-label="Hantera alla dina resurser och förnödenheter"
        >
          <Package className="w-5 h-5" />
          <span>{t('dashboard.manage_resources')}</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}


