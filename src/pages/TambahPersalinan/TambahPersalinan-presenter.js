import AuthModel from '../../services/AuthModel';
import TambahPersalinanModel from './TambahPersalinan-model';

class TambahPersalinanPresenter {
  constructor(callbacks) {
    this.callbacks = callbacks;
    this.authModel = new AuthModel();
    this.model = new TambahPersalinanModel();
  }

  getUser() {
    return this.authModel.getUser();
  }

  async loadReadyToDeliverPregnancies() {
    try {
      this.callbacks.setLoading(true);
      this.callbacks.clearError();

      const data = await this.model.getReadyToDeliverPregnancies();
      this.callbacks.setPregnancies(data);
    } catch (error) {
      if (error.message.includes('401')) {
        this.handleLogout();
        return;
      }
      this.callbacks.setError('Gagal memuat data ibu hamil yang siap melahirkan');
    } finally {
      this.callbacks.setLoading(false);
    }
  }

  async loadMotherData(pregnancyId) {
    try {
      const data = await this.model.getMotherDataByPregnancy(pregnancyId);
      this.callbacks.setMotherData(data);
    } catch (error) {
      if (error.message.includes('401')) {
        this.handleLogout();
        return;
      }
      this.callbacks.setError('Gagal memuat data ibu');
    }
  }

  async loadPersalinanData(id) {
    try {
      this.callbacks.setLoading(true);
      this.callbacks.clearError();

      const data = await this.model.getPersalinanById(id);
      this.callbacks.populateForm(data);

      // Load mother data for the pregnancy
      if (data.forkey_hamil) {
        await this.loadMotherData(data.forkey_hamil);
      }
    } catch (error) {
      if (error.message.includes('401')) {
        this.handleLogout();
        return;
      }
      this.callbacks.setError('Gagal memuat data persalinan');
    } finally {
      this.callbacks.setLoading(false);
    }
  }

  async handleSubmit(formData, complications, isEdit, editId) {
    try {
      this.callbacks.setLoading(true);
      this.callbacks.clearError();

      // Submit persalinan data
      let persalinanId;
      if (isEdit) {
        await this.model.updatePersalinan(editId, formData);
        persalinanId = editId;
      } else {
        const result = await this.model.createPersalinan(formData);
        persalinanId = result.id || result.persalinanId;
      }

      // Submit complications if any
      if (complications && complications.length > 0) {
        const validComplications = complications.filter(comp => comp.nama_komplikasi.trim() !== '');

        for (const comp of validComplications) {
          const komplikasiData = {
            ...comp,
            forkey_hamil: formData.forkey_hamil,
            forkey_anc: null // No ANC visit for delivery complications
          };

          await this.model.createKomplikasi(komplikasiData);
        }
      }

      const successMessage = isEdit
        ? 'Data persalinan berhasil diperbarui'
        : 'Data persalinan berhasil disimpan';

      // Pass pregnancy ID and persalinan ID for KF1 creation
      this.callbacks.onSuccess(successMessage, formData.forkey_hamil, persalinanId, isEdit);
    } catch (error) {
      if (error.message.includes('401')) {
        this.handleLogout();
        return;
      }
      this.callbacks.setError(error.message || 'Gagal menyimpan data persalinan');
    } finally {
      this.callbacks.setLoading(false);
    }
  }

  handleLogout() {
    this.authModel.logout();
    this.callbacks.onLogout();
  }
}

export default TambahPersalinanPresenter;