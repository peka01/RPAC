'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
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
  RotateCcw,
  Edit3
} from 'lucide-react';
import { t } from '@/lib/locales';
import { SecureOpenAIService } from '@/lib/openai-worker-service';
import { WeatherService } from '@/lib/weather-service';
import { RemindersContextService } from '@/lib/reminders-context-service-enhanced';
import { TipHistoryService } from '@/lib/tip-history-service';
import { supabase } from '@/lib/supabase';
import { KRISterHelpLoader } from '@/lib/krister-help-loader';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import HelpFileEditor from './help-file-editor';

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    name?: string;
  };
}

import type { UserProfile as DBUserProfile } from '@/lib/useUserProfile';

interface UserProfile extends DBUserProfile {
  climateZone?: string;
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
  [key: string]: any;
}

interface KRISterAssistantProps {
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

export function KRISterAssistant({ user, userProfile, currentPage, currentAction }: KRISterAssistantProps) {
  // Get current route from Next.js hooks for reactivity
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Ensure we have a valid profile
  userProfile = userProfile || {
    id: '',
    user_id: user?.id || '',
    created_at: new Date(),
    updated_at: new Date(),
    county: 'stockholm'
  };
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dailyTips, setDailyTips] = useState<DailyTip[]>([]);
  const [contextHelp, setContextHelp] = useState<any>(null);
  const [exampleQuestions, setExampleQuestions] = useState<string[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsError, setQuestionsError] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  // Help editor state (super admin)
  const [showHelpEditor, setShowHelpEditor] = useState(false);
  const [helpEditorContent, setHelpEditorContent] = useState('');
  const [helpEditorPath, setHelpEditorPath] = useState(''); // e.g. 'local/home'
  const [helpEditorFullPath, setHelpEditorFullPath] = useState(''); // Full path for API
  const [helpEditorCommitMsg, setHelpEditorCommitMsg] = useState('');
  const [isSavingHelp, setIsSavingHelp] = useState(false);
  
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

  // Load context-specific help when page/route changes
  useEffect(() => {
    if (isOpen) {
      loadContextHelp();
      loadExampleQuestions(); // Generate fresh questions on every route change
    }
  }, [pathname, searchParams, isOpen]);

  // Also regenerate questions when route changes, even if chat has messages
  useEffect(() => {
    if (isOpen && messages.length > 1) {
      // User has been chatting, but navigated to a new page - refresh questions
      loadExampleQuestions();
    }
  }, [pathname, searchParams]);

  // Load daily tips on mount
  useEffect(() => {
    if (user?.id) {
      loadDailyTips();
    }
  }, [user?.id]);

  // Removed greeting message - questions section provides enough guidance

  // Listen for external open requests
  useEffect(() => {
    const handleOpenKRISter = () => {
      setIsOpen(true);
    };
    
    window.addEventListener('openKRISter', handleOpenKRISter);
    return () => window.removeEventListener('openKRISter', handleOpenKRISter);
  }, []);

