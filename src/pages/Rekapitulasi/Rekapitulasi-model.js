import apiClient from '../../services/apiClient';

class RekapitulasiModel {
  constructor() {
    this.baseURL = '/api/rekapitulasi';
  }

  async getSummaryData(kelurahan = null, year = null, month = null) {
    const params = new URLSearchParams();
    if (kelurahan) params.append('kelurahan', kelurahan);
    if (year) params.append('year', year);
    if (month) params.append('month', month);

    const url = params.toString()
      ? `${this.baseURL}?${params.toString()}`
      : this.baseURL;

    const response = await apiClient.get(url);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error (${response.status}): ${errorText}`);
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

export default RekapitulasiModel;
