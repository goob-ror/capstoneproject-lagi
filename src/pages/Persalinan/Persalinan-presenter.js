import AuthModel from '../../services/AuthModel';
import PersalinanModel from './Persalinan-model';

class PersalinanPresenter {
  constructor(callbacks) {
    this.callbacks = callbacks;
    this.authModel = new AuthModel();
    this.model = new PersalinanModel();
    this.originalData = [];
  }

  getUser() {
    return this.authModel.getUser();
  }

  async loadPersalinanData() {
    try {
      this.callbacks.setLoading(true);
      this.callbacks.clearError();

      const data = await this.model.getAllPersalinan();
      this.originalData = data;
      this.callbacks.displayPersalinanData(data);
    } catch (error) {
      console.error('Error loading persalinan data:', error);
      if (error.message.includes('401')) {
        this.handleLogout();
        return;
      }
      this.callbacks.setError('Gagal memuat data persalinan');
    } finally {
      this.callbacks.setLoading(false);
    }
  }

  async deletePersalinan(id) {
    try {
      this.callbacks.setLoading(true);
      this.callbacks.clearError();

      await this.model.deletePersalinan(id);

      // Reload data after successful deletion
      await this.loadPersalinanData();
      
      // Show success message
      alert('Data persalinan berhasil dihapus');
    } catch (error) {
      console.error('Error deleting persalinan:', error);
      if (error.message.includes('401')) {
        this.handleLogout();
        return;
      }
      this.callbacks.setError('Gagal menghapus data persalinan');
    } finally {
      this.callbacks.setLoading(false);
    }
  }

  searchPersalinanData(searchTerm) {
    if (!searchTerm.trim()) {
      this.callbacks.updateTableData(this.originalData);
      return;
    }

    const filteredData = this.originalData.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      return (
        item.nama_ibu?.toLowerCase().includes(searchLower) ||
        item.nik_ibu?.toLowerCase().includes(searchLower) ||
        item.tempat_persalinan?.toLowerCase().includes(searchLower) ||
        item.penolong?.toLowerCase().includes(searchLower) ||
        item.cara_persalinan?.toLowerCase().includes(searchLower) ||
        item.kondisi_bayi?.toLowerCase().includes(searchLower)
      );
    });

    this.callbacks.updateTableData(filteredData);
  }

  handleLogout() {
    this.authModel.logout();
    this.callbacks.onLogout();
  }
}

export default PersalinanPresenter;