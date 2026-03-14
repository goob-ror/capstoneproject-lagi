import sessionManager from '../../services/sessionManager';

class LoginPageModel {
  constructor() {
    this.baseURL = '/api/auth';
  }

  async login(username, password, recaptchaToken) {
    if (!sessionManager.checkOnlineStatus()) {
      return await this.offlineLogin(username, password);
    }

    try {
      const response = await fetch(`${this.baseURL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, recaptchaToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle rate limiting
        if (response.status === 429) {
          const cooldownMinutes = data.cooldownMinutes || data.remainingTime;
          throw new Error(data.message || `Terlalu banyak percobaan login gagal. Coba lagi dalam ${cooldownMinutes} menit.`);
        }
        
        // Handle other errors with attempts remaining info
        if (data.attemptsRemaining !== undefined) {
          throw new Error(`${data.message} (${data.attemptsRemaining} percobaan tersisa)`);
        }
        
        throw new Error(data.message || 'Login failed');
      }

      return data;
    } catch (error) {
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return await this.offlineLogin(username, password);
      }
      throw error;
    }
  }

  async offlineLogin(username, password) {
    try {
      const session = await sessionManager.getOfflineSession();
      
      if (!session) {
        throw new Error('No cached session found. Please connect to the internet to log in.');
      }

      if (session.username !== username) {
        throw new Error('Invalid credentials. Please connect to the internet to log in with a different account.');
      }

      const passwordHash = await this.hashPassword(password);
      if (session.passwordHash && session.passwordHash !== passwordHash) {
        throw new Error('Invalid password.');
      }
      
      return {
        message: 'Logged in offline with cached session',
        token: session.token,
        user: session.user,
        offline: true
      };
    } catch (error) {
      throw error;
    }
  }

  async hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

export default LoginPageModel;
