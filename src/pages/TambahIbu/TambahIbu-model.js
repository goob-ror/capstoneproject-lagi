class TambahIbuModel {
  constructor() {
    this.baseURL = '/api/ibu';
  }

  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async getIbuById(id) {
    try {
      const response = await fetch(`${this.baseURL}/${id}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch ibu data');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching ibu by id:', error);
      throw error;
    }
  }

  async createIbu(ibuData) {
    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(ibuData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create ibu data');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating ibu:', error);
      throw error;
    }
  }

  async updateIbu(id, ibuData) {
    try {
      const response = await fetch(`${this.baseURL}/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(ibuData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update ibu data');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating ibu:', error);
      throw error;
    }
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

    // Required fields
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
