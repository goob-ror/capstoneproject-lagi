import AuthModel from '../../services/AuthModel';

class KunjunganNifasPresenter {
  constructor(view) {
    this.view = view;
    this.authModel = new AuthModel();
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  }

  getUser() {
    return this.authModel.getUser();
  }

  async loadNifasData() {
    try {
      this.view.setLoading(true);
      this.view.clearError();

      const token = this.authModel.getToken();
      const response = await fetch(`${this.baseURL}/nifas`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        this.handleLogout();
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch nifas data');
      }

      const data = await response.json();
      // Store original data for search filtering
      this.originalData = data;
      this.view.displayNifasData(data);
    } catch (error) {
      console.error('Error loading nifas data:', error);
      this.view.setError('Gagal memuat data kunjungan nifas');
    } finally {
      this.view.setLoading(false);
    }
  }

  async deleteNifas(id) {
    try {
      this.view.setLoading(true);
      this.view.clearError();

      const token = this.authModel.getToken();
      const response = await fetch(`${this.baseURL}/nifas/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        this.handleLogout();
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to delete nifas data');
      }

      // Reload data after successful deletion
      await this.loadNifasData();
      alert('Data kunjungan nifas berhasil dihapus');
    } catch (error) {
      console.error('Error deleting nifas data:', error);
      this.view.setError('Gagal menghapus data kunjungan nifas');
    } finally {
      this.view.setLoading(false);
    }
  }

  searchNifasData(searchTerm) {
    // Implement client-side search filtering
    if (this.view.updateTableData && this.originalData) {
      if (!searchTerm || searchTerm.trim() === '') {
        // If no search term, show all data
        this.view.updateTableData(this.originalData);
      } else {
        // Filter data based on search term
        const filteredData = this.originalData.filter(item => {
          const searchLower = searchTerm.toLowerCase();
          return (
            (item.nama_ibu && item.nama_ibu.toLowerCase().includes(searchLower)) ||
            (item.nik_ibu && item.nik_ibu.toLowerCase().includes(searchLower)) ||
            (item.jenis_kunjungan && item.jenis_kunjungan.toLowerCase().includes(searchLower)) ||
            (item.pemeriksa && item.pemeriksa.toLowerCase().includes(searchLower)) ||
            (item.tekanan_darah && item.tekanan_darah.toLowerCase().includes(searchLower)) ||
            (item.involusio_uteri && item.involusio_uteri.toLowerCase().includes(searchLower)) ||
            (item.lochea && item.lochea.toLowerCase().includes(searchLower)) ||
            (item.payudara && item.payudara.toLowerCase().includes(searchLower))
          );
        });
        this.view.updateTableData(filteredData);
      }
    }
  }

  handleLogout() {
    this.authModel.removeToken();
    this.authModel.removeUser();
    this.view.onLogout();
  }
}

export default KunjunganNifasPresenter;