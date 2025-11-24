class TambahANCModel {
  constructor() {
    this.baseURL = '/api/anc';
  }

  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async getActivePregnancies() {
    try {
      const response = await fetch(`${this.baseURL}/pregnancies/active`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pregnancies');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching pregnancies:', error);
      throw error;
    }
  }

  async getAncById(id) {
    try {
      const response = await fetch(`${this.baseURL}/${id}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch ANC data');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching ANC:', error);
      throw error;
    }
  }

  async createAnc(data) {
    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create ANC');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating ANC:', error);
      throw error;
    }
  }

  async updateAnc(id, data) {
    try {
      const response = await fetch(`${this.baseURL}/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update ANC');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating ANC:', error);
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

export default TambahANCModel;
