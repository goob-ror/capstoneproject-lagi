// Session Manager - Handles online/offline session storage logic

import indexedDBService from './indexedDBService';

class SessionManager {
  constructor() {
    this.isOnline = navigator.onLine;
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  // Check if currently online
  checkOnlineStatus() {
    return navigator.onLine;
  }

  // Save session - ONLY when online
  async saveSession(sessionData) {
    if (!this.checkOnlineStatus()) {
      return false;
    }

    try {
      await indexedDBService.saveSession(sessionData);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Get session - ONLY when offline (read-only)
  async getOfflineSession() {
    if (this.checkOnlineStatus()) {
      return null;
    }

    try {
      const session = await indexedDBService.getSession();
      if (session) {
      }
      return session;
    } catch (error) {
      return null;
    }
  }

  // Validate session is still valid (not expired)
  async isSessionValid() {
    try {
      return await indexedDBService.isSessionValid();
    } catch (error) {
      return false;
    }
  }

  // Clear session - can be done anytime (logout)
  async clearSession() {
    try {
      await indexedDBService.clearSession();
      return true;
    } catch (error) {
      return false;
    }
  }

  // Save to localStorage (always allowed)
  saveToLocalStorage(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }

  // Get from localStorage
  getFromLocalStorage() {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    return { token, user };
  }

  // Clear localStorage
  clearLocalStorage() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // Complete logout - clear everything
  async logout() {
    this.clearLocalStorage();
    await this.clearSession();
  }
}

// Create singleton instance
const sessionManager = new SessionManager();

export default sessionManager;
