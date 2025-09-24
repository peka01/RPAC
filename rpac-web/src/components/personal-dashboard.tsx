'use client';

import { useState, useEffect } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  Calendar,
  Target,
} from 'lucide-react';
import { t } from '@/lib/locales';

interface PreparednessScore {
  overall: number;
  food: number;
  water: number;
  medicine: number;
  energy: number;
  tools: number;
}

export function PersonalDashboard() {
  const [score, setScore] = useState<PreparednessScore>({
    overall: 0,
    food: 0,
    water: 0,
    medicine: 0,
    energy: 0,
    tools: 0,
  });

  const [alerts, setAlerts] = useState<string[]>([]);

  // Calculate preparedness score based on resources
  useEffect(() => {
    const savedResources = localStorage.getItem('rpac-resources');
    if (savedResources) {
      const resources = JSON.parse(savedResources);
      const newAlerts: string[] = [];
      
      // Calculate scores for each category
      const categories = ['food', 'water', 'medicine', 'energy', 'tools'];
      const categoryScores: Record<string, number> = {};
      
      categories.forEach(category => {
        const categoryResources = resources.filter((r: { category: string }) => r.category === category);
        if (categoryResources.length === 0) {
          categoryScores[category] = 0;
          newAlerts.push(`Inga ${t(`resources.${category}`)} resurser registrerade`);
        } else {
          const avgDays = categoryResources.reduce((sum: number, r: { days_remaining?: number; daysRemaining?: number }) => sum + (r.days_remaining || r.daysRemaining || 0), 0) / categoryResources.length;
          categoryScores[category] = Math.min(100, Math.round((avgDays / 30) * 100));
          
          if (avgDays < 3) {
            newAlerts.push(`Kritiskt låga ${t(`resources.${category}`)} resurser (${Math.round(avgDays)} dagar kvar)`);
          } else if (avgDays < 7) {
            newAlerts.push(`Låga ${t(`resources.${category}`)} resurser (${Math.round(avgDays)} dagar kvar)`);
          }
        }
      });

      const overallScore = Math.round(
        Object.values(categoryScores).reduce((sum: number, score: number) => sum + score, 0) / categories.length
      );

      setScore({
        overall: overallScore,
        food: categoryScores.food || 0,
        water: categoryScores.water || 0,
        medicine: categoryScores.medicine || 0,
        energy: categoryScores.energy || 0,
        tools: categoryScores.tools || 0,
      });
      
      setAlerts(newAlerts);
    }
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'var(--color-crisis-green)';
    if (score >= 60) return 'var(--color-crisis-blue)';
    if (score >= 40) return 'var(--color-crisis-orange)';
    return 'var(--color-crisis-red)';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return CheckCircle;
    if (score >= 60) return TrendingUp;
    return AlertTriangle;
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Utmärkt';
    if (score >= 60) return 'Bra';
    if (score >= 40) return 'Acceptabel';
    return 'Kritisk';
  };

  return (
    <div className="crisis-card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {t('individual.personal_dashboard')}
        </h2>
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5" style={{ color: getScoreColor(score.overall) }} />
          <span className="font-semibold" style={{ color: getScoreColor(score.overall) }}>
            {score.overall}%
          </span>
        </div>
      </div>

      {/* Overall Score */}
      <div className="text-center mb-8">
        <div className="relative w-32 h-32 mx-auto mb-4">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="var(--color-crisis-grey)"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke={getScoreColor(score.overall)}
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${score.overall * 2.51} 251`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: getScoreColor(score.overall) }}>
                {score.overall}%
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {getScoreLabel(score.overall)}
              </div>
            </div>
          </div>
        </div>
        
        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          {t('preparedness.overall_score')}
        </h3>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {score.overall >= 80 
            ? t('preparedness.excellent') 
            : score.overall >= 60 
            ? t('preparedness.good')
            : t('preparedness.needs_improvement')
          }
        </p>
      </div>

      {/* Category Scores */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {Object.entries(score).filter(([key]) => key !== 'overall').map(([category, categoryScore]) => {
          const Icon = getScoreIcon(categoryScore);
          return (
            <div key={category} className="text-center">
              <div className="w-16 h-16 mx-auto mb-2 rounded-full flex items-center justify-center" 
                   style={{ backgroundColor: getScoreColor(categoryScore) + '20' }}>
                <Icon className="w-6 h-6" style={{ color: getScoreColor(categoryScore) }} />
              </div>
              <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {t(`resources.${category}`)}
              </div>
              <div className="text-lg font-bold" style={{ color: getScoreColor(categoryScore) }}>
                {categoryScore}%
              </div>
            </div>
          );
        })}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {t('preparedness.important_warnings')}
          </h3>
          {alerts.map((alert, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 rounded-lg" 
                 style={{ backgroundColor: 'var(--color-crisis-red)20' }}>
              <AlertTriangle className="w-5 h-5" style={{ color: 'var(--color-crisis-red)' }} />
              <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                {alert}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--color-crisis-grey)' }}>
          <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            {t('preparedness.quick_actions')}
          </h3>
        <div className="grid grid-cols-2 gap-3">
          <button className="crisis-button text-sm" 
                  style={{ backgroundColor: 'var(--color-crisis-green)', color: 'white' }}>
            <Target className="w-4 h-4 mr-2" />
            {t('preparedness.set_goals')}
          </button>
          <button className="crisis-button text-sm" 
                  style={{ backgroundColor: 'var(--color-crisis-blue)', color: 'white' }}>
            <Calendar className="w-4 h-4 mr-2" />
            {t('preparedness.plan')}
          </button>
        </div>
      </div>
    </div>
  );
}
