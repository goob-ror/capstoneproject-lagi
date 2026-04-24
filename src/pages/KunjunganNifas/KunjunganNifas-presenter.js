import AuthModel from '../../services/AuthModel';
import apiClient from '../../services/apiClient';

class KunjunganNifasPresenter {
  constructor(view) {
    this.view = view;
    this.authModel = new AuthModel();
    this.baseURL = '/api';
  }

  getUser() {
    return this.authModel.getUser();
  }

  async loadNifasData(year = null) {
    try {
      this.view.setLoading(true);
      this.view.clearError();

      const url = year ? `${this.baseURL}/nifas?year=${year}` : `${this.baseURL}/nifas`;
      const response = await apiClient.get(url);
      if (!response.ok) throw new Error('Failed to fetch nifas data');

      const data = await response.json();
      this.originalData = data;
      this.view.displayNifasData(data);
    } catch (error) {
      if (error.status === 401) return;
      this.view.setError('Gagal memuat data kunjungan nifas');
    } finally {
      this.view.setLoading(false);
    }
  }

  async deleteNifas(id) {
    try {
      this.view.setLoading(true);
      this.view.clearError();

      const response = await apiClient.delete(`${this.baseURL}/nifas/${id}`);
      if (!response.ok) throw new Error('Failed to delete nifas data');

      await this.loadNifasData();
      alert('Data kunjungan nifas berhasil dihapus');
    } catch (error) {
      if (error.status === 401) return;
      this.view.setError('Gagal menghapus data kunjungan nifas');
    } finally {
      this.view.setLoading(false);
    }
  }

  searchNifasData(searchTerm) {
    if (this.view.updateTableData && this.originalData) {
      if (!searchTerm || searchTerm.trim() === '') {
        this.view.updateTableData(this.originalData);
      } else {
        const searchLower = searchTerm.toLowerCase();
        const filteredData = this.originalData.filter(item =>
          (item.nama_ibu && item.nama_ibu.toLowerCase().includes(searchLower)) ||
          (item.nik_ibu && item.nik_ibu.toLowerCase().includes(searchLower)) ||
          (item.jenis_kunjungan && item.jenis_kunjungan.toLowerCase().includes(searchLower)) ||
          (item.pemeriksa && item.pemeriksa.toLowerCase().includes(searchLower)) ||
          (item.tekanan_darah && item.tekanan_darah.toLowerCase().includes(searchLower)) ||
          (item.involusio_uteri && item.involusio_uteri.toLowerCase().includes(searchLower)) ||
          (item.lochea && item.lochea.toLowerCase().includes(searchLower)) ||
          (item.payudara && item.payudara.toLowerCase().includes(searchLower))
        );
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
