import { TreePine, Settings, Target, Calendar, TrendingUp, Sparkles, ArrowRight, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface UserProfile {
  household_size: number;
  has_children: boolean;
  has_elderly: boolean;
  has_pets: boolean;
  city: string;
  county: string;
  address: string;
  allergies: string;
  special_needs: string;
  garden_size: number;
  experience_level: 'beginner' | 'intermediate' | 'advanced';
  climate_zone: 'Götaland' | 'Svealand' | 'Norrland';
}

interface ProfileSetupProps {
  profileData: UserProfile;
  onGeneratePlan: () => void;
}

export function ProfileSetup({ profileData, onGeneratePlan }: ProfileSetupProps) {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" 
             style={{ backgroundColor: 'var(--color-sage)', color: 'white' }}>
          <TreePine className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Välkommen till din personliga odlingsplanerare
        </h1>
        <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
          Skapa en skräddarsydd odlingsplan baserad på dina behov, klimat och erfarenhet. 
          Vår AI hjälper dig att maximera din självförsörjning.
        </p>
      </div>

      <div className="mb-8">
        <div className="modern-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Din profil</span>
            </h2>
            <Link
              href="/settings"
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white hover:shadow-md transition-all duration-200"
              style={{ backgroundColor: 'var(--color-sage)' }}
            >
              <span>Redigera profil</span>
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" key={`profile-${profileData.household_size}-${profileData.city}-${profileData.county}`}>
            <div>
              <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Hushåll</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {profileData.household_size} personer
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Ort</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {profileData.city}, {profileData.county}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Klimatzon</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {profileData.climate_zone}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Erfarenhet</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {profileData.experience_level === 'beginner' ? 'Nybörjare' : 
                 profileData.experience_level === 'intermediate' ? 'Medel' : 'Avancerad'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="modern-card p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>Vad får du</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" 
                   style={{ backgroundColor: 'var(--color-sage)', color: 'white' }}>
                <Target className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Personlig plan</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Skräddarsydd för ditt klimat och erfarenhet
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" 
                   style={{ backgroundColor: 'var(--color-khaki)', color: 'white' }}>
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Årsplan</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Månadsvisa aktiviteter och skördetider
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" 
                   style={{ backgroundColor: 'var(--color-warm-olive)', color: 'white' }}>
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Maximera avkastning</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Optimerad för högsta självförsörjning
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={onGeneratePlan}
            className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-lg"
            style={{ 
              backgroundColor: 'var(--color-sage)',
              color: 'white'
            }}
          >
            <Sparkles className="w-5 h-5" />
            <span>Generera min plan</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}


