import { Loader2, Brain, Calculator, Target, Calendar, CheckCircle } from 'lucide-react';

export function AIGenerationView() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 animate-pulse" 
             style={{ backgroundColor: 'var(--color-sage)', color: 'white' }}>
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
        <h1 className="text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          AI skapar din personliga plan
        </h1>
        <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
          Vår AI analyserar din profil och skapar en skräddarsydd odlingsplan för dig
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="modern-card p-8">
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center animate-pulse" 
                   style={{ backgroundColor: 'var(--color-sage)', color: 'white' }}>
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  AI analyserar din profil...
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Analyserar ditt klimat, erfarenhet och behov
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center animate-pulse" 
                   style={{ backgroundColor: 'var(--color-khaki)', color: 'white' }}>
                <Calculator className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Beräknar näringsbehov...
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Optimerar för din familjs kaloribehov
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center animate-pulse" 
                   style={{ backgroundColor: 'var(--color-warm-olive)', color: 'white' }}>
                <Target className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Skapar din personliga odlingsplan...
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Väljer optimala grödor för ditt klimat
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center animate-pulse" 
                   style={{ backgroundColor: 'var(--color-sage)', color: 'white' }}>
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Optimerar för svenska förhållanden...
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Anpassar så- och skördetider för Sverige
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center animate-pulse" 
                   style={{ backgroundColor: 'var(--color-khaki)', color: 'white' }}>
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Slutför planen...
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Genererar månadsvisa aktiviteter
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


