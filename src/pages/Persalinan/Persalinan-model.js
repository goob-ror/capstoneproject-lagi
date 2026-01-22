class PersalinanModel {
  constructor() {
    this.baseURL = '/api/persalinan';
  }

  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async getAllPersalinan() {
    try {
      const response = await fetch(this.baseURL, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch persalinan data');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching persalinan data:', error);
      throw error;
    }
  }

  async deletePersalinan(id) {
    try {
      const response = await fetch(`${this.baseURL}/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to delete persalinan');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting persalinan:', error);
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

export default PersalinanModel;