import DetailIbuModel from './DetailIbu-model';

class DetailIbuPresenter {
  constructor(view) {
    this.view = view;
    this.model = new DetailIbuModel();
  }

  async loadIbuDetail(id) {
    this.view.setLoading(true);
    this.view.clearError();

    try {
      const data = await this.model.getIbuDetail(id);
      this.view.displayIbuDetail(data);
    } catch (error) {
      console.error('Load ibu detail error:', error);
      
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        this.handleLogout();
        return;
      }
      
      this.view.setError('Gagal memuat detail ibu. Silakan coba lagi.');
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

export default DetailIbuPresenter;
