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
  RotateCcw
} from 'lucide-react';
import { t } from '@/lib/locales';
import { SecureOpenAIService } from '@/lib/openai-worker-service';
import { WeatherService } from '@/lib/weather-service';
import { RemindersContextService } from '@/lib/reminders-context-service-enhanced';
import { TipHistoryService } from '@/lib/tip-history-service';
import { supabase } from '@/lib/supabase';

interface KRISterAssistantProps {
  user?: any;
  userProfile?: any;
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

export function KRISterAssistant({ user, userProfile = {}, currentPage, currentAction }: KRISterAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [dailyTips, setDailyTips] = useState<DailyTip[]>([]);
  const [contextHelp, setContextHelp] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  
  // Dragging and resizing state
  const [position, setPosition] = useState({ x: window.innerWidth - 420, y: 24 });
  const [size, setSize] = useState({ width: 384, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string>('');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, posX: 0, posY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      const newX = Math.max(0, Math.min(window.innerWidth - size.width, position.x + deltaX));
      const newY = Math.max(0, Math.min(window.innerHeight - 100, position.y + deltaY));
      
      setPosition({ x: newX, y: newY });
      setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, position, size.width]);

  // Handle resizing
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      
      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;
      let newX = resizeStart.posX;
      let newY = resizeStart.posY;

      // Handle horizontal resizing
      if (resizeDirection.includes('e')) {
        newWidth = Math.max(320, Math.min(800, resizeStart.width + deltaX));
      } else if (resizeDirection.includes('w')) {
        const potentialWidth = resizeStart.width - deltaX;
        if (potentialWidth >= 320 && potentialWidth <= 800) {
          newWidth = potentialWidth;
          newX = resizeStart.posX + deltaX;
        }
      }

      // Handle vertical resizing
      if (resizeDirection.includes('s')) {
        newHeight = Math.max(400, Math.min(window.innerHeight - 100, resizeStart.height + deltaY));
      } else if (resizeDirection.includes('n')) {
        const potentialHeight = resizeStart.height - deltaY;
        if (potentialHeight >= 400 && potentialHeight <= window.innerHeight - 100) {
          newHeight = potentialHeight;
          newY = resizeStart.posY + deltaY;
        }
      }
      
      setSize({ width: newWidth, height: newHeight });
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeDirection('');
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeStart, resizeDirection]);

  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleResizeStart = (direction: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    setResizeStart({ 
      x: e.clientX, 
      y: e.clientY, 
      width: size.width, 
      height: size.height,
      posX: position.x,
      posY: position.y
    });
  };

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
      const remindersContext = await RemindersContextService.getUserRemindersContext(user.id);

      // Get AI tips
      const profile = {
        climateZone: userProfile?.county ? getClimateZone(userProfile.county) : 'svealand',
        householdSize: userProfile?.household_size || 2,
        hasChildren: userProfile?.has_children || false,
        county: userProfile?.county || 'stockholm',
        weather: weather ? {
          temperature: weather.temperature,
          humidity: weather.humidity,
          forecast: weather.forecast
        } : undefined,
        reminders: remindersContext
      };

      const tips = await SecureOpenAIService.generateDailyPreparednessTips(profile, remindersContext);
      
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
        const { data: planData } = await supabase
          .from('cultivation_plans')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_primary', true)
          .single();
        
        cultivationPlan = planData;

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
          householdSize: userProfile?.household_size || 2,
          hasChildren: userProfile?.has_children || false,
          county: userProfile?.county || 'Okänd',
          city: userProfile?.city || '',
          weather: weather ? {
            temperature: weather.temperature,
            humidity: weather.humidity,
            forecast: weather.forecast,
            windSpeed: weather.windSpeed,
            precipitation: weather.precipitation,
            warnings: weather.warnings
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
          cultivationPlan: cultivationPlan,
          resources: resources,
          upcomingTasks: null // Could fetch from cultivation_calendar if implemented
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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

  // Floating button when closed
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-br from-[#3D4A2B] to-[#2A331E] text-white rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300 flex items-center justify-center group"
        title={t('krister.button_tooltip')}
      >
        <Bot size={32} className="transition-transform group-hover:scale-110" strokeWidth={2} />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#5C6B47] rounded-full animate-pulse" />
      </button>
    );
  }

  // Minimized state
  if (isMinimized) {
    return (
      <div 
        className="fixed z-50 bg-white rounded-2xl shadow-2xl border-2 border-[#3D4A2B] w-80"
        style={{ left: `${position.x}px`, top: `${position.y}px` }}
      >
        <div 
          className="bg-gradient-to-r from-[#3D4A2B] to-[#2A331E] text-white px-4 py-3 rounded-t-xl flex items-center justify-between cursor-move"
          onMouseDown={handleDragStart}
        >
          <div className="flex items-center gap-2">
            <Bot size={24} strokeWidth={2} />
            <div>
              <div className="font-bold">{t('krister.name')}</div>
              <div className="text-xs text-[#C8D5B9]">{t('krister.subtitle')}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(false);
              }}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              title={t('krister.minimize')}
            >
              <MessageSquare size={18} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                setIsMinimized(false);
              }}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              title={t('krister.close')}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Full open state
  return (
    <div 
      ref={containerRef}
      className="fixed z-50 bg-white rounded-2xl shadow-2xl border-2 border-[#3D4A2B] flex flex-col"
      style={{ 
        left: `${position.x}px`, 
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`
      }}
    >
      {/* Header */}
      <div 
        className="bg-gradient-to-r from-[#3D4A2B] to-[#2A331E] text-white px-4 py-3 rounded-t-xl flex items-center justify-between cursor-move select-none"
        onMouseDown={handleDragStart}
      >
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <Bot size={24} strokeWidth={2} />
          </div>
          <div>
            <div className="font-bold text-lg">{t('krister.name')}</div>
            <div className="text-xs text-[#C8D5B9]">{t('krister.subtitle')}</div>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClearChat();
            }}
            disabled={messages.length <= 1}
            className={`p-1.5 rounded-lg transition-colors ${
              messages.length > 1 
                ? 'hover:bg-white/10 cursor-pointer' 
                : 'opacity-30 cursor-not-allowed'
            }`}
            title={messages.length > 1 ? t('krister.clear_chat.title') : t('krister.clear_chat.disabled')}
          >
            <RotateCcw size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(true);
            }}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            title={t('krister.minimize')}
          >
            <Minimize2 size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            title={t('krister.close')}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-br from-[#5C6B47]/5 to-white">
        {/* Context Help Card */}
        {contextHelp && (
          <div className="bg-[#3D4A2B]/10 rounded-xl p-4 border-l-4 border-[#3D4A2B]">
            <div className="flex items-start gap-3">
              <HelpCircle className="text-[#3D4A2B] mt-0.5 flex-shrink-0" size={20} />
              <div>
                <h4 className="font-bold text-[#3D4A2B] mb-1">{contextHelp.title}</h4>
                <p className="text-sm text-gray-700 mb-2">{contextHelp.description}</p>
                <ul className="space-y-1">
                  {contextHelp.tips.map((tip: string, idx: number) => (
                    <li key={idx} className="text-xs text-gray-600 flex items-start gap-2">
                      <span className="text-[#5C6B47] mt-0.5">•</span>
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
            <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <Sparkles size={16} className="text-[#5C6B47]" />
              {t('krister.daily_tips_section')}
            </h4>
            <div className="space-y-2">
              {dailyTips.map(tip => (
                <div
                  key={tip.id}
                  className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-2">
                    {getTipIcon(tip)}
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-gray-900">{tip.title}</div>
                      <div className="text-xs text-gray-600 mt-1">{tip.description}</div>
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
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  message.type === 'user'
                    ? 'bg-[#3D4A2B] text-white'
                    : message.type === 'system'
                    ? 'bg-[#707C5F]/20 text-gray-700 border border-[#707C5F]/30'
                    : 'bg-white text-gray-800 shadow-sm border border-gray-200'
                }`}
              >
                {message.type === 'assistant' && (
                  <div className="flex items-center gap-2 mb-1">
                    <Bot size={14} className="text-[#3D4A2B]" />
                    <span className="text-xs font-semibold text-[#3D4A2B]">{t('krister.name')}</span>
                  </div>
                )}
                <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                <div
                  className={`text-xs mt-1 ${
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
              <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 text-gray-600">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm">{t('krister.thinking')}</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Example Questions (shown when no messages) */}
        {messages.length <= 1 && !isLoading && (
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <h4 className="text-sm font-bold text-gray-700 mb-3">{t('krister.example_questions.title')}</h4>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(num => (
                <button
                  key={num}
                  onClick={() => {
                    const question = t(`krister.example_questions.question_${num}`);
                    setInputMessage(question);
                  }}
                  className="w-full text-left text-xs text-gray-600 hover:text-[#3D4A2B] hover:bg-[#3D4A2B]/5 rounded-lg px-3 py-2 transition-colors"
                >
                  {t(`krister.example_questions.question_${num}`)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 bg-white rounded-b-xl">
        <div className="flex gap-2">
          <button
            onClick={handleVoiceInput}
            disabled={isLoading}
            className={`p-3 rounded-xl transition-all ${
              isListening
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-[#707C5F]/10 text-[#3D4A2B] hover:bg-[#707C5F]/20'
            }`}
            title={isListening ? t('krister.voice.stop') : t('krister.voice.start')}
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isListening ? t('krister.listening') : t('krister.type_message')}
            disabled={isLoading || isListening}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputMessage.trim() || isListening}
            className="p-3 bg-gradient-to-r from-[#3D4A2B] to-[#2A331E] text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title={t('krister.send_message')}
          >
            <Send size={20} />
          </button>
        </div>
      </div>

      {/* Resize Handles - All 8 directions */}
      {/* Corners */}
      <div
        className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize"
        onMouseDown={handleResizeStart('nw')}
      />
      <div
        className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize"
        onMouseDown={handleResizeStart('ne')}
      />
      <div
        className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize"
        onMouseDown={handleResizeStart('sw')}
      />
      <div
        className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize group"
        onMouseDown={handleResizeStart('se')}
      >
        <div className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 opacity-40 group-hover:opacity-70 transition-opacity">
          <div className="absolute bottom-0 right-0 w-2 h-0.5 bg-[#3D4A2B] rotate-45"></div>
          <div className="absolute bottom-0.5 right-0 w-2 h-0.5 bg-[#3D4A2B] rotate-45"></div>
        </div>
      </div>

      {/* Edges */}
      <div
        className="absolute top-0 left-3 right-3 h-1 cursor-n-resize"
        onMouseDown={handleResizeStart('n')}
      />
      <div
        className="absolute bottom-0 left-3 right-3 h-1 cursor-s-resize"
        onMouseDown={handleResizeStart('s')}
      />
      <div
        className="absolute left-0 top-3 bottom-3 w-1 cursor-w-resize"
        onMouseDown={handleResizeStart('w')}
      />
      <div
        className="absolute right-0 top-3 bottom-3 w-1 cursor-e-resize"
        onMouseDown={handleResizeStart('e')}
      />
    </div>
  );
}

