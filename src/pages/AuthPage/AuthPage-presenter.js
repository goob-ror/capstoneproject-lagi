import AuthPageModel from './AuthPage-model';

// AuthPage presenter - minimal logic needed
class AuthPagePresenter {
  constructor(view) {
    this.view = view;
    this.model = new AuthPageModel();
  }

  // Could add methods here if needed in the future
  // For example: checkApprovalStatus, refreshStatus, etc.
}

export default AuthPagePresenter;
