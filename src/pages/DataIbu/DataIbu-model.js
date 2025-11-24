class DataIbuModel {
  constructor() {
    this.baseURL = '/api/ibu';
    this.cachedData = [];
  }

  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async getAllIbu() {
    try {
      const response = await fetch(this.baseURL, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch ibu data');
      }

      const data = await response.json();
      this.cachedData = data;
      return data;
    } catch (error) {
      console.error('Error fetching ibu data:', error);
      throw error;
    }
  }

  async getIbuById(id) {
    try {
      const response = await fetch(`${this.baseURL}/${id}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch ibu data');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching ibu by id:', error);
      throw error;
    }
  }

  async createIbu(ibuData) {
    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(ibuData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create ibu data');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating ibu:', error);
      throw error;
    }
  }

  async updateIbu(id, ibuData) {
    try {
      const response = await fetch(`${this.baseURL}/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(ibuData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update ibu data');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating ibu:', error);
      throw error;
    }
  }

  async deleteIbu(id) {
    try {
      const response = await fetch(`${this.baseURL}/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to delete ibu data');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting ibu:', error);
      throw error;
    }
  }

  /**
   * Full-Text Search Algorithm
   * Searches across multiple fields with weighted scoring
   * @param {Array} data - Array of ibu objects
   * @param {string} searchTerm - Search query
   * @returns {Array} - Filtered and sorted results
   */
  fullTextSearch(data, searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') {
      return data;
    }

    const query = searchTerm.toLowerCase().trim();
    const searchWords = query.split(/\s+/);

    // Define searchable fields with weights (higher = more important)
    const searchableFields = [
      { field: 'nik_ibu', weight: 10 },
      { field: 'nama_lengkap', weight: 8 },
      { field: 'kelurahan', weight: 6 },
      { field: 'no_hp', weight: 5 },
      { field: 'pekerjaan', weight: 4 },
      { field: 'pendidikan', weight: 3 },
      { field: 'gol_darah', weight: 3 },
      { field: 'alamat_lengkap', weight: 2 }
    ];

    const results = data.map(item => {
      let score = 0;
      let matchedFields = [];

      searchableFields.forEach(({ field, weight }) => {
        const fieldValue = item[field] ? String(item[field]).toLowerCase() : '';
        
        if (fieldValue) {
          // Exact match (highest score)
          if (fieldValue === query) {
            score += weight * 10;
            matchedFields.push(field);
          }
          // Starts with query (high score)
          else if (fieldValue.startsWith(query)) {
            score += weight * 7;
            matchedFields.push(field);
          }
          // Contains exact query (medium score)
          else if (fieldValue.includes(query)) {
            score += weight * 5;
            matchedFields.push(field);
          }
          // Contains all search words (lower score)
          else {
            const allWordsMatch = searchWords.every(word => 
              fieldValue.includes(word)
            );
            if (allWordsMatch) {
              score += weight * 3;
              matchedFields.push(field);
            }
            // Contains any search word (lowest score)
            else {
              const anyWordMatch = searchWords.some(word => 
                fieldValue.includes(word)
              );
              if (anyWordMatch) {
                score += weight * 1;
                matchedFields.push(field);
              }
            }
          }
        }
      });

      return {
        ...item,
        _searchScore: score,
        _matchedFields: matchedFields
      };
    });

    // Filter out items with no matches and sort by score
    return results
      .filter(item => item._searchScore > 0)
      .sort((a, b) => b._searchScore - a._searchScore);
  }

  /**
   * Get cached data for client-side operations
   */
  getCachedData() {
    return this.cachedData;
  }

  /**
   * Update cached data
   */
  setCachedData(data) {
    this.cachedData = data;
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

export default DataIbuModel;
