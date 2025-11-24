import TambahIbuModel from './TambahIbu-model';

class TambahIbuPresenter {
  constructor(view) {
    this.view = view;
    this.model = new TambahIbuModel();
  }

  async loadIbuData(id) {
    try {
      const data = await this.model.getIbuById(id);
      this.view.displayIbuData(data);
    } catch (error) {
      console.error('Load ibu data error:', error);
      
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        this.handleLogout();
        return;
      }
      
      this.view.setError('Gagal memuat data. Silakan coba lagi.');
    }
  }

  async handleSubmit(formData) {
    this.view.setLoading(true);
    this.view.clearError();
    this.view.clearSuccess();

    try {
      const isEditMode = !!formData.id;
      
      // Validate form data
      const validation = this.model.validateFormData(formData);
      
      if (!validation.isValid) {
        this.view.setError(validation.errors.join(', '));
        this.view.setLoading(false);
        return;
      }

      // Create or update ibu data
      if (isEditMode) {
        await this.model.updateIbu(formData.id, formData);
        this.view.onSuccess('Data ibu berhasil diperbarui!');
      } else {
        await this.model.createIbu(formData);
        this.view.onSuccess('Data ibu berhasil ditambahkan!');
      }
    } catch (error) {
      console.error('Submit error:', error);
      
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        this.handleLogout();
        return;
      }

      if (error.message.includes('already exists')) {
        this.view.setError('NIK sudah terdaftar dalam sistem');
      } else {
        this.view.setError('Gagal menyimpan data. Silakan coba lagi.');
      }
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

export default TambahIbuPresenter;
