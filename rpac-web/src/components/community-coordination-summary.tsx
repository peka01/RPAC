'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  MapPin, 
  MessageCircle, 
  AlertTriangle, 
  CheckCircle, 
  ArrowRight,
  Radio,
  Wifi,
  Phone,
  Heart,
  ChevronRight
} from 'lucide-react';
import { t } from '@/lib/locales';

export function CommunityCoordinationSummary() {
  const router = useRouter();
  const [coordinationStats, setCoordinationStats] = useState({
    activeCommunities: 12,
    activeMembers: 247,
    averagePreparedness: 8.2,
    helpRequests: 3,
    recentActivity: [
      { type: 'community', message: 'Ny gemenskap registrerad i Malmö Centrum', time: '2 timmar sedan', status: 'success' },
      { type: 'exercise', message: 'Beredskapsövning genomförd i Göteborg', time: '1 dag sedan', status: 'success' },
      { type: 'warning', message: 'Vädervarning för Stockholmsregionen', time: '3 timmar sedan', status: 'warning' }
    ],
    networkStatus: {
      local: { active: true, members: 45, strength: 'strong' },
      regional: { active: true, members: 247, strength: 'good' },
      emergency: { active: true, members: 12, strength: 'excellent' }
    }
  });

  const handleViewFullCoordination = () => {
    router.push('/local');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'var(--color-sage)';
      case 'warning': return 'var(--color-warning)';
      case 'critical': return 'var(--color-danger)';
      default: return 'var(--color-muted)';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'critical': return AlertTriangle;
      default: return CheckCircle;
    }
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
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {t('dashboard.community_coordination')}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {t('dashboard.community_coordination_description')}
              </p>
            </div>
          </div>
          <button
            onClick={handleViewFullCoordination}
            className="hidden md:flex items-center space-x-2 px-5 py-2.5 rounded-lg transition-all duration-200 hover:shadow-md min-h-[44px] touch-manipulation active:scale-98"
            style={{ 
              backgroundColor: 'var(--bg-olive-light)',
              color: '#3D4A2B',
              fontWeight: 600
            }}
            aria-label="Visa fullständig samhällskoordination och aktivitet"
          >
            <span className="text-sm font-semibold">{t('dashboard.view_full_coordination')}</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Key Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="text-center p-4 rounded-lg min-h-[80px] flex flex-col justify-center" style={{ backgroundColor: 'var(--bg-card)' }}>
            <div className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: 'var(--color-sage)' }}>
              {coordinationStats.activeCommunities}
            </div>
            <div className="text-sm font-medium leading-tight" style={{ color: 'var(--text-secondary)' }}>
              {t('dashboard.active_communities')}
            </div>
          </div>
          <div className="text-center p-4 rounded-lg min-h-[80px] flex flex-col justify-center" style={{ backgroundColor: 'var(--bg-card)' }}>
            <div className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: 'var(--color-primary)' }}>
              {coordinationStats.activeMembers}
            </div>
            <div className="text-sm font-medium leading-tight" style={{ color: 'var(--text-secondary)' }}>
              {t('dashboard.active_members')}
            </div>
          </div>
          <div className="text-center p-4 rounded-lg min-h-[80px] flex flex-col justify-center" style={{ backgroundColor: 'var(--bg-card)' }}>
            <div className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: 'var(--color-khaki)' }}>
              {coordinationStats.averagePreparedness}%
            </div>
            <div className="text-sm font-medium leading-tight" style={{ color: 'var(--text-secondary)' }}>
              {t('dashboard.avg_preparedness')}
            </div>
          </div>
          <div className="text-center p-4 rounded-lg min-h-[80px] flex flex-col justify-center" style={{ backgroundColor: 'var(--bg-card)' }}>
            <div className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: 'var(--color-danger)' }}>
              {coordinationStats.helpRequests}
            </div>
            <div className="text-sm font-medium leading-tight" style={{ color: 'var(--text-secondary)' }}>
              {t('dashboard.help_requests')}
            </div>
          </div>
        </div>

        {/* Network Status */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            {t('dashboard.network_status')}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {Object.entries(coordinationStats.networkStatus).map(([key, network]) => {
              const labels = {
                local: 'Lokalt nätverk',
                regional: 'Regionalt nätverk', 
                emergency: 'Nödnätverk'
              };
              const icons = {
                local: Wifi,
                regional: Radio,
                emergency: Phone
              };
              const Icon = icons[key as keyof typeof icons];
              
              return (
                <div key={key} className="flex items-center space-x-3 p-3 rounded-lg" style={{ 
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--color-quaternary)'
                }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{
                    backgroundColor: network.active ? 'var(--color-sage)' + '20' : 'var(--color-muted)' + '20',
                    color: network.active ? 'var(--color-sage)' : 'var(--color-muted)'
                  }}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {labels[key as keyof typeof labels]}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {network.members} medlemmar • {network.strength}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mb-8">
          <h4 className="text-base font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            {t('dashboard.recent_activity')}
          </h4>
          <div className="space-y-3">
            {coordinationStats.recentActivity.map((activity, index) => {
              const Icon = getStatusIcon(activity.status);
              return (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: getStatusColor(activity.status) }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                      {activity.message}
                    </div>
                    <div className="text-xs font-semibold mt-1" style={{ color: 'var(--text-secondary)' }}>
                      {t('dashboard.last_updated')}: {activity.time}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleViewFullCoordination}
            className="flex-1 flex items-center justify-center space-x-2 py-4 px-6 rounded-lg font-semibold text-base transition-all duration-200 hover:shadow-lg border-2 min-h-[56px] touch-manipulation active:scale-98"
            style={{ 
              backgroundColor: '#3D4A2B',
              borderColor: '#3D4A2B',
              color: 'white'
            }}
            aria-label="Hantera samhällskoordination och se all aktivitet"
          >
            <Users className="w-5 h-5" />
            <span>{t('dashboard.manage_coordination')}</span>
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={handleViewFullCoordination}
            className="flex-1 flex items-center justify-center space-x-2 py-4 px-6 rounded-lg font-semibold text-base transition-all duration-200 hover:shadow-lg border-2 min-h-[56px] touch-manipulation active:scale-98"
            style={{ 
              backgroundColor: 'white',
              borderColor: '#3D4A2B',
              color: '#3D4A2B'
            }}
            aria-label="Gå med i lokalt samhälle"
          >
            <MessageCircle className="w-5 h-5" />
            <span>{t('dashboard.join_community')}</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}


