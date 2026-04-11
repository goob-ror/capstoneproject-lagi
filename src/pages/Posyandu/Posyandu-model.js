import AuthModel from '../../services/AuthModel';

class PosyanduModel extends AuthModel {
  constructor() {
    super();
    this.baseURL = '/api';
  }

  async getAllPosyandu() {
    try {
      const response = await fetch(`${this.baseURL}/posyandu`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.logout();
          throw new Error('Sesi telah berakhir, silakan login kembali');
        }
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal mengambil data posyandu');
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      throw error;
    }
  }

  async getAllKelurahan() {
    try {
      const response = await fetch(`${this.baseURL}/kelurahan`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.logout();
          throw new Error('Sesi telah berakhir, silakan login kembali');
        }
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal mengambil data kelurahan');
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      throw error;
    }
  }

  async createPosyandu(posyanduData) {
    try {
      const response = await fetch(`${this.baseURL}/posyandu`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`
        },
        body: JSON.stringify(posyanduData)
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.logout();
          throw new Error('Sesi telah berakhir, silakan login kembali');
        }
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal menambahkan data posyandu');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async updatePosyandu(id, posyanduData) {
    try {
      const response = await fetch(`${this.baseURL}/posyandu/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`
        },
        body: JSON.stringify(posyanduData)
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.logout();
          throw new Error('Sesi telah berakhir, silakan login kembali');
        }
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal memperbarui data posyandu');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async deletePosyandu(id) {
    try {
      const response = await fetch(`${this.baseURL}/posyandu/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.logout();
          throw new Error('Sesi telah berakhir, silakan login kembali');
        }
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal menghapus data posyandu');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }
}

export default PosyanduModel;