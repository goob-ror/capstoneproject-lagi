class TambahKomplikasiModel {
  constructor() {
    this.baseURL = '/api/komplikasi';
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
      const response = await fetch('/api/anc/pregnancies/active', {
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

  async getAncByPregnancy(pregnancyId) {
    try {
      const response = await fetch(`/api/komplikasi/anc/${pregnancyId}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch ANC visits');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching ANC visits:', error);
      throw error;
    }
  }

  async getKomplikasiById(id) {
    try {
      const response = await fetch(`${this.baseURL}/${id}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch komplikasi');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching komplikasi:', error);
      throw error;
    }
  }

  async createKomplikasi(data) {
    try {
      const response = await fetch(this.baseURL, {
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

  async updateKomplikasi(id, data) {
    try {
      const response = await fetch(`${this.baseURL}/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update komplikasi');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating komplikasi:', error);
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

export default TambahKomplikasiModel;
