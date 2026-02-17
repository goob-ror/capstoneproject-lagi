import sessionManager from './sessionManager';

class AuthModel {
  constructor() {
    this.baseURL = '/api/auth';
  }

  getToken() {
    return localStorage.getItem('token');
  }

  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  isAuthenticated() {
    const token = this.getToken();
    return !!token; // Returns true if token exists, false otherwise
  }

  async checkSessionValidity() {
    // Check IndexedDB if localStorage is empty
    const token = this.getToken();
    if (token) return true;

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

  removeToken() {
    localStorage.removeItem('token');
  }

  removeUser() {
    localStorage.removeItem('user');
  }
}

export default AuthModel;
