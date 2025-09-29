'use client';

import { useState, useEffect } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  Calendar,
  Target,
  Heart,
  Radio,
  Smartphone,
  Home,
  Users,
  Clock,
  Zap,
  Droplets,
  Utensils,
  Pill,
  Wrench,
  Phone,
  MapPin,
  MessageCircle,
  ArrowRight,
  Plus,
  Eye
} from 'lucide-react';
import { t } from '@/lib/locales';
import { useUserProfile } from '@/lib/useUserProfile';
import { resourceService } from '@/lib/supabase';

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
  icon: any;
  score: number;
  daysRemaining: number;
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  needsAttention: boolean;
}

interface QuickAction {
  title: string;
  description: string;
  icon: any;
  color: string;
  urgent: boolean;
}

interface PersonalDashboardProps {
  user?: { id: string } | null;
}

export function PersonalDashboard({ user }: PersonalDashboardProps = {}) {
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

  // Calculate preparedness score and generate insights
  useEffect(() => {
    const loadResourcesAndCalculate = async () => {
      if (!user?.id) return;
      
      try {
        const resources = await resourceService.getResources(user.id);
      const newAlerts: string[] = [];
      const newQuickActions: QuickAction[] = [];
      
      // Define resource categories with icons and thresholds
      const categoryConfig = [
        { key: 'food', name: 'Mat', icon: Utensils, threshold: 7 },
        { key: 'water', name: 'Vatten', icon: Droplets, threshold: 3 },
        { key: 'medicine', name: 'Mediciner', icon: Pill, threshold: 14 },
        { key: 'energy', name: 'Energi', icon: Zap, threshold: 3 },
        { key: 'tools', name: 'Verktyg', icon: Wrench, threshold: 30 },
        { key: 'pet_supplies', name: 'Djurförnödenheter', icon: Heart, threshold: 7 }
      ];

      const categories: ResourceCategory[] = [];
      const categoryScores: Record<string, number> = {};
      
      categoryConfig.forEach(config => {
        const categoryResources = resources.filter((r: { category: string }) => r.category === config.key);
        let avgDays = 0;
        let status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical' = 'critical';
        let needsAttention = false;

        if (categoryResources.length === 0) {
          avgDays = 0;
          status = 'critical';
          needsAttention = true;
          newAlerts.push(t('individual.no_resources_registered', { type: config.name.toLowerCase() }));
          newQuickActions.push({
            title: t('individual.add_resource_type', { type: config.name.toLowerCase() }),
            description: t('individual.register_resource_type', { type: config.name.toLowerCase() }),
            icon: Plus,
            color: 'var(--color-crisis-red)',
            urgent: true
          });
        } else {
          avgDays = categoryResources.reduce((sum: number, r: { days_remaining?: number; daysRemaining?: number }) => 
            sum + (r.days_remaining || r.daysRemaining || 0), 0) / categoryResources.length;
          
          if (avgDays >= config.threshold * 2) {
            status = 'excellent';
          } else if (avgDays >= config.threshold) {
            status = 'good';
          } else if (avgDays >= config.threshold / 2) {
            status = 'fair';
            needsAttention = true;
          } else {
            status = 'poor';
            needsAttention = true;
          }
          
          if (avgDays < 3) {
            status = 'critical';
            newAlerts.push(t('individual.critically_low_resources', { type: config.name.toLowerCase(), days: Math.round(avgDays) }));
            newQuickActions.push({
              title: t('individual.renew_resource_type', { type: config.name.toLowerCase() }),
              description: t('individual.urgent_need_resource_type', { type: config.name.toLowerCase() }),
              icon: AlertTriangle,
              color: 'var(--color-crisis-red)',
              urgent: true
            });
          } else if (avgDays < config.threshold) {
            newAlerts.push(t('individual.low_resources', { type: config.name.toLowerCase(), days: Math.round(avgDays) }));
            newQuickActions.push({
              title: t('individual.plan_resource_type', { type: config.name.toLowerCase() }),
              description: t('individual.renew_within_days', { days: Math.round(avgDays) }),
              icon: Clock,
              color: 'var(--color-crisis-orange)',
              urgent: false
            });
          }
        }

        const categoryScore = Math.min(100, Math.round((avgDays / 30) * 100));
        categoryScores[config.key] = categoryScore;

        categories.push({
          name: config.name,
          icon: config.icon,
          score: categoryScore,
          daysRemaining: Math.round(avgDays),
          status,
          needsAttention
        });
      });

      // Calculate overall score, excluding pet_supplies if user has no pets
      const categoriesToInclude = profile?.has_pets 
        ? categoryConfig 
        : categoryConfig.filter(cat => cat.key !== 'pet_supplies');
      
      const overallScore = Math.round(
        categoriesToInclude.reduce((sum, config) => sum + (categoryScores[config.key] || 0), 0) / categoriesToInclude.length
      );

      setScore({
        overall: overallScore,
        food: categoryScores.food || 0,
        water: categoryScores.water || 0,
        medicine: categoryScores.medicine || 0,
        energy: categoryScores.energy || 0,
        tools: categoryScores.tools || 0,
        pet_supplies: categoryScores.pet_supplies || 0,
      });
      
      // Only include pet_supplies category if user has pets
      const filteredCategories = profile?.has_pets 
        ? categories 
        : categories.filter(cat => cat.name !== 'Djurförnödenheter');
      
        setResourceCategories(filteredCategories);
        setCriticalAlerts(newAlerts);
        setQuickActions(newQuickActions.slice(0, 3)); // Show top 3 actions
      } catch (error) {
        console.error('Error loading resources for dashboard:', error);
      }
    };

    loadResourcesAndCalculate();
  }, [profile, user?.id]);

  const getScoreColor = (score: number) => {
    if (score === 0) return '#6b7280'; // gray-500 for loading state
    if (score >= 80) return '#4ade80'; // green-400
    if (score >= 60) return '#60a5fa'; // blue-400
    if (score >= 40) return '#fb923c'; // orange-400
    return '#f87171'; // red-400
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'var(--color-crisis-green)';
      case 'good': return 'var(--color-crisis-blue)';
      case 'fair': return 'var(--color-crisis-orange)';
      case 'poor': return 'var(--color-crisis-red)';
      case 'critical': return 'var(--color-crisis-red)';
      default: return 'var(--color-crisis-grey)';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'excellent': return t('individual.excellent_condition');
      case 'good': return t('individual.good_condition');
      case 'fair': return t('individual.fair_condition');
      case 'poor': return t('individual.poor_condition');
      case 'critical': return t('individual.needs_attention');
      default: return 'Okänd';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Overall Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" 
               style={{ 
                 backgroundColor: getScoreColor(score.overall) || '#6b7280',
                 minWidth: '48px',
                 minHeight: '48px'
               }}>
            <Home className="w-6 h-6 text-white drop-shadow-sm" />
          </div>
          <div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {t('individual.home_status')}
        </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {score.overall >= 80 ? t('individual.all_good') : 
               score.overall >= 60 ? t('individual.good_condition') : 
               t('individual.attention_needed')}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold" style={{ color: getScoreColor(score.overall) }}>
            {score.overall}%
          </div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {t('individual.readiness_score')}
          </div>
        </div>
      </div>

      {/* Critical Alerts - Priority Display */}
      {criticalAlerts.length > 0 && (
        <div 
          className="border-l-4 p-4 rounded-r-lg"
          style={{
            backgroundColor: 'var(--color-warning-critical-bg)',
            borderLeftColor: 'var(--color-warning-critical)'
          }}
        >
          <div className="flex items-center mb-2">
            <AlertTriangle 
              className="w-5 h-5 mr-2" 
              style={{ color: 'var(--color-warning-critical)' }}
            />
            <h3 
              className="font-semibold"
              style={{ color: 'var(--color-warning-critical)' }}
            >
              {t('individual.critical_alerts')}
            </h3>
          </div>
          <div className="space-y-2">
            {criticalAlerts.slice(0, 2).map((alert, index) => (
              <p 
                key={index} 
                className="text-sm"
                style={{ color: 'var(--color-warning-critical)' }}
              >
                {alert}
              </p>
            ))}
            {criticalAlerts.length > 2 && (
              <p 
                className="text-sm font-medium"
                style={{ color: 'var(--color-warning-critical)' }}
              >
                +{criticalAlerts.length - 2} {t('individual.more_warnings')}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Resource Health Overview */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            {t('individual.resource_health')}
        </h3>
          <button className="text-sm flex items-center space-x-1" style={{ color: 'var(--color-primary)' }}>
            <Eye className="w-4 h-4" />
            <span>{t('individual.view_details')}</span>
          </button>
      </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {resourceCategories.map((category, index) => {
            const Icon = category.icon;
          return (
              <div key={index} className="text-center group cursor-pointer">
                <div className="relative w-16 h-16 mx-auto mb-3 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-105"
                     style={{ 
                       backgroundColor: getStatusColor(category.status) + '15',
                       border: `2px solid ${getStatusColor(category.status)}30`
                     }}>
                  <Icon className="w-7 h-7" style={{ color: getStatusColor(category.status) }} />
                  {category.needsAttention && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
                <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {category.name}
                </div>
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {category.daysRemaining > 0 ? `${category.daysRemaining} ${t('individual.days_remaining')}` : t('individual.no_resources')}
              </div>
                <div className="text-xs font-semibold mt-1" style={{ color: getStatusColor(category.status) }}>
                  {getStatusLabel(category.status)}
              </div>
            </div>
          );
        })}
        </div>
      </div>

      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            {t('individual.next_actions')}
          </h3>
          <div className="space-y-3">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg border transition-all duration-200 hover:shadow-md cursor-pointer"
                     style={{ 
                       backgroundColor: action.urgent ? action.color + '10' : 'var(--bg-card)',
                       borderColor: action.urgent ? action.color + '30' : 'var(--color-secondary)'
                     }}>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                         style={{ backgroundColor: action.color + '20' }}>
                      <Icon className="w-5 h-5" style={{ color: action.color }} />
                    </div>
                    <div>
                      <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {action.title}
                      </div>
                      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {action.description}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pet Preparedness Section - Only show if user has pets */}
      {profile?.has_pets && (
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center mb-4">
            <Heart className="w-5 h-5 mr-2" style={{ color: 'var(--color-crisis-orange)' }} />
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              {t('msb.pet_care.title')}
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('msb.pet_care.extra_food')}</span>
              <span className="text-sm font-medium" style={{ color: 'var(--color-crisis-orange)' }}>{t('msb.pet_care.check_supplies')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('msb.pet_care.medications')}</span>
              <span className="text-sm font-medium" style={{ color: 'var(--color-crisis-orange)' }}>{t('msb.pet_care.check_supplies')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('msb.pet_care.id_tags')}</span>
              <span className="text-sm font-medium" style={{ color: 'var(--color-crisis-orange)' }}>{t('msb.pet_care.check_identification')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('msb.pet_care.carriers')}</span>
              <span className="text-sm font-medium" style={{ color: 'var(--color-crisis-orange)' }}>{t('msb.pet_care.check_transport')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('msb.pet_care.veterinary_info')}</span>
              <span className="text-sm font-medium" style={{ color: 'var(--color-crisis-orange)' }}>{t('msb.pet_care.save_contacts')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('msb.pet_care.safe_spaces')}</span>
              <span className="text-sm font-medium" style={{ color: 'var(--color-crisis-orange)' }}>{t('msb.pet_care.plan_safe_spaces')}</span>
            </div>
          </div>
          <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-crisis-orange)10' }}>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              <strong>{t('msb.pet_care.msb_recommendation')}</strong>
            </p>
          </div>
        </div>
      )}

      {/* Family Safety & Emergency Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Family Safety */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="flex items-center mb-4">
            <Users className="w-5 h-5 mr-2" style={{ color: 'var(--color-crisis-green)' }} />
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              {t('individual.family_safety')}
          </h3>
        </div>
        <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('individual.family_members')}</span>
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {profile?.household_size || 1} {t('individual.people_count')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('individual.pets')}</span>
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {profile?.pet_types || t('individual.no_pets')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('individual.medications')}</span>
              <span className="text-sm font-medium" style={{ color: profile?.medications ? 'var(--color-crisis-green)' : 'var(--color-crisis-orange)' }}>
                {profile?.medications ? t('individual.updated') : t('individual.needs_registration')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('individual.special_needs')}</span>
              <span className="text-sm font-medium" style={{ color: 'var(--color-crisis-green)' }}>
                {profile?.special_needs?.length || 0} {t('individual.registered_count')}
              </span>
        </div>
      </div>
        </div>
        
        {/* Emergency Readiness */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center mb-4">
            <Shield className="w-5 h-5 mr-2" style={{ color: 'var(--color-crisis-blue)' }} />
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              {t('individual.emergency_readiness')}
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('individual.evacuation_plan')}</span>
              <span className="text-sm font-medium" style={{ color: 'var(--color-crisis-orange)' }}>
                {t('individual.needs_planning')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('individual.meeting_point')}</span>
              <span className="text-sm font-medium" style={{ color: 'var(--color-crisis-orange)' }}>
                {t('individual.needs_selection')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('individual.communication_plan')}</span>
              <span className="text-sm font-medium" style={{ color: 'var(--color-crisis-orange)' }}>
                {t('individual.needs_update')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('individual.emergency_contacts')}</span>
              <span className="text-sm font-medium" style={{ color: 'var(--color-crisis-orange)' }}>
                {t('individual.needs_addition')}
              </span>
        </div>
      </div>
        </div>
      </div>

      {/* Quick Access Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button className="flex flex-col items-center p-4 rounded-xl border transition-all duration-200 hover:shadow-md"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--color-secondary)' }}>
          <Plus className="w-6 h-6 mb-2" style={{ color: 'var(--color-primary)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {t('individual.add_resources')}
          </span>
        </button>
        <button className="flex flex-col items-center p-4 rounded-xl border transition-all duration-200 hover:shadow-md"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--color-secondary)' }}>
          <Target className="w-6 h-6 mb-2" style={{ color: 'var(--color-crisis-green)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {t('preparedness.set_goals')}
          </span>
          </button>
        <button className="flex flex-col items-center p-4 rounded-xl border transition-all duration-200 hover:shadow-md"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--color-secondary)' }}>
          <Calendar className="w-6 h-6 mb-2" style={{ color: 'var(--color-crisis-blue)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {t('preparedness.plan')}
          </span>
        </button>
        <button className="flex flex-col items-center p-4 rounded-xl border transition-all duration-200 hover:shadow-md"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--color-secondary)' }}>
          <MessageCircle className="w-6 h-6 mb-2" style={{ color: 'var(--color-crisis-orange)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {t('individual.update_status')}
          </span>
          </button>
      </div>
    </div>
  );
}
