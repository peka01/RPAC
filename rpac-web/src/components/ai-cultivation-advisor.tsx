'use client';

import { useState, useEffect } from 'react';
import { t } from '@/lib/locales';
import { OpenAIService } from '@/lib/openai-service';
import { 
  Brain,
  Lightbulb,
  MapPin,
  Thermometer,
  Droplets,
  AlertTriangle,
  CheckCircle,
  Clock,
  Leaf,
  Sun,
  Cloud,
  Sprout,
  Target
} from 'lucide-react';

interface CultivationAdvice {
  id: string;
  type: 'recommendation' | 'warning' | 'tip' | 'seasonal';
  priority: 'high' | 'medium' | 'low';
  plant?: string;
  title: string;
  description: string;
  action?: string;
  timeframe?: string;
  icon: string;
}

interface WeatherCondition {
  temperature: number;
  humidity: number;
  rainfall: string;
  forecast: string;
}

interface UserProfile {
  climateZone: 'gotaland' | 'svealand' | 'norrland';
  experienceLevel: 'beginner' | 'intermediate' | 'expert';
  gardenSize: 'small' | 'medium' | 'large';
  preferences: string[];
  currentCrops: string[];
}

interface AICultivationAdvisorProps {
  userProfile?: Partial<UserProfile>;
  crisisMode?: boolean;
}

