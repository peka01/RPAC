'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Lightbulb, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  MessageSquare,
  Send,
  Loader2,
  Sparkles
} from 'lucide-react';
import { SecureOpenAIService } from '@/lib/openai-client-secure';
import { WeatherService, WeatherData, WeatherForecast } from '@/lib/weather-service';
import { t } from '@/lib/locales';

interface PersonalAICoachProps {
  user?: any;
  userProfile?: any;
}

interface DailyTip {
  id: string;
  type: 'tip' | 'warning' | 'reminder' | 'achievement' | 'recommendation' | 'seasonal';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action?: string;
  timeframe?: string;
  icon: string;
  category?: string;
  difficulty?: string;
  estimatedTime?: string;
  tools?: string[];
  steps?: string[];
  tips?: string[];
}

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export function PersonalAICoach({ user, userProfile = {} }: PersonalAICoachProps) {
  const [dailyTips, setDailyTips] = useState<DailyTip[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedTip, setSelectedTip] = useState<string | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [forecastData, setForecastData] = useState<WeatherForecast[]>([]);
  const [extremeWeatherWarnings, setExtremeWeatherWarnings] = useState<string[]>([]);

  // Load weather data and forecast for user's location
  const loadWeatherData = async () => {
    try {
      // Load current weather
      const weather = await WeatherService.getCurrentWeather(undefined, undefined, {
        county: userProfile?.county,
        city: userProfile?.city
      });
      setWeatherData(weather);
      
      // Load forecast data
      const forecast = await WeatherService.getWeatherForecast(undefined, undefined, {
        county: userProfile?.county,
        city: userProfile?.city
      });
      setForecastData(forecast);
      
      // Generate extreme weather warnings
      const warnings = WeatherService.getExtremeWeatherWarnings(forecast);
      setExtremeWeatherWarnings(warnings);
    } catch (error) {
      console.error('Error loading weather data:', error);
    }
  };

  // Map database profile to AI coach format with weather context
  const profile = {
    climateZone: userProfile?.county ? getClimateZone(userProfile.county) : 'svealand',
    experienceLevel: 'beginner' as const, // Default, could be added to user profile later
    gardenSize: 'medium' as const, // Default, could be added to user profile later
    preferences: ['potatoes', 'carrots', 'lettuce'], // Default, could be added to user profile later
    currentCrops: ['tomatoes', 'herbs'], // Default, could be added to user profile later
    householdSize: userProfile?.household_size || 2,
    hasChildren: userProfile?.has_children || false,
    hasElderly: userProfile?.has_elderly || false,
    hasPets: userProfile?.has_pets || false,
    petTypes: userProfile?.pet_types || '',
    medicalConditions: userProfile?.medical_conditions || '',
    allergies: userProfile?.allergies || '',
    specialNeeds: userProfile?.special_needs || '',
    county: userProfile?.county || 'stockholm',
    city: userProfile?.city || '',
    postalCode: userProfile?.postal_code || '',
    address: userProfile?.address || '',
    // Weather context for AI
    weather: weatherData ? {
      temperature: weatherData.temperature,
      humidity: weatherData.humidity,
      rainfall: weatherData.rainfall,
      forecast: weatherData.forecast,
      windSpeed: weatherData.windSpeed,
      windDirection: weatherData.windDirection,
      pressure: weatherData.pressure,
      uvIndex: weatherData.uvIndex,
      sunrise: weatherData.sunrise,
      sunset: weatherData.sunset
    } : null,
    // Forecast context for AI
    forecast: forecastData.length > 0 ? forecastData.map(day => ({
      date: day.date,
      temperature: day.temperature,
      weather: day.weather,
      rainfall: day.rainfall,
      windSpeed: day.windSpeed
    })) : [],
    // Extreme weather warnings
    extremeWeatherWarnings: extremeWeatherWarnings
  };

  // Helper function to map Swedish counties to climate zones
  function getClimateZone(county: string): 'gotaland' | 'svealand' | 'norrland' {
    const countyToClimateZone: Record<string, 'gotaland' | 'svealand' | 'norrland'> = {
      stockholm: 'svealand',
      uppsala: 'svealand',
      sodermanland: 'svealand',
      ostergotland: 'gotaland',
      jonkoping: 'gotaland',
      kronoberg: 'gotaland',
      kalmar: 'gotaland',
      blekinge: 'gotaland',
      skane: 'gotaland',
      halland: 'gotaland',
      vastra_gotaland: 'gotaland',
      varmland: 'svealand',
      orebro: 'svealand',
      vastmanland: 'svealand',
      dalarna: 'svealand',
      gavleborg: 'svealand',
      vasternorrland: 'norrland',
      jamtland: 'norrland',
      vasterbotten: 'norrland',
      norrbotten: 'norrland'
    };
    return countyToClimateZone[county.toLowerCase()] || 'svealand';
  }

  // Generate daily AI tips based on current profile
  const generateDailyTips = async (): Promise<DailyTip[]> => {
    try {
      const aiTips = await SecureOpenAIService.generateDailyPreparednessTips(profile);
      return aiTips;
    } catch (error) {
      console.error('Error generating AI tips:', error);
      return getFallbackTips();
    }
  };

  // Load weather data when component mounts or user profile changes
  useEffect(() => {
    loadWeatherData();
  }, [userProfile?.county, userProfile?.city]);

  // Regenerate tips when profile, weather, or forecast changes
  useEffect(() => {
    const fetchDailyTips = async () => {
      setIsLoading(true);
      try {
        const aiTips = await generateDailyTips();
        setDailyTips(aiTips);
      } catch (error) {
        console.error('Error generating AI tips:', error);
        setDailyTips(getFallbackTips());
      } finally {
        setIsLoading(false);
      }
    };

    fetchDailyTips();
  }, [userProfile, weatherData, forecastData, extremeWeatherWarnings]); // Re-run when weather data changes

  // Fallback tips when AI is unavailable
  const getFallbackTips = (): DailyTip[] => {
    const currentMonth = new Date().getMonth() + 1;
    const season = currentMonth >= 3 && currentMonth <= 5 ? 'spring' : 
                  currentMonth >= 6 && currentMonth <= 8 ? 'summer' :
                  currentMonth >= 9 && currentMonth <= 11 ? 'autumn' : 'winter';

    return [
      {
        id: 'tip-1',
        type: 'tip',
        priority: 'high',
        title: 'Kontrollera dina resurser',
        description: 'Gå igenom din beredskapslista och kontrollera att allt är på plats.',
        action: 'Gå till resursinventering',
        timeframe: 'Idag',
        icon: '📋',
        category: 'preparedness',
        difficulty: 'beginner',
        estimatedTime: '15 minuter',
        tools: ['Beredskapslista', 'Penna'],
        steps: [
          'Öppna resursinventeringen',
          'Kontrollera varje kategori',
          'Markera saknade objekt',
          'Uppdatera listan'
        ],
        tips: [
          'Gör detta regelbundet',
          'Involvera hela familjen',
          'Uppdatera efter användning'
        ]
      },
      {
        id: 'tip-2',
        type: 'reminder',
        priority: 'medium',
        title: 'Planera nästa odlingssäsong',
        description: 'Börja planera för nästa odlingssäsong baserat på dina behov.',
        action: 'Öppna odlingsplaneraren',
        timeframe: 'Denna vecka',
        icon: '🌱',
        category: 'cultivation',
        difficulty: 'intermediate',
        estimatedTime: '30 minuter',
        tools: ['Odlingsplanerare', 'Frökatalog'],
        steps: [
          'Utvärdera förra säsongens resultat',
          'Planera nya grödor',
          'Beställ frön i tid',
          'Förbered odlingsbäddar'
        ],
        tips: [
          'Lär av förra säsongens misstag',
          'Välj grödor som passar ditt klimat',
          'Planera för kontinuerlig skörd'
        ]
      },
      {
        id: 'tip-3',
        type: 'warning',
        priority: 'high',
        title: 'Kontrollera väderprognosen',
        description: 'Håll dig uppdaterad om kommande väderförhållanden som kan påverka din beredskap.',
        action: 'Visa väderdata',
        timeframe: 'Idag',
        icon: '🌤️',
        category: 'weather',
        difficulty: 'beginner',
        estimatedTime: '5 minuter',
        tools: ['Väderapp', 'SMHI'],
        steps: [
          'Kontrollera 7-dagars prognos',
          'Läs varningar och råd',
          'Planera aktiviteter därefter',
          'Uppdatera beredskapsplaner'
        ],
        tips: [
          'Kontrollera regelbundet',
          'Lyssna på officiella varningar',
          'Anpassa planer efter väder'
        ]
      }
    ];
  };

  // Handle sending a message to the AI coach
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: newMessage.trim(),
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsTyping(true);

    try {
      // Get AI response for the conversation
      const aiResponse = await SecureOpenAIService.generatePersonalCoachResponse({
        userProfile: profile,
        userQuestion: newMessage.trim(),
        chatHistory: chatMessages.slice(-5).map(msg => ({
          sender: msg.type,
          message: msg.content,
          timestamp: msg.timestamp.toISOString()
        })) // Last 5 messages for context
      });
      
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        type: 'ai',
        content: aiResponse,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      const errorMessage: ChatMessage = {
        id: `ai-error-${Date.now()}`,
        type: 'ai',
        content: 'Ursäkta, jag kunde inte svara på din fråga just nu. Försök igen eller kontakta en expert för vidare hjälp.',
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };


  const getTipIcon = (tip: DailyTip) => {
    switch (tip.type) {
      case 'warning': return AlertTriangle;
      case 'tip': return Lightbulb;
      case 'reminder': return Clock;
      case 'achievement': return CheckCircle;
      default: return Lightbulb;
    }
  };

  const getTipColor = (tip: DailyTip) => {
    switch (tip.type) {
      case 'warning': return 'var(--color-warm-olive)';
      case 'tip': return 'var(--color-sage)';
      case 'reminder': return 'var(--color-cool-olive)';
      case 'achievement': return 'var(--color-khaki)';
      default: return 'var(--color-sage)';
    }
  };

  const getPriorityBadge = (priority: string) => {
    const getBadgeStyle = (priority: string) => {
      switch (priority) {
        case 'high': return { backgroundColor: 'var(--color-crisis-red)', color: 'white' };
        case 'medium': return { backgroundColor: 'var(--color-crisis-orange)', color: 'white' };
        case 'low': return { backgroundColor: 'var(--color-crisis-grey)', color: 'white' };
        default: return { backgroundColor: 'var(--color-crisis-grey)', color: 'white' };
      }
    };

    const getBadgeText = (priority: string) => {
      switch (priority) {
        case 'high': return 'Hög prioritet';
        case 'medium': return 'Medium prioritet';
        case 'low': return 'Låg prioritet';
        default: return 'Okänd prioritet';
      }
    };

    return (
      <span 
        className="px-2 py-1 text-xs rounded"
        style={getBadgeStyle(priority)}
      >
        {getBadgeText(priority)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Bot className="h-6 w-6" style={{ color: 'var(--color-sage)' }} />
          <h2 className="text-2xl font-bold" style={{ color: 'var(--color-dark-green)' }}>Personlig AI-coach</h2>
        </div>
        <p className="text-sm" style={{ color: 'var(--color-khaki)' }}>
          Få personliga råd och tips för din beredskap och odling
        </p>
      </div>

      {/* Extreme Weather Warnings */}
      {extremeWeatherWarnings.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg" style={{
          backgroundColor: 'var(--color-crisis-red)',
          borderColor: 'var(--color-crisis-red)',
          color: 'white'
        }}>
          <div className="flex items-center mb-2">
            <AlertTriangle className="w-5 h-5 mr-2" />
            <h3 className="font-bold text-lg">Väderprognos - Viktiga varningar</h3>
          </div>
          <div className="space-y-2">
            {extremeWeatherWarnings.map((warning, index) => (
              <div key={index} className="text-sm font-medium">
                {warning}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Tips Section */}
      <div className="modern-card">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="h-5 w-5" style={{ color: 'var(--color-sage)' }} />
            <h3 className="text-xl font-semibold" style={{ color: 'var(--color-dark-green)' }}>Dagens tips</h3>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--color-sage)' }} />
              <span className="ml-2" style={{ color: 'var(--color-khaki)' }}>Laddar personliga tips...</span>
            </div>
          ) : (
            <div className="grid gap-4">
              {dailyTips.map((tip) => {
                const IconComponent = getTipIcon(tip);
                return (
                  <div 
                    key={tip.id} 
                    className={`modern-card cursor-pointer transition-all hover:shadow-md ${
                      selectedTip === tip.id ? 'ring-2' : ''
                    }`}
                    style={{ 
                      borderColor: selectedTip === tip.id ? 'var(--color-sage)' : 'transparent',
                      borderWidth: selectedTip === tip.id ? '2px' : '0px'
                    }}
                    onClick={() => setSelectedTip(selectedTip === tip.id ? null : tip.id)}
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div 
                          className="p-2 rounded-full"
                          style={{ backgroundColor: getTipColor(tip) + '20' }}
                        >
                          <IconComponent className="h-5 w-5" style={{ color: getTipColor(tip) }} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold" style={{ color: 'var(--color-dark-green)' }}>{tip.title}</h3>
                            {getPriorityBadge(tip.priority)}
                          </div>
                          <p className="text-sm mb-2" style={{ color: 'var(--color-khaki)' }}>{tip.description}</p>
                          <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--color-khaki)' }}>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {tip.timeframe}
                            </span>
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              {tip.estimatedTime}
                            </span>
                          </div>
                          {tip.action && (
                            <button 
                              className="mt-2 px-3 py-1 text-sm text-white rounded"
                              style={{ backgroundColor: getTipColor(tip) }}
                            >
                              {tip.action}
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Expanded tip details */}
                      {selectedTip === tip.id && (
                        <div className="mt-4 pt-4 border-t border-opacity-20" style={{ borderColor: 'var(--color-khaki)' }}>
                          <div className="grid gap-3">
                            {tip.steps && tip.steps.length > 0 && (
                              <div>
                                <h4 className="font-medium mb-2" style={{ color: 'var(--color-dark-green)' }}>Steg:</h4>
                                <ol className="list-decimal list-inside space-y-1 text-sm" style={{ color: 'var(--color-khaki)' }}>
                                  {tip.steps.map((step, index) => (
                                    <li key={index}>{step}</li>
                                  ))}
                                </ol>
                              </div>
                            )}
                            {tip.tools && tip.tools.length > 0 && (
                              <div>
                                <h4 className="font-medium mb-2" style={{ color: 'var(--color-dark-green)' }}>Verktyg:</h4>
                                <div className="flex flex-wrap gap-1">
                                  {tip.tools.map((tool, index) => (
                                    <span 
                                      key={index} 
                                      className="px-2 py-1 text-xs border rounded"
                                      style={{ 
                                        borderColor: 'var(--color-khaki)', 
                                        color: 'var(--color-khaki)' 
                                      }}
                                    >
                                      {tool}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {tip.tips && tip.tips.length > 0 && (
                              <div>
                                <h4 className="font-medium mb-2" style={{ color: 'var(--color-dark-green)' }}>Tips:</h4>
                                <ul className="list-disc list-inside space-y-1 text-sm" style={{ color: 'var(--color-khaki)' }}>
                                  {tip.tips.map((tipText, index) => (
                                    <li key={index}>{tipText}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* AI Chat Section */}
      <div className="modern-card">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <MessageSquare className="h-5 w-5" style={{ color: 'var(--color-sage)' }} />
            <h3 className="text-xl font-semibold" style={{ color: 'var(--color-dark-green)' }}>Chatta med AI-coachen</h3>
          </div>
          
          {/* Chat Messages */}
          <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
            {chatMessages.length === 0 && (
              <div className="text-center py-8" style={{ color: 'var(--color-khaki)' }}>
                <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" style={{ color: 'var(--color-sage)' }} />
                <p>Ställ en fråga till din personliga AI-coach!</p>
                <p className="text-sm mt-2">Jag kan hjälpa dig med beredskap, odling och krisplanering.</p>
              </div>
            )}
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.type === 'user'
                      ? 'text-white'
                      : 'bg-opacity-10'
                  }`}
                  style={{
                    backgroundColor: message.type === 'user' 
                      ? 'var(--color-sage)' 
                      : 'var(--color-khaki)',
                    color: message.type === 'user' 
                      ? 'white' 
                      : 'var(--color-dark-green)'
                  }}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="px-4 py-2 rounded-lg" style={{ backgroundColor: 'var(--color-khaki)', opacity: 0.1 }}>
                  <div className="flex items-center gap-1">
                    <Loader2 className="h-4 w-4 animate-spin" style={{ color: 'var(--color-sage)' }} />
                    <span className="text-sm" style={{ color: 'var(--color-khaki)' }}>AI-coachen skriver...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Ställ en fråga till AI-coachen..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isTyping}
              className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
              style={{ 
                borderColor: 'var(--color-khaki)'
              }}
            />
            <button 
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isTyping}
              className="px-4 py-2 text-white rounded-lg disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-sage)' }}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
