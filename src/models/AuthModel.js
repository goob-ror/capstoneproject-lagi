import indexedDBService from '../services/indexedDBService';

class AuthModel {
  constructor() {
    this.baseURL = '/api/auth';
  }

  async login(username, password) {
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
      // If offline, try to get session from IndexedDB
      if (!navigator.onLine) {
        const session = await indexedDBService.getSession();
        if (session && session.username === username) {
          console.log('Using cached session (offline mode)');
          return {
            message: 'Logged in with cached session (offline)',
            token: session.token,
            user: session.user
          };
        }
      }
      throw error;
    }
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

  // Save token to both localStorage and IndexedDB
  async saveToken(token) {
    localStorage.setItem('token', token);
    try {
      const session = await indexedDBService.getSession() || {};
      await indexedDBService.saveSession({ ...session, token });
    } catch (error) {
      console.error('Error saving token to IndexedDB:', error);
    }
  }

  getToken() {
    return localStorage.getItem('token');
  }

  async removeToken() {
    localStorage.removeItem('token');
    try {
      await indexedDBService.clearSession();
    } catch (error) {
      console.error('Error removing token from IndexedDB:', error);
    }
  }

  // Save user to both localStorage and IndexedDB
  async saveUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
    try {
      const session = await indexedDBService.getSession() || {};
      await indexedDBService.saveSession({ ...session, user });
    } catch (error) {
      console.error('Error saving user to IndexedDB:', error);
    }
  }

  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  async removeUser() {
    localStorage.removeItem('user');
    try {
      await indexedDBService.clearSession();
    } catch (error) {
      console.error('Error removing user from IndexedDB:', error);
    }
  }

  async isAuthenticated() {
    const token = this.getToken();
    if (token) return true;

    // Check IndexedDB if localStorage is empty
    try {
      const isValid = await indexedDBService.isSessionValid();
      if (isValid) {
        const session = await indexedDBService.getSession();
        if (session && session.token) {
          // Restore to localStorage
          localStorage.setItem('token', session.token);
          if (session.user) {
            localStorage.setItem('user', JSON.stringify(session.user));
          }
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
      return await indexedDBService.getSession();
    } catch (error) {
      console.error('Error getting offline session:', error);
      return null;
    }
  }
}

export default AuthModel;
