// IndexedDB Service for session management

import { initDB, saveSession, getSession, clearSession } from '../utils/indexedDB';

class IndexedDBService {
  constructor() {
    this.initialized = false;
  }

  // Initialize the database
  async init() {
    try {
      await initDB();
      this.initialized = true;
    } catch (error) {
      throw error;
    }
  }

  // Save session data (only when user explicitly logs in)
  async saveSession(sessionData) {
    try {
      if (!this.initialized) {
        await this.init();
      }
      await saveSession(sessionData);
    } catch (error) {
      throw error;
    }
  }

  // Get session data
  async getSession() {
    try {
      if (!this.initialized) {
        await this.init();
      }
      return await getSession();
    } catch (error) {
      return null;
    }
  }

  // Check if session is valid (not expired)
  async isSessionValid() {
    try {
      const session = await this.getSession();
      if (!session) return false;

      // Session expires after 24 hours
      const expiryTime = 24 * 60 * 60 * 1000;
      const isValid = (Date.now() - session.timestamp) < expiryTime;

      if (!isValid) {
        await this.clearSession();
      }

      return isValid;
    } catch (error) {
      return false;
    }
  }

  // Clear session data
  async clearSession() {
    try {
      if (!this.initialized) {
        await this.init();
      }
      await clearSession();
    } catch (error) {
      throw error;
    }
  }
}

// Create singleton instance
const indexedDBService = new IndexedDBService();

export default indexedDBService;
