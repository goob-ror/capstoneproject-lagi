import RekapitulasiModel from './Rekapitulasi-model';

class RekapitulasiPresenter {
  constructor(view) {
    this.view = view;
    this.model = new RekapitulasiModel();
  }

  async loadSummaryData(kelurahan = null) {
    this.view.setLoading(true);
    this.view.clearError();

    try {
      const data = await this.model.getSummaryData(kelurahan);
      this.view.displaySummaryData(data);
    } catch (error) {
      console.error('Load summary error:', error);
      
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        this.handleLogout();
        return;
      }
      
      this.view.setError('Gagal memuat data rekapitulasi. Silakan coba lagi.');
    } finally {
      this.view.setLoading(false);
    }
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

export default RekapitulasiPresenter;
