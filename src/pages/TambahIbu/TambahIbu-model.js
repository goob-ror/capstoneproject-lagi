import apiClient from '../../services/apiClient';

class TambahIbuModel {
  constructor() {
    this.baseURL = '/api/ibu';
  }

  async getIbuById(id) {
    const response = await apiClient.get(`${this.baseURL}/${id}`);
    if (!response.ok) throw new Error('Failed to fetch ibu data');
    return response.json();
  }

  async createIbu(ibuData) {
    const response = await apiClient.post(this.baseURL, ibuData);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create ibu data');
    }
    return response.json();
  }

  async updateIbu(id, ibuData) {
    const response = await apiClient.put(`${this.baseURL}/${id}`, ibuData);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update ibu data');
    }
    return response.json();
  }

  validateNIK(nik) {
    // NIK must be 16 digits
    const nikRegex = /^[0-9]{16}$/;
    return nikRegex.test(nik);
  }

  validatePhone(phone) {
    // Phone must be 10-13 digits
    if (!phone) return true; // Optional field
    const phoneRegex = /^[0-9]{10,13}$/;
    return phoneRegex.test(phone);
  }

  validateFormData(formData) {
    const errors = [];

    // Required fields - Data Pribadi
    if (!formData.nik_ibu) {
      errors.push('NIK harus diisi');
    } else if (!this.validateNIK(formData.nik_ibu)) {
      errors.push('NIK harus 16 digit angka');
    }

    if (!formData.nama_lengkap) {
      errors.push('Nama lengkap harus diisi');
    }

    if (!formData.tanggal_lahir) {
      errors.push('Tanggal lahir harus diisi');
    }

    // Optional but validated fields
    if (formData.no_hp && !this.validatePhone(formData.no_hp)) {
      errors.push('No. HP harus 10-13 digit angka');
    }

    // Required fields - Data Kehamilan
    if (!formData.gravida || formData.gravida < 1) {
      errors.push('Gravida harus diisi dengan nilai minimal 1');
    }

    if (formData.partus === '' || formData.partus < 0) {
      errors.push('Partus harus diisi dengan nilai minimal 0');
    }

    if (formData.abortus === '' || formData.abortus < 0) {
      errors.push('Abortus harus diisi dengan nilai minimal 0');
    }

    if (!formData.haid_terakhir) {
      errors.push('Haid terakhir (HPHT) harus diisi');
    }

    if (!formData.status_kehamilan) {
      errors.push('Status kehamilan harus diisi');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
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

export default TambahIbuModel;
