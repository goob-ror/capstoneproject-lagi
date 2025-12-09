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

  async loadMotherData(pregnancyId) {
    try {
      const motherData = await this.model.getMotherDataByPregnancyId(pregnancyId);
      this.view.setMotherData(motherData);
    } catch (error) {
      console.error('Load mother data error:', error);
      
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        this.handleLogout();
        return;
      }
      
      this.view.setError('Gagal memuat data ibu.');
    }
  }

  async loadPreviousVisits(pregnancyId) {
    try {
      const visits = await this.model.getPreviousVisitsByPregnancyId(pregnancyId);
      this.view.setPreviousVisits(visits);
    } catch (error) {
      console.error('Load previous visits error:', error);
      
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        this.handleLogout();
        return;
      }
      
      this.view.setError('Gagal memuat data kunjungan sebelumnya.');
    }
  }

  async checkExistingVisit(pregnancyId, jenisKunjungan) {
    try {
      const result = await this.model.checkExistingVisit(pregnancyId, jenisKunjungan);
      if (result.exists && result.data) {
        // Only populate if visit exists
        this.view.populateForm(result.data);
        this.view.setExistingVisitId(result.data.id);
        this.view.showExistingVisitWarning(jenisKunjungan);
      } else {
        // Clear existing visit data when switching to non-existent visit
        this.view.setExistingVisitId(null);
        this.view.hideExistingVisitWarning();
        // Don't populate form - let it stay empty for new entry
      }
    } catch (error) {
      console.error('Check existing visit error:', error);
      
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        this.handleLogout();
        return;
      }
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
