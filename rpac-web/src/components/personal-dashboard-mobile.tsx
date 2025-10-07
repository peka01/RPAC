'use client';

import { useState, useEffect } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  Calendar,
  Home,
  Zap,
  Droplets,
  Utensils,
  Pill,
  Wrench,
  ArrowRight,
  Sprout,
  Heart,
  ChevronRight,
  Award,
  Battery,
  Package
} from 'lucide-react';
import { t } from '@/lib/locales';
import { useUserProfile } from '@/lib/useUserProfile';
import { ShieldProgressSpinner } from '@/components/ShieldProgressSpinner';
import { resourceService, supabase } from '@/lib/supabase';

interface PreparednessScore {
  overall: number;
  food: number;
  water: number;
  medicine: number;
  energy: number;
  tools: number;
  pet_supplies: number;
}

interface ResourceCategory {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  score: number;
  daysRemaining: number;
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  needsAttention: boolean;
}

interface QuickAction {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  urgent: boolean;
}

interface PersonalDashboardMobileProps {
  user?: { id: string } | null;
}

export function PersonalDashboardMobile({ user }: PersonalDashboardMobileProps = {}) {
  const { profile } = useUserProfile(user as any);
  
  const [score, setScore] = useState<PreparednessScore>({
    overall: 0,
    food: 0,
    water: 0,
    medicine: 0,
    energy: 0,
    tools: 0,
    pet_supplies: 0,
  });

  const [resourceCategories, setResourceCategories] = useState<ResourceCategory[]>([]);
  const [criticalAlerts, setCriticalAlerts] = useState<string[]>([]);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const [cultivationProgress, setCultivationProgress] = useState<{completed: number; total: number; percentage: number}>({
    completed: 0,
    total: 0,
    percentage: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadResourcesAndCalculate = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      
      try {
        const resources = await resourceService.getResources(user.id);
        const newAlerts: string[] = [];
        const newQuickActions: QuickAction[] = [];
        
        const categoryConfig = [
          { key: 'food', name: 'Mat', icon: Utensils, threshold: 7 },
          { key: 'water', name: 'Vatten', icon: Droplets, threshold: 3 },
          { key: 'medicine', name: 'Medicin', icon: Pill, threshold: 7 },
          { key: 'energy', name: 'Energi', icon: Zap, threshold: 3 },
          { key: 'tools', name: 'Verktyg', icon: Wrench, threshold: 0 },
          { key: 'pet_supplies', name: 'Husdjur', icon: Heart, threshold: 7 },
        ];

        const newCategories: ResourceCategory[] = [];
        let totalScore = 0;
        const categoryScores: Record<string, number> = {};

        categoryConfig.forEach(({ key, name, icon, threshold }) => {
          const categoryResources = resources.filter((r: { category: string }) => r.category === key);
          
          let totalDays = 0;
          let hasResources = false;

          categoryResources.forEach((resource: { quantity: number; days_remaining: number }) => {
            hasResources = true;
            const quantity = resource.quantity || 0;
            const dailyUsage = (resource as any).daily_usage || 1;
            const days = dailyUsage > 0 ? Math.floor(quantity / dailyUsage) : 0;
            totalDays += days;
          });

          let categoryScore = 0;
          let status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical' = 'poor';
          
          if (hasResources) {
            if (totalDays >= threshold * 2) {
              categoryScore = 100;
              status = 'excellent';
            } else if (totalDays >= threshold) {
              categoryScore = 75;
              status = 'good';
            } else if (totalDays >= threshold / 2) {
              categoryScore = 50;
              status = 'fair';
            } else {
              categoryScore = 25;
              status = 'poor';
            }
          } else {
            categoryScore = 0;
            status = 'critical';
          }

          categoryScores[key] = categoryScore;
          totalScore += categoryScore;

          const needsAttention = status === 'critical' || status === 'poor';
          
          newCategories.push({
            name,
            icon,
            score: categoryScore,
            daysRemaining: Math.floor(totalDays),
            status,
            needsAttention
          });

          if (needsAttention) {
            if (status === 'critical') {
              newAlerts.push(`${name}: Inga resurser registrerade`);
              newQuickActions.push({
                title: `Lägg till ${name.toLowerCase()}`,
                description: 'Kritiskt område som behöver uppmärksamhet',
                icon,
                color: '#EF4444',
                urgent: true
              });
            } else if (totalDays < threshold) {
              newAlerts.push(`${name}: Endast ${Math.floor(totalDays)} dagar kvar`);
              newQuickActions.push({
                title: `Fyll på ${name.toLowerCase()}`,
                description: `Endast ${Math.floor(totalDays)} dagar kvar`,
                icon,
                color: '#F59E0B',
                urgent: true
              });
            }
          }
        });

        const overallScore = Math.round(totalScore / categoryConfig.length);

        setScore({
          overall: overallScore,
          food: categoryScores.food || 0,
          water: categoryScores.water || 0,
          medicine: categoryScores.medicine || 0,
          energy: categoryScores.energy || 0,
          tools: categoryScores.tools || 0,
          pet_supplies: categoryScores.pet_supplies || 0
        });

        setResourceCategories(newCategories);
        setCriticalAlerts(newAlerts);
        setQuickActions(newQuickActions.slice(0, 3));

        // Load cultivation progress
        const { data: calendarData } = await supabase
          .from('cultivation_calendar')
          .select('id, is_completed')
          .eq('user_id', user.id);

        if (calendarData && calendarData.length > 0) {
          const completed = calendarData.filter((item: { is_completed: boolean }) => item.is_completed).length;
          const total = calendarData.length;
          const percentage = Math.round((completed / total) * 100);

          setCultivationProgress({ completed, total, percentage });
        }

      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadResourcesAndCalculate();
  }, [user]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#3B82F6';
    if (score >= 40) return '#F59E0B';
    return '#EF4444';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-600';
    if (score >= 60) return 'from-blue-500 to-cyan-600';
    if (score >= 40) return 'from-amber-500 to-orange-600';
    return 'from-red-500 to-rose-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Utmärkt beredskap';
    if (score >= 60) return 'Bra beredskap';
    if (score >= 40) return 'Acceptabel nivå';
    return 'Behöver förbättras';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return '#10B981';
      case 'good': return '#3B82F6';
      case 'fair': return '#F59E0B';
      case 'poor': return '#EF4444';
      case 'critical': return '#7F1D1D';
      default: return '#6B7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'excellent': return 'Utmärkt';
      case 'good': return 'Bra';
      case 'fair': return 'Acceptabel';
      case 'poor': return 'Dålig';
      case 'critical': return 'Kritisk';
      default: return 'Okänd';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/50 to-purple-50/50 flex items-center justify-center">
        <ShieldProgressSpinner variant="bounce" size="lg" color="olive" message="Laddar" />
      </div>
    );
  }

  const scoreColor = getScoreColor(score.overall);
  const scoreGradient = getScoreGradient(score.overall);
  const scoreLabel = getScoreLabel(score.overall);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 to-purple-50/50 pb-32">
      {/* Resource Categories */}
      <div className="px-6 mb-6">
        <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
          <Package size={20} className="text-[#3D4A2B]" strokeWidth={2.5} />
          Resurser
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {resourceCategories.map((category, index) => {
            const Icon = category.icon;
            const statusColor = getStatusColor(category.status);
            
            return (
              <button
                key={index}
                className="bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all touch-manipulation active:scale-98 text-left relative overflow-hidden"
              >
                {category.needsAttention && (
                  <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                )}
                
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: `${statusColor}20` }}
                >
                  <Icon className="w-7 h-7" />
                </div>
                
                <h4 className="font-bold text-gray-900 mb-1">{category.name}</h4>
                
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-xs font-bold px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: `${statusColor}20`,
                      color: statusColor
                    }}
                  >
                    {getStatusLabel(category.status)}
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {category.score}%
                  </span>
                </div>
                
                <div className="text-xs text-gray-600">
                  {category.daysRemaining > 0 ? (
                    <>
                      <span className="font-bold">{category.daysRemaining}</span> dagar kvar
                    </>
                  ) : (
                    'Inga resurser'
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>


      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <div className="px-6">
          <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
            <Zap size={20} className="text-amber-500" strokeWidth={2.5} />
            Rekommenderade åtgärder
          </h3>
          <div className="space-y-3">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              
              return (
                <button
                  key={index}
                  className="w-full bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all touch-manipulation active:scale-98 text-left border-2"
                  style={{
                    borderColor: action.urgent ? `${action.color}40` : '#E5E7EB',
                    backgroundColor: action.urgent ? `${action.color}05` : 'white'
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${action.color}20` }}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 mb-1">{action.title}</h4>
                      <p className="text-sm text-gray-600">{action.description}</p>
                    </div>
                    
                    <ArrowRight size={20} className="text-gray-400 flex-shrink-0" strokeWidth={2} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && resourceCategories.length === 0 && quickActions.length === 0 && (
        <div className="px-6">
          <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield size={40} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Välkommen till din hemstatus!</h3>
            <p className="text-gray-600 mb-6">
              Börja registrera dina resurser för att få en översikt över din beredskap.
            </p>
            <button className="px-6 py-3 bg-[#3D4A2B] text-white font-bold rounded-xl hover:bg-[#2A331E] transition-all touch-manipulation active:scale-95">
              Lägg till resurser
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