export function AICultivationAdvisor({ 
  userProfile = {}, 
  crisisMode = false 
}: AICultivationAdvisorProps) {
  const [advice, setAdvice] = useState<CultivationAdvice[]>([]);
  const [weather, setWeather] = useState<WeatherCondition | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAdvice, setSelectedAdvice] = useState<string | null>(null);

  // Default user profile
  const profile: UserProfile = {
    climateZone: 'svealand',
    experienceLevel: 'beginner',
    gardenSize: 'medium',
    preferences: ['potatoes', 'carrots', 'lettuce'],
    currentCrops: ['tomatoes', 'herbs'],
    ...userProfile
  };

  // Mock weather data (in production, this would come from SMHI API)
  const mockWeatherData: WeatherCondition = {
    temperature: 18,
    humidity: 65,
    rainfall: 'Lätt regn förväntas',
    forecast: 'Molnigt med uppehåll'
  };

  // Generate AI-powered cultivation advice using Gemini AI
  const generateAdvice = async (): Promise<CultivationAdvice[]> => {
    try {
      // Use real OpenAI AI for advice generation
      if (crisisMode) {
        return await OpenAIService.getCrisisAdvice(profile);
      } else {
        return await OpenAIService.generateCultivationAdvice(profile, crisisMode);
      }
    } catch (error) {
      console.error('Error generating AI advice:', error);
      // Fallback to mock advice if AI fails
      return getFallbackAdvice();
    }
  };

  // Fallback advice when AI is unavailable
  const getFallbackAdvice = (): CultivationAdvice[] => {
    const currentMonth = new Date().getMonth() + 1;
    const currentSeason = currentMonth >= 3 && currentMonth <= 5 ? 'spring' :
                         currentMonth >= 6 && currentMonth <= 8 ? 'summer' :
                         currentMonth >= 9 && currentMonth <= 11 ? 'autumn' : 'winter';
    
    const adviceList: CultivationAdvice[] = [];

    // Crisis mode recommendations - based on MSB food security guidelines
    if (crisisMode) {
      adviceList.push({
        id: 'msb-crisis-food-1',
        type: 'warning',
        priority: 'high',
        title: 'MSB-rekommendation: Näringsrika snabbgrödor',
        description: 'Enligt MSB:s riktlinjer ska du prioritera rädisor, spenat och sallad som växer snabbt och ger mycket näring per kvadratmeter.',
        action: 'Så rädisor och spenat inom 2 veckor',
        timeframe: '4-6 veckor till skörd',
        icon: '⚡'
      });

      adviceList.push({
        id: 'msb-crisis-food-2',
        type: 'recommendation',
        priority: 'high',
        title: 'MSB: Säker matproduktion inomhus',
        description: 'Enligt "Om krisen eller kriget kommer": Sätt upp enkla odlingslådor inomhus för kryddörter och mikrogrön som backup för utomhusodling.',
        action: 'Skaffa odlingslådor och frön',
        timeframe: '2-3 veckor till första skörd',
        icon: '🏠'
      });

      adviceList.push({
        id: 'msb-crisis-storage-1',
        type: 'warning',
        priority: 'high',
        title: 'MSB: Fokusera på lagringsbar mat',
        description: 'Prioritera potatis, morötter och kål som kan lagras länge. MSB rekommenderar minst 3 dagars mat hemma.',
        action: 'Plantera potatis och rotfrukter',
        timeframe: '16-20 veckor till skörd',
        icon: '📦'
      });

      adviceList.push({
        id: 'msb-water-efficient-1',
        type: 'recommendation',
        priority: 'high',
        title: 'MSB: Vatteneffektiv odling',
        description: 'Vid vattenbrist enligt MSB-riktlinjer: Välj tåliga grödor som kål och morötter som kräver mindre vatten.',
        action: 'Mulcha jorden för att spara vatten',
        timeframe: 'Gör omedelbart',
        icon: '💧'
      });
    }

    // Seasonal advice based on current month
    if (currentSeason === 'spring' && currentMonth >= 4) {
      adviceList.push({
        id: 'spring-1',
        type: 'recommendation',
        priority: 'high',
        plant: 'potatoes',
        title: 'Perfekt tid för potatis',
        description: `För ${profile.climateZone === 'norrland' ? 'Norrland' : profile.climateZone === 'svealand' ? 'Svealand' : 'Götaland'} är nu rätt tid att plantera potatis.`,
        action: 'Plantera förgrodd potatis',
        timeframe: '16-18 veckor till skörd',
        icon: '🥔'
      });

      adviceList.push({
        id: 'spring-2',
        type: 'tip',
        priority: 'medium',
        title: 'Förbered jorden',
        description: 'Tillsätt kompost och vädra jorden när den inte längre är frusen.',
        action: 'Lägg till kompost och harva',
        timeframe: 'Gör nu innan såning',
        icon: '🌱'
      });
    }

    if (currentSeason === 'summer') {
      adviceList.push({
        id: 'summer-1',
        type: 'warning',
        priority: 'high',
        title: 'Vattning viktig under torka',
        description: 'Sommarvärmen kräver extra vattning, speciellt för nya plantor.',
        action: 'Vattna tidigt på morgonen',
        timeframe: 'Dagligen under varma perioder',
        icon: '💧'
      });

      adviceList.push({
        id: 'summer-2',
        type: 'recommendation',
        priority: 'medium',
        plant: 'lettuce',
        title: 'Successiv såning av sallad',
        description: 'Så sallad var tredje vecka för kontinuerlig skörd hela sommaren.',
        action: 'Så ny omgång sallad',
        timeframe: '6-8 veckor till skörd',
        icon: '🥬'
      });
    }

    if (currentSeason === 'autumn') {
      adviceList.push({
        id: 'autumn-1',
        type: 'recommendation',
        priority: 'high',
        title: 'Skördetid för rotfrukter',
        description: 'Oktober är perfekt för att skörda morötter, potatis och rödbetor.',
        action: 'Börja skörda innan frosten',
        timeframe: 'Inom 2-3 veckor',
        icon: '🥕'
      });

      adviceList.push({
        id: 'autumn-2',
        type: 'tip',
        priority: 'medium',
        title: 'Förbered för vinter',
        description: 'Täck odlingsbäddar med löv eller halm för att skydda jorden.',
        action: 'Samla löv och täck bäddarna',
        timeframe: 'Gör innan första frosten',
        icon: '🍂'
      });
    }

    if (currentSeason === 'winter') {
      adviceList.push({
        id: 'winter-1',
        type: 'tip',
        priority: 'medium',
        title: 'Planera nästa säsong',
        description: 'Använd vintern för att planera nästa års odling och beställa frön.',
        action: 'Gör en odlingsplan',
        timeframe: 'Klart till mars',
        icon: '📋'
      });

      adviceList.push({
        id: 'winter-2',
        type: 'recommendation',
        priority: 'low',
        title: 'Inomhusodling',
        description: 'Odla kryddörter på fönsterbrädan under vinterperioden.',
        action: 'Så basilika och koriander',
        timeframe: '4-6 veckor till skörd',
        icon: '🌿'
      });
    }

    // Experience-based advice with MSB considerations
    if (profile.experienceLevel === 'beginner') {
      adviceList.push({
        id: 'beginner-msb-1',
        type: 'tip',
        priority: 'medium',
        title: 'MSB-guide för nybörjare',
        description: 'Som nybörjare enligt MSB-riktlinjer: börja med lätta grödor som rädisor, sallad och kryddörter som ger snabb avkastning.',
        action: 'Välj 2-3 enkla grödor från MSB-listan',
        timeframe: 'För din första säsong',
        icon: '🎯'
      });

      adviceList.push({
        id: 'beginner-msb-2',
        type: 'recommendation',
        priority: 'medium',
        title: 'MSB: Lär dig grunderna',
        description: 'Enligt MSB är det viktigt att lära sig grundläggande konservering och förvaring av egen skörd.',
        action: 'Läs om konservering och torkning',
        timeframe: 'Innan skördesäsongen',
        icon: '📚'
      });
    }

    // Weather-based advice
    if (weather?.rainfall === 'Lätt regn förväntas') {
      adviceList.push({
        id: 'weather-1',
        type: 'tip',
        priority: 'low',
        title: 'Regn förväntas',
        description: 'Med regn i sikte behöver du inte vattna de kommande dagarna.',
        action: 'Skippa vattning idag',
        timeframe: 'Nästa 2-3 dagar',
        icon: '🌧️'
      });
    }

    // Garden size specific advice with MSB food security focus
    if (profile.gardenSize === 'small') {
      adviceList.push({
        id: 'small-garden-msb-1',
        type: 'recommendation',
        priority: 'medium',
        title: 'MSB: Maximal avkastning på liten yta',
        description: 'Enligt MSB-riktlinjer: Utnyttja vertikalt utrymme med klätterväxter som ärtor och bönor för maximal matproduktion.',
        action: 'Sätt upp spaljer och välj näringsdensa grödor',
        timeframe: 'Innan växtsäsongen',
        icon: '📏'
      });

      adviceList.push({
        id: 'small-garden-msb-2',
        type: 'tip',
        priority: 'medium',
        title: 'MSB: Successiv såning på liten yta',
        description: 'På liten yta enligt MSB: så lite och ofta för kontinuerlig skörd istället för en stor skörd.',
        action: 'Så sallad var 2:a vecka',
        timeframe: 'Genom hela säsongen',
        icon: '🔄'
      });
    }

    // Add general MSB food security advice
    adviceList.push({
      id: 'msb-general-1',
      type: 'tip',
      priority: 'medium',
        title: 'MSB: Planera för självförsörjning',
        description: 'Enligt "Om krisen eller kriget kommer": Planera odlingen så att du kan producera mat för minst några veckors konsumtion.',
      action: 'Beräkna familiens matbehov',
      timeframe: 'Planera nu för nästa säsong',
      icon: '🎯'
    });

    return adviceList.sort((a, b) => {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    });
  };

  useEffect(() => {
    const loadAdvice = async () => {
      setLoading(true);
      try {
        setWeather(mockWeatherData);
        const aiAdvice = await generateAdvice();
        setAdvice(aiAdvice);
      } catch (error) {
        console.error('Error loading AI advice:', error);
        // Fallback to mock advice
        setAdvice(getFallbackAdvice());
      } finally {
        setLoading(false);
      }
    };

    loadAdvice();
  }, [crisisMode]);

  const getAdviceIcon = (advice: CultivationAdvice) => {
    switch (advice.type) {
      case 'warning': return AlertTriangle;
      case 'recommendation': return Lightbulb;
      case 'tip': return CheckCircle;
      case 'seasonal': return Clock;
      default: return Lightbulb;
    }
  };

  const getAdviceColor = (advice: CultivationAdvice) => {
    switch (advice.type) {
      case 'warning': return 'var(--color-warm-olive)';
      case 'recommendation': return 'var(--color-sage)';
      case 'tip': return 'var(--color-cool-olive)';
      case 'seasonal': return 'var(--color-khaki)';
      default: return 'var(--color-sage)';
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      high: 'var(--color-warm-olive)',
      medium: 'var(--color-sage)',
      low: 'var(--color-cool-olive)'
    };
    const labels = {
      high: 'Viktigt',
      medium: 'Medel',
      low: 'Tips'
    };
    
    return {
      color: colors[priority as keyof typeof colors],
      label: labels[priority as keyof typeof labels]
    };
  };

  if (loading) {
    return (
      <div className="rounded-lg p-6 border shadow-lg" style={{ 
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--color-sage)'
      }}>
        <div className="flex items-center justify-center space-x-3 py-8">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{
            borderColor: 'var(--color-sage)'
          }}></div>
          <span style={{ color: 'var(--text-secondary)' }}>
            AI analyserar dina odlingsförhållanden...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg p-6 border shadow-lg" style={{ 
      backgroundColor: 'var(--bg-card)',
      borderColor: crisisMode ? 'var(--color-warm-olive)' : 'var(--color-sage)'
    }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center shadow-sm" style={{ 
            background: `linear-gradient(135deg, ${crisisMode ? 'var(--color-warm-olive)' : 'var(--color-sage)'} 0%, var(--color-secondary) 100%)` 
          }}>
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              AI {t('cultivation.title').split(' ')[0]}rådgivare
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Personliga råd för {t(`cultivation.climate_zones.${profile.climateZone}`)}
            </p>
          </div>
        </div>

        {crisisMode && (
          <div className="flex items-center space-x-2 px-3 py-1 rounded-full border" style={{
            backgroundColor: 'rgba(184, 134, 11, 0.1)',
            borderColor: 'var(--color-warm-olive)'
          }}>
            <AlertTriangle className="w-4 h-4" style={{ color: 'var(--color-warm-olive)' }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--color-warm-olive)' }}>
              Krisläge
            </span>
          </div>
        )}
      </div>

      {/* Weather Summary */}
      {weather && (
        <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-olive-light)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Thermometer className="w-4 h-4" style={{ color: 'var(--color-sage)' }} />
                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                  {weather.temperature}°C
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Droplets className="w-4 h-4" style={{ color: 'var(--color-cool-olive)' }} />
                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                  {weather.humidity}%
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {weather.forecast}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {weather.rainfall}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AI Advice Cards */}
      <div className="space-y-4">
        {advice.map((item) => {
          const Icon = getAdviceIcon(item);
          const adviceColor = getAdviceColor(item);
          const priority = getPriorityBadge(item.priority);
          const isExpanded = selectedAdvice === item.id;

          return (
            <div
              key={item.id}
              className="border rounded-lg p-4 cursor-pointer hover:shadow-md transition-all duration-200"
              style={{ 
                backgroundColor: 'var(--bg-card)',
                borderColor: isExpanded ? adviceColor : 'var(--color-secondary)'
              }}
              onClick={() => setSelectedAdvice(isExpanded ? null : item.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm mt-1" style={{ 
                    backgroundColor: adviceColor
                  }}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                        {item.title}
                      </h3>
                      <span className="text-2xl">{item.icon}</span>
                    </div>
                    
                    <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                      {item.description}
                    </p>

                    {item.action && (
                      <div className="flex items-center space-x-4 text-xs">
                        <div className="flex items-center space-x-1">
                          <Target className="w-3 h-3" style={{ color: adviceColor }} />
                          <span style={{ color: 'var(--text-primary)' }}>{item.action}</span>
                        </div>
                        {item.timeframe && (
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" style={{ color: 'var(--text-tertiary)' }} />
                            <span style={{ color: 'var(--text-tertiary)' }}>{item.timeframe}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span 
                    className="text-xs px-2 py-1 rounded-full font-medium"
                    style={{
                      backgroundColor: `${priority.color}20`,
                      color: priority.color
                    }}
                  >
                    {priority.label}
                  </span>
                </div>
              </div>

              {/* Expanded content */}
              {isExpanded && item.plant && (
                <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-secondary)' }}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span style={{ color: 'var(--text-tertiary)' }}>Växttid:</span>
                      <span className="ml-2" style={{ color: 'var(--text-secondary)' }}>
                        12-16 veckor
                      </span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-tertiary)' }}>Svårighet:</span>
                      <span className="ml-2" style={{ color: 'var(--text-secondary)' }}>
                        Nybörjare
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {advice.length === 0 && (
        <div className="text-center py-8">
          <Sprout className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--color-secondary)' }} />
          <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Inga råd just nu
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            AI:n analyserar dina förhållanden och kommer snart med personliga råd.
          </p>
        </div>
      )}
    </div>
  );
}
