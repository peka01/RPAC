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
  WifiOff
} from 'lucide-react';
import { t } from '@/lib/locales';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  recipient_id?: string; // För direktmeddelanden
  community_id?: string; // För community-meddelanden
  content: string;
  message_type: 'text' | 'emergency' | 'system' | 'radio_relay';
  priority: 'low' | 'medium' | 'high' | 'emergency';
  created_at: string;
  read_at?: string;
  metadata?: {
    radio_frequency?: string;
    emergency_type?: string;
    location?: string;
  };
}

interface Contact {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'away';
  last_seen?: string;
  community_id?: string;
  role?: 'member' | 'coordinator' | 'emergency_contact';
}

interface MessagingSystemProps {
  user: User;
  communityId?: string;
}

export function MessagingSystem({ user, communityId }: MessagingSystemProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'direct' | 'community' | 'emergency' | 'radio'>('community');
  const [isConnected, setIsConnected] = useState(true);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Simulera real-time meddelanden (i produktion: Supabase Realtime)
  useEffect(() => {
    // Demo-data för utveckling
    const demoContacts: Contact[] = [
      {
        id: 'user-1',
        name: 'Anna Andersson',
        status: 'online',
        community_id: communityId,
        role: 'coordinator'
      },
      {
        id: 'user-2', 
        name: 'Erik Eriksson',
        status: 'offline',
        last_seen: new Date(Date.now() - 3600000).toISOString(),
        community_id: communityId,
        role: 'member'
      },
      {
        id: 'emergency-center',
        name: 'Kriscentral Stockholms län',
        status: 'online',
        role: 'emergency_contact'
      }
    ];

    const demoMessages: Message[] = [
      {
        id: 'msg-1',
        sender_id: 'user-1',
        sender_name: 'Anna Andersson',
        community_id: communityId,
        content: 'Hej alla! Har någon extra batterier? Strömmen gick precis.',
        message_type: 'text',
        priority: 'medium',
        created_at: new Date(Date.now() - 1800000).toISOString()
      },
      {
        id: 'msg-2',
        sender_id: 'emergency-center',
        sender_name: 'Kriscentral',
        community_id: communityId,
        content: t('emergency.important_power_outage'),
        message_type: 'emergency',
        priority: 'emergency',
        created_at: new Date(Date.now() - 900000).toISOString()
      }
    ];

    setContacts(demoContacts);
    setMessages(demoMessages);

    // Simulera Supabase Realtime prenumeration
    const messageSubscription = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        const newMessage = payload.new as Message;
        setMessages(prev => [...prev, newMessage]);
      })
      .subscribe();

    return () => {
      messageSubscription.unsubscribe();
    };
  }, [communityId]);

  // Auto-scroll till senaste meddelande within component only
  useEffect(() => {
    // Only auto-scroll if we have messages and this isn't the initial load
    if (messages.length > 0 && messagesEndRef.current) {
      // Only scroll within the messages container, not the whole page
      const messagesContainer = messagesEndRef.current.closest('.messages-container');
      if (messagesContainer) {
        // Use a small delay to ensure DOM is ready and avoid initial page scroll
        setTimeout(() => {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 100);
      }
    }
  }, [messages]);

  const sendMessage = async (type: Message['message_type'] = 'text', priority: Message['priority'] = 'medium') => {
    if (!newMessage.trim() && type === 'text') return;

    const message: Message = {
      id: `msg-${Date.now()}`,
      sender_id: user.id,
      sender_name: user.user_metadata?.name || 'Användare',
      content: type === 'emergency' ? 
        `🚨 NÖDMEDDELANDE: ${newMessage}` : 
        newMessage,
      message_type: type,
      priority: priority,
      created_at: new Date().toISOString(),
      ...(activeContact ? 
        { recipient_id: activeContact.id } : 
        { community_id: communityId }
      )
    };

    // I produktion: skicka till Supabase
    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Simulera auto-svar för demo
    if (activeContact && type !== 'emergency') {
      setTimeout(() => {
        const response: Message = {
          id: `msg-${Date.now()}-response`,
          sender_id: activeContact.id,
          sender_name: activeContact.name,
          recipient_id: user.id,
          content: 'Meddelande mottaget! Jag svarar så snart jag kan.',
          message_type: 'text',
          priority: 'low',
          created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, response]);
      }, 2000);
    }
  };

  const sendEmergencyMessage = () => {
    setEmergencyMode(true);
    sendMessage('emergency', 'emergency');
    setTimeout(() => setEmergencyMode(false), 5000);
  };

  const getMessageStyle = (message: Message) => {
    const isOwn = message.sender_id === user.id;
    const baseStyle = `max-w-xs lg:max-w-md px-4 py-2 rounded-lg break-words ${
      isOwn ? 'ml-auto' : 'mr-auto'
    }`;

    switch (message.priority) {
      case 'emergency':
        return `${baseStyle} bg-red-600 text-white border-2 border-red-800`;
      case 'high':
        return `${baseStyle} ${isOwn ? 'bg-orange-600 text-white' : 'bg-orange-100 text-orange-900'}`;
      case 'medium':
        return `${baseStyle} ${isOwn ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`;
      default:
        return `${baseStyle} ${isOwn ? 'bg-gray-600 text-white' : 'bg-white text-gray-900'}`;
    }
  };

  const filteredMessages = messages.filter(msg => {
    if (activeTab === 'direct' && activeContact) {
      return (msg.sender_id === activeContact.id && msg.recipient_id === user.id) ||
             (msg.sender_id === user.id && msg.recipient_id === activeContact.id);
    }
    if (activeTab === 'community') {
      return msg.community_id === communityId;
    }
    if (activeTab === 'emergency') {
      return msg.priority === 'emergency' || msg.message_type === 'emergency';
    }
    if (activeTab === 'radio') {
      return msg.message_type === 'radio_relay';
    }
    return true;
  });

  return (
    <div className="bg-white/95 rounded-xl border shadow-lg flex flex-col resize-y overflow-auto" style={{ 
      backgroundColor: 'var(--bg-card)',
      borderColor: 'var(--color-cool-olive)',
      minHeight: '500px',
      height: '600px',
      maxHeight: '800px'
    }}>
      {/* Professional Communication Header */}
      <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--color-muted-light)' }}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm" style={{ 
            background: 'linear-gradient(135deg, var(--color-cool-olive) 0%, var(--color-tertiary) 100%)' 
          }}>
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {t('professional.tactical_communication')}
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{t('professional.secure_messaging')}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Professional Connection Status */}
          <div className="flex items-center space-x-2 px-2 py-1 rounded text-xs font-semibold" style={{
            backgroundColor: isConnected ? 'var(--bg-olive-light)' : 'rgba(139, 69, 19, 0.1)',
            color: isConnected ? 'var(--color-cool-olive)' : 'var(--color-danger)'
          }}>
            {isConnected ? (
              <>
                <Wifi className="w-3 h-3" />
                <span>{t('status_indicators.online')}</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3" />
                <span>{t('status_indicators.offline')}</span>
              </>
            )}
          </div>

          {/* Emergency Protocol Button */}
          <button
            onClick={sendEmergencyMessage}
            disabled={emergencyMode}
            className={`p-2 rounded-lg transition-all duration-300 border ${
              emergencyMode ? 'animate-pulse' : 'hover:scale-110'
            }`}
            style={{ 
              backgroundColor: emergencyMode ? 'var(--color-danger)' : 'rgba(139, 69, 19, 0.1)',
              borderColor: 'var(--color-danger)',
              color: 'var(--color-danger)'
            }}
            title={t('buttons.activate_emergency')}
          >
            <AlertTriangle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Professional Tab Navigation */}
      <div className="flex border-b" style={{ borderColor: 'var(--color-muted-light)' }}>
        {[
          { id: 'community', label: t('military_terms.network'), icon: Users, category: t('military_terms.local') },
          { id: 'direct', label: t('military_terms.direct'), icon: MessageCircle, category: 'P2P' },
          { id: 'emergency', label: t('military_terms.crisis_mode'), icon: AlertTriangle, category: t('military_terms.emrg') },
          { id: 'radio', label: t('military_terms.radio'), icon: Radio, category: t('military_terms.rf') }
        ].map(({ id, label, icon: Icon, category }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex-1 flex flex-col items-center justify-center py-3 px-2 text-sm transition-all duration-300 ${
                isActive ? 'border-b-2' : ''
              }`}
              style={{
                borderBottomColor: isActive ? 'var(--color-primary)' : 'transparent',
                backgroundColor: isActive ? 'var(--bg-olive-light)' : 'transparent',
                color: isActive ? 'var(--color-primary)' : 'var(--text-secondary)'
              }}
            >
              <Icon className="w-4 h-4 mb-1" />
              <span className="text-xs font-bold">{label}</span>
              <span className="text-xs opacity-70">{category}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Kontaktlista (endast för direktmeddelanden) */}
        {activeTab === 'direct' && (
          <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            <div className="p-2 space-y-1">
              {contacts.map(contact => (
                <button
                  key={contact.id}
                  onClick={() => setActiveContact(contact)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    activeContact?.id === contact.id
                      ? 'bg-blue-100 dark:bg-blue-900/50'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      contact.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {contact.name}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {contact.role === 'coordinator' ? 'Koordinator' : 
                         contact.role === 'emergency_contact' ? 'Krishjälp' : 'Medlem'}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Meddelandeområde */}
        <div className="flex-1 flex flex-col">
          {/* Meddelanden */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 messages-container">
            {filteredMessages.map(message => (
              <div key={message.id} className="flex flex-col">
                <div className={getMessageStyle(message)}>
                  {/* Metainformation */}
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs opacity-75">
                      {message.sender_name}
                    </span>
                    <div className="flex items-center space-x-1">
                      {message.priority === 'emergency' && (
                        <AlertTriangle className="w-3 h-3" />
                      )}
                      <span className="text-xs opacity-75">
                        {new Date(message.created_at).toLocaleTimeString('sv-SE', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                  
                  {/* Meddelandeinnehåll */}
                  <p className="text-sm">{message.content}</p>
                  
                  {/* Radio-metadata */}
                  {message.message_type === 'radio_relay' && message.metadata?.radio_frequency && (
                    <div className="mt-1 text-xs opacity-75 flex items-center space-x-1">
                      <Radio className="w-3 h-3" />
                      <span>Frekvens: {message.metadata.radio_frequency}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Meddelandeinmatning */}
          {(activeTab !== 'radio' || isConnected) && (
            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder={
                    activeTab === 'emergency' ? 'Beskriv nödsituationen...' :
                    activeTab === 'radio' ? 'Radio-meddelande (endast vid nöd)...' :
                    'Skriv meddelande...'
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
                  disabled={emergencyMode}
                />
                
                <button
                  onClick={() => sendMessage()}
                  disabled={!newMessage.trim() || emergencyMode}
                  className="crisis-button p-2"
                  style={{ backgroundColor: 'var(--color-crisis-blue)', color: 'white' }}
                >
                  <Send className="w-4 h-4" />
                </button>

                {activeTab === 'direct' && activeContact && (
                  <div className="flex space-x-1">
                    <button
                      className="crisis-button p-2"
                      style={{ backgroundColor: 'var(--color-crisis-green)', color: 'white' }}
                      title={t('buttons.call')}
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                    <button
                      className="crisis-button p-2"
                      style={{ backgroundColor: 'var(--color-crisis-blue)', color: 'white' }}
                      title={t('buttons.video_call')}
                    >
                      <Video className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Emergency info */}
              {emergencyMode && (
                <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                  <p className="text-xs text-red-800 dark:text-red-200 flex items-center space-x-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>{t('emergency.emergency_sent_to_all')}</span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Radio-offline meddelande */}
          {activeTab === 'radio' && !isConnected && (
            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="text-center text-gray-500">
                <Radio className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Radio-kommunikation är för närvarande inte tillgänglig</p>
                <p className="text-xs mt-1">Kontrollera antennanslutning och frekvens</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
