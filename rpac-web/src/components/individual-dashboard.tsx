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
  Activity
} from 'lucide-react';
import { resourceService, type Resource } from '@/lib/supabase';
import { useUserProfile } from '@/lib/useUserProfile';
import { t } from '@/lib/locales';
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

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await resourceService.getResources(user.id);
      setResources(data);

      // Calculate statistics
      const filled = data.filter(r => r.is_filled);
      const msb = data.filter(r => r.is_msb_recommended);
      const msbFilled = msb.filter(r => r.is_filled);
      const expiring = filled.filter(r => r.days_remaining < 30 && r.days_remaining < 99999);
      const critical = data.filter(r => r.is_msb_recommended && !r.is_filled && r.msb_priority === 'high');

      // Calculate preparedness score
      const score = msb.length > 0 ? Math.round((msbFilled.length / msb.length) * 100) : 0;

      // Calculate self-sufficiency (simplified)
      const familySize = profile?.household_size || 1;
      const waterResources = filled.filter(r => r.category === 'water');
      const foodResources = filled.filter(r => r.category === 'food');
      
      const waterDays = waterResources.length > 0 
        ? waterResources.reduce((sum, r) => sum + r.quantity, 0) / (2 * familySize)
        : 0;
      const foodDays = foodResources.length > 0
        ? Math.min(...foodResources.map(r => r.days_remaining < 99999 ? r.days_remaining : 365))
        : 0;
      
      const days = Math.min(Math.floor(waterDays), Math.floor(foodDays));

      setStats({
        totalResources: data.length,
        filledResources: filled.length,
        msbCompleted: msbFilled.length,
        msbTotal: msb.length,
        preparednessScore: score,
        selfSufficiencyDays: days,
        criticalItems: critical.length,
        expiringSoon: expiring.length
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryHealth = (category: CategoryKey) => {
    const categoryResources = resources.filter(r => r.category === category);
    const filled = categoryResources.filter(r => r.is_filled);
    return categoryResources.length > 0 ? Math.round((filled.length / categoryResources.length) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3D4A2B]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#556B2F] to-[#3D4A2B] text-white rounded-2xl p-8 shadow-2xl">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Home size={40} className="text-white" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">Mitt hem</h1>
              <p className="text-white/80 text-lg">
                {profile?.display_name ? `${profile.display_name}s` : 'Din'} personliga beredskap
              </p>
            </div>
          </div>
          {profile?.household_size && profile.household_size > 1 && (
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <div className="flex items-center gap-2">
                <Users size={16} />
                <span className="text-sm font-medium">
                  {profile.household_size} personer
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 text-sm">Beredskapspoäng</span>
              <Shield size={20} className="text-white/80" />
            </div>
            <div className="text-3xl font-bold">{stats.preparednessScore}%</div>
            <div className="text-white/80 text-xs mt-1">
              {stats.preparednessScore >= 80 ? 'Utmärkt!' : 
               stats.preparednessScore >= 60 ? 'Bra framsteg' : 
               stats.preparednessScore >= 40 ? 'På rätt väg' : 'Behöver uppmärksamhet'}
            </div>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 text-sm">Självförsörjning</span>
              <Calendar size={20} className="text-white/80" />
            </div>
            <div className="text-3xl font-bold">{stats.selfSufficiencyDays}</div>
            <div className="text-white/80 text-xs mt-1">
              {stats.selfSufficiencyDays === 1 ? 'dag' : 'dagar'} klarar du
            </div>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 text-sm">MSB-resurser</span>
              <CheckCircle size={20} className="text-white/80" />
            </div>
            <div className="text-3xl font-bold">{stats.msbCompleted}/{stats.msbTotal}</div>
            <div className="text-white/80 text-xs mt-1">Rekommendationer</div>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 text-sm">Resurser</span>
              <Package size={20} className="text-white/80" />
            </div>
            <div className="text-3xl font-bold">{stats.filledResources}</div>
            <div className="text-white/80 text-xs mt-1">Ifyllda resurser</div>
          </div>
        </div>
      </div>

      {/* Critical Alerts */}
      {(stats.criticalItems > 0 || stats.expiringSoon > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.criticalItems > 0 && (
            <div className="bg-[#8B4513]/10 border-2 border-[#8B4513] rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#8B4513] rounded-xl flex items-center justify-center flex-shrink-0 animate-pulse">
                  <AlertTriangle size={24} className="text-white" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {stats.criticalItems} kritiska resurser saknas
                  </h3>
                  <p className="text-gray-700 mb-4">
                    Högprioriterade MSB-rekommendationer som behöver fyllas i
                  </p>
                  <button
                    onClick={() => onNavigate('resources', 'inventory')}
                    className="px-6 py-3 bg-[#8B4513] text-white font-bold rounded-xl hover:bg-[#6B3410] transition-colors"
                  >
                    Fyll i resurser
                  </button>
                </div>
              </div>
            </div>
          )}

          {stats.expiringSoon > 0 && (
            <div className="bg-[#B8860B]/10 border-2 border-[#B8860B] rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#B8860B] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Clock size={24} className="text-white" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {stats.expiringSoon} resurser utgår snart
                  </h3>
                  <p className="text-gray-700 mb-4">
                    Resurser som behöver förnyas inom 30 dagar
                  </p>
                  <button
                    onClick={() => onNavigate('resources', 'inventory')}
                    className="px-6 py-3 bg-[#B8860B] text-white font-bold rounded-xl hover:bg-[#9A7209] transition-colors"
                  >
                    Se resurser
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Category Health Overview */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Resurshälsa per kategori</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {(Object.keys(categoryConfig) as CategoryKey[]).map(category => {
            const config = categoryConfig[category];
            const health = getCategoryHealth(category);
            const Icon = config.icon;
            
            return (
              <button
                key={category}
                onClick={() => onNavigate('resources', 'inventory')}
                className="group bg-white rounded-xl p-4 shadow-md hover:shadow-xl transition-all hover:scale-105 text-center"
              >
                <div 
                  className="w-16 h-16 mx-auto mb-3 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${config.color}20` }}
                >
                  <span className="text-3xl">{config.emoji}</span>
                </div>
                <h4 className="font-bold text-gray-900 mb-2">{config.label}</h4>
                <div className="text-2xl font-bold mb-1" style={{ color: config.color }}>
                  {health}%
                </div>
                <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${health}%`,
                      backgroundColor: config.color
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

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
            {stats.filledResources} av {stats.totalResources} resurser ifyllda
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

        <button
          onClick={() => onNavigate('resources', 'ai-coach')}
          className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] text-left border-2 border-transparent hover:border-[#3D4A2B]"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-[#707C5F]/10 rounded-xl flex items-center justify-center group-hover:bg-[#707C5F] transition-colors">
              <Activity size={28} className="text-[#707C5F] group-hover:text-white transition-colors" strokeWidth={2.5} />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900 mb-1">
                AI-coach
              </div>
              <div className="text-sm text-gray-600">
                Få personliga råd
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            Beredskapscoach med AI
          </div>
        </button>
      </div>
    </div>
  );
}

