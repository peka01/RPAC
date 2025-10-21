'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { t } from '@/lib/locales';
import Link from 'next/link';
import { 
  Shield, 
  Users, 
  Building2, 
  Key, 
  TrendingUp,
  UserCheck,
  UserCog,
  ShieldCheck,
  Globe,
  Lock,
  Clock,
  AlertCircle,
  Package,
  LogOut
} from 'lucide-react';

interface SystemStats {
  totalUsers: number;
  individualUsers: number;
  communityManagers: number;
  superAdmins: number;
  activeCommunities: number;
  openCommunities: number;
  closedCommunities: number;
  pendingRequests: number;
  activeLicenses: number;
  expiredLicenses: number;
  totalResources: number;
  totalMessages: number;
}

import { useRouter } from 'next/navigation';

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadSystemStats();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/super-admin/login');
  }

  async function loadSystemStats() {
    try {
      // Get user tier counts
      const { data: tierCounts } = await supabase
        .from('user_profiles')
        .select('user_tier');

      const totalUsers = tierCounts?.length || 0;
      const individualUsers = tierCounts?.filter(u => u.user_tier === 'individual').length || 0;
      const communityManagers = tierCounts?.filter(u => u.user_tier === 'community_manager').length || 0;
      const superAdmins = tierCounts?.filter(u => u.user_tier === 'super_admin').length || 0;

      // Get community counts
      const { data: communities } = await supabase
        .from('local_communities')
        .select('access_type');

      const activeCommunities = communities?.length || 0;
      const openCommunities = communities?.filter(c => c.access_type === 'öppet').length || 0;
      const closedCommunities = communities?.filter(c => c.access_type === 'stängt').length || 0;

      // Get pending membership requests
      const { count: pendingCount } = await supabase
        .from('community_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('membership_status', 'pending');

      // Get license counts
      const { count: activeLicenses } = await supabase
        .from('license_history')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      const { count: expiredLicenses } = await supabase
        .from('license_history')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', false);

      // Get resource count
      const { count: resourceCount } = await supabase
        .from('resources')
        .select('*', { count: 'exact', head: true });

      // Get message count
      const { count: messageCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalUsers,
        individualUsers,
        communityManagers,
        superAdmins,
        activeCommunities,
        openCommunities,
        closedCommunities,
        pendingRequests: pendingCount || 0,
        activeLicenses: activeLicenses || 0,
        expiredLicenses: expiredLicenses || 0,
        totalResources: resourceCount || 0,
        totalMessages: messageCount || 0,
      });
    } catch (error) {
      console.error('Error loading system stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#3D4A2B]/20 border-t-[#3D4A2B] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">{t('admin.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#2A331E] to-[#3D4A2B] text-white px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Shield className="w-10 h-10" />
              <h1 className="text-3xl font-bold">{t('admin.title')}</h1>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Logga ut</span>
            </button>
          </div>
          <p className="text-white/80 text-lg">
            {t('admin.stats.title')}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#3D4A2B]">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-[#3D4A2B]" />
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-gray-600 text-sm mb-1">{t('admin.stats.total_users')}</p>
            <p className="text-3xl font-bold text-gray-900">{stats?.totalUsers}</p>
          </div>

          {/* Community Managers */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-amber-500">
            <div className="flex items-center justify-between mb-4">
              <UserCog className="w-8 h-8 text-amber-600" />
            </div>
            <p className="text-gray-600 text-sm mb-1">{t('admin.stats.community_managers')}</p>
            <p className="text-3xl font-bold text-gray-900">{stats?.communityManagers}</p>
            <p className="text-xs text-gray-500 mt-1">
              {stats?.individualUsers} {t('admin.stats.individual_users')}
            </p>
          </div>

          {/* Active Communities */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-4">
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-gray-600 text-sm mb-1">{t('admin.stats.active_communities')}</p>
            <p className="text-3xl font-bold text-gray-900">{stats?.activeCommunities}</p>
            <div className="flex gap-3 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Globe className="w-3 h-3" />
                {stats?.openCommunities} {t('admin.stats.open_communities')}
              </span>
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3" />
                {stats?.closedCommunities} {t('admin.stats.closed_communities')}
              </span>
            </div>
          </div>

          {/* Pending Requests */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between mb-4">
              <Clock className="w-8 h-8 text-orange-600" />
              {(stats?.pendingRequests ?? 0) > 0 && (
                <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-full">
                  {stats?.pendingRequests}
                </span>
              )}
            </div>
            <p className="text-gray-600 text-sm mb-1">{t('admin.stats.pending_requests')}</p>
            <p className="text-3xl font-bold text-gray-900">{stats?.pendingRequests ?? 0}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/super-admin/users">
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all cursor-pointer border border-transparent hover:border-[#3D4A2B]">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 bg-[#3D4A2B]/10 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-[#3D4A2B]" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">{t('admin.user_management.title')}</h3>
              </div>
              <p className="text-gray-600 text-sm">
                {t('admin.user_management.subtitle')}
              </p>
            </div>
          </Link>

          <Link href="/super-admin/communities">
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all cursor-pointer border border-transparent hover:border-[#3D4A2B]">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">{t('admin.community_management.title')}</h3>
              </div>
              <p className="text-gray-600 text-sm">
                {t('admin.community_management.subtitle')}
              </p>
            </div>
          </Link>

          <Link href="/super-admin/licenses">
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all cursor-pointer border border-transparent hover:border-[#3D4A2B]">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center">
                  <Key className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">{t('admin.license_management.title')}</h3>
              </div>
              <p className="text-gray-600 text-sm">
                {t('admin.license_management.subtitle')}
              </p>
              <div className="flex gap-3 mt-3 text-xs">
                <span className="text-green-700 bg-green-50 px-2 py-1 rounded">
                  {stats?.activeLicenses} {t('admin.license_management.active_licenses')}
                </span>
                <span className="text-red-700 bg-red-50 px-2 py-1 rounded">
                  {stats?.expiredLicenses} {t('admin.license_management.expired_licenses')}
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* System Overview */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Package className="w-6 h-6 text-[#3D4A2B]" />
            Systemöversikt
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border-l-4 border-[#3D4A2B] pl-4">
              <p className="text-gray-600 text-sm mb-1">{t('admin.stats.total_resources')}</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalResources}</p>
            </div>
            <div className="border-l-4 border-blue-500 pl-4">
              <p className="text-gray-600 text-sm mb-1">{t('admin.stats.total_messages')}</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalMessages}</p>
            </div>
            <div className="border-l-4 border-green-500 pl-4">
              <p className="text-gray-600 text-sm mb-1">{t('admin.stats.super_admins')}</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.superAdmins}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

