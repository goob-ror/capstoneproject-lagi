import AuthModel from '../models/AuthModel';
import indexedDBService from '../services/indexedDBService';

class LoginPresenter {
  constructor(view) {
    this.view = view;
    this.model = new AuthModel();
  }

  async handleLogin(username, password) {
    try {
      this.view.setLoading(true);
      this.view.clearError();

      const data = await this.model.login(username, password);

      await this.model.saveToken(data.token);
      await this.model.saveUser(data.user);

      // Save session to IndexedDB for offline access
      try {
        await indexedDBService.saveSession({
          token: data.token,
          user: data.user,
          username: username
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
