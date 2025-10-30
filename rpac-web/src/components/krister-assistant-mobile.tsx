'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  X,
  Minimize2,
  Send,
  Mic,
  MicOff,
  Loader2,
  Sparkles,
  Lightbulb,
  AlertTriangle,
  Clock,
  MessageSquare,
  HelpCircle,
  ChevronDown,
  MoreVertical,
  RotateCcw
} from 'lucide-react';
import { t } from '@/lib/locales';
import { SecureOpenAIService } from '@/lib/openai-worker-service';
import { WeatherService } from '@/lib/weather-service';
import { RemindersContextService } from '@/lib/reminders-context-service-enhanced';
import { TipHistoryService } from '@/lib/tip-history-service';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    name?: string;
  };
}

interface UserProfile {
  climateZone?: string;
  householdSize?: number;
  hasChildren?: boolean;
  county?: string;
  city?: string;
  experienceLevel?: string;
  gardenSize?: string;
  crisisMode?: boolean;
  location?: string;
  weather?: {
    temperature?: number;
    humidity?: number;
    forecast?: string;
    windSpeed?: number;
    precipitation?: number;
    feelsLike?: number;
    warnings?: Array<{
      type?: string;
      description?: string;
      message?: string;
      severity?: 'low' | 'moderate' | 'severe' | 'extreme';
    }>;
  };
  [key: string]: unknown;
}

interface KRISterAssistantMobileProps {
  user?: User;
  userProfile?: UserProfile;
  currentPage: 'dashboard' | 'individual' | 'local' | 'regional' | 'settings' | 'cultivation' | 'resources';
  currentAction?: string;
  currentSection?: string;
  currentSubsection?: string;
}

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface DailyTip {
  id: string;
  type: 'tip' | 'warning' | 'reminder' | 'achievement' | 'recommendation' | 'seasonal';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  icon: string;
  plant?: string;
  timeframe?: string;
}

