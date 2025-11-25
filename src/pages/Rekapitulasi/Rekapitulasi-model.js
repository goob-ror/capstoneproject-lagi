class RekapitulasiModel {
  constructor() {
    this.baseURL = '/api/rekapitulasi';
  }

  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async getSummaryData(kelurahan = null) {
    try {
      const url = kelurahan 
        ? `${this.baseURL}?kelurahan=${encodeURIComponent(kelurahan)}`
        : this.baseURL;
        
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch summary data');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching summary:', error);
      throw error;
    }
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
