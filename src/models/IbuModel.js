import AuthModel from './AuthModel';

class IbuModel {
  constructor() {
    this.baseURL = '/api/ibu';
    this.authModel = new AuthModel();
  }

  getAuthHeaders() {
    const token = this.authModel.getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async getAll() {
    const response = await fetch(this.baseURL, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }

    return await response.json();
  }

  async getById(id) {
    const response = await fetch(`${this.baseURL}/${id}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }

    return await response.json();
  }

  async create(data) {
    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to create');
    }

    return result;
  }

  async update(id, data) {
    const response = await fetch(`${this.baseURL}/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to update');
    }

    return result;
  }

  async delete(id) {
    const response = await fetch(`${this.baseURL}/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to delete');
    }

    return result;
  }
}

export default IbuModel;
