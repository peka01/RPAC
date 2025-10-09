'use client';

import { useEffect, useState } from 'react';
import { MapPin, Users, TrendingUp, AlertTriangle, ExternalLink, Activity, Package, Info } from 'lucide-react';
import { t } from '@/lib/locales';
import { getRegionalStatistics, getCommunitiesInCounty, type RegionalStatistics, type CommunityOverview } from '@/lib/regional-service';
import { getLansstyrelsenLinks, getCountyDisplayName, getOfficialCrisisLinks, getAvailableOpenDataCategories } from '@/lib/lansstyrelsen-api';

interface RegionalOverviewDesktopProps {
  county: string;
}

export function RegionalOverviewDesktop({ county }: RegionalOverviewDesktopProps) {
  const [statistics, setStatistics] = useState<RegionalStatistics | null>(null);
  const [communities, setCommunities] = useState<CommunityOverview[]>([]);
  const [loading, setLoading] = useState(true);

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3D4A2B] mx-auto mb-4"></div>
          <p className="text-gray-600">{t('regional.loading_county_data')}</p>
        </div>
      </div>
    );
  }

  if (!county) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <MapPin size={64} className="text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('regional.no_county_set')}</h2>
          <p className="text-gray-600">{t('regional.set_location_prompt')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3 text-[#3D4A2B]">
            {countyDisplayName}
          </h1>
          <p className="text-lg text-gray-600">{t('regional.county_overview')}</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Communities */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#3D4A2B]">
            <div className="flex items-center gap-3 mb-3">
              <MapPin size={28} className="text-[#3D4A2B]" />
              <h3 className="text-lg font-semibold text-gray-800">
                {t('regional.active_communities')}
              </h3>
            </div>
            <p className="text-4xl font-bold mb-2 text-[#3D4A2B]">
              {statistics?.totalCommunities || 0}
            </p>
            <p className="text-sm text-gray-600">
              {t('regional.registered_communities')}
            </p>
          </div>

          {/* Members */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#5C6B47]">
            <div className="flex items-center gap-3 mb-3">
              <Users size={28} className="text-[#5C6B47]" />
              <h3 className="text-lg font-semibold text-gray-800">
                {t('regional.total_members')}
              </h3>
            </div>
            <p className="text-4xl font-bold mb-2 text-[#5C6B47]">
              {statistics?.totalMembers || 0}
            </p>
            <p className="text-sm text-gray-600">
              {t('regional.registered_users')}
            </p>
          </div>

          {/* Preparedness */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#4A5239] relative group">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp size={28} className="text-[#4A5239]" />
              <h3 className="text-lg font-semibold text-gray-800 flex-1">
                {t('regional.preparedness_score')}
              </h3>
              <div className="relative">
                <Info size={20} className="text-gray-400 cursor-help" />
                <div className="absolute bottom-full right-0 mb-2 w-80 bg-gray-900 text-white text-sm rounded-lg p-4 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <div className="font-semibold mb-2">{t('regional.preparedness_score_tooltip_title')}</div>
                  <p className="mb-2">{t('regional.preparedness_score_tooltip_description')}</p>
                  <div className="text-xs text-gray-300">
                    {t('regional.preparedness_score_tooltip_calculation')}
                  </div>
                  <div className="absolute top-full right-4 -mt-1">
                    <div className="border-8 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-4xl font-bold mb-2 text-[#4A5239]">
              {statistics?.averagePreparedness?.toFixed(1) || '0.0'}
            </p>
            <p className="text-sm text-gray-600">
              {t('regional.average_score')}
            </p>
          </div>

          {/* Help Requests */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#B8860B]">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle size={28} className="text-[#B8860B]" />
              <h3 className="text-lg font-semibold text-gray-800">
                {t('regional.help_requests')}
              </h3>
            </div>
            <p className="text-4xl font-bold mb-2 text-[#B8860B]">
              {statistics?.activeHelpRequests || 0}
            </p>
            <p className="text-sm text-gray-600">
              {t('regional.open_requests')}
            </p>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Communities & Activity (2/3) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Communities List */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-3 mb-6">
                <MapPin size={24} className="text-[#3D4A2B]" />
                <h2 className="text-2xl font-semibold text-gray-800">
                  {t('regional.community_list')}
                </h2>
              </div>

              {communities.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">{t('regional.no_communities_in_county')}</p>
                  <p className="text-sm text-gray-400">{t('regional.create_community_prompt')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {communities.map((community) => (
                    <div
                      key={community.id}
                      className="p-4 border border-gray-200 rounded-lg hover:border-[#3D4A2B] hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-800 mb-1">
                            {community.name}
                          </h3>
                          <p className="text-sm text-gray-600 mb-3">
                            {community.location}
                          </p>
                          <div className="flex items-center gap-6 text-sm">
                            <span className="flex items-center gap-1 text-gray-700">
                              <Users size={16} className="text-[#5C6B47]" />
                              {community.memberCount} {community.memberCount === 1 ? t('regional.member') : t('regional.members')}
                            </span>
                            <span className="flex items-center gap-1 text-gray-700">
                              <Package size={16} className="text-[#4A5239]" />
                              {community.sharedResourcesCount} {t('regional.resources')}
                            </span>
                            {community.activeRequestsCount > 0 && (
                              <span className="flex items-center gap-1 text-[#B8860B]">
                                <AlertTriangle size={16} />
                                {community.activeRequestsCount} {t('regional.requests')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Activity Feed */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-3 mb-6">
                <Activity size={24} className="text-[#3D4A2B]" />
                <h2 className="text-2xl font-semibold text-gray-800">
                  {t('regional.recent_activities')}
                </h2>
              </div>

              {!statistics || statistics.recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">{t('regional.no_recent_activity')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {statistics.recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="border-l-4 border-[#5C6B47] pl-4 py-2"
                    >
                      <h3 className="font-medium text-gray-800">
                        {activity.description}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTimeAgo(activity.timestamp)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Länsstyrelsen Info (1/3) */}
          <div className="space-y-6">
            {/* Länsstyrelsen Links */}
            <div className="bg-gradient-to-br from-[#3D4A2B] to-[#2A331E] rounded-xl shadow-md p-6 text-white">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <ExternalLink size={20} />
                {t('regional.lansstyrelsen_info')}
              </h2>
              <p className="text-sm text-white/80 mb-6">
                {t('regional.official_county_information')}
              </p>
              <div className="space-y-3">
                {lansstyrelseLlinks.mainPage && (
                  <a
                    href={lansstyrelseLlinks.mainPage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{t('regional.visit_lansstyrelsen')}</span>
                      <ExternalLink size={16} />
                    </div>
                  </a>
                )}
                {lansstyrelseLlinks.crisisInfo && (
                  <a
                    href={lansstyrelseLlinks.crisisInfo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{t('regional.crisis_preparedness')}</span>
                      <ExternalLink size={16} />
                    </div>
                  </a>
                )}
                {lansstyrelseLlinks.environment && (
                  <a
                    href={lansstyrelseLlinks.environment}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{t('regional.environment_nature')}</span>
                      <ExternalLink size={16} />
                    </div>
                  </a>
                )}
              </div>
            </div>

            {/* Official Crisis Links */}
            <div className="bg-white rounded-xl shadow-md p-6">
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
                    className="block p-3 border border-gray-200 rounded-lg hover:border-[#3D4A2B] hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium text-gray-800 text-sm mb-1">
                          {link.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {link.description}
                        </div>
                      </div>
                      <ExternalLink size={14} className="text-gray-400 flex-shrink-0 mt-1" />
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Resource Stats */}
            {statistics && statistics.sharedResources > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  {t('regional.resource_coordination')}
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-[#5C6B47]/10 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">
                      {t('regional.shared_resources')}
                    </span>
                    <span className="text-lg font-bold text-[#5C6B47]">
                      {statistics.sharedResources}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

