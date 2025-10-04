'use client';

import { useState, useEffect } from 'react';
import { resourceService, Resource } from '@/lib/supabase';
import { useUserProfile } from '@/lib/useUserProfile';
import { t } from '@/lib/locales';
import { ResourceQuickAddModal } from './resource-quick-add-modal';
import { SupabaseResourceInventory } from './supabase-resource-inventory';
import { IndividualDashboard } from './individual-dashboard';
import { 
  Package, 
  Droplets, 
  Heart, 
  Zap, 
  Wrench,
  Shield,
  Plus,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Sparkles,
  Share2,
  Calendar,
  BarChart3,
  Home
} from 'lucide-react';

interface ResourceManagementHubProps {
  user: { id: string; email?: string };
}

const categoryConfig = {
  food: { 
    icon: Package, 
    emoji: '🍞', 
    label: 'Mat',
    color: '#FFC000' // Seasonal harvest gold
  },
  water: { 
    icon: Droplets, 
    emoji: '💧', 
    label: 'Vatten',
    color: '#4A90E2' // Cool water blue (accent only)
  },
  medicine: { 
    icon: Heart, 
    emoji: '💊', 
    label: 'Medicin',
    color: '#8B4513' // Muted red/brown
  },
  energy: { 
    icon: Zap, 
    emoji: '⚡', 
    label: 'Energi',
    color: '#B8860B' // Amber
  },
  tools: { 
    icon: Wrench, 
    emoji: '🔧', 
    label: 'Verktyg',
    color: '#4A5239' // Olive gray
  },
  other: { 
    icon: Sparkles, 
    emoji: '✨', 
    label: 'Övrigt',
    color: '#707C5F' // Muted olive
  }
};

type CategoryKey = keyof typeof categoryConfig;

interface CategoryStats {
  total: number;
  filled: number;
  empty: number;
  expiringSoon: number;
  avgDaysRemaining: number;
  health: number;
}

