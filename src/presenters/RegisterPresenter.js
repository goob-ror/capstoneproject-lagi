import AuthModel from '../models/AuthModel';

class RegisterPresenter {
  constructor(view) {
    this.view = view;
    this.model = new AuthModel();
  }

  async handleRegister(userData) {
    try {
      this.view.setLoading(true);
      this.view.clearError();

      // Validate inputs
      if (!userData.username || !userData.password) {
        throw new Error('Username and password are required');
      }

      if (userData.password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      await this.model.register(userData);

      this.view.onRegisterSuccess();
    } catch (error) {
      this.view.setError(error.message);
    } finally {
      this.view.setLoading(false);
    }
  }

  handleNavigateToLogin() {
    this.view.navigateToLogin();
  }
}

export default RegisterPresenter;
