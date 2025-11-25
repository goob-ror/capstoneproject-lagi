class DetailIbuModel {
  constructor() {
    this.baseURL = '/api/ibu';
  }

  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async getIbuDetail(id) {
    try {
      const response = await fetch(`${this.baseURL}/${id}/detail`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch ibu detail');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching ibu detail:', error);
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

export default DetailIbuModel;
