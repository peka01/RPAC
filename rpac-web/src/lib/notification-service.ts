/**
 * Notification Service
 * Integrates with existing messaging system to create notifications
 */

import { supabase } from './supabase';
import type { Notification } from '@/components/notification-center';

export interface CreateNotificationParams {
  userId: string;
  type: 'message' | 'resource_request' | 'emergency' | 'system';
  title: string;
  content: string;
  senderName?: string;
  actionUrl?: string;
}

export const notificationService = {
  /**
   * Create a new notification
   */
  async createNotification(params: CreateNotificationParams): Promise<Notification> {
    const { userId, type, title, content, senderName, actionUrl } = params;

    try {
      const { data, error } = await supabase
        .rpc('create_notification', {
          p_user_id: userId,
          p_type: type,
          p_title: title,
          p_content: content,
          p_sender_name: senderName,
          p_action_url: actionUrl
        });

      if (error) {
        console.error('Error creating notification:', error);
        throw error;
      }

      return data;
    } catch (err) {
      console.error('Error creating notification:', err);
      throw err;
    }
  },

  /**
   * Create notification for new message
   */
  async createMessageNotification(params: {
    recipientId: string;
    senderName: string;
    messageContent: string;
    isEmergency?: boolean;
    communityId?: string;
  }): Promise<void> {
    const { recipientId, senderName, messageContent, isEmergency, communityId } = params;

    const title = isEmergency 
      ? `🚨 Nödsituation från ${senderName}`
      : `💬 Nytt meddelande från ${senderName}`;

    const content = messageContent.length > 100 
      ? `${messageContent.substring(0, 100)}...`
      : messageContent;

    const actionUrl = communityId 
      ? `/local?tab=messaging&community=${communityId}`
      : `/local?tab=messaging`;

    await this.createNotification({
      userId: recipientId,
      type: isEmergency ? 'emergency' : 'message',
      title,
      content,
      senderName,
      actionUrl
    });
  },

  /**
   * Create notification for resource request
   */
  async createResourceRequestNotification(params: {
    recipientId: string;
    requesterName: string;
    resourceName: string;
    resourceId: string;
    communityId?: string;
  }): Promise<void> {
    const { recipientId, requesterName, resourceName, resourceId, communityId } = params;

    const actionUrl = communityId 
      ? `/local?tab=resources&community=${communityId}&resource=${resourceId}`
      : `/local?tab=resources&resource=${resourceId}`;

    await this.createNotification({
      userId: recipientId,
      type: 'resource_request',
      title: `📦 Resursförfrågan från ${requesterName}`,
      content: `${requesterName} vill låna din ${resourceName}`,
      senderName: requesterName,
      actionUrl: actionUrl
    });
  },

  /**
   * Create notification for system alert
   */
  async createSystemNotification(params: {
    userId: string;
    title: string;
    content: string;
    actionUrl?: string;
  }): Promise<void> {
    const { userId, title, content, actionUrl } = params;

    await this.createNotification({
      userId,
      type: 'system',
      title: `ℹ️ ${title}`,
      content,
      actionUrl
    });
  },

  /**
   * Get unread notification count for user
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Error getting unread count:', error);
        return 0;
      }

      return data?.length || 0;
    } catch (err) {
      console.error('Error getting unread count:', err);
      return 0;
    }
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        throw error;
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
      throw err;
    }
  },

  /**
   * Mark all notifications as read for user
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        throw error;
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      throw err;
    }
  }
};
