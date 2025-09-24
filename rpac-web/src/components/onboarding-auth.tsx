'use client';

import { useState, useEffect } from 'react';
import { supabase, authService } from '@/lib/supabase';
import { 
  User, 
  LogIn, 
  LogOut, 
  UserPlus, 
  Shield, 
  ArrowRight,
  ArrowLeft,
  Users,
  Heart,
  AlertTriangle
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Välkommen till Beredd',
    description: 'Din trygga stöd när allt annat fallerar. Vi hjälper dig att förbereda dig för oväntade situationer.',
    icon: Shield,
    color: 'var(--color-crisis-green)'
  },
  {
    id: 'personal',
    title: 'Din personliga beredskap',
    description: 'Håll koll på dina resurser, odla din egen mat och få AI-hjälp med växtdiagnos.',
    icon: User,
    color: 'var(--color-crisis-blue)'
  },
  {
    id: 'community',
    title: 'Vårt lokala samhälle',
    description: 'Dela resurser med grannar, kommunicera lokalt och bygga ett starkt nätverk.',
    icon: Users,
    color: 'var(--color-crisis-orange)'
  },
  {
    id: 'regional',
    title: 'Regional hjälp',
    description: 'Få hjälp när du behöver det mest. Ömsesidig hjälp och samordning på regional nivå.',
    icon: Heart,
    color: 'var(--color-crisis-red)'
  }
];

export function OnboardingAuth() {
  const [user, setUser] = useState<{ id: string; email?: string; user_metadata?: { name?: string } } | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormErrors([]);
    
    try {
      if (isSignUp) {
        await authService.signUp(formData.email, formData.password, formData.name);
      } else {
        await authService.signIn(formData.email, formData.password);
      }
      setShowAuthForm(false);
      setFormData({ email: '', password: '', name: '' });
    } catch (error: unknown) {
      console.error('Auth error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ett fel uppstod. Försök igen.';
      setFormErrors([errorMessage]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await authService.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const nextStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg" style={{ color: 'var(--text-primary)' }}>Laddar...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" 
               style={{ backgroundColor: 'var(--color-crisis-green)' }}>
            <User className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {user.user_metadata?.name || user.email}
          </span>
        </div>
        <button
          onClick={handleSignOut}
          className="crisis-button text-sm whitespace-nowrap"
          style={{ background: 'linear-gradient(135deg, #3D4A2B 0%, #2A331E 100%)', color: 'white' }}
        >
          <LogOut className="w-4 h-4 mr-1" />
          Logga ut
        </button>
      </div>
    );
  }

  // Show onboarding if not authenticated
  if (!showAuthForm) {
    const step = onboardingSteps[currentStep];
    const Icon = step.icon;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="crisis-card max-w-2xl w-full">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                Steg {currentStep + 1} av {onboardingSteps.length}
              </span>
              <button
                onClick={() => setShowAuthForm(true)}
                className="text-sm underline"
                style={{ color: 'var(--color-crisis-blue)' }}
              >
                Hoppa över
              </button>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all duration-300"
                style={{ 
                  backgroundColor: step.color,
                  width: `${((currentStep + 1) / onboardingSteps.length) * 100}%`
                }}
              ></div>
            </div>
          </div>

          {/* Step Content */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                 style={{ backgroundColor: step.color + '20' }}>
              <Icon className="w-10 h-10" style={{ color: step.color }} />
            </div>
            
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              {step.title}
            </h2>
            
            <p className="text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {step.description}
            </p>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="crisis-button flex items-center space-x-2"
              style={{ 
                backgroundColor: currentStep === 0 ? 'var(--color-crisis-grey)' : 'var(--color-crisis-blue)',
                color: 'white',
                opacity: currentStep === 0 ? 0.5 : 1
              }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Föregående</span>
            </button>

            {currentStep === onboardingSteps.length - 1 ? (
              <button
                onClick={() => setShowAuthForm(true)}
                className="crisis-button flex items-center space-x-2"
                style={{ backgroundColor: 'var(--color-crisis-green)', color: 'white' }}
              >
                <span>Kom igång</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={nextStep}
                className="crisis-button flex items-center space-x-2"
                style={{ backgroundColor: 'var(--color-crisis-green)', color: 'white' }}
              >
                <span>Nästa</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show auth form
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="crisis-card max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
               style={{ backgroundColor: 'var(--color-crisis-green)20' }}>
            <Shield className="w-8 h-8" style={{ color: 'var(--color-crisis-green)' }} />
          </div>
          <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {isSignUp ? 'Skapa ditt konto' : 'Välkommen tillbaka'}
          </h3>
          <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
            {isSignUp 
              ? 'Börja din beredskapsresa idag' 
              : 'Logga in för att fortsätta'
            }
          </p>
        </div>

        {/* Error Messages */}
        {formErrors.length > 0 && (
          <div className="mb-4 p-3 rounded-lg flex items-center space-x-2"
               style={{ backgroundColor: 'var(--color-crisis-red)20' }}>
            <AlertTriangle className="w-5 h-5" style={{ color: 'var(--color-crisis-red)' }} />
            <div>
              {formErrors.map((error, index) => (
                <p key={index} className="text-sm" style={{ color: 'var(--color-crisis-red)' }}>
                  {error}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Ditt namn
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                style={{ 
                  borderColor: 'var(--color-crisis-grey)'
                }}
                placeholder="Ange ditt fullständiga namn"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              E-postadress
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full p-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
              style={{ 
                borderColor: 'var(--color-crisis-grey)',
              }}
              placeholder="din@email.se"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Lösenord
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              className="w-full p-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
              style={{ 
                borderColor: 'var(--color-crisis-grey)',
              }}
              placeholder={isSignUp ? "Minst 6 tecken" : "Ditt lösenord"}
              required
            />
            {isSignUp && (
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                Lösenordet måste vara minst 6 tecken långt
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full crisis-button flex items-center justify-center space-x-2"
            style={{ backgroundColor: 'var(--color-crisis-green)', color: 'white' }}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Bearbetar...</span>
              </>
            ) : (
              <>
                {isSignUp ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                <span>{isSignUp ? 'Skapa konto' : 'Logga in'}</span>
              </>
            )}
          </button>
        </form>

        {/* Toggle Auth Mode */}
        <div className="mt-6 text-center">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {isSignUp ? 'Har du redan ett konto?' : 'Behöver du ett konto?'}
          </p>
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setFormErrors([]);
              setFormData({ email: '', password: '', name: '' });
            }}
            className="text-sm font-semibold mt-1 underline"
            style={{ color: 'var(--color-crisis-blue)' }}
          >
            {isSignUp ? 'Logga in istället' : 'Skapa konto'}
          </button>
        </div>

        {/* Back to Onboarding */}
        <div className="mt-4 text-center">
          <button
            onClick={() => setShowAuthForm(false)}
            className="text-sm underline"
            style={{ color: 'var(--text-secondary)' }}
          >
            ← Tillbaka till introduktion
          </button>
        </div>
      </div>
    </div>
  );
}
