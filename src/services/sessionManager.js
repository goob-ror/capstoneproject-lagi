// Session Manager - Handles online/offline session storage logic

import indexedDBService from './indexedDBService';

class SessionManager {
  constructor() {
    this.isOnline = navigator.onLine;
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('📡 Back online');
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('📴 Gone offline');
    });
  }

  // Check if currently online
  checkOnlineStatus() {
    return navigator.onLine;
  }

  // Save session - ONLY when online
  async saveSession(sessionData) {
    if (!this.checkOnlineStatus()) {
      console.warn('⚠️ Cannot save session while offline');
      return false;
    }

    try {
      await indexedDBService.saveSession(sessionData);
      console.log('✓ Session saved to IndexedDB (online)');
      return true;
    } catch (error) {
      console.error('Failed to save session:', error);
      return false;
    }
  }

  // Get session - ONLY when offline (read-only)
  async getOfflineSession() {
    if (this.checkOnlineStatus()) {
      console.warn('⚠️ Use server authentication when online');
      return null;
    }

    try {
      const session = await indexedDBService.getSession();
      if (session) {
        console.log('✓ Retrieved cached session (offline)');
      }
      return session;
    } catch (error) {
      console.error('Failed to get offline session:', error);
      return null;
    }
  }

  // Validate session is still valid (not expired)
  async isSessionValid() {
    try {
      return await indexedDBService.isSessionValid();
    } catch (error) {
      console.error('Failed to validate session:', error);
      return false;
    }
  }

  // Clear session - can be done anytime (logout)
  async clearSession() {
    try {
      await indexedDBService.clearSession();
      console.log('✓ Session cleared');
      return true;
    } catch (error) {
      console.error('Failed to clear session:', error);
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
