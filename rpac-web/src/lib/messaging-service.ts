/**
 * Messaging Service
 * Real-time messaging system with Supabase integration for RPAC
 */

import { supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { notificationService } from './notification-service';

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
    } else if (communityId) {
      // Community messages (NOT direct messages)
      // Must have community_id set and receiver_id NULL
      query = query.eq('community_id', communityId).is('receiver_id', null);
    }
    
    const { data, error } = await query;
    
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
    } else if (communityId) {
      messageData.community_id = communityId;
      // Do NOT set receiver_id for community messages
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
    
    const { data, error } = await supabase
      .from('messages')
      .insert([messageData])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error sending message:', error);
    } else {
      // Create notification for recipient
      try {
        if (recipientId) {
          // Direct message notification - include senderId so notification links to the conversation
          await notificationService.createMessageNotification({
            recipientId,
            senderName: senderName,
            senderId: senderId, // Pass sender ID for direct message link
            messageContent: content,
            isEmergency: isEmergency
          });
        } else if (communityId) {
          // Community message - get all community members and create notifications
          const { data: members } = await supabase
            .from('community_memberships')
            .select('user_id')
            .eq('community_id', communityId)
            .neq('user_id', senderId); // Don't notify sender

          if (members) {
            for (const member of members) {
              await notificationService.createMessageNotification({
                recipientId: member.user_id,
                senderName: senderName,
                messageContent: content,
                isEmergency: isEmergency,
                communityId: communityId
              });
            }
          }
        }
      } catch (notificationError) {
        console.error('Error creating notification:', notificationError);
        // Don't fail the message send if notification creation fails
      }
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
          try {
            const message = this.formatMessage(payload.new);
            onMessage(message);
          } catch (error) {
            console.error('🔔 Error formatting realtime message:', error);
            if (onError) {
              onError(error as Error);
            }
          }
        }
      )
      .subscribe();
    
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
    // Get community members - include emails from the join
    // We need to use a database function or RPC to get emails since auth.users is not directly accessible
    const { data: memberData, error: membershipsError } = await supabase
      .rpc('get_community_members_with_emails', { p_community_id: communityId });
    
    if (membershipsError) {
      console.warn('RPC call failed, falling back to basic query:', membershipsError);
      // Fallback to basic query without emails
      const { data: memberships, error: fallbackError } = await supabase
        .from('community_memberships')
        .select('user_id, role')
        .eq('community_id', communityId);
      
      if (fallbackError) throw fallbackError;
      if (!memberships || memberships.length === 0) return [];
      
      // Get user profiles
      const userIds = memberships.map(m => m.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, first_name, last_name, name_display_preference, avatar_url')
        .in('user_id', userIds);
      
      if (profilesError) {
        console.warn('Could not fetch user profiles:', profilesError);
      }
      
      // Check presence
      const { data: presenceData } = await supabase
        .from('user_presence')
        .select('*')
        .in('user_id', userIds)
        .gte('last_seen', new Date(Date.now() - 5 * 60 * 1000).toISOString());
      
      // Format contacts with display names from user_profiles
      return memberships.map((membership: any, index: number) => {
        const presence = presenceData?.find(p => p.user_id === membership.user_id);
        const profile = profiles?.find(p => p.user_id === membership.user_id);
        
        let userName = 'Medlem';
        
        if (!profile) {
          userName = `Medlem ${index + 1}`;
        } else if (!profile.display_name || profile.display_name.trim() === '') {
          userName = `Medlem ${index + 1}`;
        } else {
          // Use display_name directly (it should be properly set now)
          userName = profile.display_name.trim();
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
    }
    
    if (!memberData || memberData.length === 0) return [];
    
    const userIds = memberData.map((m: any) => m.user_id);
    
    // Check presence
    const { data: presenceData } = await supabase
      .from('user_presence')
      .select('*')
      .in('user_id', userIds)
      .gte('last_seen', new Date(Date.now() - 5 * 60 * 1000).toISOString());
    
    // Format contacts with emails from RPC
    return memberData.map((member: any, index: number) => {
      const presence = presenceData?.find(p => p.user_id === member.user_id);
      const userEmail = member.email;
      
      // Determine display name
      let userName = 'Medlem';
      
      if (!member.display_name || member.display_name.trim() === '') {
        // Fallback to email (username part only) or numbered fallback
        if (userEmail) {
          userName = userEmail.split('@')[0];
        } else {
          userName = `Medlem ${index + 1}`;
        }
      } else {
        const preference = member.name_display_preference || 'display_name';
        
        switch (preference) {
          case 'display_name':
            userName = member.display_name.trim() || (userEmail ? userEmail.split('@')[0] : `Medlem ${index + 1}`);
            break;
          case 'first_last':
            if (member.first_name && member.last_name) {
              userName = `${member.first_name} ${member.last_name}`;
            } else {
              userName = member.display_name.trim() || (userEmail ? userEmail.split('@')[0] : `Medlem ${index + 1}`);
            }
            break;
          case 'initials':
            if (member.first_name && member.last_name) {
              userName = `${member.first_name[0]}${member.last_name[0]}`.toUpperCase();
            } else if (member.display_name && member.display_name.trim()) {
              userName = member.display_name.trim().substring(0, 2).toUpperCase();
            } else {
              userName = 'M';
            }
            break;
          case 'email':
            userName = member.display_name.trim() || (userEmail ? userEmail.split('@')[0] : `Medlem ${index + 1}`);
            break;
          default:
            userName = member.display_name.trim() || (userEmail ? userEmail.split('@')[0] : `Medlem ${index + 1}`);
        }
      }
      
      return {
        id: member.user_id,
        name: userName,
        email: userEmail,
        status: presence ? 'online' : 'offline',
        community_id: communityId,
        role: member.role as Contact['role']
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

