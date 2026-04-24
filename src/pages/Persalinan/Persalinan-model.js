import apiClient from '../../services/apiClient';

class PersalinanModel {
  constructor() {
    this.baseURL = '/api/persalinan';
  }

  async getAllPersalinan(year = null) {
    const url = year ? `${this.baseURL}?year=${year}` : this.baseURL;
    const response = await apiClient.get(url);
    if (!response.ok) throw new Error('Failed to fetch persalinan data');
    return response.json();
  }

  async deletePersalinan(id) {
    const response = await apiClient.delete(`${this.baseURL}/${id}`);
    if (!response.ok) throw new Error('Failed to delete persalinan');
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

export default PersalinanModel;