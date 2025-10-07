'use client';

import { useState, useEffect } from 'react';
import {
  Home,
  Package,
  Droplets,
  Heart,
  Zap,
  Wrench,
  Shield,
  TrendingUp,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Sprout,
  Activity,
  Plus,
  ChevronRight,
  HelpCircle
} from 'lucide-react';
import { resourceService, type Resource, supabase } from '@/lib/supabase';
import { useUserProfile } from '@/lib/useUserProfile';
import { t } from '@/lib/locales';
import { calculatePlanNutrition } from '@/lib/cultivation-plan-service';
import type { User } from '@supabase/supabase-js';

interface IndividualDashboardProps {
  user: { id: string; email?: string };
  onNavigate: (section: string, subsection?: string) => void;
}

const categoryConfig = {
  food: { icon: Package, emoji: '🍞', label: 'Mat', color: '#FFC000' },
  water: { icon: Droplets, emoji: '💧', label: 'Vatten', color: '#4A90E2' },
  medicine: { icon: Heart, emoji: '💊', label: 'Medicin', color: '#8B4513' },
  energy: { icon: Zap, emoji: '⚡', label: 'Energi', color: '#B8860B' },
  tools: { icon: Wrench, emoji: '🔧', label: 'Verktyg', color: '#4A5239' },
  other: { icon: Package, emoji: '✨', label: 'Övrigt', color: '#707C5F' }
};

type CategoryKey = keyof typeof categoryConfig;

