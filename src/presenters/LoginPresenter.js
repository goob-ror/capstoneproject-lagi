import AuthModel from '../models/AuthModel';

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

      this.model.saveToken(data.token);
      this.model.saveUser(data.user);

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
