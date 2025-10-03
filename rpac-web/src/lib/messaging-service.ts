/**
 * Messaging Service
 * Real-time messaging system with Supabase integration for RPAC
 */

import { supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface Message {
  id: string;
  sender_id: string;
  sender_name?: string;
  recipient_id?: string; // För direktmeddelanden
  community_id?: string; // För community-meddelanden
  content: string;
  message_type: 'text' | 'emergency' | 'system' | 'radio_relay';
  priority?: 'low' | 'medium' | 'high' | 'emergency';
  is_emergency?: boolean;
  is_read?: boolean;
  read_at?: string;
  created_at: string;
  metadata?: {
    radio_frequency?: string;
    emergency_type?: string;
    location?: string;
  };
}

export interface Contact {
  id: string;
  name: string;
  email?: string;
  status?: 'online' | 'offline' | 'away';
  last_seen?: string;
  community_id?: string;
  role?: 'admin' | 'moderator' | 'member' | 'coordinator' | 'emergency_contact';
}

export interface UserPresence {
  user_id: string;
  status: 'online' | 'offline' | 'away';
  last_seen: string;
}

export const messagingService = {
  /**
   * Get messages for a specific conversation (direct or community)
   */
  async getMessages(params: {
    userId: string;
    recipientId?: string;
    communityId?: string;
    limit?: number;
  }): Promise<Message[]> {
    const { userId, recipientId, communityId, limit = 100 } = params;
    
    let query = supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(limit);
    
    if (recipientId) {
      // Direct messages between two users (NOT community messages)
      // Must have receiver_id set and community_id NULL or not relevant to community
      query = query
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${userId})`)
        .not('receiver_id', 'is', null); // Ensure it's actually a direct message
      console.log('🔍 QUERY TYPE: DIRECT MESSAGE between', userId, 'and', recipientId);
    } else if (communityId) {
      // Community messages (NOT direct messages)
      // Must have community_id set and receiver_id NULL
      query = query.eq('community_id', communityId).is('receiver_id', null);
      console.log('🔍 QUERY TYPE: COMMUNITY MESSAGE for community', communityId);
    }
    
    console.log('📥 Fetching messages with params:', { userId, recipientId, communityId, limit });
    
    const { data, error } = await query;
    
    console.log('📬 Messages fetched:', data?.length || 0, 'messages');
    console.log('📬 Messages data:', data);
    console.log('❌ Error (if any):', error);
    
    if (error) throw error;
    return (data || []).map(msg => this.formatMessage(msg));
  },

  /**
   * Send a new message
   */
  async sendMessage(params: {
    senderId: string;
    senderName: string;
    content: string;
    recipientId?: string;
    communityId?: string;
    messageType?: Message['message_type'];
    isEmergency?: boolean;
    metadata?: Message['metadata'];
  }): Promise<Message> {
    const {
      senderId,
      senderName,
      content,
      recipientId,
      communityId,
      messageType = 'text',
      isEmergency = false,
      metadata
    } = params;
    
    const messageData: any = {
      sender_id: senderId,
      content,
      message_type: messageType,
      is_emergency: isEmergency,
      is_read: false
    };
    
    // CRITICAL: A message must be EITHER direct OR community, NEVER both
    if (recipientId) {
      messageData.receiver_id = recipientId;
      // Do NOT set community_id for direct messages
      console.log('📤 Sending DIRECT message to user:', recipientId);
    } else if (communityId) {
      messageData.community_id = communityId;
      // Do NOT set receiver_id for community messages
      console.log('📤 Sending COMMUNITY message to:', communityId);
    } else {
      throw new Error('Message must have either recipientId or communityId');
    }
    
    // Store sender name in metadata if needed for display
    if (!messageData.metadata) {
      messageData.metadata = {};
    }
    if (senderName) {
      messageData.metadata.sender_name = senderName;
    }
    if (metadata) {
      messageData.metadata = { ...messageData.metadata, ...metadata };
    }
    
    console.log('📤 Sending message with data:', {
      ...messageData,
      has_receiver_id: !!messageData.receiver_id,
      has_community_id: !!messageData.community_id,
      type: messageData.receiver_id ? 'DIRECT' : 'COMMUNITY'
    });
    
    const { data, error } = await supabase
      .from('messages')
      .insert([messageData])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error sending message:', error);
    } else {
      console.log('✅ Message sent successfully:', {
        id: data.id,
        has_receiver_id: !!data.receiver_id,
        has_community_id: !!data.community_id,
        type: data.receiver_id ? 'DIRECT' : 'COMMUNITY'
      });
    }
    
    if (error) throw error;
    return this.formatMessage(data);
  },

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', messageId);
    
    if (error) throw error;
  },

  /**
   * Mark all messages in a conversation as read
   */
  async markConversationAsRead(userId: string, recipientId?: string, communityId?: string): Promise<void> {
    let query = supabase
      .from('messages')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('is_read', false);
    
    if (recipientId) {
      // Mark direct messages from recipient
      query = query.eq('sender_id', recipientId).eq('receiver_id', userId);
    } else if (communityId) {
      // Mark community messages not from current user
      query = query.eq('community_id', communityId).neq('sender_id', userId);
    }
    
    const { error } = await query;
    if (error) throw error;
  },

  /**
   * Get unread message count
   */
  async getUnreadCount(userId: string, communityId?: string): Promise<number> {
    let query = supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('is_read', false);
    
    if (communityId) {
      query = query.eq('community_id', communityId).neq('sender_id', userId);
    } else {
      query = query.eq('receiver_id', userId);
    }
    
    const { count, error } = await query;
    
    if (error) throw error;
    return count || 0;
  },

  /**
   * Get recent conversations (list of people/communities user has messaged with)
   */
  async getRecentConversations(userId: string): Promise<any[]> {
    // Get recent direct messages
    const { data: directMessages, error: dmError } = await supabase
      .from('messages')
      .select('sender_id, receiver_id, created_at, is_read')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (dmError) throw dmError;
    
    // Get recent community messages
    const { data: communityMessages, error: cmError } = await supabase
      .from('messages')
      .select('community_id, created_at, is_read')
      .not('community_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (cmError) throw cmError;
    
    // Process and deduplicate conversations
    const conversations: Map<string, any> = new Map();
    
    // Process direct messages
    directMessages?.forEach(msg => {
      const otherId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
      if (!conversations.has(otherId)) {
        conversations.set(otherId, {
          type: 'direct',
          id: otherId,
          lastMessageAt: msg.created_at,
          hasUnread: !msg.is_read && msg.receiver_id === userId
        });
      }
    });
    
    // Process community messages
    communityMessages?.forEach(msg => {
      const key = `community_${msg.community_id}`;
      if (!conversations.has(key)) {
        conversations.set(key, {
          type: 'community',
          id: msg.community_id,
          lastMessageAt: msg.created_at,
          hasUnread: !msg.is_read
        });
      }
    });
    
    return Array.from(conversations.values())
      .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
  },

  /**
   * Subscribe to new messages in real-time
   */
  subscribeToMessages(params: {
    userId: string;
    recipientId?: string;
    communityId?: string;
    onMessage: (message: Message) => void;
    onError?: (error: Error) => void;
  }): RealtimeChannel {
    const { userId, recipientId, communityId, onMessage, onError } = params;
    
    const channelName = recipientId 
      ? `messages:${userId}:${recipientId}`
      : communityId
      ? `messages:community:${communityId}`
      : `messages:${userId}`;
    
    console.log('🔔 Setting up realtime subscription:', {
      channelName,
      userId,
      recipientId,
      communityId
    });
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: recipientId
            ? `receiver_id=eq.${userId}`
            : communityId
            ? `community_id=eq.${communityId}&receiver_id=is.null`
            : `receiver_id=eq.${userId}`
        },
        (payload) => {
          console.log('🔔 Realtime message received!', payload);
          try {
            const message = this.formatMessage(payload.new);
            console.log('🔔 Formatted message:', message);
            onMessage(message);
          } catch (error) {
            console.error('🔔 Error formatting realtime message:', error);
            if (onError) {
              onError(error as Error);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('🔔 Subscription status:', status);
      });
    
    return channel;
  },

  /**
   * Update user presence status
   */
  async updatePresence(userId: string, status: UserPresence['status']): Promise<void> {
    // This could be stored in a separate presence table or in user metadata
    const { error } = await supabase
      .from('user_presence')
      .upsert({
        user_id: userId,
        status,
        last_seen: new Date().toISOString()
      });
    
    if (error) {
      // If table doesn't exist yet, just log it
      console.warn('Presence update failed (table may not exist yet):', error);
    }
  },

  /**
   * Get online users in a community
   */
  async getOnlineUsers(communityId: string): Promise<Contact[]> {
    // Get community members
    const { data: memberships, error: membershipsError } = await supabase
      .from('community_memberships')
      .select('user_id, role')
      .eq('community_id', communityId);
    
    if (membershipsError) throw membershipsError;
    if (!memberships || memberships.length === 0) return [];
    
    // Get user profiles for these members
    const userIds = memberships.map(m => m.user_id);
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('user_id, display_name, first_name, last_name, name_display_preference, avatar_url')
      .in('user_id', userIds);
    
    if (profilesError) {
      console.warn('Could not fetch user profiles:', profilesError);
      // Continue without profiles rather than failing completely
    }
    
    // Check presence
    const { data: presenceData } = await supabase
      .from('user_presence')
      .select('*')
      .in('user_id', userIds)
      .gte('last_seen', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // Active in last 5 minutes
    
    // Format contacts with display names from user_profiles based on privacy preference
    return memberships.map((membership: any, index: number) => {
      const presence = presenceData?.find(p => p.user_id === membership.user_id);
      const profile = profiles?.find(p => p.user_id === membership.user_id);
      
      // Determine display name based on user's privacy preference
      let userName = 'Medlem';
      
      // If no profile or empty display_name, use numbered fallback
      if (!profile || !profile.display_name || profile.display_name.trim() === '') {
        userName = `Medlem ${index + 1}`;
      } else {
        const preference = profile.name_display_preference || 'display_name';
        
        switch (preference) {
          case 'display_name':
            userName = profile.display_name.trim() || `Medlem ${index + 1}`;
            break;
          case 'first_last':
            if (profile.first_name && profile.last_name) {
              userName = `${profile.first_name} ${profile.last_name}`;
            } else {
              userName = profile.display_name.trim() || `Medlem ${index + 1}`;
            }
            break;
          case 'initials':
            if (profile.first_name && profile.last_name) {
              userName = `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
            } else if (profile.display_name && profile.display_name.trim()) {
              userName = profile.display_name.trim().substring(0, 2).toUpperCase();
            } else {
              userName = 'M';
            }
            break;
          case 'email':
            userName = profile.display_name.trim() || `Medlem ${index + 1}`;
            break;
          default:
            userName = profile.display_name.trim() || `Medlem ${index + 1}`;
        }
      }
      
      return {
        id: membership.user_id,
        name: userName,
        email: undefined,
        status: presence ? 'online' : 'offline',
        community_id: communityId,
        role: membership.role as Contact['role']
      };
    });
  },

  /**
   * Delete a message (sender only)
   */
  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)
      .eq('sender_id', userId); // Only sender can delete
    
    if (error) throw error;
  },

  /**
   * Format message from database to interface
   */
  formatMessage(dbMessage: any): Message {
    return {
      id: dbMessage.id,
      sender_id: dbMessage.sender_id,
      sender_name: dbMessage.metadata?.sender_name || 'Okänd användare',
      recipient_id: dbMessage.receiver_id,
      community_id: dbMessage.community_id,
      content: dbMessage.content,
      message_type: dbMessage.message_type || 'text',
      priority: dbMessage.is_emergency ? 'emergency' : 'medium',
      is_emergency: dbMessage.is_emergency || false,
      is_read: dbMessage.is_read || false,
      read_at: dbMessage.read_at,
      created_at: dbMessage.created_at,
      metadata: dbMessage.metadata
    };
  },

  /**
   * Search messages
   */
  async searchMessages(params: {
    userId: string;
    query: string;
    communityId?: string;
    limit?: number;
  }): Promise<Message[]> {
    const { userId, query, communityId, limit = 50 } = params;
    
    let dbQuery = supabase
      .from('messages')
      .select('*')
      .ilike('content', `%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (communityId) {
      dbQuery = dbQuery.eq('community_id', communityId);
    } else {
      dbQuery = dbQuery.or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
    }
    
    const { data, error } = await dbQuery;
    
    if (error) throw error;
    return (data || []).map(msg => this.formatMessage(msg));
  }
};

