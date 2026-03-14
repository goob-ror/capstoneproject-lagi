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

  async getSummaryData(kelurahan = null, year = null, month = null) {
    try {
      const params = new URLSearchParams();
      if (kelurahan) params.append('kelurahan', kelurahan);
      if (year) params.append('year', year);
      if (month) params.append('month', month);
      
      const url = params.toString() 
        ? `${this.baseURL}?${params.toString()}`
        : this.baseURL;
              
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
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
