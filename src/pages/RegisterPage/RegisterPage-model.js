class RegisterPageModel {
  constructor() {
    this.baseURL = '/api/auth';
  }

  async register(userData) {
    try {
      const response = await fetch(`${this.baseURL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      return data;
    } catch (error) {
      if (!navigator.onLine) {
        throw new Error('Registration requires an internet connection. Please try again when online.');
      }
      throw error;
    }
  }
}

export default RegisterPageModel;
