class TambahPersalinanModel {
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

  async getReadyToDeliverPregnancies() {
    try {
      const response = await fetch(`${this.baseURL}/pregnancies/ready-to-deliver`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch ready to deliver pregnancies');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching ready to deliver pregnancies:', error);
      throw error;
    }
  }

  async getMotherDataByPregnancy(pregnancyId) {
    try {
      const response = await fetch(`${this.baseURL}/pregnancy/${pregnancyId}/mother`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch mother data');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching mother data:', error);
      throw error;
    }
  }

  async getPersalinanById(id) {
    try {
      const response = await fetch(`${this.baseURL}/${id}`, {
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

  async createPersalinan(data) {
    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create persalinan');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating persalinan:', error);
      throw error;
    }
  }

  async updatePersalinan(id, data) {
    try {
      const response = await fetch(`${this.baseURL}/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update persalinan');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating persalinan:', error);
      throw error;
    }
  }

  async createKomplikasi(data) {
    try {
      const response = await fetch('/api/komplikasi', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create komplikasi');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating komplikasi:', error);
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

export default TambahPersalinanModel;