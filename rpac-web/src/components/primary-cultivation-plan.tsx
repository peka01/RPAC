'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Star, Calendar, MapPin, Target, TrendingUp, Eye, Edit } from 'lucide-react';

interface PrimaryCultivationPlanProps {
  user: any;
  onViewPlan?: (plan: any) => void;
  onEditPlan?: (plan: any) => void;
}

export function PrimaryCultivationPlan({ user, onViewPlan, onEditPlan }: PrimaryCultivationPlanProps) {
  const [primaryPlan, setPrimaryPlan] = useState<any>(null);
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
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="ml-2 text-sm" style={{ color: 'var(--text-secondary)' }}>Laddar primär plan...</span>
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
                {primaryPlan.self_sufficiency_percent}%
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Självförsörjning
              </div>
            </div>
          </div>
          
          {primaryPlan.crops && primaryPlan.crops.length > 0 && (
            <div className="flex items-center p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <MapPin className="w-5 h-5 mr-3 text-blue-600" />
              <div>
                <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  {primaryPlan.crops.length}
                </div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Grödor
                </div>
              </div>
            </div>
          )}

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

          {primaryPlan.estimated_cost > 0 && (
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
