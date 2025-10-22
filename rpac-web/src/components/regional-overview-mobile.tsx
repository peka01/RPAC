'use client';

import { useEffect, useState } from 'react';
import { MapPin, Users, AlertTriangle, ExternalLink, Activity, Package, Info } from 'lucide-react';
import { t } from '@/lib/locales';
import { getRegionalStatistics, getCommunitiesInCounty, type RegionalStatistics, type CommunityOverview } from '@/lib/regional-service';
import { getLansstyrelsenLinks, getCountyDisplayName, getOfficialCrisisLinks } from '@/lib/lansstyrelsen-api';

interface RegionalOverviewMobileProps {
  county: string;
}

export function RegionalOverviewMobile({ county }: RegionalOverviewMobileProps) {
  const [statistics, setStatistics] = useState<RegionalStatistics | null>(null);
  const [communities, setCommunities] = useState<CommunityOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stats' | 'communities' | 'activity' | 'info'>('stats');
  const [showPreparednessInfo, setShowPreparednessInfo] = useState(false);

  useEffect(() => {
    loadRegionalData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [county]);

  const loadRegionalData = async () => {
    if (!county) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [stats, comms] = await Promise.all([
        getRegionalStatistics(county),
        getCommunitiesInCounty(county)
      ]);
      setStatistics(stats);
      setCommunities(comms);
    } catch (error) {
      console.error('Error loading regional data:', error);
    } finally {
      setLoading(false);
    }
  };

  const lansstyrelseLlinks = getLansstyrelsenLinks(county);
  const countyDisplayName = getCountyDisplayName(county);
  const officialLinks = getOfficialCrisisLinks();

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('regional.just_now');
    if (diffMins < 60) return `${diffMins} ${t('regional.minutes_ago')}`;
    if (diffHours < 24) return `${diffHours} ${t('regional.hours_ago')}`;
    if (diffDays === 1) return `1 ${t('regional.day_ago')}`;
    return `${diffDays} ${t('regional.days_ago')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3D4A2B] mx-auto mb-4"></div>
          <p className="text-gray-600">{t('regional.loading_county_data')}</p>
        </div>
      </div>
    );
  }

  if (!county) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <MapPin size={64} className="text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">{t('regional.no_county_set')}</h2>
          <p className="text-gray-600 text-sm mb-4">{t('regional.set_location_prompt')}</p>
          <a
            href="/settings?highlight=postal_code"
            className="inline-block px-6 py-3 bg-[#3D4A2B] text-white font-medium rounded-lg hover:bg-[#2A331E] transition-all touch-manipulation active:scale-95 cursor-pointer"
          >
            Gå till inställningar
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-[#3D4A2B] to-[#2A331E] text-white px-6 py-8 rounded-b-3xl shadow-2xl mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            <MapPin size={28} className="text-white" strokeWidth={2} />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-1">{countyDisplayName}</h1>
            <p className="text-white/80 text-sm">{t('regional.county_overview')}</p>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="text-3xl font-bold mb-1">{statistics?.totalCommunities || 0}</div>
            <div className="text-white/80 text-xs">{t('regional.active_communities')}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="text-3xl font-bold mb-1">{statistics?.totalMembers || 0}</div>
            <div className="text-white/80 text-xs">{t('regional.total_members')}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 relative">
            <div className="flex items-center justify-between mb-1">
              <div className="text-3xl font-bold">{statistics?.averagePreparedness?.toFixed(1) || '0.0'}</div>
              <button
                onClick={() => setShowPreparednessInfo(true)}
                className="p-1 rounded-full hover:bg-white/20 transition-colors touch-manipulation"
              >
                <Info size={18} className="text-white/80" />
              </button>
            </div>
            <div className="text-white/80 text-xs">{t('regional.average_preparedness')}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="text-3xl font-bold mb-1">{statistics?.activeHelpRequests || 0}</div>
            <div className="text-white/80 text-xs">{t('regional.active_help_requests')}</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-4 mb-6">
        <div className="bg-white rounded-xl shadow-md p-1 flex gap-1">
          <button
            onClick={() => setActiveTab('communities')}
            className={`flex-1 py-3 px-2 rounded-lg text-sm font-medium transition-all touch-manipulation ${
              activeTab === 'communities'
                ? 'bg-[#3D4A2B] text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {t('regional.community_list')}
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex-1 py-3 px-2 rounded-lg text-sm font-medium transition-all touch-manipulation ${
              activeTab === 'activity'
                ? 'bg-[#3D4A2B] text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {t('regional.recent_activities')}
          </button>
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-3 px-2 rounded-lg text-sm font-medium transition-all touch-manipulation ${
              activeTab === 'info'
                ? 'bg-[#3D4A2B] text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {t('regional.official_resources')}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="px-4 space-y-4">
        {/* Communities Tab */}
        {activeTab === 'communities' && (
          <>
            {communities.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-8 text-center">
                <MapPin size={48} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">{t('regional.no_communities_in_county')}</p>
                <p className="text-sm text-gray-400">{t('regional.create_community_prompt')}</p>
              </div>
            ) : (
              communities.map((community) => (
                <div
                  key={community.id}
                  className="bg-white rounded-xl shadow-md p-5 touch-manipulation active:scale-98 transition-transform"
                >
                  <h3 className="font-semibold text-lg text-gray-800 mb-2">
                    {community.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {community.location}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1 text-gray-700">
                      <Users size={16} className="text-[#5C6B47]" />
                      {community.memberCount}
                    </span>
                    <span className="flex items-center gap-1 text-gray-700">
                      <Package size={16} className="text-[#4A5239]" />
                      {community.sharedResourcesCount}
                    </span>
                    {community.activeRequestsCount > 0 && (
                      <span className="flex items-center gap-1 text-[#B8860B]">
                        <AlertTriangle size={16} />
                        {community.activeRequestsCount}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <>
            {!statistics || statistics.recentActivity.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-8 text-center">
                <Activity size={48} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">{t('regional.no_recent_activity')}</p>
              </div>
            ) : (
              statistics.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="bg-white rounded-xl shadow-md p-5"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-[#5C6B47]/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Activity size={20} className="text-[#5C6B47]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-800 font-medium mb-1">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTimeAgo(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* Info Tab */}
        {activeTab === 'info' && (
          <>
            {/* Länsstyrelsen Links */}
            <div className="bg-gradient-to-br from-[#3D4A2B] to-[#2A331E] rounded-xl shadow-md p-6 text-white">
              <h2 className="text-lg font-semibold mb-4">
                {t('regional.lansstyrelsen_info')}
              </h2>
              <p className="text-sm text-white/80 mb-4">
                {t('regional.official_county_information')}
              </p>
              <div className="space-y-2">
                {lansstyrelseLlinks.mainPage && (
                  <a
                    href={lansstyrelseLlinks.mainPage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-lg transition-colors touch-manipulation"
                  >
                    <span className="font-medium">{t('regional.visit_lansstyrelsen')}</span>
                    <ExternalLink size={18} />
                  </a>
                )}
                {lansstyrelseLlinks.crisisInfo && (
                  <a
                    href={lansstyrelseLlinks.crisisInfo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-lg transition-colors touch-manipulation"
                  >
                    <span className="font-medium">{t('regional.crisis_preparedness')}</span>
                    <ExternalLink size={18} />
                  </a>
                )}
                {lansstyrelseLlinks.environment && (
                  <a
                    href={lansstyrelseLlinks.environment}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-lg transition-colors touch-manipulation"
                  >
                    <span className="font-medium">{t('regional.environment_nature')}</span>
                    <ExternalLink size={18} />
                  </a>
                )}
              </div>
            </div>

            {/* Official Crisis Links */}
            <div className="bg-white rounded-xl shadow-md p-5">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {t('regional.official_resources')}
              </h3>
              <div className="space-y-3">
                {Object.values(officialLinks).map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start justify-between gap-3 p-4 border border-gray-200 rounded-lg hover:border-[#3D4A2B] transition-all touch-manipulation active:scale-98"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-800 text-sm mb-1">
                        {link.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {link.description}
                      </div>
                    </div>
                    <ExternalLink size={16} className="text-gray-400 flex-shrink-0 mt-1" />
                  </a>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Preparedness Info Modal */}
      {showPreparednessInfo && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-end"
          onClick={() => setShowPreparednessInfo(false)}
        >
          <div 
            className="bg-white rounded-t-3xl p-6 w-full max-h-[80vh] overflow-y-auto animate-slide-in-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                {t('regional.preparedness_score_tooltip_title')}
              </h3>
              <button
                onClick={() => setShowPreparednessInfo(false)}
                className="p-2 hover:bg-gray-100 rounded-full touch-manipulation"
              >
                <span className="text-2xl text-gray-500">×</span>
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-700">
                {t('regional.preparedness_score_tooltip_description')}
              </p>
              
              <div className="bg-[#5C6B47]/10 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-700 mb-2">
                  {t('regional.preparedness_score_tooltip_calculation')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

