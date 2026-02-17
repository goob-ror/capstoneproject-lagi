import UserManagementModel from './UserManagement-model';

class UserManagementPresenter {
  constructor(view) {
    this.view = view;
    this.model = new UserManagementModel();
  }

  getUser() {
    return this.model.getUser();
  }

  async loadUsers() {
    try {
      this.view.setLoading(true);
      this.view.clearError();
      const users = await this.model.fetchUsers();
      this.view.displayUsers(users);
    } catch (error) {
      this.view.setError(error.message);
    } finally {
      this.view.setLoading(false);
    }
  }

  async addUser(userData) {
    try {
      this.view.setLoading(true);
      this.view.clearError();
      await this.model.addUser(userData);
      await this.loadUsers();
      this.view.setSuccess('User berhasil ditambahkan');
    } catch (error) {
      this.view.setError(error.message);
      throw error;
    } finally {
      this.view.setLoading(false);
    }
  }

  async updateUser(userId, userData) {
    try {
      this.view.setLoading(true);
      this.view.clearError();
      await this.model.updateUser(userId, userData);
      await this.loadUsers();
      this.view.setSuccess('User berhasil diupdate');
    } catch (error) {
      this.view.setError(error.message);
      throw error;
    } finally {
      this.view.setLoading(false);
    }
  }

  async changePassword(userId, newPassword) {
    try {
      this.view.setLoading(true);
      this.view.clearError();
      await this.model.changePassword(userId, newPassword);
      this.view.setSuccess('Password berhasil diubah');
    } catch (error) {
      this.view.setError(error.message);
      throw error;
    } finally {
      this.view.setLoading(false);
    }
  }

  async verifyUser(userId) {
    try {
      this.view.setLoading(true);
      this.view.clearError();
      await this.model.verifyUser(userId);
      await this.loadUsers();
      this.view.setSuccess('User berhasil diverifikasi');
    } catch (error) {
      this.view.setError(error.message);
    } finally {
      this.view.setLoading(false);
    }
  }

  async deleteUser(userId) {
    try {
      this.view.setLoading(true);
      this.view.clearError();
      await this.model.deleteUser(userId);
      await this.loadUsers();
      this.view.setSuccess('User berhasil dihapus');
    } catch (error) {
      this.view.setError(error.message);
    } finally {
      this.view.setLoading(false);
    }
  }

  handleLogout() {
    this.model.removeToken();
    this.model.removeUser();
    this.view.onLogout();
  }
}

export default UserManagementPresenter;
