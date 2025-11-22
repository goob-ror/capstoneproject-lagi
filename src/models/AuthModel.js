import sessionManager from '../services/sessionManager';

class AuthModel {
  constructor() {
    this.baseURL = '/api/auth';
  }

  async login(username, password) {
    // Check if offline first
    if (!sessionManager.checkOnlineStatus()) {
      return await this.offlineLogin(username, password);
    }

    try {
      const response = await fetch(`${this.baseURL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      return data;
    } catch (error) {
      // If network error, try offline login
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return await this.offlineLogin(username, password);
      }
      throw error;
    }
  }

  async offlineLogin(username, password) {
    try {
      // Use sessionManager to get offline session (read-only)
      const session = await sessionManager.getOfflineSession();
      
      if (!session) {
        throw new Error('No cached session found. Please connect to the internet to log in.');
      }

      // Validate username matches
      if (session.username !== username) {
        throw new Error('Invalid credentials. Please connect to the internet to log in with a different account.');
      }

      // Simple password validation using stored hash
      const passwordHash = await this.hashPassword(password);
      if (session.passwordHash && session.passwordHash !== passwordHash) {
        throw new Error('Invalid password.');
      }

      console.log('✓ Offline login successful');
      
      return {
        message: 'Logged in offline with cached session',
        token: session.token,
        user: session.user,
        offline: true
      };
    } catch (error) {
      console.error('Offline login failed:', error);
      throw error;
    }
  }

  // Simple password hashing for offline validation
  async hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async register(userData) {
    try {
      const response = await fetch(`${this.baseURL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      return data;
    } catch (error) {
      // If offline, show error - registration requires online connection
      if (!navigator.onLine) {
        throw new Error('Registration requires an internet connection. Please try again when online.');
      }
      throw error;
    }
  }

  // Save token to localStorage only (IndexedDB session managed separately)
  async saveToken(token) {
    localStorage.setItem('token', token);
  }

  getToken() {
    return localStorage.getItem('token');
  }

  async removeToken() {
    localStorage.removeItem('token');
    try {
      await sessionManager.clearSession();
    } catch (error) {
      console.error('Error removing token from IndexedDB:', error);
    }
  }

  // Save user to localStorage only (IndexedDB session managed separately)
  async saveUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
  }

  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  async removeUser() {
    localStorage.removeItem('user');
    try {
      await sessionManager.clearSession();
    } catch (error) {
      console.error('Error removing user from IndexedDB:', error);
    }
  }

  async isAuthenticated() {
    const token = this.getToken();
    if (token) return true;

    // Check IndexedDB if localStorage is empty
    try {
      const isValid = await sessionManager.isSessionValid();
      if (isValid) {
        const session = await sessionManager.getOfflineSession();
        if (session && session.token) {
          // Restore to localStorage
          sessionManager.saveToLocalStorage(session.token, session.user);
          return true;
        }
      }
    } catch (error) {
      console.error('Error checking IndexedDB session:', error);
    }

    return false;
  }

  // Get session from IndexedDB (for offline mode)
  async getOfflineSession() {
    try {
      return await sessionManager.getOfflineSession();
    } catch (error) {
      console.error('Error getting offline session:', error);
      return null;
    }
  }
}

export default AuthModel;
