import apiClient from '../../services/apiClient';

class DashboardModel {
  constructor() {
    this.baseURL = '/api';
  }

  async getDashboardStats() {
    const response = await apiClient.get(`${this.baseURL}/dashboard/stats`);
    if (!response.ok) throw new Error('Failed to fetch dashboard stats');
    return response.json();
  }

  async getIbuByKelurahan() {
    const response = await apiClient.get(`${this.baseURL}/dashboard/ibu-by-kelurahan`);
    if (!response.ok) throw new Error('Failed to fetch ibu by kelurahan');
    return response.json();
  }

  async getAgeDistribution() {
    const response = await apiClient.get(`${this.baseURL}/dashboard/age-distribution`);
    if (!response.ok) throw new Error('Failed to fetch age distribution');
    return response.json();
  }

  async getANCPerMonth() {
    const response = await apiClient.get(`${this.baseURL}/dashboard/anc-per-month`);
    if (!response.ok) throw new Error('Failed to fetch ANC per month');
    return response.json();
  }

  async getImmunizationCoverage() {
    const response = await apiClient.get(`${this.baseURL}/dashboard/immunization-coverage`);
    if (!response.ok) throw new Error('Failed to fetch immunization coverage');
    return response.json();
  }

  async getRiskDistribution() {
    const response = await apiClient.get(`${this.baseURL}/dashboard/risk-distribution`);
    if (!response.ok) throw new Error('Failed to fetch risk distribution');
    return response.json();
  }

  async getNearingDueDates() {
    const response = await apiClient.get(`${this.baseURL}/dashboard/nearing-due-dates`);
    if (!response.ok) throw new Error('Failed to fetch nearing due dates');
    return response.json();
  }

  async getANCSchedule() {
    const response = await apiClient.get(`${this.baseURL}/dashboard/anc-schedule`);
    if (!response.ok) throw new Error('Failed to fetch ANC schedule');
    return response.json();
  }

  async getSuamiPerokokKelurahan() {
    const response = await apiClient.get(`${this.baseURL}/dashboard/suami-perokok-kelurahan`);
    if (!response.ok) throw new Error('Failed to fetch suami perokok by kelurahan');
    return response.json();
  }

  async getImtDistributionKelurahan() {
    const response = await apiClient.get(`${this.baseURL}/dashboard/imt-distribution-kelurahan`);
    if (!response.ok) throw new Error('Failed to fetch IMT distribution by kelurahan');
    return response.json();
  }

  async getAtRiskMothers() {
    const response = await apiClient.get(`${this.baseURL}/dashboard/at-risk-mothers`);
    if (!response.ok) throw new Error('Failed to fetch at-risk mothers');
    return response.json();
  }

  async getActionRecommendation(kehamilanId) {
    const response = await apiClient.get(
      `${this.baseURL}/dashboard/at-risk-mothers/${kehamilanId}/action-recommendation`
    );
    if (!response.ok) throw new Error('Failed to fetch action recommendation');
    return response.json();
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
