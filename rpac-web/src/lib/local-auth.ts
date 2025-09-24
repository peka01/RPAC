// Simple local authentication system
// This works immediately without any external dependencies

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
    // Load user from localStorage on init
    this.loadUser();
  }

  private loadUser() {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedUser = localStorage.getItem('rpac-user');
      if (savedUser) {
        this.currentUser = JSON.parse(savedUser);
      }
    }
  }

  private saveUser(user: User | null) {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined' && window.localStorage) {
      if (user) {
        localStorage.setItem('rpac-user', JSON.stringify(user));
      } else {
        localStorage.removeItem('rpac-user');
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
    
    const user: User = {
      id: Date.now().toString(),
      email,
      name,
      created_at: new Date().toISOString()
    };

    this.saveUser(user);
    return user;
  }

  async signIn(email: string, _password: string): Promise<User> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // For demo purposes, accept any email/password
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
