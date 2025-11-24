import TambahANCModel from './TambahANC-model';

class TambahANCPresenter {
  constructor(view) {
    this.view = view;
    this.model = new TambahANCModel();
  }

  async loadPregnancies() {
    try {
      const pregnancies = await this.model.getActivePregnancies();
      this.view.setPregnancies(pregnancies);
    } catch (error) {
      console.error('Load pregnancies error:', error);
      
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        this.handleLogout();
        return;
      }
      
      this.view.setError('Gagal memuat data kehamilan.');
    }
  }

  async loadAncData(id) {
    this.view.setLoading(true);
    
    try {
      const data = await this.model.getAncById(id);
      this.view.populateForm(data);
    } catch (error) {
      console.error('Load ANC error:', error);
      
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        this.handleLogout();
        return;
      }
      
      this.view.setError('Gagal memuat data ANC.');
    } finally {
      this.view.setLoading(false);
    }
  }

  async handleSubmit(formData, isEdit, id) {
    this.view.setLoading(true);
    this.view.clearError();

    try {
      if (isEdit) {
        await this.model.updateAnc(id, formData);
        this.view.onSuccess('Data kunjungan ANC berhasil diperbarui');
      } else {
        await this.model.createAnc(formData);
        this.view.onSuccess('Data kunjungan ANC berhasil ditambahkan');
      }
    } catch (error) {
      console.error('Submit error:', error);
      
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        this.handleLogout();
        return;
      }
      
      this.view.setError(error.message || 'Gagal menyimpan data. Silakan coba lagi.');
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

export default TambahANCPresenter;
