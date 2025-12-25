import PosyanduModel from './Posyandu-model';

class PosyanduPresenter {
  constructor(view) {
    this.view = view;
    this.model = new PosyanduModel();
  }

  async loadPosyanduData() {
    try {
      this.view.setLoading(true);
      this.view.clearError();
      
      const data = await this.model.getAllPosyandu();
      this.view.displayPosyanduData(data);
    } catch (error) {
      console.error('Error loading posyandu data:', error);
      this.view.setError(error.message || 'Gagal memuat data posyandu');
    } finally {
      this.view.setLoading(false);
    }
  }

  async loadKelurahanData() {
    try {
      const data = await this.model.getAllKelurahan();
      this.view.displayKelurahanData(data);
    } catch (error) {
      console.error('Error loading kelurahan data:', error);
      this.view.setError(error.message || 'Gagal memuat data kelurahan');
    }
  }

  async createPosyandu(formData) {
    try {
      this.view.setLoading(true);
      this.view.clearError();

      // Validate form data
      if (!formData.nama_posyandu || !formData.kelurahan_id || !formData.rt) {
        throw new Error('Semua field harus diisi');
      }

      // Validate RT format
      const rtPattern = /^(\d{2})(,\d{2})*$/;
      if (!rtPattern.test(formData.rt)) {
        throw new Error('Format RT tidak valid. Gunakan format: 01,02,03');
      }

      await this.model.createPosyandu(formData);
      this.view.onSuccess('Data posyandu berhasil ditambahkan');
      
      // Reload data
      await this.loadPosyanduData();
    } catch (error) {
      console.error('Error creating posyandu:', error);
      this.view.setError(error.message || 'Gagal menambahkan data posyandu');
    } finally {
      this.view.setLoading(false);
    }
  }

  async updatePosyandu(id, formData) {
    try {
      this.view.setLoading(true);
      this.view.clearError();

      // Validate form data
      if (!formData.nama_posyandu || !formData.kelurahan_id || !formData.rt) {
        throw new Error('Semua field harus diisi');
      }

      // Validate RT format
      const rtPattern = /^(\d{2})(,\d{2})*$/;
      if (!rtPattern.test(formData.rt)) {
        throw new Error('Format RT tidak valid. Gunakan format: 01,02,03');
      }

      await this.model.updatePosyandu(id, formData);
      this.view.onSuccess('Data posyandu berhasil diperbarui');
      
      // Reload data
      await this.loadPosyanduData();
    } catch (error) {
      console.error('Error updating posyandu:', error);
      this.view.setError(error.message || 'Gagal memperbarui data posyandu');
    } finally {
      this.view.setLoading(false);
    }
  }

  async deletePosyandu(id) {
    try {
      this.view.setLoading(true);
      this.view.clearError();

      await this.model.deletePosyandu(id);
      this.view.onSuccess('Data posyandu berhasil dihapus');
      
      // Reload data
      await this.loadPosyanduData();
    } catch (error) {
      console.error('Error deleting posyandu:', error);
      this.view.setError(error.message || 'Gagal menghapus data posyandu');
    } finally {
      this.view.setLoading(false);
    }
  }

  handleLogout() {
    this.model.logout();
    this.view.onLogout();
  }
}

export default PosyanduPresenter;