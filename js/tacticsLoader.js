class TacticsLoader {
  constructor() {
    this.index = null; // { basic: [...], advanced: [...], defense: [...] }
  }

  async loadIndex() {
    const data = await this._fetchJSON('tactics/index.json');
    this.index = data;
    return data;
  }

  getCategoriesList() {
    if (!this.index) return [];
    return Object.keys(this.index);
  }

  getTacticsByCategory(category) {
    if (!this.index) return [];
    if (category === 'all') {
      return Object.values(this.index).flat();
    }
    return this.index[category] || [];
  }

  async loadTactics(path) {
    return await this._fetchJSON(path);
  }

  async _fetchJSON(path) {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to load: ${path} (${response.status})`);
    }
    return response.json();
  }
}
