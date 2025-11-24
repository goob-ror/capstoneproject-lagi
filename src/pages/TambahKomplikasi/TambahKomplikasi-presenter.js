import TambahKomplikasiModel from './TambahKomplikasi-model';

class TambahKomplikasiPresenter {
  constructor(view) {
    this.view = view;
    this.model = new TambahKomplikasiModel();
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

  async loadAncVisits(pregnancyId) {
    try {
      const ancVisits = await this.model.getAncByPregnancy(pregnancyId);
      this.view.setAncVisits(ancVisits);
    } catch (error) {
      console.error('Load ANC visits error:', error);
      this.view.setAncVisits([]);
    }
  }

  async loadKomplikasiData(id) {
    this.view.setLoading(true);
    
    try {
      const data = await this.model.getKomplikasiById(id);
      this.view.populateForm(data);
      
      if (data.forkey_hamil) {
        await this.loadAncVisits(data.forkey_hamil);
      }
    } catch (error) {
      console.error('Load komplikasi error:', error);
      
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        this.handleLogout();
        return;
      }
      
      this.view.setError('Gagal memuat data komplikasi.');
    } finally {
      this.view.setLoading(false);
    }
  }

  async handleSubmit(formData, isEdit, id) {
    this.view.setLoading(true);
    this.view.clearError();

    try {
      if (isEdit) {
        await this.model.updateKomplikasi(id, formData);
        this.view.onSuccess('Data komplikasi berhasil diperbarui');
      } else {
        await this.model.createKomplikasi(formData);
        this.view.onSuccess('Data komplikasi berhasil ditambahkan');
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

export default TambahKomplikasiPresenter;
