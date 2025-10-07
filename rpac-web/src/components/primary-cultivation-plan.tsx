'use client';

import { useState, useEffect } from 'react';
import { ShieldProgressSpinner } from '@/components/ShieldProgressSpinner';
import { supabase } from '@/lib/supabase';
import { Star, Calendar, MapPin, Target, TrendingUp, Eye, Edit } from 'lucide-react';

interface PlanData {
  realTimeStats?: {
    selfSufficiencyPercent?: number;
    gardenProduction?: number;
  };
  gardenPlan?: {
    selfSufficiencyPercent?: number;
    gardenProduction?: number;
    crops?: Array<{ name: string; [key: string]: unknown }>;
  };
  profile?: {
    household_size?: number;
  };
  [key: string]: unknown;
}

interface CultivationPlan {
  id: string;
  title?: string;
  description?: string;
  crops?: Array<{ name: string; [key: string]: unknown }>;
  self_sufficiency_percent?: number;
  estimated_cost?: number;
  timeline?: string;
  created_at: string;
  plan_data?: PlanData;
  [key: string]: unknown;
}

interface PrimaryCultivationPlanProps {
  user: { id: string };
  onViewPlan?: (plan: CultivationPlan) => void;
  onEditPlan?: (plan: CultivationPlan) => void;
}

export function PrimaryCultivationPlan({ user, onViewPlan, onEditPlan }: PrimaryCultivationPlanProps) {
  const [primaryPlan, setPrimaryPlan] = useState<CultivationPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadPrimaryPlan();
    }
  }, [user?.id]);

  const loadPrimaryPlan = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cultivation_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_primary', true)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error loading primary plan:', error);
      } else {
        setPrimaryPlan(data);
      }
    } catch (error) {
      console.error('Error loading primary plan:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="modern-card p-6">
        <div className="flex items-center justify-center">
          <ShieldProgressSpinner variant="bounce" size="sm" color="olive" message="Laddar primär plan..." />
        </div>
      </div>
    );
  }

  if (!primaryPlan) {
    return null; // Don't show anything if no primary plan
  }

  return (
    <div className="modern-card p-6 mb-6 border-l-4" 
         style={{ 
           backgroundColor: 'var(--bg-card)',
           borderLeftColor: 'var(--color-primary)',
           borderColor: 'var(--color-primary)'
         }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
          <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            Din primära odlingsplan
          </h3>
        </div>
        <div className="flex items-center justify-center w-8 h-8 rounded-full" 
             style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
          <Star className="w-4 h-4 fill-current" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {primaryPlan.title}
          </h4>
          {primaryPlan.description && (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {primaryPlan.description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <TrendingUp className="w-5 h-5 mr-3 text-green-600" />
            <div>
              <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                {(() => {
                  // Priority order: realTimeStats > gardenPlan > legacy self_sufficiency_percent > calculated fallback
                  if (primaryPlan.plan_data?.realTimeStats?.selfSufficiencyPercent) {
                    return primaryPlan.plan_data.realTimeStats.selfSufficiencyPercent;
                  }
                  if (primaryPlan.plan_data?.gardenPlan?.selfSufficiencyPercent) {
                    return primaryPlan.plan_data.gardenPlan.selfSufficiencyPercent;
                  }
                  if (primaryPlan.self_sufficiency_percent) {
                    return primaryPlan.self_sufficiency_percent;
                  }
                  
                  // Fallback calculation for legacy plans
                  if (primaryPlan.plan_data?.gardenPlan?.crops && primaryPlan.plan_data?.profile?.household_size) {
                    const dailyCaloriesPerPerson = 2000;
                    const annualCalorieNeed = primaryPlan.plan_data.profile.household_size * dailyCaloriesPerPerson * 365;
                    const gardenProduction = primaryPlan.plan_data.gardenPlan.gardenProduction || 0;
                    const calculatedPercent = Math.round((gardenProduction / annualCalorieNeed) * 100);
                    return calculatedPercent;
                  }
                  
                  return 0;
                })()}%
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Självförsörjning
              </div>
            </div>
          </div>
          
          {(primaryPlan.crops && primaryPlan.crops.length > 0) || (primaryPlan.plan_data?.gardenPlan?.crops && primaryPlan.plan_data.gardenPlan.crops.length > 0) ? (
            <div className="flex items-center p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <MapPin className="w-5 h-5 mr-3 text-blue-600" />
              <div>
                <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  {primaryPlan.crops?.length || primaryPlan.plan_data?.gardenPlan?.crops?.length || 0}
                </div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Grödor
                </div>
              </div>
            </div>
          ) : null}

          {primaryPlan.timeline && (
            <div className="flex items-center p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <Calendar className="w-5 h-5 mr-3 text-purple-600" />
              <div>
                <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  {primaryPlan.timeline}
                </div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Tidsram
                </div>
              </div>
            </div>
          )}

          {primaryPlan.estimated_cost && primaryPlan.estimated_cost > 0 && (
            <div className="flex items-center p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <span className="w-5 h-5 mr-3 text-orange-600">💰</span>
              <div>
                <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  {Math.round(primaryPlan.estimated_cost)} kr
                </div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Kostnad
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--color-quaternary)' }}>
        <div className="text-xs flex items-center" style={{ color: 'var(--text-tertiary)' }}>
          <Calendar className="w-3 h-3 mr-1" />
          Skapad {new Date(primaryPlan.created_at).toLocaleDateString('sv-SE')}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onViewPlan?.(primaryPlan)}
            className="flex items-center px-4 py-2 text-sm rounded-lg font-medium transition-all duration-200 hover:shadow-md"
            style={{ 
              backgroundColor: 'var(--color-primary)',
              color: 'white'
            }}
          >
            <Eye className="w-4 h-4 mr-2" />
            Öppna
          </button>
          
          <button
            onClick={() => onEditPlan?.(primaryPlan)}
            className="flex items-center px-3 py-2 text-sm rounded-lg font-medium transition-all duration-200 hover:shadow-md border"
            style={{ 
              color: 'var(--color-secondary)',
              borderColor: 'var(--color-secondary)',
              backgroundColor: 'transparent'
            }}
          >
            <Edit className="w-4 h-4 mr-2" />
            Redigera
          </button>
        </div>
      </div>
    </div>
  );
}
