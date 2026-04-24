import apiClient from '../../services/apiClient';

class TambahKomplikasiModel {
  constructor() {
    this.baseURL = '/api/komplikasi';
  }

  async getActivePregnancies() {
    const response = await apiClient.get('/api/anc/pregnancies/active');
    if (!response.ok) throw new Error('Failed to fetch pregnancies');
    return response.json();
  }

  async getAncByPregnancy(pregnancyId) {
    const response = await apiClient.get(`/api/komplikasi/anc/${pregnancyId}`);
    if (!response.ok) throw new Error('Failed to fetch ANC visits');
    return response.json();
  }

  async getKomplikasiById(id) {
    const response = await apiClient.get(`${this.baseURL}/${id}`);
    if (!response.ok) throw new Error('Failed to fetch komplikasi');
    return response.json();
  }

  async createKomplikasi(data) {
    const response = await apiClient.post(this.baseURL, data);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create komplikasi');
    }
    return response.json();
  }

  async updateKomplikasi(id, data) {
    const response = await apiClient.put(`${this.baseURL}/${id}`, data);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update komplikasi');
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

export default TambahKomplikasiModel;
