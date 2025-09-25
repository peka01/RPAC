import { SupabaseResourceInventory } from '@/components/supabase-resource-inventory';
import { PlantDiagnosis } from '@/components/plant-diagnosis';
import { PersonalDashboard } from '@/components/personal-dashboard';
import { t } from '@/lib/locales';

export default function IndividualPage() {
  return (
    <div className="bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {t('individual.title')}
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            {t('individual.manage_resources')}
          </p>
        </div>

      {/* Personal Dashboard */}
      <div className="modern-card">
        <PersonalDashboard />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="modern-card">
          <SupabaseResourceInventory user={{ id: 'individual-user' }} />
        </div>
        <div className="modern-card">
          <PlantDiagnosis />
        </div>
      </div>

      {/* Additional Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="crisis-card">
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            {t('individual.guides')}
          </h2>
          <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
            {t('individual.guides_description')}
          </p>
          <div className="space-y-2">
            <button className="crisis-button w-full text-left" style={{ backgroundColor: 'var(--color-crisis-green)', color: 'white' }}>
              {t('individual.basic_preparedness')}
            </button>
            <button className="crisis-button w-full text-left" style={{ backgroundColor: 'var(--color-crisis-blue)', color: 'white' }}>
              {t('individual.gardening_guide')}
            </button>
            <button className="crisis-button w-full text-left" style={{ backgroundColor: 'var(--color-crisis-brown)', color: 'white' }}>
              {t('individual.home_defense')}
            </button>
          </div>
        </div>

        <div className="crisis-card">
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            {t('individual.personal_coach')}
          </h2>
          <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
            {t('individual.coach_description')}
          </p>
          <div className="space-y-2">
            <button className="crisis-button w-full text-left" style={{ backgroundColor: 'var(--color-crisis-orange)', color: 'white' }}>
              {t('individual.get_personal_advice')}
            </button>
            <button className="crisis-button w-full text-left" style={{ backgroundColor: 'var(--color-crisis-blue)', color: 'white' }}>
              {t('individual.analyze_preparedness')}
            </button>
            <button className="crisis-button w-full text-left" style={{ backgroundColor: 'var(--color-crisis-green)', color: 'white' }}>
              {t('individual.set_preparedness_goals')}
            </button>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

