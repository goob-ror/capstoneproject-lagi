import apiClient from '../../services/apiClient';

class KunjunganANCModel {
  constructor() {
    this.baseURL = '/api/anc';
    this.cachedData = [];
  }

  async getAllAnc(year = null) {
    const url = year ? `${this.baseURL}?year=${year}` : this.baseURL;
    const response = await apiClient.get(url);
    if (!response.ok) throw new Error('Failed to fetch ANC data');
    const data = await response.json();
    this.cachedData = data;
    return data;
  }

  async deleteAnc(id) {
    const response = await apiClient.delete(`${this.baseURL}/${id}`);
    if (!response.ok) throw new Error('Failed to delete ANC data');
    return response.json();
  }

  fullTextSearch(data, searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') {
      return data;
    }

    const query = searchTerm.toLowerCase().trim();
    const searchWords = query.split(/\s+/);

    const searchableFields = [
      { field: 'nama_ibu', weight: 10 },
      { field: 'jenis_kunjungan', weight: 8 },
      { field: 'pemeriksa', weight: 6 },
      { field: 'jenis_akses', weight: 5 },
      { field: 'status_risiko_visit', weight: 4 }
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

export default KunjunganANCModel;
