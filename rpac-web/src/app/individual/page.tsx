import { ResourceInventory } from '@/components/resource-inventory';
import { PlantDiagnosis } from '@/components/plant-diagnosis';
import { PersonalDashboard } from '@/components/personal-dashboard';
import { t } from '@/lib/locales';

export default function IndividualPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {t('individual.title')}
        </h1>
        <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
          Hantera din personliga beredskap och resurser
        </p>
      </div>

      {/* Personal Dashboard */}
      <PersonalDashboard />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ResourceInventory />
        <PlantDiagnosis />
      </div>

      {/* Additional Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="crisis-card">
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            {t('individual.guides')}
          </h2>
          <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
            Steg-för-steg guider för krisberedskap
          </p>
          <div className="space-y-2">
            <button className="crisis-button w-full text-left" style={{ backgroundColor: 'var(--color-crisis-green)', color: 'white' }}>
              📚 Grundläggande beredskap
            </button>
            <button className="crisis-button w-full text-left" style={{ backgroundColor: 'var(--color-crisis-blue)', color: 'white' }}>
              🌱 Odlingsguide för nybörjare
            </button>
            <button className="crisis-button w-full text-left" style={{ backgroundColor: 'var(--color-crisis-brown)', color: 'white' }}>
              🏠 Hemförsvar och säkerhet
            </button>
          </div>
        </div>

        <div className="crisis-card">
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            {t('individual.personal_coach')}
          </h2>
          <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
            AI-driven personlig beredskapscoach
          </p>
          <div className="space-y-2">
            <button className="crisis-button w-full text-left" style={{ backgroundColor: 'var(--color-crisis-orange)', color: 'white' }}>
              💡 Få personliga råd
            </button>
            <button className="crisis-button w-full text-left" style={{ backgroundColor: 'var(--color-crisis-blue)', color: 'white' }}>
              📊 Analysera din beredskap
            </button>
            <button className="crisis-button w-full text-left" style={{ backgroundColor: 'var(--color-crisis-green)', color: 'white' }}>
              🎯 Sätt beredskapsmål
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

