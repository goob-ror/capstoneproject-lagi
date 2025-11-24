import DataIbuModel from './DataIbu-model';

class DataIbuPresenter {
  constructor(view) {
    this.view = view;
    this.model = new DataIbuModel();
  }

  async loadIbuData() {
    this.view.setLoading(true);
    this.view.clearError();

    try {
      const data = await this.model.getAllIbu();
      this.view.displayIbuData(data);
    } catch (error) {
      console.error('Load ibu data error:', error);
      
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        this.handleLogout();
        return;
      }
      
      this.view.setError('Gagal memuat data ibu. Silakan coba lagi.');
    } finally {
      this.view.setLoading(false);
    }
  }

  async deleteIbu(id) {
    try {
      await this.model.deleteIbu(id);
      
      // Reload data after successful deletion
      await this.loadIbuData();
    } catch (error) {
      console.error('Delete ibu error:', error);
      
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        this.handleLogout();
        return;
      }
      
      this.view.setError('Gagal menghapus data. Silakan coba lagi.');
    }
  }

  /**
   * Perform full-text search on ibu data
   * @param {string} searchTerm - Search query
   */
  searchIbuData(searchTerm) {
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

export default DataIbuPresenter;