export function IndividualDashboard({ user, onNavigate }: IndividualDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState<Resource[]>([]);
  const [cultivationPlan, setCultivationPlan] = useState<any>(null);
  const { profile } = useUserProfile(user as any);
  
  const [stats, setStats] = useState({
    totalResources: 0,
    filledResources: 0,
    msbCompleted: 0,
    msbTotal: 0,
    preparednessScore: 0,
    selfSufficiencyDays: 0,
    criticalItems: 0,
    expiringSoon: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, [user.id]);

  // Refresh data when component becomes visible (e.g., after navigating back from resources page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadDashboardData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user.id]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await resourceService.getResources(user.id);
      setResources(data);

      // Calculate statistics based on added resources (not is_filled)
      const addedResources = data; // All resources in DB are "added"
      const msb = data.filter(r => r.is_msb_recommended);
      const msbAdded = msb.filter(r => r.quantity > 0); // Has resources added
      const expiring = addedResources.filter(r => r.days_remaining < 30 && r.days_remaining < 99999 && r.quantity > 0);
      
      // MSB categories we recommend (6 total)
      const msbCategories = ['food', 'water', 'medicine', 'energy', 'tools', 'other'];
      const msbCategoriesWithResources = new Set(msbAdded.map(r => r.category));
      const msbCategoriesCompleted = msbCategoriesWithResources.size;

      // Calculate preparedness score based on MSB categories covered
      const score = Math.round((msbCategoriesCompleted / msbCategories.length) * 100);

      // Calculate self-sufficiency
      const familySize = profile?.household_size || 1;
      const waterResources = addedResources.filter(r => r.category === 'water' && r.quantity > 0);
      const foodResources = addedResources.filter(r => r.category === 'food' && r.quantity > 0);
      
      // Water: Assume each quantity unit = 1 liter, need 2L per person per day
      const waterDays = waterResources.length > 0 
        ? waterResources.reduce((sum, r) => sum + r.quantity, 0) / (2 * familySize)
        : 0;
      
      // Food: Use minimum days_remaining of all food items
      const foodDays = foodResources.length > 0
        ? Math.min(...foodResources.map(r => r.days_remaining < 99999 ? r.days_remaining : 365))
        : 0;
      
      // Self-sufficiency is limited by the resource you have least of
      const days = Math.min(Math.floor(waterDays), Math.floor(foodDays));

      setStats({
        totalResources: data.length,
        filledResources: addedResources.length, // Renamed but still tracks added resources
        msbCompleted: msbCategoriesCompleted,
        msbTotal: msbCategories.length,
        preparednessScore: score,
        selfSufficiencyDays: days,
        criticalItems: msbCategories.length - msbCategoriesCompleted, // Categories not yet covered
        expiringSoon: expiring.length
      });

      // Load cultivation plan
      const { data: planData } = await supabase
        .from('cultivation_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_primary', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (planData) {
        const crops = planData.crops || [];
        const cropNames = crops.map((crop: any) => crop.cropName || crop.name || crop).filter(Boolean);

        const householdSize = profile?.household_size || 2;
        const targetDays = 30;

        const cultivationPlanForCalc = {
          id: planData.id,
          user_id: planData.user_id,
          plan_name: planData.title,
          description: planData.description,
          crops: crops,
          is_primary: planData.is_primary,
          created_at: planData.created_at,
          updated_at: planData.updated_at
        };

        const nutrition = calculatePlanNutrition(cultivationPlanForCalc, householdSize, targetDays);

        setCultivationPlan({
          id: planData.id,
          title: planData.title,
          name: planData.title,
          description: planData.description || 'Din odlingsplan',
          self_sufficiency_percent: nutrition.percentOfTarget,
          selfSufficiencyPercent: nutrition.percentOfTarget,
          crops: cropNames,
          estimated_cost: 0,
          created_at: planData.created_at,
          is_primary: planData.is_primary,
          plan_id: planData.plan_id
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryHealth = (category: CategoryKey) => {
    const categoryResources = resources.filter(r => r.category === category);
    const withQuantity = categoryResources.filter(r => r.quantity > 0);
    return categoryResources.length > 0 ? Math.round((withQuantity.length / categoryResources.length) * 100) : 0;
  };

  // Get color for self-sufficiency days (green > yellow > red)
  const getSelfSufficiencyColor = (days: number) => {
    if (days >= 7) return { bg: '#556B2F', text: '#ffffff' }; // Green - 7+ days
    if (days >= 3) return { bg: '#B8860B', text: '#ffffff' }; // Yellow - 3-6 days
    return { bg: '#8B4513', text: '#ffffff' }; // Red - 0-2 days
  };

  // Get color for preparedness score
  const getScoreColor = (score: number) => {
    if (score >= 80) return { bg: '#556B2F', text: '#ffffff' }; // Green
    if (score >= 50) return { bg: '#B8860B', text: '#ffffff' }; // Yellow
    return { bg: '#8B4513', text: '#ffffff' }; // Red
  };

  // Get health status color for categories
  const getHealthStatusColor = (health: number) => {
    if (health >= 70) return '#556B2F'; // Green
    if (health >= 30) return '#B8860B'; // Yellow
    return '#8B4513'; // Red
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3D4A2B]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#556B2F] to-[#3D4A2B] text-white rounded-2xl p-8 shadow-2xl" role="region" aria-label="Hemöversikt">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Home size={32} className="text-white" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold mb-2">Mitt hem</h1>
              <p className="text-white/80 text-sm">
                {profile?.display_name ? `${profile.display_name}s` : 'Din'} beredskap
              </p>
            </div>
          </div>
          {profile?.household_size && profile.household_size > 1 && (
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-2 py-1 ml-2">
              <div className="flex items-center gap-1">
                <Users size={12} />
                <span className="text-xs font-medium">
                  {profile.household_size} pers
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Combined Resources Card */}
          <div className="bg-white/25 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/30 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Package size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">Resurser</h3>
                  <p className="text-white/70 text-xs">Totalt registrerade</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              {/* Total Resources */}
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-4xl font-bold text-white mb-1" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                    {stats.totalResources}
                  </div>
                  <div className="text-white/70 text-xs">Tillagda resurser</div>
                </div>
              </div>
              
              {/* MSB Progress */}
              <div className="bg-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-white/80" />
                    <span className="text-white/90 text-sm font-medium">MSB-rekommenderade</span>
                  </div>
                  <span className="text-white font-semibold text-sm">
                    {stats.msbCompleted}/{stats.msbTotal}
                  </span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div 
                    className="bg-white rounded-full h-2 transition-all duration-500" 
                    style={{ width: `${(stats.msbCompleted / stats.msbTotal) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Cultivation Card */}
          {cultivationPlan && (
            <div className="bg-white/25 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/30 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Sprout size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-sm">Odling</h3>
                    <p className="text-white/70 text-xs">Hushållsbehov</p>
                  </div>
                </div>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-4xl font-bold text-white mb-1" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                    {cultivationPlan.selfSufficiencyPercent || 0}%
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div 
                      className="bg-white rounded-full h-2 transition-all duration-500" 
                      style={{ width: `${Math.min(cultivationPlan.selfSufficiencyPercent || 0, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Critical Alerts with Better Spacing */}
      {(stats.criticalItems > 0 || stats.expiringSoon > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stats.criticalItems > 0 && (
            <div className="bg-[#8B4513]/10 border-3 border-[#8B4513] rounded-xl p-8 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-[#8B4513] rounded-xl flex items-center justify-center flex-shrink-0 animate-pulse shadow-lg">
                  <AlertTriangle size={28} className="text-white" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-black text-gray-900 mb-3">
                    {stats.criticalItems} kritiska resurser saknas
                  </h3>
                  <p className="text-gray-700 font-medium mb-6 leading-relaxed">
                    Högprioriterade MSB-rekommendationer som behöver fyllas i
                  </p>
                  <button
                    onClick={() => onNavigate('resources', 'inventory')}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-[#8B4513] text-white font-bold text-base rounded-xl hover:bg-[#6B3410] transition-all shadow-lg hover:shadow-xl border-2 border-[#8B4513] min-h-[56px] touch-manipulation active:scale-98"
                    aria-label="Fyll i kritiska resurser för att förbättra din beredskap"
                  >
                    <Plus size={20} />
                    <span>{t('dashboard.fill_resources_action')}</span>
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {stats.expiringSoon > 0 && (
            <div className="bg-[#B8860B]/10 border-3 border-[#B8860B] rounded-xl p-8 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-[#B8860B] rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Clock size={28} className="text-white" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-black text-gray-900 mb-3">
                    {stats.expiringSoon} resurser utgår snart
                  </h3>
                  <p className="text-gray-700 font-medium mb-6 leading-relaxed">
                    Resurser som behöver förnyas inom 30 dagar
                  </p>
                  <button
                    onClick={() => onNavigate('resources', 'inventory')}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-[#B8860B] text-white font-bold text-base rounded-xl hover:bg-[#9A7209] transition-all shadow-lg hover:shadow-xl border-2 border-[#B8860B] min-h-[56px] touch-manipulation active:scale-98"
                    aria-label="Se resurser som utgår snart"
                  >
                    <Clock size={20} />
                    <span>Se resurser</span>
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}


      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => onNavigate('resources', 'inventory')}
          className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] text-left border-2 border-transparent hover:border-[#3D4A2B]"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-[#3D4A2B]/10 rounded-xl flex items-center justify-center group-hover:bg-[#3D4A2B] transition-colors">
              <Package size={28} className="text-[#3D4A2B] group-hover:text-white transition-colors" strokeWidth={2.5} />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900 mb-1">
                Resursinventering
              </div>
              <div className="text-sm text-gray-600">
                Hantera dina resurser
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            {stats.totalResources} {stats.totalResources === 1 ? 'resurs tillagd' : 'resurser tillagda'}
          </div>
        </button>

        <button
          onClick={() => onNavigate('cultivation', 'calendar')}
          className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] text-left border-2 border-transparent hover:border-[#3D4A2B]"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-[#556B2F]/10 rounded-xl flex items-center justify-center group-hover:bg-[#556B2F] transition-colors">
              <Sprout size={28} className="text-[#556B2F] group-hover:text-white transition-colors" strokeWidth={2.5} />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900 mb-1">
                Odlingskalender
              </div>
              <div className="text-sm text-gray-600">
                Planera din odling
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            Se månadens odlingsuppgifter
          </div>
        </button>

      </div>
    </div>
  );
}

