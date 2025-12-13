class DashboardModel {
  constructor() {
    this.baseURL = '/api';
  }

  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async getDashboardStats() {
    try {
      const response = await fetch(`${this.baseURL}/dashboard/stats`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  async getIbuByKelurahan() {
    try {
      const response = await fetch(`${this.baseURL}/dashboard/ibu-by-kelurahan`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch ibu by kelurahan');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching ibu by kelurahan:', error);
      throw error;
    }
  }

  async getAgeDistribution() {
    try {
      const response = await fetch(`${this.baseURL}/dashboard/age-distribution`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch age distribution');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching age distribution:', error);
      throw error;
    }
  }

  async getANCPerMonth() {
    try {
      const response = await fetch(`${this.baseURL}/dashboard/anc-per-month`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch ANC per month');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching ANC per month:', error);
      throw error;
    }
  }

  async getImmunizationCoverage() {
    try {
      const response = await fetch(`${this.baseURL}/dashboard/immunization-coverage`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch immunization coverage');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching immunization coverage:', error);
      throw error;
    }
  }

  async getRiskDistribution() {
    try {
      const response = await fetch(`${this.baseURL}/dashboard/risk-distribution`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch risk distribution');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching risk distribution:', error);
      throw error;
    }
  }

  async getNearingDueDates() {
    try {
      const response = await fetch(`${this.baseURL}/dashboard/nearing-due-dates`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch nearing due dates');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching nearing due dates:', error);
      throw error;
    }
  }

  async getANCSchedule() {
    try {
      const response = await fetch(`${this.baseURL}/dashboard/anc-schedule`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch ANC schedule');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching ANC schedule:', error);
      throw error;
    }
  }

  async getSuamiPerokokKelurahan() {
    try {
      const response = await fetch(`${this.baseURL}/dashboard/suami-perokok-kelurahan`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch suami perokok by kelurahan');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching suami perokok by kelurahan:', error);
      throw error;
    }
  }

  async getImtDistributionKelurahan() {
    try {
      const response = await fetch(`${this.baseURL}/dashboard/imt-distribution-kelurahan`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch IMT distribution by kelurahan');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching IMT distribution by kelurahan:', error);
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

export default DashboardModel;
