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
import { ShieldProgressSpinner } from '@/components/ShieldProgressSpinner';
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
      let planData = null;
      try {
        const { data: plan, error: planError } = await supabase
          .from('cultivation_plans')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_primary', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (planError && planError.code !== 'PGRST116') { // PGRST116 = no rows found
          console.warn('Error fetching cultivation plan:', planError);
        } else {
          planData = plan;
        }
      } catch (err) {
        console.warn('Failed to fetch cultivation plan:', err);
      }

      if (planData) {
        const crops = planData.crops || [];
        const cropNames = crops.map((crop: { cropName?: string; name?: string; [key: string]: unknown }) => crop.cropName || crop.name || crop).filter(Boolean);

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
        <ShieldProgressSpinner variant="bounce" size="lg" color="olive" message="Laddar" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
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

