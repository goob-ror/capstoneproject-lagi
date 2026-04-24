import apiClient from '../../services/apiClient';

class UserManagementModel {
  constructor() {
    this.baseURL = '/api/users';
  }

  async fetchUsers() {
    const response = await apiClient.get(this.baseURL);
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  }

  async addUser(userData) {
    const response = await apiClient.post(this.baseURL, userData);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add user');
    }
    return response.json();
  }

  async updateUser(userId, userData) {
    const response = await apiClient.put(`${this.baseURL}/${userId}`, userData);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update user');
    }
    return response.json();
  }

  async changePassword(userId, newPassword) {
    const response = await apiClient.put(`${this.baseURL}/${userId}/password`, { password: newPassword });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to change password');
    }
    return response.json();
  }

  async verifyUser(userId) {
    const response = await apiClient.put(`${this.baseURL}/${userId}/verify`, {});
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to verify user');
    }
    return response.json();
  }

  async deleteUser(userId) {
    const response = await apiClient.delete(`${this.baseURL}/${userId}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete user');
    }
    return response.json();
  }

  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  removeToken() {
    localStorage.removeItem('token');
  }

  removeUser() {
    localStorage.removeItem('user');
  }
}

export default UserManagementModel;
