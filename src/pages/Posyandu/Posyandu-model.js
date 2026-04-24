import apiClient from '../../services/apiClient';
import AuthModel from '../../services/AuthModel';

class PosyanduModel extends AuthModel {
  constructor() {
    super();
    this.baseURL = '/api';
  }

  async getAllPosyandu() {
    const response = await apiClient.get(`${this.baseURL}/posyandu`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Gagal mengambil data posyandu');
    }
    const data = await response.json();
    return data.data || [];
  }

  async getAllKelurahan() {
    const response = await apiClient.get(`${this.baseURL}/kelurahan`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Gagal mengambil data kelurahan');
    }
    const data = await response.json();
    return data.data || [];
  }

  async createPosyandu(posyanduData) {
    const response = await apiClient.post(`${this.baseURL}/posyandu`, posyanduData);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Gagal menambahkan data posyandu');
    }
    return response.json();
  }

  async updatePosyandu(id, posyanduData) {
    const response = await apiClient.put(`${this.baseURL}/posyandu/${id}`, posyanduData);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Gagal memperbarui data posyandu');
    }
    return response.json();
  }

  async deletePosyandu(id) {
    const response = await apiClient.delete(`${this.baseURL}/posyandu/${id}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Gagal menghapus data posyandu');
    }
    return response.json();
  }
}

export default PosyanduModel;