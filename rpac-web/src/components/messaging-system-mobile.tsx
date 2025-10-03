'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, 
  Send, 
  Phone,
  Video,
  AlertTriangle,
  Users,
  CheckCircle2,
  Package,
  ChevronLeft,
  MoreVertical,
  Search,
  Wifi,
  WifiOff,
  Image as ImageIcon,
  Smile
} from 'lucide-react';
import { t } from '@/lib/locales';
import { messagingService, type Message, type Contact } from '@/lib/messaging-service';
import { ResourceSharingPanelMobile } from './resource-sharing-panel-mobile';
import type { User } from '@supabase/supabase-js';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface MessagingSystemMobileProps {
  user: User;
  communityId?: string;
  onUnreadCountChange?: (count: number) => void;
}

export function MessagingSystemMobile({ user, communityId, onUnreadCountChange }: MessagingSystemMobileProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'community' | 'direct' | 'resources'>('community');
  const [view, setView] = useState<'tabs' | 'contacts' | 'chat' | 'resources'>('tabs');
  const [isConnected, setIsConnected] = useState(true);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (user?.id) {
      loadInitialData();
    }
  }, [user?.id, communityId]);

  useEffect(() => {
    if (user?.id && (activeTab === 'community' || activeTab === 'direct')) {
      loadMessages();
    }
  }, [activeTab, activeContact]);

  useEffect(() => {
    if (!user?.id) return;

    const params: any = {
      userId: user.id,
      onMessage: handleNewMessage,
      onError: (err: Error) => {
        console.error('Real-time messaging error:', err);
        setIsConnected(false);
      }
    };

    if (activeTab === 'community' && communityId) {
      params.communityId = communityId;
    } else if (activeTab === 'direct' && activeContact) {
      params.recipientId = activeContact.id;
    }

    const channel = messagingService.subscribeToMessages(params);
    realtimeChannelRef.current = channel;

    messagingService.updatePresence(user.id, 'online').catch(console.error);

    return () => {
      channel.unsubscribe();
      messagingService.updatePresence(user.id, 'offline').catch(console.error);
    };
  }, [user?.id, communityId, activeTab, activeContact]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const loadInitialData = async () => {
    setLoading(true);
    try {
      if (communityId) {
        const communityContacts = await messagingService.getOnlineUsers(communityId);
        const filteredContacts = communityContacts.filter(c => c.id !== user.id);
        setContacts(filteredContacts);
      }
      await loadMessages();
    } catch (err) {
      console.error('Error loading initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!user?.id) return;

    try {
      let fetchedMessages: Message[] = [];
      
      if (activeTab === 'community' && communityId) {
        fetchedMessages = await messagingService.getMessages(communityId);
      } else if (activeTab === 'direct' && activeContact) {
        fetchedMessages = await messagingService.getMessages(undefined, activeContact.id, user.id);
      }

      setMessages(fetchedMessages);
      
      const unreadCount = fetchedMessages.filter(m => !m.is_read && m.sender_id !== user.id).length;
      if (onUnreadCountChange) {
        onUnreadCountChange(unreadCount);
      }
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const handleNewMessage = (message: Message) => {
    setMessages(prev => {
      const exists = prev.some(m => m.id === message.id);
      if (exists) return prev;
      return [...prev, message];
    });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user?.id || sending) return;

    setSending(true);
    try {
      const params: any = {
        sender_id: user.id,
        content: newMessage.trim(),
        message_type: 'text',
        is_emergency: false
      };

      if (activeTab === 'direct' && activeContact) {
        params.recipientId = activeContact.id;
      } else if (activeTab === 'community' && communityId) {
        params.communityId = communityId;
      }

      await messagingService.sendMessage(params);
      setNewMessage('');
      await loadMessages();
      
      // Auto-resize textarea
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Nu';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
    return date.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' });
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Tabs View
  if (view === 'tabs') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#5C6B47]/10 to-[#707C5F]/10 px-4 pt-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Meddelanden</h1>
          <div className="flex items-center gap-2 text-sm">
            {isConnected ? (
              <><Wifi size={16} className="text-green-600" /> <span className="text-gray-600">Online</span></>
            ) : (
              <><WifiOff size={16} className="text-red-600" /> <span className="text-gray-600">Offline</span></>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {/* Community Chat Card */}
          <button
            onClick={() => {
              setActiveTab('community');
              setView('chat');
            }}
            className="w-full bg-gradient-to-br from-[#3D4A2B] to-[#2A331E] text-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all touch-manipulation active:scale-98"
          >
            <div className="flex items-center gap-4">
              <div className="bg-white/20 rounded-2xl p-4">
                <Users size={32} strokeWidth={2.5} />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-xl font-bold mb-1">Samhällschat</h3>
                <p className="text-[#C8D5B9] text-sm">Chatta med alla i samhället</p>
                {messages.filter(m => m.community_id && !m.is_read && m.sender_id !== user.id).length > 0 && (
                  <div className="mt-2 inline-block bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {messages.filter(m => m.community_id && !m.is_read && m.sender_id !== user.id).length} nya
                  </div>
                )}
              </div>
              <ChevronLeft className="rotate-180" size={24} />
            </div>
          </button>

          {/* Direct Messages Card */}
          <button
            onClick={() => {
              setActiveTab('direct');
              setView('contacts');
            }}
            className="w-full bg-white border-2 border-[#5C6B47]/30 rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all touch-manipulation active:scale-98"
          >
            <div className="flex items-center gap-4">
              <div className="bg-[#3D4A2B] rounded-2xl p-4">
                <MessageCircle className="text-white" size={32} strokeWidth={2.5} />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-xl font-bold text-gray-900 mb-1">Direktmeddelanden</h3>
                <p className="text-gray-600 text-sm">Privata konversationer</p>
              </div>
              <ChevronLeft className="rotate-180 text-gray-400" size={24} />
            </div>
          </button>

          {/* Resources Card */}
          <button
            onClick={() => {
              setActiveTab('resources');
              setView('resources');
            }}
            className="w-full bg-white border-2 border-[#5C6B47]/30 rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all touch-manipulation active:scale-98"
          >
            <div className="flex items-center gap-4">
              <div className="bg-[#556B2F] rounded-2xl p-4">
                <Package className="text-white" size={32} strokeWidth={2.5} />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-xl font-bold text-gray-900 mb-1">Resursdelning</h3>
                <p className="text-gray-600 text-sm">Dela och begär resurser</p>
              </div>
              <ChevronLeft className="rotate-180 text-gray-400" size={24} />
            </div>
          </button>

          {/* Emergency Button */}
          <button
            onClick={() => {
              setActiveTab('community');
              setView('chat');
              setNewMessage('🚨 NÖDLÄGE: ');
              inputRef.current?.focus();
            }}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all touch-manipulation active:scale-98"
          >
            <div className="flex items-center gap-4">
              <div className="bg-white/20 rounded-2xl p-4">
                <AlertTriangle size={32} strokeWidth={2.5} />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-xl font-bold mb-1">Nödmeddelande</h3>
                <p className="text-red-100 text-sm">Skicka akut larmsignal</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // Contacts View (for Direct Messages)
  if (view === 'contacts') {
    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#3D4A2B] to-[#2A331E] text-white px-4 py-4 shadow-lg z-10">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setView('tabs')}
              className="p-2 hover:bg-white/10 rounded-full touch-manipulation"
            >
              <ChevronLeft size={24} strokeWidth={2.5} />
            </button>
            <div className="flex-1">
              <h2 className="text-xl font-bold">Välj kontakt</h2>
              <p className="text-[#C8D5B9] text-sm">{contacts.length} tillgängliga</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Sök kontakt..."
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40"
            />
          </div>
        </div>

        {/* Contacts List */}
        <div className="divide-y divide-gray-100">
          {contacts.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Users size={64} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Inga kontakter</h3>
              <p className="text-gray-600 text-sm">Samhället har inga andra medlemmar än</p>
            </div>
          ) : (
            contacts.map(contact => (
              <button
                key={contact.id}
                onClick={() => {
                  setActiveContact(contact);
                  setView('chat');
                }}
                className="w-full p-4 hover:bg-gray-50 transition-colors touch-manipulation active:bg-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#3D4A2B] to-[#5C6B47] rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                    <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
                      contact.status === 'online' ? 'bg-green-500' :
                      contact.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                    }`} />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-bold text-gray-900">{contact.name}</h4>
                    <p className="text-sm text-gray-500">
                      {contact.status === 'online' ? 'Online' : 
                       contact.last_seen ? `Senast ${formatTimestamp(contact.last_seen)}` : 'Offline'}
                    </p>
                  </div>
                  <ChevronLeft className="rotate-180 text-gray-400" size={20} />
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  // Resources View
  if (view === 'resources') {
    return (
      <div className="min-h-screen bg-white">
        <div className="sticky top-0 bg-gradient-to-r from-[#3D4A2B] to-[#2A331E] text-white px-4 py-4 shadow-lg z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView('tabs')}
              className="p-2 hover:bg-white/10 rounded-full touch-manipulation"
            >
              <ChevronLeft size={24} strokeWidth={2.5} />
            </button>
            <div className="flex-1">
              <h2 className="text-xl font-bold">Resursdelning</h2>
              <p className="text-[#C8D5B9] text-sm">Dela och begär resurser</p>
            </div>
          </div>
        </div>

        <div className="p-4">
          {communityId ? (
            <ResourceSharingPanelMobile
              user={user}
              communityId={communityId}
              onSendMessage={(content) => {
                setNewMessage(content);
                setActiveTab('community');
                setView('chat');
              }}
            />
          ) : (
            <div className="text-center py-16">
              <Package size={64} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Inget samhälle valt</h3>
              <p className="text-gray-600 text-sm">Gå med i ett samhälle för att dela resurser</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Chat View
  return (
    <div className="fixed inset-0 flex flex-col bg-gradient-to-br from-[#5C6B47]/5 to-[#707C5F]/5">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#3D4A2B] to-[#2A331E] text-white px-4 py-3 shadow-lg z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (activeTab === 'direct') {
                setView('contacts');
                setActiveContact(null);
              } else {
                setView('tabs');
              }
            }}
            className="p-2 hover:bg-white/10 rounded-full touch-manipulation"
          >
            <ChevronLeft size={24} strokeWidth={2.5} />
          </button>
          
          <div className="flex-1">
            {activeTab === 'community' ? (
              <>
                <h2 className="font-bold text-lg">Samhällschat</h2>
                <p className="text-[#C8D5B9] text-xs">Alla ser detta</p>
              </>
            ) : activeContact ? (
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${
                  activeContact.status === 'online' ? 'bg-green-400' : 'bg-gray-400'
                }`} />
                <div>
                  <h2 className="font-bold text-lg">{activeContact.name}</h2>
                  <p className="text-[#C8D5B9] text-xs">
                    {activeContact.status === 'online' ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          <button className="p-2 hover:bg-white/10 rounded-full touch-manipulation">
            <MoreVertical size={24} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#3D4A2B] border-t-transparent"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageCircle size={64} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Inga meddelanden än</h3>
              <p className="text-gray-600 text-sm">Skicka det första meddelandet!</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const isOwnMessage = message.sender_id === user.id;
              const showAvatar = index === 0 || messages[index - 1].sender_id !== message.sender_id;

              return (
                <div
                  key={message.id}
                  className={`flex gap-2 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {!isOwnMessage && showAvatar && (
                    <div className="w-8 h-8 bg-gradient-to-br from-[#3D4A2B] to-[#5C6B47] rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {message.sender_name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  {!isOwnMessage && !showAvatar && <div className="w-8" />}
                  
                  <div className={`max-w-[75%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                    {!isOwnMessage && showAvatar && (
                      <span className="text-xs font-medium text-gray-600 px-1">
                        {message.sender_name || 'Okänd'}
                      </span>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-2.5 ${
                        message.is_emergency
                          ? 'bg-red-600 text-white'
                          : isOwnMessage
                          ? 'bg-[#3D4A2B] text-white rounded-br-md'
                          : 'bg-white text-gray-900 shadow-md rounded-bl-md'
                      }`}
                    >
                      <p className="text-[15px] leading-relaxed break-words">{message.content}</p>
                    </div>
                    <div className={`flex items-center gap-1 px-1 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                      <span className="text-xs text-gray-500">{formatTimestamp(message.created_at)}</span>
                      {isOwnMessage && message.is_read && (
                        <CheckCircle2 size={14} className="text-blue-500" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-white border-t-2 border-gray-100 p-3 shadow-2xl">
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-gray-100 rounded-3xl px-4 py-2 flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={handleTextareaChange}
              onKeyPress={handleKeyPress}
              placeholder="Meddelande..."
              rows={1}
              className="flex-1 bg-transparent border-none outline-none resize-none text-[15px] max-h-[120px] py-2"
              style={{ minHeight: '24px' }}
            />
            <button className="p-1.5 hover:bg-gray-200 rounded-full touch-manipulation flex-shrink-0">
              <Smile size={22} className="text-gray-500" />
            </button>
          </div>
          
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className={`p-3.5 rounded-full shadow-lg touch-manipulation active:scale-95 transition-all ${
              newMessage.trim() && !sending
                ? 'bg-[#3D4A2B] hover:bg-[#2A331E]'
                : 'bg-gray-300'
            }`}
          >
            <Send 
              size={22} 
              className={`${newMessage.trim() && !sending ? 'text-white' : 'text-gray-500'}`}
              strokeWidth={2.5}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

