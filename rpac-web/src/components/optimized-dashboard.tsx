'use client';

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { User } from '@supabase/supabase-js';
import { getCachedUserProfile, getCachedResources, preloadCriticalData } from '@/lib/performance-optimizations';
import { ShieldProgressSpinner } from './ShieldProgressSpinner';
import { Package, Shield, AlertTriangle, Home, Plus, Sprout, Users } from 'lucide-react';

interface OptimizedDashboardProps {
  user: User | null;
}

// Memoized components for better performance
const StatsCard = memo(({ title, value, icon: Icon, color }: {
  title: string;
  value: string | number;
  icon: any;
  color: string;
}) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
    </div>
  </div>
));

StatsCard.displayName = 'StatsCard';

const QuickAction = memo(({ title, description, icon: Icon, onClick, color }: {
  title: string;
  description: string;
  icon: any;
  onClick: () => void;
  color: string;
}) => (
  <button
    onClick={onClick}
    className={`p-4 rounded-xl text-left transition-all hover:scale-105 hover:shadow-lg ${color}`}
  >
    <div className="flex items-center gap-3 mb-2">
      <Icon size={20} className="text-white" />
      <h3 className="font-semibold text-white">{title}</h3>
    </div>
    <p className="text-sm text-white/80">{description}</p>
  </button>
));

QuickAction.displayName = 'QuickAction';

export function OptimizedDashboard({ user }: OptimizedDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalResources: 0,
    msbScore: 0,
    expiringItems: 0,
    selfSufficiency: 0
  });

  // Memoized calculations
  const calculatedStats = useMemo(() => {
    if (!resources.length) return stats;

    const msbResources = resources.filter(r => r.is_msb_recommended);
    const msbCategories = ['food', 'water', 'medicine', 'energy', 'tools', 'other'];
    const msbCategoriesWithResources = new Set(msbResources.map(r => r.category));
    const msbScore = Math.round((msbCategoriesWithResources.size / msbCategories.length) * 100);

    const expiringItems = resources.filter(r => 
      r.days_remaining < 30 && r.days_remaining < 99999 && r.quantity > 0
    ).length;

    // Calculate self-sufficiency based on water and food
    const familySize = userProfile?.household_size || 1;
    const waterResources = resources.filter(r => r.category === 'water' && r.quantity > 0);
    const foodResources = resources.filter(r => r.category === 'food' && r.quantity > 0);
    
    const waterDays = waterResources.length > 0 
      ? waterResources.reduce((sum, r) => sum + r.quantity, 0) / (2 * familySize)
      : 0;
    
    const foodDays = foodResources.length > 0
      ? Math.min(...foodResources.map(r => r.days_remaining < 99999 ? r.days_remaining : 365))
      : 0;
    
    const selfSufficiency = Math.min(Math.floor(waterDays), Math.floor(foodDays));

    return {
      totalResources: resources.length,
      msbScore,
      expiringItems,
      selfSufficiency
    };
  }, [resources, userProfile]);

  // Optimized data loading
  const loadDashboardData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Preload critical data in parallel
      const [profileData, resourcesData] = await preloadCriticalData(user.id);
      
      setUserProfile(profileData);
      setResources(resourcesData?.data || []);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Update stats when calculations change
  useEffect(() => {
    setStats(calculatedStats);
  }, [calculatedStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <ShieldProgressSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Välkommen, {userProfile?.display_name || user?.email?.split('@')[0] || 'Användare'}!
        </h1>
        <p className="text-gray-600">Din personliga beredskapsöversikt</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Totalt resurser"
          value={stats.totalResources}
          icon={Package}
          color="bg-[#3D4A2B]"
        />
        <StatsCard
          title="MSB Score"
          value={`${stats.msbScore}%`}
          icon={Shield}
          color="bg-[#5C6B47]"
        />
        <StatsCard
          title="Utgående varor"
          value={stats.expiringItems}
          icon={AlertTriangle}
          color="bg-[#B8860B]"
        />
        <StatsCard
          title="Självförsörjning"
          value={`${stats.selfSufficiency} dagar`}
          icon={Home}
          color="bg-[#707C5F]"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <QuickAction
          title="Lägg till resurs"
          description="Registrera nya förnödenheter"
          icon={Plus}
          onClick={() => {/* Navigate to add resource */}}
          color="bg-gradient-to-br from-[#3D4A2B] to-[#2A331E]"
        />
        <QuickAction
          title="Min odling"
          description="Planera och hantera odling"
          icon={Sprout}
          onClick={() => {/* Navigate to cultivation */}}
          color="bg-gradient-to-br from-[#5C6B47] to-[#4A5239]"
        />
        <QuickAction
          title="Lokalt nätverk"
          description="Anslut med ditt samhälle"
          icon={Users}
          onClick={() => {/* Navigate to community */}}
          color="bg-gradient-to-br from-[#707C5F] to-[#5C6B47]"
        />
      </div>
    </div>
  );
}
