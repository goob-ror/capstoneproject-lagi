import KomplikasiModel from './Komplikasi-model';

class KomplikasiPresenter {
  constructor(view) {
    this.view = view;
    this.model = new KomplikasiModel();
  }

  async loadKomplikasiData() {
    this.view.setLoading(true);
    this.view.clearError();

    try {
      const data = await this.model.getAllKomplikasi();
      this.view.displayKomplikasiData(data);
    } catch (error) {
      console.error('Load komplikasi error:', error);
      
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        this.handleLogout();
        return;
      }
      
      this.view.setError('Gagal memuat data komplikasi. Silakan coba lagi.');
    } finally {
      this.view.setLoading(false);
    }
  }

  async deleteKomplikasi(id) {
    try {
      await this.model.deleteKomplikasi(id);
      await this.loadKomplikasiData();
    } catch (error) {
      console.error('Delete komplikasi error:', error);
      
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        this.handleLogout();
        return;
      }
      
      this.view.setError('Gagal menghapus data komplikasi. Silakan coba lagi.');
    }
  }

  searchKomplikasiData(searchTerm) {
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

export default KomplikasiPresenter;
