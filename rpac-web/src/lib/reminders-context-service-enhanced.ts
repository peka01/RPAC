'use client';

import { supabase } from './supabase';

export interface CultivationReminder {
  id: string;
  user_id: string;
  plant_id?: string;
  reminder_type: string;
  reminder_date: string;
  reminder_time?: string;
  message: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
  // Enhanced fields (available after migration)
  source_type?: string;
  source_tip_id?: string;
  tip_metadata?: any;
  user_notes?: string;
  completion_notes?: string;
}

export interface RemindersContext {
  pendingReminders: CultivationReminder[];
  overdueReminders: CultivationReminder[];
  completedToday: CultivationReminder[];
  upcomingReminders: CultivationReminder[];
  reminderStats: {
    totalPending: number;
    totalOverdue: number;
    completedThisWeek: number;
    completionRate: number;
  };
}

export class RemindersContextService {
  /**
   * Check if enhanced schema is available
   */
  private static async hasEnhancedSchema(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('cultivation_reminders')
        .select('source_type')
        .limit(1);
      
      return !error && data !== null;
    } catch {
      return false;
    }
  }

  /**
   * Load and format user's reminders data for AI context
   */
  static async getUserRemindersContext(userId: string): Promise<RemindersContext> {
    try {
      const { data: reminders, error } = await supabase
        .from('cultivation_reminders')
        .select('*')
        .eq('user_id', userId)
        .order('reminder_date', { ascending: true });

      if (error) {
        console.error('Error loading reminders:', error);
        throw error;
      }

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Filter reminders by status and date
      const pendingReminders = reminders.filter(r => !r.is_completed);
      const overdueReminders = pendingReminders.filter(r => 
        new Date(r.reminder_date) < now
      );
      const completedToday = reminders.filter(r => 
        r.is_completed && new Date(r.updated_at).toDateString() === today.toDateString()
      );
      const upcomingReminders = pendingReminders.filter(r => {
        const reminderDate = new Date(r.reminder_date);
        return reminderDate >= now && reminderDate <= weekFromNow;
      });

      // Calculate completion rate
      const completedReminders = reminders.filter(r => r.is_completed);
      const completionRate = reminders.length > 0 ? 
        (completedReminders.length / reminders.length) * 100 : 0;

      return {
        pendingReminders,
        overdueReminders,
        completedToday,
        upcomingReminders,
        reminderStats: {
          totalPending: pendingReminders.length,
          totalOverdue: overdueReminders.length,
          completedThisWeek: reminders.filter(r => 
            r.is_completed && new Date(r.updated_at) >= weekAgo
          ).length,
          completionRate: Math.round(completionRate * 10) / 10
        }
      };
    } catch (error) {
      console.error('Error in getUserRemindersContext:', error);
      // Return empty context on error
      return {
        pendingReminders: [],
        overdueReminders: [],
        completedToday: [],
        upcomingReminders: [],
        reminderStats: {
          totalPending: 0,
          totalOverdue: 0,
          completedThisWeek: 0,
          completionRate: 0
        }
      };
    }
  }

  /**
   * Save a daily tip as a reminder (works with both schemas)
   */
  static async saveTipToReminders(
    userId: string, 
    tip: {
      id: string;
      title: string;
      description: string;
      action?: string;
      timeframe?: string;
      priority: string;
      category?: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const hasEnhanced = await this.hasEnhancedSchema();
      
      if (hasEnhanced) {
        // Use enhanced schema with full metadata
        const reminder = {
          user_id: userId,
          reminder_type: 'daily_tip',
          reminder_date: new Date().toISOString(),
          message: tip.title,
          source_type: 'daily_tip',
          source_tip_id: tip.id,
          tip_metadata: {
            description: tip.description,
            action: tip.action,
            timeframe: tip.timeframe,
            priority: tip.priority,
            category: tip.category
          }
        };

        const { error } = await supabase
          .from('cultivation_reminders')
          .insert(reminder);

        if (error) {
          console.error('Error saving tip to reminders (enhanced):', error);
          return { success: false, error: error.message };
        }
      } else {
        // Use basic schema with comprehensive message
        const message = `${tip.title}${tip.description ? ` - ${tip.description}` : ''}${tip.action ? ` (Åtgärd: ${tip.action})` : ''}`;
        
        const reminder = {
          user_id: userId,
          reminder_type: 'daily_tip',
          reminder_date: new Date().toISOString(),
          message: message
        };

        const { error } = await supabase
          .from('cultivation_reminders')
          .insert(reminder);

        if (error) {
          console.error('Error saving tip to reminders (basic):', error);
          return { success: false, error: error.message };
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error in saveTipToReminders:', error);
      return { success: false, error: 'Failed to save tip to reminders' };
    }
  }

  /**
   * Mark a reminder as completed
   */
  static async markReminderCompleted(
    reminderId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('cultivation_reminders')
        .update({ 
          is_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', reminderId);

      if (error) {
        console.error('Error marking reminder as completed:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in markReminderCompleted:', error);
      return { success: false, error: 'Failed to mark reminder as completed' };
    }
  }
}
