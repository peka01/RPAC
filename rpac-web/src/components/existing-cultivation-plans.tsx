'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Calendar, MapPin, Target, TrendingUp, Edit, Trash2, Eye, Star } from 'lucide-react';
import { t } from '@/lib/locales';

interface CultivationPlan {
  id: string;
  plan_id: string;
  title?: string;
  name?: string;
  description?: string;
  timeline?: string;
  crops?: any[];
  self_sufficiency_percent?: number;
  estimated_cost?: number;
  is_primary?: boolean;
  plan_data?: {
    name?: string;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}

interface ExistingCultivationPlansProps {
  user: any;
  onViewPlan?: (plan: CultivationPlan) => void;
  onEditPlan?: (plan: CultivationPlan) => void;
}

export function ExistingCultivationPlans({ user, onViewPlan, onEditPlan }: ExistingCultivationPlansProps) {
  const [plans, setPlans] = useState<CultivationPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadPlans();
    }
  }, [user?.id]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cultivation_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Loaded cultivation plans:', data);
      setPlans(data || []);
    } catch (error) {
      console.error('Error loading cultivation plans:', error);
      setError('Kunde inte ladda odlingsplaner');
    } finally {
      setLoading(false);
    }
  };

  const deletePlan = async (planId: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna odlingsplan?')) return;
    
    try {
      const { error } = await supabase
        .from('cultivation_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;
      
      // Reload plans
      await loadPlans();
    } catch (error) {
      console.error('Error deleting plan:', error);
      setError('Kunde inte ta bort odlingsplanen');
    }
  };

  const setPrimaryPlan = async (planId: string) => {
    try {
      // First, unset all primary plans for this user
      await supabase
        .from('cultivation_plans')
        .update({ is_primary: false })
        .eq('user_id', user.id);

      // Then set the selected plan as primary
      const { error } = await supabase
        .from('cultivation_plans')
        .update({ is_primary: true })
        .eq('id', planId);

      if (error) throw error;
      
      // Reload plans
      await loadPlans();
    } catch (error) {
      console.error('Error setting primary plan:', error);
      setError('Kunde inte sätta primär plan');
    }
  };

  if (loading) {
    return (
      <div className="modern-card p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2" style={{ color: 'var(--text-secondary)' }}>Laddar odlingsplaner...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="modern-card p-6">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <button 
            onClick={loadPlans}
            className="mt-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
          >
            Försök igen
          </button>
        </div>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="modern-card p-6">
        <div className="text-center">
          <Target className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Inga odlingsplaner än
          </h3>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            Skapa din första personliga odlingsplan för att komma igång
          </p>
        </div>
      </div>
    );
  }

  // Sort plans: primary first, then by creation date
  const sortedPlans = [...plans].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Mina odlingsplaner ({plans.length})
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedPlans.map((plan) => (
          <div 
            key={plan.id} 
            className="modern-card p-6 hover:shadow-lg transition-all duration-200 border-l-4"
            style={{ 
              backgroundColor: 'var(--bg-card)',
              borderColor: plan.is_primary ? 'var(--color-primary)' : 'var(--color-quaternary)',
              borderLeftColor: plan.is_primary ? 'var(--color-primary)' : 'var(--color-quaternary)'
            }}
          >
            {/* Plan Header */}
            <div className="mb-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-bold text-lg mb-1" style={{ color: 'var(--text-primary)' }}>
                    {plan.title || plan.plan_data?.name || plan.name || 'Namnlös odlingsplan'}
                  </h4>
                  {plan.description && (
                    <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                      {plan.description}
                    </p>
                  )}
                </div>
                
                {/* Primary Plan Toggle - Star Icon in Top Right */}
                <button
                  onClick={() => setPrimaryPlan(plan.id)}
                  className="flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 hover:scale-110"
                  style={{ 
                    backgroundColor: plan.is_primary ? 'var(--color-primary)' : 'var(--color-quaternary)',
                    color: 'white'
                  }}
                  title={plan.is_primary ? 'Avmarkera som primär' : 'Sätt som primär'}
                >
                  {plan.is_primary ? <Star className="w-4 h-4 fill-current" /> : <Star className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Plan Metrics */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="flex items-center p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <TrendingUp className="w-4 h-4 mr-2 text-green-600" />
                <div>
                  <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {plan.self_sufficiency_percent || 0}%
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Självförsörjning
                  </div>
                </div>
              </div>
              
              {plan.crops && plan.crops.length > 0 && (
                <div className="flex items-center p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <MapPin className="w-4 h-4 mr-2 text-blue-600" />
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {plan.crops.length}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Grödor
                    </div>
                  </div>
                </div>
              )}

              {plan.timeline && (
                <div className="flex items-center p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <Calendar className="w-4 h-4 mr-2 text-purple-600" />
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {plan.timeline}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Tidsram
                    </div>
                  </div>
                </div>
              )}

              {plan.estimated_cost && plan.estimated_cost > 0 && (
                <div className="flex items-center p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <span className="w-4 h-4 mr-2 text-orange-600">💰</span>
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {Math.round(plan.estimated_cost)} kr
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Kostnad
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Creation Date */}
            <div className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>
              <span className="flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                Skapad {new Date(plan.created_at).toLocaleDateString('sv-SE')}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-2 pt-4 border-t" style={{ borderColor: 'var(--color-quaternary)' }}>
              <button
                onClick={() => {
                  if (onViewPlan) {
                    onViewPlan(plan);
                  }
                  console.log('Opening plan:', plan);
                }}
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
                onClick={() => deletePlan(plan.id)}
                className="flex items-center px-3 py-2 text-sm rounded-lg font-medium transition-all duration-200 hover:shadow-md border"
                style={{ 
                  color: 'var(--color-danger)',
                  borderColor: 'var(--color-danger)',
                  backgroundColor: 'transparent'
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Ta bort
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
