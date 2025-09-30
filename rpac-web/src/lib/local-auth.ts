// Simple local authentication system
// This works immediately without any external dependencies

import { SecureStorage, StorageMigration } from './secure-storage';

interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

class LocalAuth {
  private currentUser: User | null = null;
  private listeners: ((user: User | null) => void)[] = [];

  constructor() {
    // Check if migration is needed and perform it
    if (typeof window !== 'undefined' && StorageMigration.needsMigration()) {
      StorageMigration.migrateToEncrypted();
    }
    
    // Load user from secure storage on init
    this.loadUser();
  }

  private loadUser() {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      const savedUser = SecureStorage.getItem<User>('rpac-user');
      if (savedUser) {
        this.currentUser = savedUser;
      }
    }
  }

  private saveUser(user: User | null) {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      if (user) {
        SecureStorage.setItem('rpac-user', user);
      } else {
        SecureStorage.removeItem('rpac-user');
      }
    }
    this.currentUser = user;
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentUser));
  }

  async signUp(email: string, password: string, name: string): Promise<User> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
    
    // Validate password strength
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
    
    // Validate name
    if (!name || name.trim().length < 2) {
      throw new Error('Name must be at least 2 characters long');
    }
    
    // Check if user already exists (in a real app, this would check the database)
    const existingUser = this.getCurrentUser();
    if (existingUser && existingUser.email === email) {
      throw new Error('User with this email already exists');
    }
    
    const user: User = {
      id: Date.now().toString(),
      email,
      name: name.trim(),
      created_at: new Date().toISOString()
    };

    this.saveUser(user);
    return user;
  }

  async signIn(email: string, password: string): Promise<User> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
    
    // Validate password strength
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
    
    // Demo users with proper authentication
    const demoUsers: Record<string, string> = {
      'demo@rpac.se': 'demo123456',
      'test@rpac.se': 'test123456',
      'admin@rpac.se': 'admin123456'
    };
    
    // Check credentials
    if (!demoUsers[email] || demoUsers[email] !== password) {
      throw new Error('Invalid email or password');
    }
    
    console.log('Successful sign in for:', email);
    const user: User = {
      id: Date.now().toString(),
      email,
      name: email.split('@')[0],
      created_at: new Date().toISOString()
    };

    this.saveUser(user);
    return user;
  }

  async signOut(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200));
    this.saveUser(null);
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  onAuthStateChange(callback: (user: User | null) => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
}

export const localAuth = new LocalAuth();
