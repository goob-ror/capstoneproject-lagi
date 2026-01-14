class KomplikasiModel {
  constructor() {
    this.baseURL = '/api/komplikasi';
    this.cachedData = [];
  }

  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async getAllKomplikasi() {
    try {
      const response = await fetch(this.baseURL, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch komplikasi data');
      }

      const data = await response.json();
      this.cachedData = data;
      return data;
    } catch (error) {
      console.error('Error fetching komplikasi:', error);
      throw error;
    }
  }

  async deleteKomplikasi(id) {
    try {
      const response = await fetch(`${this.baseURL}/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to delete komplikasi');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting komplikasi:', error);
      throw error;
    }
  }

  fullTextSearch(data, searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') {
      return data;
    }

    const query = searchTerm.toLowerCase().trim();
    const searchWords = query.split(/\s+/);

    const searchableFields = [
      { field: 'nama_ibu', weight: 10 },
      { field: 'nama_komplikasi', weight: 9 },
      { field: 'kejadian', weight: 6 },
      { field: 'tingkat_keparahan', weight: 5 }
    ];

    const results = data.map(item => {
      let score = 0;

      searchableFields.forEach(({ field, weight }) => {
        const fieldValue = item[field] ? String(item[field]).toLowerCase() : '';
        
        if (fieldValue) {
          if (fieldValue === query) {
            score += weight * 10;
          } else if (fieldValue.startsWith(query)) {
            score += weight * 7;
          } else if (fieldValue.includes(query)) {
            score += weight * 5;
          } else {
            const allWordsMatch = searchWords.every(word => fieldValue.includes(word));
            if (allWordsMatch) {
              score += weight * 3;
            }
          }
        }
      });

      return { ...item, _searchScore: score };
    });

    return results
      .filter(item => item._searchScore > 0)
      .sort((a, b) => b._searchScore - a._searchScore);
  }

  getCachedData() {
    return this.cachedData;
  }

  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  removeToken() {
    localStorage.removeItem('token');
  }

  removeUser() {
    localStorage.removeItem('user');
  }
}

export default KomplikasiModel;