  const loadContextHelp = async () => {
    try {
      // Use the new help loader system to get context-aware markdown help
      // Use the actual current route from Next.js hooks
      const currentPathname = pathname || window.location.pathname;
      const currentSearchParams = searchParams || new URLSearchParams(window.location.search);
      
      const helpContent = await KRISterHelpLoader.loadHelpForRoute(currentPathname, currentSearchParams);
      
      if (helpContent) {
        setContextHelp({
          title: helpContent.title,
          description: helpContent.context,
          steps: helpContent.steps,
          tips: helpContent.tips,
          faqs: helpContent.faqs,
          relatedPages: helpContent.relatedPages,
          rawMarkdown: helpContent.rawMarkdown
        });
        // Precompute current help path for editor
        const computedPath = computeHelpPathForRoute(currentPathname, currentSearchParams)?.replace(/\.md$/, '') || '';
        setHelpEditorPath(computedPath);
        return; // Success, exit early
      }
    } catch (error) {
      console.error('Error loading context help:', error);
    }
    
    // Fallback to old sv.json system if help file doesn't exist yet
    let contextKey: string = currentPage;
    
    // Build context key from URL
    const currentPathname = pathname || window.location.pathname;
    const tab = searchParams?.get('tab');
    const section = searchParams?.get('section');
    const resourceTab = searchParams?.get('resourceTab');
    
    // More granular context based on actual URL
    if (currentPathname.includes('/individual')) {
      if (section === 'cultivation') contextKey = 'cultivation';
      else if (section === 'resources') contextKey = 'resources';
      else if (section === 'knowledge') contextKey = 'individual';
      else if (section === 'coach') contextKey = 'individual';
      else contextKey = 'individual';
    } else if (currentPathname.includes('/local/discover')) {
      contextKey = 'local_discover';
    } else if (currentPathname.includes('/local/messages/community')) {
      contextKey = 'messaging_community';
    } else if (currentPathname.includes('/local/messages/direct')) {
      contextKey = 'messaging_direct';
    } else if (currentPathname.includes('/local')) {
      if (tab === 'activity') contextKey = 'local_activity';
      else if (tab === 'messages') contextKey = 'messaging_community';
      else if (tab === 'admin') contextKey = 'community_admin';
      else if (tab === 'resources') {
        if (resourceTab === 'shared') contextKey = 'resource_shared';
        else if (resourceTab === 'owned') contextKey = 'resource_owned';
        else if (resourceTab === 'help') contextKey = 'resource_help';
        else contextKey = 'local';
      } else {
        contextKey = 'local';
      }
    } else if (currentPathname.includes('/regional')) {
      contextKey = 'regional';
    } else if (currentPathname.includes('/settings')) {
      if (tab === 'profile') contextKey = 'settings_profile';
      else if (tab === 'location') contextKey = 'settings_location';
      else contextKey = 'settings';
    } else if (currentPathname === '/' || currentPathname.includes('/dashboard')) {
      contextKey = 'dashboard';
    }
    
    // Try to get specific context help from sv.json
    try {
      const helpData = {
        title: t(`krister.context_help.${contextKey}.title`),
        description: t(`krister.context_help.${contextKey}.description`),
        tips: t(`krister.context_help.${contextKey}.tips`) as unknown as string[]
      };
      setContextHelp(helpData);
      // Compute path for legacy context as well
      const computedPath = computeHelpPathForRoute(currentPathname, searchParams || undefined)?.replace(/\.md$/, '') || '';
      setHelpEditorPath(computedPath);
    } catch (error) {
      // Final fallback to dashboard
      try {
        const helpData = {
          title: t('krister.context_help.dashboard.title'),
          description: t('krister.context_help.dashboard.description'),
          tips: t('krister.context_help.dashboard.tips') as unknown as string[]
        };
        setContextHelp(helpData);
      } catch (e) {
        console.error('Failed to load any context help:', e);
      }
    }
  };

  // Compute help file path (same logic as loader)
  const computeHelpPathForRoute = (pathnameStr: string, params?: URLSearchParams): string | null => {
    const clean = pathnameStr.replace(/^\/+|\/+$/g, '');
    if (clean === '' || clean === 'dashboard') return 'dashboard.md';
    if (clean === 'individual') {
      const section = params?.get('section') || 'resources';
      return `individual/${section}.md`;
    }
    if (clean === 'local') {
      const tab = params?.get('tab');
      const resourceTab = params?.get('resourceTab');
      if (!tab || tab === 'home') return 'local/home.md';
      if (tab === 'activity') return 'local/activity.md';
      if (tab === 'resources') {
        if (resourceTab === 'shared') return 'local/resources-shared.md';
        if (resourceTab === 'owned') return 'local/resources-owned.md';
        if (resourceTab === 'help') return 'local/resources-help.md';
        return 'local/resources-shared.md';
      }
      if (tab === 'admin') return 'local/admin.md';
    }
    if (clean === 'local/discover') return 'local/discover.md';
    if (clean === 'local/activity') return 'local/activity.md';
    if (clean === 'local/messages/community') return 'local/messages-community.md';
    if (clean === 'local/messages/direct') return 'local/messages-direct.md';
    if (clean === 'regional') return 'regional/overview.md';
    if (clean === 'settings') {
      const tab = params?.get('tab') || 'profile';
      return `settings/${tab}.md`;
    }
    if (clean === 'super-admin') return 'admin/super-admin.md';
    return null;
  };

