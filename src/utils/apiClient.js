// Centralized API client with authentication handling
class ApiClient {
  constructor() {
    this.baseURL = '/api';
  }

  getToken() {
    return localStorage.getItem('token');
  }

  async fetch(endpoint, options = {}) {
    const token = this.getToken();
    
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    // Add authorization header if token exists
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);

      // Handle 401 Unauthorized - token expired or invalid
      if (response.status === 401) {
        this.handleUnauthorized();
        throw new Error('Session expired. Please login again.');
      }

      // Handle 403 Forbidden - account not approved
      if (response.status === 403) {
        const data = await response.json();
        if (data.status === 'pending') {
          window.location.href = '/waiting-approval';
          throw new Error('Account pending approval');
        }
      }

      return response;
    } catch (error) {
      // Network errors or other fetch errors
      if (error.message.includes('Session expired')) {
        throw error;
      }
      throw error;
    }
  }

  handleUnauthorized() {
    // Clear authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Redirect to login
    window.location.href = '/login';
  }

  // Convenience methods
  async get(endpoint, options = {}) {
    return this.fetch(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint, data, options = {}) {
    return this.fetch(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data, options = {}) {
    return this.fetch(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint, options = {}) {
    return this.fetch(endpoint, { ...options, method: 'DELETE' });
  }
}

export default new ApiClient();
