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
  X
} from 'lucide-react';
import { t } from '@/lib/locales';
import { messagingService, type Message, type Contact } from '@/lib/messaging-service';
import type { User } from '@supabase/supabase-js';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface MessagingSystemProps {
  user: User;
  communityId?: string;
}

export function MessagingSystemV2({ user, communityId }: MessagingSystemProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'direct' | 'community' | 'emergency'>('community');
  const [isConnected, setIsConnected] = useState(true);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null);

  // Load initial data
  useEffect(() => {
    if (user?.id) {
      loadInitialData();
    }
  }, [user?.id, communityId]);

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

      // Load contacts (community members if in community mode)
      if (communityId) {
        const onlineUsers = await messagingService.getOnlineUsers(communityId);
        setContacts(onlineUsers);
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
      const params: any = { userId: user.id, limit: 100 };

      if (activeTab === 'community' && communityId) {
        params.communityId = communityId;
      } else if (activeTab === 'direct' && activeContact) {
        params.recipientId = activeContact.id;
      }

      const loadedMessages = await messagingService.getMessages(params);
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
      const params: any = {
        senderId: user.id,
        senderName: user.user_metadata?.name || user.email || 'Okänd användare',
        content: isEmergency ? `🚨 NÖDMEDDELANDE: ${newMessage}` : newMessage,
        messageType: type,
        isEmergency
      };

      if (activeTab === 'direct' && activeContact) {
        params.recipientId = activeContact.id;
      } else if (activeTab === 'community' && communityId) {
        params.communityId = communityId;
      }

      await messagingService.sendMessage(params);
      setNewMessage('');

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3D4A2B]"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageCircle size={24} />
            <h2 className="text-xl font-bold">
              {activeTab === 'community' ? 'Samhällsmeddelanden' : 
               activeTab === 'direct' ? 'Direktmeddelanden' : 
               'Nödkommunikation'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <><Wifi size={20} /> <span className="text-sm">Ansluten</span></>
            ) : (
              <><WifiOff size={20} /> <span className="text-sm">Frånkopplad</span></>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('community')}
            className={`flex-1 py-2 px-4 rounded-lg transition-all ${
              activeTab === 'community'
                ? 'bg-white text-blue-600 font-semibold'
                : 'bg-blue-500/30 text-white hover:bg-blue-500/50'
            }`}
          >
            <Users className="inline mr-2" size={18} />
            Samhälle
          </button>
          <button
            onClick={() => setActiveTab('direct')}
            className={`flex-1 py-2 px-4 rounded-lg transition-all ${
              activeTab === 'direct'
                ? 'bg-white text-blue-600 font-semibold'
                : 'bg-blue-500/30 text-white hover:bg-blue-500/50'
            }`}
          >
            <MessageCircle className="inline mr-2" size={18} />
            Direkt
          </button>
          <button
            onClick={() => setActiveTab('emergency')}
            className={`flex-1 py-2 px-4 rounded-lg transition-all ${
              activeTab === 'emergency'
                ? 'bg-red-600 text-white font-semibold'
                : 'bg-red-500/30 text-white hover:bg-red-500/50'
            }`}
          >
            <AlertTriangle className="inline mr-2" size={18} />
            Nöd
          </button>
        </div>
      </div>

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
        {/* Contacts sidebar (for direct messages) */}
        {activeTab === 'direct' && (
          <div className="w-64 border-r border-gray-200 overflow-y-auto">
            <div className="p-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Sök kontakt..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className={`w-full p-3 text-left hover:bg-gray-100 transition-colors ${
                      activeContact?.id === contact.id ? 'bg-[#5C6B47]/10 border-l-4 border-[#3D4A2B]' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          contact.status === 'online' ? 'bg-green-500' :
                          contact.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                        }`} />
                        <span className="font-medium text-gray-900">{contact.name}</span>
                      </div>
                      {contact.role === 'coordinator' && (
                        <span className="text-xs bg-[#5C6B47]/20 text-[#2A331E] px-2 py-1 rounded">
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
                <div className="text-center py-8 text-gray-500">
                  <Users size={48} className="mx-auto mb-2 opacity-50" />
                  <p>Inga kontakter tillgängliga</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Messages area */}
        <div className="flex-1 flex flex-col">
          {/* Active contact header (for direct messages) */}
          {activeTab === 'direct' && activeContact && (
            <div className="bg-gray-50 border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    activeContact.status === 'online' ? 'bg-green-500' :
                    activeContact.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                  }`} />
                  <div>
                    <h3 className="font-semibold text-gray-900">{activeContact.name}</h3>
                    <p className="text-sm text-gray-500">
                      {activeContact.status === 'online' ? 'Online' : 
                       activeContact.status === 'away' ? 'Borta' : 
                       activeContact.last_seen ? `Senast ${formatTimestamp(activeContact.last_seen)}` : 'Offline'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 transition-colors">
                    <Phone size={20} />
                  </button>
                  <button className="p-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 transition-colors">
                    <Video size={20} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 messages-container bg-gray-50">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <MessageCircle size={64} className="mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">Inga meddelanden än</p>
                <p className="text-sm">Skicka det första meddelandet för att starta konversationen</p>
              </div>
            ) : (
              messages.map((message) => {
                const isOwnMessage = message.sender_id === user?.id;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] ${message.message_type === 'system' ? 'w-full max-w-full' : ''}`}>
                      {!isOwnMessage && message.message_type !== 'system' && (
                        <p className="text-xs text-gray-600 mb-1 px-1">{message.sender_name}</p>
                      )}
                      <div className={`rounded-lg p-3 shadow-sm ${getMessageStyle(message)}`}>
                        <p className="whitespace-pre-wrap break-words">{message.content}</p>
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
                          <CheckCircle2 size={14} className="text-[#556B2F]" />
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

          {/* Input area */}
          <div className="border-t border-gray-200 p-4 bg-white">
            {activeTab === 'emergency' && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800 font-medium">
                  ⚠️ Nödläge aktiverat - Meddelanden skickas med hög prioritet
                </p>
              </div>
            )}
            
            <div className="flex gap-2">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  activeTab === 'emergency' 
                    ? 'Beskriv nödsituationen...' 
                    : 'Skriv ett meddelande...'
                }
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={2}
                disabled={activeTab === 'direct' && !activeContact}
              />
              <div className="flex flex-col gap-2">
                {activeTab === 'emergency' ? (
                  <button
                    onClick={sendEmergencyMessage}
                    disabled={!newMessage.trim()}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold"
                  >
                    <AlertTriangle className="inline mr-2" size={18} />
                    SKICKA NÖD
                  </button>
                ) : (
                  <button
                    onClick={() => sendMessage()}
                    disabled={!newMessage.trim() || (activeTab === 'direct' && !activeContact)}
                    className="px-6 py-2 bg-[#3D4A2B] text-white rounded-lg hover:bg-[#2A331E] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="inline mr-2" size={18} />
                    Skicka
                  </button>
                )}
              </div>
            </div>
            
            <p className="text-xs text-gray-500 mt-2">
              Tryck Enter för att skicka • Shift+Enter för ny rad
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