  const openHelpEditor = async () => {
    try {
      if (!helpEditorPath) return;
      const resp = await fetch(`/api/help/${helpEditorPath}`);
      if (!resp.ok) throw new Error('Failed to load help content');
      const text = await resp.text();
      setHelpEditorContent(text);
      setHelpEditorCommitMsg(`Uppdatera hjälp: ${helpEditorPath}`);
      setShowHelpEditor(true);
    } catch (e) {
      console.error('Load help for edit failed:', e);
    }
  };

  const saveHelpEdits = async () => {
    if (!helpEditorPath || !user?.id) return;
    setIsSavingHelp(true);
    try {
      // Get Supabase session token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error('Ingen aktiv session. Logga in igen.');
      }

      const resp = await fetch('/api/help-edit', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          path: helpEditorPath,
          content: helpEditorContent,
          message: helpEditorCommitMsg || `KRISter hjälp uppdaterad: ${helpEditorPath}`
        })
      });
      if (!resp.ok) {
        let err: any;
        try {
          err = await resp.json();
        } catch {
          err = { error: await resp.text() };
        }
        throw new Error(err.error || 'Kunde inte spara ändringarna');
      }
      // Close modal
      setShowHelpEditor(false);
      // Reload help with cache-bust
      await KRISterHelpLoader.clearCache();
      await loadContextHelp();
    } catch (e: any) {
      console.error('Save help edit failed:', e);
      alert(e.message || 'Kunde inte spara ändringarna. Kontrollera att du är inloggad som super admin.');
    } finally {
      setIsSavingHelp(false);
    }
  };

  const loadDailyTips = async () => {
    try {
      setIsLoading(true);
      
      // Load weather data with postal code for better accuracy
      const weather = await WeatherService.getCurrentWeather(undefined, undefined, {
        postal_code: userProfile?.postal_code,
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

  const loadExampleQuestions = async () => {
    try {
      setQuestionsLoading(true);
      setQuestionsError(false);
      
      // Build context from current route
      const currentPathname = pathname || window.location.pathname;
      const tab = searchParams?.get('tab');
      const section = searchParams?.get('section');
      
      let pageContext = 'dashboard';
      let pageDescription = 'översiktssidan';
      
      if (currentPathname.includes('/individual')) {
        if (section === 'cultivation') {
          pageContext = 'cultivation';
          pageDescription = 'odlingssidan där användaren planerar och följer upp sin odling';
        } else if (section === 'resources') {
          pageContext = 'resources';
          pageDescription = 'resurssidan där användaren hanterar sitt hemförråd';
        } else {
          pageContext = 'individual';
          pageDescription = 'den individuella beredskapssidan';
        }
      } else if (currentPathname.includes('/local')) {
        if (tab === 'activity') {
          pageContext = 'local_activity';
          pageDescription = 'den lokala aktivitetssidan';
        } else if (tab === 'messages') {
          pageContext = 'messaging';
          pageDescription = 'meddelandesidan för samhället';
        } else if (tab === 'admin') {
          pageContext = 'community_admin';
          pageDescription = 'administratörssidan för samhället';
        } else {
          pageContext = 'local';
          pageDescription = 'den lokala samhällssidan';
        }
      } else if (currentPathname.includes('/regional')) {
        pageContext = 'regional';
        pageDescription = 'den regionala översiktssidan';
      } else if (currentPathname.includes('/settings')) {
        pageContext = 'settings';
        pageDescription = 'inställningssidan';
      }

      // Get user context
      const userContext = userProfile ? {
        county: userProfile.county || 'okänd',
        hasChildren: userProfile.has_children || false,
        householdSize: userProfile.household_size || 2,
        experienceLevel: userProfile.experience_level || 'nybörjare'
      } : null;

      // Call OpenAI API to generate context-aware questions
      const prompt = `Du är KRISter, en AI-assistent för beredskapssystemet RPAC.
Användaren befinner sig just nu på ${pageDescription}.

Din uppgift: Generera exakt 3-4 korta, relevanta exempelfrågor som användaren kan ställa OM DEN HÄR SPECIFIKA SIDAN.

VIKTIGT: Inkludera ALLTID minst 1-2 procedurella "hur gör jag..."-frågor där det är relevant!

Frågorna ska vara:
- Direkt relaterade till funktioner på denna sida
- MIX av informationsfrågor OCH procedurfrågor ("hur gör jag...", "hur delar jag...", etc.)
- Korta (max 8-10 ord)
- Praktiska och handlingsbara
- Anpassade till användarens kontext${userContext ? ` (län: ${userContext.county}, ${userContext.hasChildren ? 'har barn' : 'inga barn'}, ${userContext.householdSize} personer, ${userContext.experienceLevel})` : ''}

Exempel för olika sidor:
- Odling: "Vad ska jag plantera nu?", "Hur skapar jag en odlingsplan?"
- Resurser (Mitt hem): "Vad ska jag ha i mitt beredskapslager?", "Hur delar jag en resurs med mitt samhälle?"
- Lokalt: "Hur går jag med i ett samhälle?", "Hur begär jag en resurs från en granne?"
- Regionalt: "Vilka samhällen är mest aktiva?", "Hur startar jag ett nytt samhälle?"

Svara ENDAST med en JSON-array av frågesträngar, ingen annan text.
Exempel: ["Fråga 1?", "Hur gör jag X?", "Fråga 3?"]`;

      const response = await fetch('https://api.beready.se', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'RPAC-Client/1.0'
        },
        body: JSON.stringify({
          prompt,
          type: 'example-questions'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error:', response.status, errorText);
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || data.response;
      
      if (!content) {
        throw new Error('No content in response');
      }

      // Parse the JSON array
      const questions = JSON.parse(content.trim());
      
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('Invalid questions format');
      }

      setExampleQuestions(questions.slice(0, 4)); // Max 4 questions
    } catch (error) {
      console.error('Error loading example questions:', error);
      setQuestionsError(true);
      setExampleQuestions([]);
    } finally {
      setQuestionsLoading(false);
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
          postal_code: userProfile?.postal_code || '',
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
          upcomingTasks: undefined,
          helpDocumentation: contextHelp || undefined
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

  const handleRefreshContent = async () => {
    setIsRefreshing(true);
    try {
      // Bust cache and reload help content from repository
      KRISterHelpLoader.clearCache();
      await loadContextHelp();
    } catch (error) {
      console.error('Error refreshing content:', error);
    } finally {
      setIsRefreshing(false);
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

  // Don't show floating button - only accessible via top menu help icon
  if (!isOpen) {
    return null;
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
      className="fixed z-50 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-[#3D4A2B]/30 flex flex-col"
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
              handleRefreshContent();
            }}
            disabled={isRefreshing}
            className={`p-1.5 rounded-lg transition-colors ${
              isRefreshing ? 'opacity-50' : 'hover:bg-white/10'
            }`}
            title={t('krister.refresh_content') || 'Uppdatera innehåll'}
          >
            <RotateCcw size={18} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
          {helpEditorPath && userProfile?.user_tier === 'super_admin' && (
            <button
              onClick={async (e) => {
                e.stopPropagation();
                // Fetch the current content and open in-app editor
                try {
                  const response = await fetch(`/api/help/${helpEditorPath}?t=${Date.now()}`);
                  const content = await response.text();
                  setHelpEditorContent(content);
                  setHelpEditorFullPath(`rpac-web/public/help/${helpEditorPath}.md`);
                  setShowHelpEditor(true);
                } catch (error) {
                  console.error('Failed to load help content for editing:', error);
                  alert('Kunde inte ladda hjälpfilen för redigering');
                }
              }}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              title={t('krister.help.edit')}
            >
              <Edit3 size={18} />
            </button>
          )}
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
        {/* Context Help - Display raw markdown directly */}
        {contextHelp && (
          <div className="text-sm leading-relaxed">
            {contextHelp.rawMarkdown ? (
              <div className="prose prose-sm max-w-none 
                prose-headings:text-[#3D4A2B] prose-headings:font-semibold
                prose-h1:text-base prose-h1:mb-2 prose-h1:mt-0
                prose-h2:text-sm prose-h2:mt-4 prose-h2:mb-1.5 prose-h2:font-semibold
                prose-h3:text-sm prose-h3:mt-2 prose-h3:mb-1 prose-h3:font-medium
                prose-p:text-sm prose-p:text-gray-700 prose-p:my-1 prose-p:leading-relaxed
                prose-li:text-sm prose-li:text-gray-700 prose-li:my-0.5
                prose-ul:my-1.5 prose-ul:space-y-0.5
                prose-ol:my-1.5 prose-ol:space-y-0.5
                prose-a:text-[#3D4A2B] prose-a:underline prose-a:font-normal
                prose-strong:font-bold
                prose-code:text-xs prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                >
                  {contextHelp.rawMarkdown}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none prose-headings:text-[#3D4A2B]">
                <h1 className="text-base font-semibold mb-2">{contextHelp.title}</h1>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{contextHelp.description || ''}</ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {/* Daily Tips Section - DISABLED FOR NOW */}
        {false && dailyTips.length > 0 && (
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

        {/* Example Questions - Always shown when available */}
        {!isLoading && (
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <h4 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
              <HelpCircle size={14} className="text-gray-400" />
              {messages.length <= 1 ? t('krister.example_questions.title') : 'Relaterade frågor'}
            </h4>
            
            {questionsLoading && (
              <div className="flex items-center justify-center py-6 text-gray-400">
                <Loader2 size={18} className="animate-spin mr-2" />
                <span className="text-xs">Genererar frågor...</span>
              </div>
            )}
            
            {questionsError && !questionsLoading && (
              <div className="text-xs text-gray-500 py-2 px-3 bg-gray-50 rounded-lg">
                Kunde inte ladda exempelfrågor just nu. Skriv din egen fråga nedan!
              </div>
            )}
            
            {!questionsLoading && !questionsError && exampleQuestions.length > 0 && (
              <div className="space-y-1.5">
                {exampleQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={async () => {
                      // Set the question and immediately send it
                      setInputMessage(question);
                      
                      // Use a small delay to ensure state is updated
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
                              postal_code: userProfile?.postal_code || '',
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
                              upcomingTasks: undefined,
                              helpDocumentation: contextHelp || undefined
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
                    className="w-full text-left text-xs text-gray-600 hover:text-[#3D4A2B] hover:bg-[#3D4A2B]/5 rounded-lg px-3 py-2 transition-colors flex items-start gap-2"
                  >
                    <span className="text-gray-400 mt-0.5">•</span>
                    <span className="flex-1">{question}</span>
                  </button>
                ))}
              </div>
            )}
            
            {!questionsLoading && !questionsError && exampleQuestions.length === 0 && (
              <div className="text-xs text-gray-500 py-2 px-3 bg-gray-50 rounded-lg">
                Skriv din fråga nedan för att komma igång!
              </div>
            )}
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
      {/* Help File Editor - Full-featured markdown editor */}
      {showHelpEditor && (
        <HelpFileEditor
          filePath={helpEditorFullPath}
          initialContent={helpEditorContent}
          onClose={() => setShowHelpEditor(false)}
          onSave={async (newContent) => {
            // Refresh help content after save
            await loadContextHelp();
            setShowHelpEditor(false);
          }}
          pageContext={{
            route: pathname || '',
            pageTitle: contextHelp?.title || '',
            features: contextHelp?.steps?.map((s: any) => s.title) || [],
            components: ['ResourceListView', 'SideMenu', 'Krister Assistant', 'Forms', 'Navigation']
          }}
        />
      )}
    </div>
  );
}

