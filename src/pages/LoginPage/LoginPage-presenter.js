import LoginPageModel from './LoginPage-model';
import sessionManager from '../../services/sessionManager';

class LoginPresenter {
  constructor(view) {
    this.view = view;
    this.model = new LoginPageModel();
  }

  async handleLogin(username, password) {
    try {
      this.view.setLoading(true);
      this.view.clearError();

      const data = await this.model.login(username, password);

      // Check if this is an offline login
      if (data.offline) {
        // Restore from cached session to localStorage only (no IndexedDB write)
        sessionManager.saveToLocalStorage(data.token, data.user);
        this.view.setError('⚠️ Logged in offline mode. Some features may be limited.');
        setTimeout(() => this.view.onLoginSuccess(), 1500);
        return;
      }

      // Online login - save to localStorage
      sessionManager.saveToLocalStorage(data.token, data.user);

      // Save complete session to IndexedDB ONLY when online
      try {
        // Hash password for offline validation
        const passwordHash = await this.model.hashPassword(password);
        
        // sessionManager will only save if online
        await sessionManager.saveSession({
          token: data.token,
          user: data.user,
          username: username,
          passwordHash: passwordHash
        });
      } catch (dbError) {
        console.warn('Failed to save session to IndexedDB:', dbError);
        // Don't block login if IndexedDB fails
      }

      this.view.onLoginSuccess();
    } catch (error) {
      if (error.message.includes('pending approval')) {
        this.view.onPendingApproval();
      } else {
        this.view.setError(error.message);
      }
    } finally {
      this.view.setLoading(false);
    }
  }

  handleNavigateToRegister() {
    this.view.navigateToRegister();
  }
}

export default LoginPresenter;
