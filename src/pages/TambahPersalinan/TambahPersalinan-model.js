import apiClient from '../../services/apiClient';

class TambahPersalinanModel {
  constructor() {
    this.baseURL = '/api/persalinan';
  }

  async getReadyToDeliverPregnancies() {
    const response = await apiClient.get(`${this.baseURL}/pregnancies/ready-to-deliver`);
    if (!response.ok) throw new Error('Failed to fetch ready to deliver pregnancies');
    return response.json();
  }

  async getMotherDataByPregnancy(pregnancyId) {
    const response = await apiClient.get(`${this.baseURL}/pregnancy/${pregnancyId}/mother`);
    if (!response.ok) throw new Error('Failed to fetch mother data');
    return response.json();
  }

  async getPersalinanById(id) {
    const response = await apiClient.get(`${this.baseURL}/${id}`);
    if (!response.ok) throw new Error('Failed to fetch persalinan data');
    return response.json();
  }

  async createPersalinan(data) {
    const response = await apiClient.post(this.baseURL, data);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create persalinan');
    }
    return response.json();
  }

  async updatePersalinan(id, data) {
    const response = await apiClient.put(`${this.baseURL}/${id}`, data);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update persalinan');
    }
    return response.json();
  }

  async createKomplikasi(data) {
    const response = await apiClient.post('/api/komplikasi', data);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create komplikasi');
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

export default TambahPersalinanModel;