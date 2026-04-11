import AuthModel from '../../services/AuthModel';

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

      const token = this.authModel.getToken();
      const response = await fetch(`${this.baseURL}/nifas/delivered-mothers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        this.handleLogout();
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch delivered mothers');
      }

      const data = await response.json();
      this.view.setDeliveredMothers(data);
    } catch (error) {
      this.view.setError('Gagal memuat data ibu nifas');
    } finally {
      this.view.setLoading(false);
    }
  }

  async loadMotherData(pregnancyId) {
    try {
      const token = this.authModel.getToken();
      const response = await fetch(`${this.baseURL}/nifas/pregnancy/${pregnancyId}/mother`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        this.handleLogout();
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch mother data');
      }

      const data = await response.json();
      this.view.setMotherData(data);
    } catch (error) {
      this.view.setError('Gagal memuat data ibu');
    }
  }

  async loadNifasData(id) {
    try {
      this.view.setLoading(true);
      this.view.clearError();

      const token = this.authModel.getToken();
      const response = await fetch(`${this.baseURL}/nifas/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        this.handleLogout();
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch nifas data');
      }

      const data = await response.json();
      this.view.populateForm(data);
    } catch (error) {
      this.view.setError('Gagal memuat data kunjungan nifas');
    } finally {
      this.view.setLoading(false);
    }
  }

  async handleSubmit(formData, validComplications, isEdit, editId) {
    try {
      this.view.setLoading(true);
      this.view.clearError();

      // Validation
      if (!formData.forkey_hamil) {
        this.view.setError('Pilih ibu nifas terlebih dahulu');
        return;
      }

      if (!formData.tanggal_kunjungan) {
        this.view.setError('Tanggal kunjungan harus diisi');
        return;
      }

      const token = this.authModel.getToken();
      
      // Check if we have complications to submit
      const hasComplications = validComplications && validComplications.length > 0;
      
      let url, method, requestBody;
      
      if (isEdit) {
        // For edit, use the regular endpoint (complications are handled separately)
        url = `${this.baseURL}/nifas/${editId}`;
        method = 'PUT';
        requestBody = formData;
      } else {
        // For create, use the with-complications endpoint if we have complications
        if (hasComplications) {
          url = `${this.baseURL}/nifas/with-complications`;
          method = 'POST';
          requestBody = {
            nifasData: formData,
            complications: validComplications
          };
        } else {
          url = `${this.baseURL}/nifas`;
          method = 'POST';
          requestBody = formData;
        }
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (response.status === 401) {
        this.handleLogout();
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save nifas data');
      }

      const result = await response.json();
      
      // If editing and we have complications, handle them separately
      if (isEdit && hasComplications) {
        await this.handleComplicationsForEdit(validComplications, formData.forkey_hamil, token);
      }
      
      this.view.onSuccess(result.message || (isEdit ? 'Data kunjungan nifas berhasil diupdate' : 'Data kunjungan nifas berhasil disimpan'));
    } catch (error) {
      this.view.setError(error.message || 'Gagal menyimpan data kunjungan nifas');
    } finally {
      this.view.setLoading(false);
    }
  }

  async handleComplicationsForEdit(complications, forkey_hamil, token) {
    // For edit mode, create complications separately
    for (const comp of complications) {
      try {
        const response = await fetch(`${this.baseURL}/komplikasi`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...comp,
            forkey_hamil: forkey_hamil,
            kejadian: comp.kejadian || 'Saat Nifas'
          })
        });

        if (!response.ok) {
          // error logged silently
        }
      } catch (error) {
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