export function ResourceManagementHub({ user }: ResourceManagementHubProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'dashboard' | 'inventory'>('dashboard');
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | null>(null);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  
  const { profile: userProfile, loading: profileLoading } = useUserProfile(user as any);

  useEffect(() => {
    if (user?.id) {
      loadResources();
    }
  }, [user?.id]);

  const loadResources = async () => {
    try {
      setLoading(true);
      const data = await resourceService.getResources(user.id);
      setResources(data);
    } catch (error) {
      console.error('Error loading resources:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate category statistics
  const getCategoryStats = (category: CategoryKey): CategoryStats => {
    const categoryResources = resources.filter(r => r.category === category);
    const total = categoryResources.length;
    const filled = categoryResources.filter(r => r.is_filled).length;
    const empty = total - filled;
    const expiringSoon = categoryResources.filter(r => 
      r.is_filled && r.days_remaining < 30 && r.days_remaining < 99999
    ).length;
    
    const filledResources = categoryResources.filter(r => r.is_filled);
    const avgDaysRemaining = filledResources.length > 0
      ? filledResources.reduce((sum, r) => sum + (r.days_remaining >= 99999 ? 365 : r.days_remaining), 0) / filledResources.length
      : 0;
    
    const health = total > 0 ? Math.round((filled / total) * 100) : 0;
    
    return { total, filled, empty, expiringSoon, avgDaysRemaining, health };
  };

  // Calculate overall preparedness
  const getOverallPreparedness = () => {
    if (resources.length === 0) return { score: 0, days: 0, message: '' };
    
    const msbResources = resources.filter(r => r.is_msb_recommended);
    const filledMsb = msbResources.filter(r => r.is_filled).length;
    const score = msbResources.length > 0 
      ? Math.round((filledMsb / msbResources.length) * 100)
      : 0;
    
    // Calculate self-sufficiency days (simplified)
    const waterResources = resources.filter(r => r.category === 'water' && r.is_filled);
    const foodResources = resources.filter(r => r.category === 'food' && r.is_filled);
    const familySize = userProfile?.household_size || 1;
    
    const waterDays = waterResources.length > 0 
      ? waterResources.reduce((sum, r) => sum + r.quantity, 0) / (2 * familySize) // 2L per person per day
      : 0;
    const foodDays = foodResources.length > 0
      ? Math.min(...foodResources.map(r => r.days_remaining < 99999 ? r.days_remaining : 365))
      : 0;
    
    const days = Math.min(Math.floor(waterDays), Math.floor(foodDays));
    
    let message = '';
    if (score >= 80) message = 'Utmärkt beredskap!';
    else if (score >= 60) message = 'Bra framsteg';
    else if (score >= 40) message = 'På rätt väg';
    else message = 'Behöver uppmärksamhet';
    
    return { score, days, message };
  };

  const preparedness = getOverallPreparedness();

  const handleNavigation = (section: string, subsection?: string) => {
    if (section === 'resources') {
      if (subsection === 'inventory') {
        setActiveView('inventory');
      } else {
        setActiveView('dashboard');
      }
    } else if (section === 'cultivation') {
      // Handle cultivation navigation (future)
      console.log('Navigate to cultivation:', subsection);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#3D4A2B' }}></div>
          <p className="text-gray-600">Laddar din beredskapsstatus...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions Bar */}
      <div className="bg-gradient-to-r from-[#556B2F] to-[#3D4A2B] text-white rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">Hantera dina resurser</h2>
            <p className="text-white/80">Bygg din beredskap med MSB:s rekommendationer</p>
          </div>
          <button
            onClick={() => setShowQuickAddModal(true)}
            className="flex items-center gap-2 px-8 py-4 bg-white text-[#3D4A2B] rounded-xl font-bold hover:bg-white/90 transition-all hover:scale-105 shadow-lg"
          >
            <Plus size={24} strokeWidth={3} />
            <span className="text-lg">Snabblägg till</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setActiveView('dashboard')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
            activeView === 'dashboard'
              ? 'bg-gradient-to-br from-[#556B2F] to-[#3D4A2B] text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <BarChart3 size={20} />
          Kategorier
        </button>
        <button
          onClick={() => setActiveView('inventory')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
            activeView === 'inventory'
              ? 'bg-gradient-to-br from-[#556B2F] to-[#3D4A2B] text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <Package size={20} />
          Inventering
        </button>
      </div>

      {/* View Content */}
      {activeView === 'dashboard' ? (
        <>
          {/* Category Health Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(Object.keys(categoryConfig) as CategoryKey[]).map(category => {
              const config = categoryConfig[category];
              const stats = getCategoryStats(category);
              const Icon = config.icon;
              
              const healthColor = 
                stats.health >= 80 ? '#556B2F' :
                stats.health >= 50 ? '#B8860B' :
                stats.health >= 25 ? '#D97706' : '#8B4513';

              return (
                <button
                  key={category}
                  onClick={() => {
                    setSelectedCategory(category);
                    setActiveView('inventory');
                  }}
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] text-left relative overflow-hidden group"
                >
                  {/* Background Pattern */}
                  <div 
                    className="absolute top-0 right-0 w-32 h-32 opacity-5 group-hover:opacity-10 transition-opacity"
                    style={{ background: `radial-gradient(circle, ${config.color} 0%, transparent 70%)` }}
                  />

                  {/* Needs Attention Badge */}
                  {stats.expiringSoon > 0 && (
                    <div className="absolute top-4 right-4 w-3 h-3 bg-[#D97706] rounded-full animate-pulse">
                      <div className="absolute inset-0 rounded-full bg-current animate-ping opacity-75"></div>
                    </div>
                  )}

                  <div className="relative">
                    {/* Category Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div 
                        className="w-16 h-16 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${config.color}20` }}
                      >
                        <span className="text-3xl">{config.emoji}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          {config.label}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {stats.filled} / {stats.total} ifyllda
                        </p>
                      </div>
                    </div>

                    {/* Health Score */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl font-bold" style={{ color: healthColor }}>
                          {stats.health}%
                        </span>
                        <span className="text-sm text-gray-600">
                          Status
                        </span>
                      </div>
                      <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${stats.health}%`,
                            backgroundColor: healthColor
                          }}
                        />
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-gray-600 mb-1">Ej ifyllda</div>
                        <div className="text-lg font-bold text-gray-900">{stats.empty}</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-gray-600 mb-1">Utgår snart</div>
                        <div className="text-lg font-bold text-gray-900">{stats.expiringSoon}</div>
                      </div>
                    </div>

                    {/* Average Days Remaining */}
                    {stats.avgDaysRemaining > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-sm">
                        <span className="text-gray-600">Medellivslängd</span>
                        <span className="font-bold text-gray-900">
                          {stats.avgDaysRemaining >= 365 ? '1+ år' : `${Math.round(stats.avgDaysRemaining)} dagar`}
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* MSB Status Banner */}
          <div className="bg-[#3D4A2B]/5 border-2 border-[#3D4A2B]/20 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#3D4A2B] rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield size={24} className="text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {t('msb.emergency_supplies')}
                </h3>
                <p className="text-gray-700 mb-4">
                  {t('resources.msb_supplies_description')}
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-white rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">MSB-rekommendationer</span>
                      <span className="text-2xl font-bold text-[#3D4A2B]">
                        {resources.filter(r => r.is_msb_recommended && r.is_filled).length} / {resources.filter(r => r.is_msb_recommended).length}
                      </span>
                    </div>
                    <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className="h-full bg-[#3D4A2B] rounded-full transition-all duration-500"
                        style={{ 
                          width: `${(resources.filter(r => r.is_msb_recommended && r.is_filled).length / Math.max(resources.filter(r => r.is_msb_recommended).length, 1)) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveView('inventory')}
                    className="px-6 py-3 bg-[#3D4A2B] text-white rounded-xl font-bold hover:bg-[#2A331E] transition-colors"
                  >
                    Fyll i resurser
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setShowQuickAddModal(true)}
              className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-[#3D4A2B]/10 rounded-xl flex items-center justify-center group-hover:bg-[#3D4A2B] transition-colors">
                  <Plus size={28} className="text-[#3D4A2B] group-hover:text-white transition-colors" strokeWidth={2.5} />
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900 mb-1">
                    Snabblägg till resurser
                  </div>
                  <div className="text-sm text-gray-600">
                    Färdiga mallar & enkla tillägg
                  </div>
                </div>
              </div>
            </button>

            <button
              className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] text-left opacity-60 cursor-not-allowed"
              disabled
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Share2 size={28} className="text-gray-400" strokeWidth={2.5} />
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900 mb-1">
                    Dela resurser
                  </div>
                  <div className="text-sm text-gray-600">
                    Kommer snart - dela med samhället
                  </div>
                </div>
              </div>
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Inventory View - Reuse existing component */}
          <div className="bg-white rounded-2xl shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    {selectedCategory ? categoryConfig[selectedCategory].label : 'Alla resurser'}
                  </h2>
                  <p className="text-gray-600">
                    Hantera dina beredskapresurser
                  </p>
                </div>
                {selectedCategory && (
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
                  >
                    ← Tillbaka till alla kategorier
                  </button>
                )}
              </div>
            </div>
            
            {/* Integrated inventory component */}
            <div>
              <SupabaseResourceInventory user={user} />
            </div>
          </div>
        </>
      )}

      {/* Quick Add Modal */}
      {showQuickAddModal && (
        <ResourceQuickAddModal
          user={user}
          isOpen={showQuickAddModal}
          onClose={() => setShowQuickAddModal(false)}
          onSuccess={loadResources}
          familySize={userProfile?.household_size || 1}
        />
      )}
    </div>
  );
}

