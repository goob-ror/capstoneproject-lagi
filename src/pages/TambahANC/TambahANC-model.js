import apiClient from '../../services/apiClient';

class TambahANCModel {
  constructor() {
    this.baseURL = '/api/anc';
  }

  async getActivePregnancies() {
    const response = await apiClient.get(`${this.baseURL}/pregnancies/active`);
    if (!response.ok) throw new Error('Failed to fetch pregnancies');
    return response.json();
  }

  async getAncById(id) {
    const response = await apiClient.get(`${this.baseURL}/${id}`);
    if (!response.ok) throw new Error('Failed to fetch ANC data');
    return response.json();
  }

  async getMotherDataByPregnancyId(pregnancyId) {
    const response = await apiClient.get(`${this.baseURL}/pregnancy/${pregnancyId}/mother`);
    if (!response.ok) throw new Error('Failed to fetch mother data');
    return response.json();
  }

  async getPreviousVisitsByPregnancyId(pregnancyId) {
    const response = await apiClient.get(`${this.baseURL}/pregnancy/${pregnancyId}/visits`);
    if (!response.ok) throw new Error('Failed to fetch previous visits');
    return response.json();
  }

  async checkExistingVisit(pregnancyId, jenisKunjungan) {
    const response = await apiClient.get(`${this.baseURL}/pregnancy/${pregnancyId}/visit/${jenisKunjungan}`);
    if (!response.ok) throw new Error('Failed to check existing visit');
    return response.json();
  }

  async createAnc(data) {
    const response = await apiClient.post(this.baseURL, data);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create ANC');
    }
    return response.json();
  }

  async updateAnc(id, data) {
    const response = await apiClient.put(`${this.baseURL}/${id}`, data);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update ANC');
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

export default TambahANCModel;
