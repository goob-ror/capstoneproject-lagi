import AuthModel from '../../services/AuthModel';
import apiClient from '../../services/apiClient';

class TambahNifasPresenter {
  constructor(view) {
    this.view = view;
    this.authModel = new AuthModel();
    this.baseURL = '/api/nifas';
  }

  getUser() {
    return this.authModel.getUser();
  }

  async loadDeliveredMothers() {
    try {
      this.view.setLoading(true);
      this.view.clearError();

      const response = await apiClient.get(`${this.baseURL}/delivered-mothers`);
      if (!response.ok) throw new Error('Failed to fetch delivered mothers');

      const data = await response.json();
      this.view.setDeliveredMothers(data);
    } catch (error) {
      if (error.status === 401) return;
      this.view.setError('Gagal memuat data ibu nifas');
    } finally {
      this.view.setLoading(false);
    }
  }

  async loadMotherData(pregnancyId) {
    try {
      const response = await apiClient.get(`${this.baseURL}/pregnancy/${pregnancyId}/mother`);
      if (!response.ok) throw new Error('Failed to fetch mother data');

      const data = await response.json();
      this.view.setMotherData(data);
    } catch (error) {
      if (error.status === 401) return;
      this.view.setError('Gagal memuat data ibu');
    }
  }

  async loadNifasData(id) {
    try {
      this.view.setLoading(true);
      this.view.clearError();

      const response = await apiClient.get(`${this.baseURL}/${id}`);
      if (!response.ok) throw new Error('Failed to fetch nifas data');

      const data = await response.json();
      this.view.populateForm(data);
    } catch (error) {
      if (error.status === 401) return;
      this.view.setError('Gagal memuat data kunjungan nifas');
    } finally {
      this.view.setLoading(false);
    }
  }

  async handleSubmit(formData, validComplications, isEdit, editId) {
    try {
      this.view.setLoading(true);
      this.view.clearError();

      if (!formData.forkey_hamil) {
        this.view.setError('Pilih ibu nifas terlebih dahulu');
        return;
      }

      if (!formData.tanggal_kunjungan) {
        this.view.setError('Tanggal kunjungan harus diisi');
        return;
      }

      const hasComplications = validComplications && validComplications.length > 0;

      let response;

      if (isEdit) {
        response = await apiClient.put(`${this.baseURL}/${editId}`, formData);
      } else if (hasComplications) {
        response = await apiClient.post(`${this.baseURL}/with-complications`, {
          nifasData: formData,
          complications: validComplications,
        });
      } else {
        response = await apiClient.post(this.baseURL, formData);
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save nifas data');
      }

      const result = await response.json();

      if (isEdit && hasComplications) {
        await this.handleComplicationsForEdit(validComplications, formData.forkey_hamil);
      }

      this.view.onSuccess(
        result.message ||
          (isEdit
            ? 'Data kunjungan nifas berhasil diupdate'
            : 'Data kunjungan nifas berhasil disimpan')
      );
    } catch (error) {
      if (error.status === 401) return;
      this.view.setError(error.message || 'Gagal menyimpan data kunjungan nifas');
    } finally {
      this.view.setLoading(false);
    }
  }

  async handleComplicationsForEdit(complications, forkey_hamil) {
    for (const comp of complications) {
      try {
        await apiClient.post('/api/komplikasi', {
          ...comp,
          forkey_hamil,
          kejadian: comp.kejadian || 'Saat Nifas',
        });
      } catch (error) {
        // individual complication errors are non-fatal
      }
    }
  }

  handleLogout() {
    this.authModel.removeToken();
    this.authModel.removeUser();
    this.view.onLogout();
  }
}

export default TambahNifasPresenter;
