import apiClient from '../../services/apiClient';

class DetailIbuModel {
  constructor() {
    this.baseURL = '/api/ibu';
  }

  async getIbuDetail(id) {
    const response = await apiClient.get(`${this.baseURL}/${id}/detail`);
    if (!response.ok) throw new Error('Failed to fetch ibu detail');
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

export default DetailIbuModel;