export function KRISterAssistantMobile({ user, userProfile = {}, currentPage, currentAction }: KRISterAssistantMobileProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [dailyTips, setDailyTips] = useState<DailyTip[]>([]);
  const [contextHelp, setContextHelp] = useState<any>(null);
  const [showContextHelp, setShowContextHelp] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load context-specific help when page changes
  useEffect(() => {
    loadContextHelp();
  }, [currentPage, currentAction]);

  // Load daily tips on mount
  useEffect(() => {
    if (user?.id) {
      loadDailyTips();
    }
  }, [user?.id]);

  // Add greeting message when opened for first time
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greetingMessage: Message = {
        id: `msg-${Date.now()}`,
        type: 'system',
        content: t('krister.greeting'),
        timestamp: new Date()
      };
      setMessages([greetingMessage]);
    }
  }, [isOpen]);

  // Listen for external open requests
  useEffect(() => {
    const handleOpenKRISter = () => {
      setIsOpen(true);
    };
    
    window.addEventListener('openKRISter', handleOpenKRISter);
    return () => window.removeEventListener('openKRISter', handleOpenKRISter);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
    }
  }, [inputMessage]);

  const loadContextHelp = () => {
    // Build context key with more granularity
    let contextKey: string = currentPage;
    
    // Add section/subsection for more specific help
    if (currentAction) {
      // Parse URL for more specific context
      if (currentAction.includes('cultivation')) {
        contextKey = 'cultivation';
      } else if (currentAction.includes('resources')) {
        contextKey = 'resources';
      } else if (currentAction.includes('community')) {
        contextKey = 'community';
      } else if (currentAction.includes('messaging')) {
        contextKey = 'messaging';
      } else if (currentAction.includes('resource-sharing')) {
        contextKey = 'resource_sharing';
      } else if (currentAction.includes('settings')) {
        contextKey = 'settings';
        if (currentAction.includes('profile')) contextKey = 'settings_profile';
        else if (currentAction.includes('location')) contextKey = 'settings_location';
      }
    }
    
    // Try to get specific context help, fallback to page-level
    try {
      const helpData = {
        title: t(`krister.context_help.${contextKey}.title`),
        description: t(`krister.context_help.${contextKey}.description`),
        tips: [
          t(`krister.context_help.${contextKey}.tips.0`),
          t(`krister.context_help.${contextKey}.tips.1`),
          t(`krister.context_help.${contextKey}.tips.2`)
        ]
      };
      setContextHelp(helpData);
    } catch (error) {
      // Fallback to page-level context
      const helpData = {
        title: t(`krister.context_help.${currentPage}.title`),
        description: t(`krister.context_help.${currentPage}.description`),
        tips: [
          t(`krister.context_help.${currentPage}.tips.0`),
          t(`krister.context_help.${currentPage}.tips.1`),
          t(`krister.context_help.${currentPage}.tips.2`)
        ]
      };
      setContextHelp(helpData);
    }
  };

  const loadDailyTips = async () => {
    try {
      setIsLoading(true);
      
      // Load weather data
      const weather = await WeatherService.getCurrentWeather(undefined, undefined, {
        county: userProfile?.county,
        city: userProfile?.city
      });

      // Load reminders context
      const remindersContext = user ? await RemindersContextService.getUserRemindersContext(user.id) : null;

      // Get AI tips
      const profile = {
        climateZone: userProfile?.county ? getClimateZone(userProfile.county) : 'svealand',
        householdSize: typeof userProfile?.household_size === 'number' ? userProfile.household_size : 2,
        hasChildren: typeof userProfile?.has_children === 'boolean' ? userProfile.has_children : false,
        county: userProfile?.county || 'stockholm',
        weather: weather ? {
          temperature: weather.temperature,
          humidity: weather.humidity,
          forecast: weather.forecast
        } : undefined,
        reminders: remindersContext ? [
          ...remindersContext.pendingReminders,
          ...remindersContext.overdueReminders,
          ...remindersContext.completedToday,
          ...remindersContext.upcomingReminders
        ] : undefined
      };

      const tips = await SecureOpenAIService.generateDailyPreparednessTips(profile, remindersContext || undefined);
      
      // Filter out tips that have been shown recently
      const recentTipTitles = TipHistoryService.getRecentlyShownTips(7);
      const newTips = tips.filter((tip: DailyTip) => !recentTipTitles.includes(tip.title));
      
      // Store tips in history
      newTips.forEach((tip: DailyTip) => {
        TipHistoryService.addTipToHistory({ id: tip.id, title: tip.title });
      });

      setDailyTips(newTips.slice(0, 3)); // Show max 3 tips
    } catch (error) {
      console.error('Error loading daily tips:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getClimateZone = (county: string): 'gotaland' | 'svealand' | 'norrland' => {
    const countyToClimateZone: Record<string, 'gotaland' | 'svealand' | 'norrland'> = {
      stockholm: 'svealand',
      uppsala: 'svealand',
      sodermanland: 'svealand',
      ostergotland: 'gotaland',
      jonkoping: 'gotaland',
      kronoberg: 'gotaland',
      kalmar: 'gotaland',
      gotland: 'gotaland',
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
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Fetch user's cultivation plan and resources for context
      let cultivationPlan = null;
      let resources = null;
      
      if (user?.id) {
        // Fetch primary cultivation plan
        try {
          const { data: planData, error: planError } = await supabase
            .from('cultivation_plans')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_primary', true)
            .single();
          
          if (planError && planError.code !== 'PGRST116') { // PGRST116 = no rows found
            console.warn('Error fetching cultivation plan:', planError);
          } else {
            cultivationPlan = planData;
          }
        } catch (err) {
          console.warn('Failed to fetch cultivation plan:', err);
        }

        // Fetch resources
        const { data: resourcesData } = await supabase
          .from('resources')
          .select('*')
          .eq('user_id', user.id);
        
        resources = resourcesData;
      }

      // Get current weather
      const weather = await WeatherService.getCurrentWeather(undefined, undefined, {
        county: userProfile?.county,
        city: userProfile?.city
      });

      // Get AI response with full context
      const response = await SecureOpenAIService.generatePersonalCoachResponse({
        userProfile: {
          climateZone: userProfile?.county ? getClimateZone(userProfile.county) : 'Götaland',
          householdSize: typeof userProfile?.household_size === 'number' ? userProfile.household_size : 2,
          hasChildren: typeof userProfile?.has_children === 'boolean' ? userProfile.has_children : false,
          county: userProfile?.county || 'Okänd',
          city: userProfile?.city || '',
          weather: weather ? {
            temperature: weather.temperature,
            humidity: weather.humidity,
            forecast: weather.forecast,
            windSpeed: weather.windSpeed
          } : undefined
        },
        userQuestion: inputMessage.trim(),
        chatHistory: messages.slice(-5).map(m => ({
          sender: m.type === 'user' ? 'Användare' : 'KRISter',
          message: m.content,
          timestamp: m.timestamp.toISOString()
        })),
        appContext: {
          currentPage,
          cultivationPlan: cultivationPlan || undefined,
          resources: resources || undefined,
          upcomingTasks: undefined
        }
      });

      const aiMessage: Message = {
        id: `msg-${Date.now()}-ai`,
        type: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage: Message = {
        id: `msg-${Date.now()}-error`,
        type: 'system',
        content: t('krister.error.ai_unavailable'),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert(t('krister.voice.not_supported'));
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'sv-SE';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          alert(t('krister.voice.permission_denied'));
        } else {
          alert(t('krister.voice.error'));
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      setIsListening(false);
    }
  };

  const getTipIcon = (tip: DailyTip) => {
    switch (tip.type) {
      case 'warning':
        return <AlertTriangle className="text-amber-600" size={20} />;
      case 'reminder':
        return <Clock className="text-[#3D4A2B]" size={20} />;
      case 'achievement':
        return <Sparkles className="text-[#5C6B47]" size={20} />;
      case 'seasonal':
        return <Sparkles className="text-[#5C6B47]" size={20} />;
      case 'recommendation':
        return <Lightbulb className="text-[#707C5F]" size={20} />;
      default:
        return <Lightbulb className="text-[#707C5F]" size={20} />;
    }
  };

  const handleClearChat = () => {
    if (messages.length > 1) { // More than just the greeting
      // Keep only the greeting message
      const greetingMessage: Message = {
        id: `msg-${Date.now()}`,
        type: 'system',
        content: t('krister.greeting'),
        timestamp: new Date()
      };
      setMessages([greetingMessage]);
      setShowMenu(false);
    }
  };

  // Don't show floating button - only accessible via top menu help icon
  if (!isOpen) {
    return null;
  }

  // Full screen mobile chat
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-[#5C6B47]/10 to-white/95 backdrop-blur-sm animate-slide-in-bottom">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#3D4A2B] to-[#2A331E] text-white px-4 py-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Bot size={28} strokeWidth={2.5} />
            </div>
            <div>
              <div className="font-bold text-xl">{t('krister.name')}</div>
              <div className="text-sm text-[#C8D5B9]">{t('krister.subtitle')}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-3 hover:bg-white/10 rounded-xl transition-colors touch-manipulation active:scale-95 relative"
              title="Meny"
            >
              <MoreVertical size={24} strokeWidth={2.5} />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-3 hover:bg-white/10 rounded-xl transition-colors touch-manipulation active:scale-95"
              title={t('krister.close')}
            >
              <X size={24} strokeWidth={2.5} />
            </button>
          </div>

          {/* Dropdown Menu */}
          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-40"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute top-16 right-4 z-50 bg-white rounded-xl shadow-2xl border-2 border-[#3D4A2B] min-w-[200px] overflow-hidden">
                <button
                  onClick={handleClearChat}
                  disabled={messages.length <= 1}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors touch-manipulation ${
                    messages.length > 1
                      ? 'hover:bg-[#3D4A2B]/10 active:bg-[#3D4A2B]/20'
                      : 'opacity-40 cursor-not-allowed'
                  }`}
                >
                  <RotateCcw size={20} className="text-[#3D4A2B]" />
                  <span className="text-[#3D4A2B] font-medium">
                    {t('krister.clear_chat.title')}
                    {messages.length <= 1 && <span className="text-xs ml-1">({t('krister.clear_chat.disabled')})</span>}
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-32">
        {/* Context Help Card */}
        {contextHelp && showContextHelp && (
          <div className="bg-gradient-to-br from-[#3D4A2B]/10 to-[#5C6B47]/10 rounded-2xl p-4 border-l-4 border-[#3D4A2B] shadow-sm">
            <div className="flex items-start gap-3">
              <HelpCircle className="text-[#3D4A2B] mt-1 flex-shrink-0" size={24} />
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-bold text-[#3D4A2B] text-lg">{contextHelp.title}</h4>
                  <button
                    onClick={() => setShowContextHelp(false)}
                    className="p-1 hover:bg-white/50 rounded-lg transition-colors touch-manipulation"
                  >
                    <X size={18} className="text-[#3D4A2B]" />
                  </button>
                </div>
                <p className="text-sm text-gray-700 mb-3">{contextHelp.description}</p>
                <ul className="space-y-2">
                  {contextHelp.tips.map((tip: string, idx: number) => (
                    <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-[#5C6B47] mt-1 font-bold">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Daily Tips Section */}
        {dailyTips.length > 0 && (
          <div>
            <h4 className="text-base font-bold text-gray-700 mb-3 flex items-center gap-2">
              <Sparkles size={20} className="text-[#5C6B47]" />
              {t('krister.daily_tips_section')}
            </h4>
            <div className="space-y-3">
              {dailyTips.map(tip => (
                <div
                  key={tip.id}
                  className="bg-white rounded-2xl p-4 shadow-md border border-gray-200 active:scale-98 transition-transform touch-manipulation"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getTipIcon(tip)}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 mb-1">{tip.title}</div>
                      <div className="text-sm text-gray-600">{tip.description}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chat Messages */}
        <div className="space-y-3">
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  message.type === 'user'
                    ? 'bg-gradient-to-br from-[#3D4A2B] to-[#2A331E] text-white'
                    : message.type === 'system'
                    ? 'bg-[#707C5F]/20 text-gray-700 border border-[#707C5F]/30'
                    : 'bg-white text-gray-800 shadow-md border border-gray-200'
                }`}
              >
                {message.type === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2">
                    <Bot size={16} className="text-[#3D4A2B]" />
                    <span className="text-xs font-semibold text-[#3D4A2B]">{t('krister.name')}</span>
                  </div>
                )}
                <div className="text-base whitespace-pre-wrap leading-relaxed">{message.content}</div>
                <div
                  className={`text-xs mt-2 ${
                    message.type === 'user' ? 'text-white/70' : 'text-gray-500'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl px-4 py-3 shadow-md border border-gray-200">
                <div className="flex items-center gap-2 text-gray-600">
                  <Loader2 size={18} className="animate-spin" />
                  <span className="text-sm">{t('krister.thinking')}</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Example Questions (shown when no messages) */}
        {messages.length <= 1 && !isLoading && (
          <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-200">
            <h4 className="text-base font-bold text-gray-700 mb-3">{t('krister.example_questions.title')}</h4>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(num => (
                <button
                  key={num}
                  onClick={async () => {
                    const question = t(`krister.example_questions.question_${num}`);
                    
                    // Set the question in the input
                    setInputMessage(question);
                    
                    // Auto-send the question immediately
                    setTimeout(async () => {
                      const userMessage: Message = {
                        id: `msg-${Date.now()}`,
                        type: 'user',
                        content: question,
                        timestamp: new Date()
                      };

                      setMessages(prev => [...prev, userMessage]);
                      setInputMessage('');
                      setIsLoading(true);

                      try {
                        // Fetch user's cultivation plan and resources for context
                        let cultivationPlan = null;
                        let resources = null;
                        
                        if (user?.id) {
                          // Fetch primary cultivation plan
                          try {
                            const { data: planData, error: planError } = await supabase
                              .from('cultivation_plans')
                              .select('*')
                              .eq('user_id', user.id)
                              .eq('is_primary', true)
                              .single();
                            
                            if (planError && planError.code !== 'PGRST116') {
                              console.warn('Error fetching cultivation plan:', planError);
                            } else {
                              cultivationPlan = planData;
                            }
                          } catch (err) {
                            console.warn('Failed to fetch cultivation plan:', err);
                          }

                          // Fetch resources
                          const { data: resourcesData } = await supabase
                            .from('resources')
                            .select('*')
                            .eq('user_id', user.id);
                          
                          resources = resourcesData;
                        }

                        // Get current weather
                        const weather = await WeatherService.getCurrentWeather(undefined, undefined, {
                          county: userProfile?.county,
                          city: userProfile?.city
                        });

                        // Get AI response with full context
                        const response = await SecureOpenAIService.generatePersonalCoachResponse({
                          userProfile: {
                            climateZone: userProfile?.county ? getClimateZone(userProfile.county) : 'Götaland',
                            householdSize: typeof userProfile?.household_size === 'number' ? userProfile.household_size : 2,
                            hasChildren: typeof userProfile?.has_children === 'boolean' ? userProfile.has_children : false,
                            county: userProfile?.county || 'Okänd',
                            city: userProfile?.city || '',
                            weather: weather ? {
                              temperature: weather.temperature,
                              humidity: weather.humidity,
                              forecast: weather.forecast,
                              windSpeed: weather.windSpeed
                            } : undefined
                          },
                          userQuestion: question,
                          chatHistory: messages.slice(-5).map(m => ({
                            sender: m.type === 'user' ? 'Användare' : 'KRISter',
                            message: m.content,
                            timestamp: m.timestamp.toISOString()
                          })),
                          appContext: {
                            currentPage,
                            cultivationPlan: cultivationPlan || undefined,
                            resources: resources || undefined,
                            upcomingTasks: undefined
                          }
                        });

                        const aiMessage: Message = {
                          id: `msg-${Date.now()}-ai`,
                          type: 'assistant',
                          content: response,
                          timestamp: new Date()
                        };

                        setMessages(prev => [...prev, aiMessage]);
                      } catch (error) {
                        console.error('Error getting AI response:', error);
                        const errorMessage: Message = {
                          id: `msg-${Date.now()}-error`,
                          type: 'system',
                          content: t('krister.error.ai_unavailable'),
                          timestamp: new Date()
                        };
                        setMessages(prev => [...prev, errorMessage]);
                      } finally {
                        setIsLoading(false);
                      }
                    }, 100);
                  }}
                  className="w-full text-left text-sm text-gray-600 hover:text-[#3D4A2B] active:bg-[#3D4A2B]/10 rounded-xl px-4 py-3 transition-colors border border-gray-200 touch-manipulation active:scale-98"
                >
                  {t(`krister.example_questions.question_${num}`)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t-2 border-gray-200 shadow-2xl">
        <div className="flex gap-2 items-end">
          <button
            onClick={handleVoiceInput}
            disabled={isLoading}
            className={`flex-shrink-0 p-4 rounded-2xl transition-all touch-manipulation active:scale-95 ${
              isListening
                ? 'bg-red-500 text-white animate-pulse shadow-lg'
                : 'bg-[#707C5F]/10 text-[#3D4A2B] active:bg-[#707C5F]/20'
            }`}
            title={isListening ? t('krister.voice.stop') : t('krister.voice.start')}
          >
            {isListening ? <MicOff size={24} /> : <Mic size={24} />}
          </button>
          <textarea
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={isListening ? t('krister.listening') : t('krister.type_message')}
            disabled={isLoading || isListening}
            rows={1}
            className="flex-1 px-4 py-4 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent resize-none min-h-[56px] max-h-32 text-base"
            style={{ lineHeight: '1.5' }}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputMessage.trim() || isListening}
            className="flex-shrink-0 p-4 bg-gradient-to-r from-[#3D4A2B] to-[#2A331E] text-white rounded-2xl shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
            title={t('krister.send_message')}
          >
            <Send size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}

