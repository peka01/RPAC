'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, 
  Send, 
  Phone,
  Video,
  AlertTriangle,
  Users,
  Clock,
  CheckCircle2,
  Check,
  Radio,
  Wifi,
  WifiOff,
  Search,
  X,
  Package
} from 'lucide-react';
import { t } from '@/lib/locales';
import { ShieldProgressSpinner } from '@/components/ShieldProgressSpinner';
import { messagingService, type Message, type Contact } from '@/lib/messaging-service';
import { ResourceSharingPanel } from './resource-sharing-panel';
import type { User } from '@supabase/supabase-js';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface MessagingSystemProps {
  user: User;
  communityId?: string;
  initialTab?: 'direct' | 'community' | 'emergency' | 'resources';
  initialContactId?: string;
  hideTabs?: boolean;
}

export function MessagingSystemV2({ user, communityId, initialTab = 'community', initialContactId, hideTabs = false }: MessagingSystemProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'direct' | 'community' | 'emergency' | 'resources'>(initialTab);
  const [isConnected, setIsConnected] = useState(true);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus message input after messages load (for navigation from notifications)
  useEffect(() => {
    // Small delay to ensure component is fully rendered
    const timer = setTimeout(() => {
      messageInputRef.current?.focus();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [messages.length]); // Focus when messages are loaded

  // Load initial data
  useEffect(() => {
    if (user?.id) {
      loadInitialData();
    }
  }, [user?.id, communityId]);

  // Reload messages when tab or contact changes
  useEffect(() => {
    if (user?.id) {
      loadMessages();
    }
  }, [activeTab, activeContact]);

  // Subscribe to real-time messages
  useEffect(() => {
    if (!user?.id) return;

    const params: any = {
      userId: user.id,
      onMessage: handleNewMessage,
      onError: (err: Error) => {
        console.error('Real-time messaging error:', err);
        setError('Anslutningsproblem med meddelandesystem');
      }
    };

    if (activeTab === 'community' && communityId) {
      params.communityId = communityId;
    } else if (activeTab === 'direct' && activeContact) {
      params.recipientId = activeContact.id;
    }

    const channel = messagingService.subscribeToMessages(params);
    realtimeChannelRef.current = channel;

    // Update presence
    messagingService.updatePresence(user.id, 'online').catch(console.error);

    return () => {
      channel.unsubscribe();
      messagingService.updatePresence(user.id, 'offline').catch(console.error);
    };
  }, [user?.id, communityId, activeTab, activeContact]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && messagesEndRef.current) {
      const messagesContainer = messagesEndRef.current.closest('.messages-container');
      if (messagesContainer) {
        setTimeout(() => {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 100);
      }
    }
  }, [messages]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load contacts (community members if in community mode, excluding self)
      if (communityId) {
        console.log('👥 Loading contacts for community:', communityId);
        const onlineUsers = await messagingService.getOnlineUsers(communityId);
        console.log('👥 Online users loaded:', onlineUsers.length, onlineUsers);
        console.log('👥 Current user ID:', user.id);
        // Filter out the current user from the contacts list
        const filteredContacts = onlineUsers.filter(contact => contact.id !== user.id);
        console.log('👥 Filtered contacts (excluding self):', filteredContacts.length, filteredContacts);
        console.log('👥 Contact details:', onlineUsers.map(c => ({ id: c.id, name: c.name, status: c.status })));
        setContacts(filteredContacts);
        
        // Auto-select contact if initialContactId is provided
        if (initialContactId) {
          const targetContact = filteredContacts.find(c => c.id === initialContactId);
          if (targetContact) {
            console.log('🎯 Auto-selecting contact from URL:', targetContact.name);
            setActiveContact(targetContact);
          } else {
            console.warn('⚠️ Target contact not found in community:', initialContactId);
          }
        }
      } else {
        console.log('⚠️ No communityId provided for loading contacts');
      }

      // Load messages
      await loadMessages();

    } catch (err) {
      console.error('Error loading messaging data:', err);
      setError(err instanceof Error ? err.message : 'Ett fel inträffade vid laddning av meddelanden');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!user?.id) return;

    try {
      console.log('🔍 MessagingSystemV2 loadMessages called with:', {
        userId: user.id,
        activeTab,
        communityId,
        activeContact: activeContact?.id
      });

      // Don't load messages on Direct tab without a selected contact
      if (activeTab === 'direct' && !activeContact) {
        console.log('📝 Direct tab without contact - setting empty messages');
        setMessages([]);
        return;
      }

      const params: any = { userId: user.id, limit: 100 };

      if (activeTab === 'community' && communityId) {
        params.communityId = communityId;
        console.log('🏘️ Loading community messages for:', communityId);
      } else if (activeTab === 'direct' && activeContact) {
        params.recipientId = activeContact.id;
        console.log('💬 Loading direct messages with:', activeContact.id);
      } else {
        console.log('⚠️ No valid params for message loading:', { activeTab, communityId, activeContact: activeContact?.id });
      }

      console.log('📤 Calling messagingService.getMessages with params:', params);
      const loadedMessages = await messagingService.getMessages(params);
      console.log('📥 Received messages:', loadedMessages.length, loadedMessages);
      setMessages(loadedMessages);

      // Mark messages as read
      if (activeContact) {
        await messagingService.markConversationAsRead(user.id, activeContact.id);
      } else if (communityId) {
        await messagingService.markConversationAsRead(user.id, undefined, communityId);
      }
    } catch (err) {
      console.error('Error loading messages:', err);
      throw err;
    }
  };

  const handleNewMessage = (message: Message) => {
    setMessages(prev => {
      // Avoid duplicates
      if (prev.some(m => m.id === message.id)) {
        return prev;
      }
      return [...prev, message];
    });

    // Play notification sound for emergency messages
    if (message.is_emergency) {
      // Could add audio notification here
      console.log('🚨 EMERGENCY MESSAGE:', message.content);
    }
  };

  const sendMessage = async (type: Message['message_type'] = 'text', isEmergency: boolean = false) => {
    if (!newMessage.trim() && type === 'text') return;
    if (!user?.id) return;

    try {
      // Get user's display name from profile, fallback to email
      let senderName = user.email?.split('@')[0] || 'Okänd användare';
      try {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('display_name')
          .eq('user_id', user.id)
          .single();
        
        if (profile?.display_name) {
          senderName = profile.display_name;
        } else {
          // Fallback to full email if no display name
          senderName = user.email || 'Okänd användare';
        }
      } catch (err) {
        console.log('Could not fetch user profile, using email:', user.email);
        senderName = user.email || 'Okänd användare';
      }
      
      const params: any = {
        senderId: user.id,
        senderName,
        content: isEmergency ? `🚨 NÖDMEDDELANDE: ${newMessage}` : newMessage,
        messageType: type,
        isEmergency
      };

      if (activeTab === 'direct' && activeContact) {
        // Direct message - ONLY set recipientId, NOT communityId
        params.recipientId = activeContact.id;
        // Explicitly don't set communityId for direct messages
      } else if (activeTab === 'community' && communityId) {
        // Community message - ONLY set communityId, NOT recipientId
        params.communityId = communityId;
        // Explicitly don't set recipientId for community messages
      }

      await messagingService.sendMessage(params);
      setNewMessage('');

      // Reload messages to show the sent message immediately
      // (in case realtime subscription is slow)
      await loadMessages();

      if (isEmergency) {
        setEmergencyMode(true);
        setTimeout(() => setEmergencyMode(false), 5000);
      }

    } catch (err) {
      console.error('Error sending message:', err);
      setError('Kunde inte skicka meddelande. Försök igen.');
    }
  };

  const sendEmergencyMessage = () => {
    sendMessage('emergency', true);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getMessageStyle = (message: Message) => {
    const isOwnMessage = message.sender_id === user?.id;
    
    if (message.is_emergency || message.message_type === 'emergency') {
      return 'bg-red-100 border-2 border-red-500 text-red-900';
    }
    if (message.message_type === 'system') {
      return 'bg-blue-100 border border-blue-300 text-blue-900 text-center italic';
    }
    if (isOwnMessage) {
      return 'bg-blue-600 text-white ml-auto';
    }
    return 'bg-gray-100 text-gray-900';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just nu';
    if (diffMins < 60) return `${diffMins} min sedan`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} tim sedan`;
    return date.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <ShieldProgressSpinner variant="bounce" size="lg" color="olive" message="Laddar" />
      </div>
    );
  }

  return (
    <div className={`${hideTabs ? 'h-full' : 'modern-card p-3 md:p-6'} flex flex-col overflow-hidden`}>
      {/* Header - Hidden when in full-screen mode */}
      {!hideTabs && (
        <div className="border-b border-gray-200 pb-4 md:pb-6 mb-3 md:mb-4">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center shadow-md bg-gradient-to-br from-[#3D4A2B] to-[#5C6B47]">
                <MessageCircle className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold text-gray-900">
                  {activeTab === 'community' ? 'Samhällsmeddelanden' : 
                   activeTab === 'direct' ? 'Direktmeddelanden' : 
                   activeTab === 'resources' ? 'Resursdelning & Hjälp' :
                   'Nödkommunikation'}
                </h2>
                <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm text-gray-600">
                  {isConnected ? (
                    <><Wifi size={14} className="md:w-4 md:h-4" /> <span>Ansluten</span></>
                  ) : (
                    <><WifiOff size={14} className="md:w-4 md:h-4" /> <span>Frånkopplad</span></>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs - Mobile Native Style */}
          <div className="flex gap-1 md:gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab('community')}
              className={`flex-1 min-w-[80px] md:min-w-[120px] py-2 md:py-2 px-2 md:px-4 rounded-lg md:rounded-lg transition-all border-2 touch-manipulation active:scale-95 ${
                activeTab === 'community'
                  ? 'bg-[#3D4A2B] text-white border-[#3D4A2B] font-semibold'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-[#3D4A2B] hover:text-[#3D4A2B]'
              }`}
            >
              <Users className="inline mr-1 md:mr-2" size={16} />
              <span className="text-xs md:text-sm">Samhälle</span>
            </button>
            <button
              onClick={() => setActiveTab('resources')}
              className={`flex-1 min-w-[80px] md:min-w-[120px] py-2 md:py-2 px-2 md:px-4 rounded-lg md:rounded-lg transition-all border-2 touch-manipulation active:scale-95 ${
                activeTab === 'resources'
                  ? 'bg-[#3D4A2B] text-white border-[#3D4A2B] font-semibold'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-[#3D4A2B] hover:text-[#3D4A2B]'
              }`}
            >
              <Package className="inline mr-1 md:mr-2" size={16} />
              <span className="text-xs md:text-sm">Resurser</span>
            </button>
            <button
              onClick={() => setActiveTab('direct')}
              className={`flex-1 min-w-[80px] md:min-w-[120px] py-2 md:py-2 px-2 md:px-4 rounded-lg md:rounded-lg transition-all border-2 touch-manipulation active:scale-95 ${
                activeTab === 'direct'
                  ? 'bg-[#3D4A2B] text-white border-[#3D4A2B] font-semibold'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-[#3D4A2B] hover:text-[#3D4A2B]'
              }`}
            >
              <MessageCircle className="inline mr-1 md:mr-2" size={16} />
              <span className="text-xs md:text-sm">Direkt</span>
            </button>
            <button
              onClick={() => setActiveTab('emergency')}
              className={`flex-1 min-w-[80px] md:min-w-[120px] py-2 md:py-2 px-2 md:px-4 rounded-lg md:rounded-lg transition-all border-2 touch-manipulation active:scale-95 ${
                activeTab === 'emergency'
                  ? 'bg-red-600 text-white border-red-600 font-semibold'
                  : 'bg-white text-red-600 border-red-300 hover:border-red-600'
              }`}
            >
              <AlertTriangle className="inline mr-1 md:mr-2" size={16} />
              <span className="text-xs md:text-sm">Nöd</span>
            </button>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 m-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={20} />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)}>
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Contacts sidebar (for direct messages) - Mobile Responsive */}
        {activeTab === 'direct' && (
          <div className="w-full md:w-64 border-r border-gray-200 overflow-y-auto">
            <div className="p-2 md:p-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Sök kontakt..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] text-sm md:text-base"
                />
              </div>
            </div>
            <div className="space-y-1">
              {contacts
                .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(contact => (
                  <button
                    key={contact.id}
                    onClick={() => {
                      setActiveContact(contact);
                      loadMessages();
                    }}
                    className={`w-full p-2 md:p-3 text-left hover:bg-gray-100 transition-colors touch-manipulation active:scale-98 ${
                      activeContact?.id === contact.id ? 'bg-[#5C6B47]/10 border-l-4 border-[#3D4A2B]' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          contact.status === 'online' ? 'bg-green-500' :
                          contact.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                        }`} />
                        <span className="font-medium text-gray-900 text-sm md:text-base">{contact.name}</span>
                      </div>
                      {contact.role === 'coordinator' && (
                        <span className="text-xs bg-[#5C6B47]/20 text-[#2A331E] px-1 md:px-2 py-1 rounded">
                          Koordinator
                        </span>
                      )}
                    </div>
                    {contact.last_seen && contact.status === 'offline' && (
                      <p className="text-xs text-gray-500 mt-1">
                        Senast {formatTimestamp(contact.last_seen)}
                      </p>
                    )}
                  </button>
                ))}
              {contacts.length === 0 && (
                <div className="text-center py-6 md:py-8 text-gray-500 px-4">
                  <Users size={32} className="md:w-12 md:h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm md:text-base font-medium text-gray-900 mb-2">Inga kontakter tillgängliga</p>
                  <p className="text-xs md:text-sm text-gray-600 mb-4">
                    Du är den enda medlemmen i detta samhälle just nu.
                  </p>
                  <button
                    onClick={() => setActiveTab('community')}
                    className="px-4 py-2 bg-[#3D4A2B] text-white text-sm rounded-lg hover:bg-[#2A331E] transition-colors touch-manipulation active:scale-95"
                  >
                    Gå till samhällsmeddelanden
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Messages area or Resources panel */}
        <div className="flex-1 flex flex-col">
          {/* Resources Tab Content */}
          {activeTab === 'resources' ? (
            <div className="flex-1 overflow-y-auto p-4">
              {communityId ? (
                <ResourceSharingPanel
                  user={user}
                  communityId={communityId}
                  onSendMessage={(content) => {
                    setNewMessage(content);
                    setActiveTab('community');
                  }}
                />
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Package size={64} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">Välj ett samhälle först</p>
                  <p className="text-sm">Gå med i ett samhälle för att dela resurser och be om hjälp</p>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Active contact header (for direct messages) - Mobile Responsive */}
              {activeTab === 'direct' && activeContact && (
                <div className="bg-gray-50 border-b border-gray-200 p-2 md:p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full ${
                        activeContact.status === 'online' ? 'bg-green-500' :
                        activeContact.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`} />
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm md:text-base">{activeContact.name}</h3>
                        <p className="text-xs md:text-sm text-gray-500">
                          {activeContact.status === 'online' ? 'Online' : 
                           activeContact.status === 'away' ? 'Borta' : 
                           activeContact.last_seen ? `Senast ${formatTimestamp(activeContact.last_seen)}` : 'Offline'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 md:gap-2">
                      <button 
                        className="p-1.5 md:p-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 transition-colors cursor-not-allowed opacity-60 touch-manipulation"
                        title="Röstsamtal kommer snart"
                        disabled
                      >
                        <Phone size={16} className="md:w-5 md:h-5" />
                      </button>
                      <button 
                        className="p-1.5 md:p-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 transition-colors cursor-not-allowed opacity-60 touch-manipulation"
                        title="Videosamtal kommer snart"
                        disabled
                      >
                        <Video size={16} className="md:w-5 md:h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Messages - Mobile Native Style */}
              <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-2 md:space-y-3 messages-container bg-gray-50">
            {messages.length === 0 ? (
              <div className="text-center py-8 md:py-12 px-4 md:px-6 text-gray-500">
                {/* Illustration */}
                <div className="relative w-16 h-16 md:w-24 md:h-24 mx-auto mb-4 md:mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#5C6B47]/20 to-[#3D4A2B]/10 rounded-full"></div>
                  <div className="absolute inset-2 md:inset-3 bg-white rounded-full flex items-center justify-center">
                    <MessageCircle size={24} className="md:w-10 md:h-10 text-[#5C6B47]" strokeWidth={1.5} />
                  </div>
                </div>
                {activeTab === 'direct' && !activeContact ? (
                  <>
                    <p className="text-base md:text-lg font-bold text-gray-900 mb-2">
                      {contacts.length === 0 ? 'Inga medlemmar att chatta med' : 'Välj en kontakt'}
                    </p>
                    <p className="text-xs md:text-sm text-gray-600 leading-relaxed max-w-md mx-auto">
                      {contacts.length === 0 
                        ? 'Du är den enda medlemmen i detta samhälle. Bjud in andra eller gå till samhällsmeddelanden.'
                        : 'Välj en medlem från listan till vänster för att börja chatta'
                      }
                    </p>
                    {contacts.length === 0 && (
                      <button
                        onClick={() => setActiveTab('community')}
                        className="mt-4 px-6 py-3 bg-[#3D4A2B] text-white text-sm font-medium rounded-lg hover:bg-[#2A331E] transition-colors touch-manipulation active:scale-95"
                      >
                        Gå till samhällsmeddelanden
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-base md:text-lg font-bold text-gray-900 mb-2">Inga meddelanden än</p>
                    <p className="text-xs md:text-sm text-gray-600 leading-relaxed max-w-md mx-auto">{t('dashboard.empty_messages_tip')}</p>
                  </>
                )}
              </div>
            ) : (
              messages.map((message) => {
                const isOwnMessage = message.sender_id === user?.id;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] md:max-w-[70%] ${message.message_type === 'system' ? 'w-full max-w-full' : ''}`}>
                      {!isOwnMessage && message.message_type !== 'system' && (
                        <p className="text-xs text-gray-600 mb-1 px-1">{message.sender_name}</p>
                      )}
                      <div className={`rounded-lg md:rounded-lg p-2 md:p-3 shadow-sm ${getMessageStyle(message)}`}>
                        <p className="whitespace-pre-wrap break-words text-sm md:text-base">{message.content}</p>
                        {message.metadata?.location && (
                          <p className="text-xs mt-2 opacity-75">
                            📍 {message.metadata.location}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 px-1">
                        <p className="text-xs text-gray-500">
                          {formatTimestamp(message.created_at)}
                        </p>
                        {isOwnMessage && message.is_read && (
                          <CheckCircle2 size={12} className="md:w-3.5 md:h-3.5 text-[#556B2F]" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Emergency mode banner */}
          {emergencyMode && (
            <div className="bg-red-600 text-white px-4 py-2 text-center font-semibold animate-pulse">
              🚨 NÖDMEDDELANDE SKICKAT - Väntar på svar
            </div>
          )}

          {/* Input area - Mobile Native Style */}
          <div className="border-t border-gray-200 p-2 md:p-4 bg-white">
            {activeTab === 'emergency' && (
              <div className="mb-2 md:mb-3 p-2 md:p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs md:text-sm text-red-800 font-medium">
                  ⚠️ Nödläge aktiverat - Meddelanden skickas med hög prioritet
                </p>
              </div>
            )}
            
            <div className="flex gap-2">
              <textarea
                ref={messageInputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  activeTab === 'emergency' 
                    ? 'Beskriv nödsituationen...' 
                    : 'Skriv ett meddelande...'
                }
                className="flex-1 px-3 md:px-4 py-2 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] resize-none text-sm md:text-base"
                rows={2}
                disabled={activeTab === 'direct' && !activeContact}
              />
              <div className="flex flex-col gap-1 md:gap-2">
                {activeTab === 'emergency' ? (
                  <button
                    onClick={sendEmergencyMessage}
                    disabled={!newMessage.trim()}
                    className="px-4 md:px-8 py-3 md:py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all font-bold text-sm md:text-base border-2 border-red-600 hover:border-red-700 shadow-lg hover:shadow-xl min-h-[44px] md:min-h-[56px] touch-manipulation active:scale-95"
                    aria-label="Skicka nödmeddelande till alla i samhället"
                  >
                    <AlertTriangle className="inline mr-1 md:mr-2" size={16} />
                    <span className="hidden md:inline">SKICKA NÖD</span>
                    <span className="md:hidden">NÖD</span>
                  </button>
                ) : (
                  <button
                    onClick={() => sendMessage()}
                    disabled={!newMessage.trim() || (activeTab === 'direct' && !activeContact)}
                    className="px-4 md:px-8 py-3 md:py-4 bg-[#3D4A2B] text-white rounded-lg hover:bg-[#2A331E] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all font-bold text-sm md:text-base border-2 border-[#3D4A2B] hover:border-[#2A331E] shadow-md hover:shadow-lg min-h-[44px] md:min-h-[56px] touch-manipulation active:scale-95"
                    aria-label="Skicka meddelande"
                  >
                    <Send className="inline mr-1 md:mr-2" size={16} />
                    <span className="hidden md:inline">Skicka</span>
                  </button>
                )}
              </div>
            </div>
            
            <p className="text-xs text-gray-500 mt-1 md:mt-2">
              Tryck Enter för att skicka • Shift+Enter för ny rad
            </p>
          </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

