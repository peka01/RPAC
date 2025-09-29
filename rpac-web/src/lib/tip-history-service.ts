'use client';

export interface TipHistoryEntry {
  tipId: string;
  title: string;
  shownAt: string;
  savedToReminders: boolean;
  completed: boolean;
}

export class TipHistoryService {
  private static STORAGE_KEY = 'rpac_tip_history';
  private static MAX_HISTORY_DAYS = 30; // Keep history for 30 days

  /**
   * Get tip history from localStorage
   */
  static getTipHistory(): TipHistoryEntry[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      const history = JSON.parse(stored);
      
      // Clean up old entries (older than 30 days)
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.MAX_HISTORY_DAYS);
      
      return history.filter((entry: TipHistoryEntry) => 
        new Date(entry.shownAt) > cutoffDate
      );
    } catch (error) {
      console.error('Error loading tip history:', error);
      return [];
    }
  }

  /**
   * Save tip history to localStorage
   */
  static saveTipHistory(history: TipHistoryEntry[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving tip history:', error);
    }
  }

  /**
   * Add a tip to history when it's shown
   */
  static addTipToHistory(tip: { id: string; title: string }): void {
    const history = this.getTipHistory();
    
    // Check if tip already exists in history
    const existingIndex = history.findIndex(entry => entry.tipId === tip.id);
    
    if (existingIndex >= 0) {
      // Update existing entry
      history[existingIndex] = {
        ...history[existingIndex],
        shownAt: new Date().toISOString()
      };
    } else {
      // Add new entry
      history.push({
        tipId: tip.id,
        title: tip.title,
        shownAt: new Date().toISOString(),
        savedToReminders: false,
        completed: false
      });
    }
    
    this.saveTipHistory(history);
  }

  /**
   * Mark a tip as saved to reminders
   */
  static markTipAsSaved(tipId: string): void {
    const history = this.getTipHistory();
    const entry = history.find(entry => entry.tipId === tipId);
    
    if (entry) {
      entry.savedToReminders = true;
      this.saveTipHistory(history);
    }
  }

  /**
   * Mark a tip as completed
   */
  static markTipAsCompleted(tipId: string): void {
    const history = this.getTipHistory();
    const entry = history.find(entry => entry.tipId === tipId);
    
    if (entry) {
      entry.completed = true;
      this.saveTipHistory(history);
    }
  }

  /**
   * Get recently shown tips (to avoid duplicates)
   */
  static getRecentlyShownTips(days: number = 7): string[] {
    const history = this.getTipHistory();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return history
      .filter(entry => new Date(entry.shownAt) > cutoffDate)
      .map(entry => entry.title);
  }

  /**
   * Get tips that have been saved to reminders
   */
  static getSavedToRemindersTips(): string[] {
    const history = this.getTipHistory();
    return history
      .filter(entry => entry.savedToReminders)
      .map(entry => entry.title);
  }

  /**
   * Get completed tips
   */
  static getCompletedTips(): string[] {
    const history = this.getTipHistory();
    return history
      .filter(entry => entry.completed)
      .map(entry => entry.title);
  }

  /**
   * Clear old history (cleanup)
   */
  static clearOldHistory(): void {
    const history = this.getTipHistory();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.MAX_HISTORY_DAYS);
    
    const filteredHistory = history.filter(entry => 
      new Date(entry.shownAt) > cutoffDate
    );
    
    this.saveTipHistory(filteredHistory);
  }
}
