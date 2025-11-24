import KunjunganANCModel from './KunjunganANC-model';

class KunjunganANCPresenter {
  constructor(view) {
    this.view = view;
    this.model = new KunjunganANCModel();
  }

  async loadAncData() {
    this.view.setLoading(true);
    this.view.clearError();

    try {
      const data = await this.model.getAllAnc();
      this.view.displayAncData(data);
    } catch (error) {
      console.error('Load ANC data error:', error);
      
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        this.handleLogout();
        return;
      }
      
      this.view.setError('Gagal memuat data kunjungan ANC. Silakan coba lagi.');
    } finally {
      this.view.setLoading(false);
    }
  }

  async deleteAnc(id) {
    try {
      await this.model.deleteAnc(id);
      await this.loadAncData();
    } catch (error) {
      console.error('Delete ANC error:', error);
      
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        this.handleLogout();
        return;
      }
      
      this.view.setError('Gagal menghapus data kunjungan ANC. Silakan coba lagi.');
    }
  }

  searchAncData(searchTerm) {
    const cachedData = this.model.getCachedData();
    const filteredData = this.model.fullTextSearch(cachedData, searchTerm);
    this.view.updateTableData(filteredData);
  }

  getUser() {
    return this.model.getUser();
  }

  handleLogout() {
    this.model.removeToken();
    this.model.removeUser();
    this.view.onLogout();
  }
}

export default KunjunganANCPresenter;
