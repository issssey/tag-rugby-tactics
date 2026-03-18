class TacticsLoader {
  constructor() {
    this.index = null;
  }

  async loadIndex() {
    const data = await this._fetchJSON('tactics/index.json');
    this.index = data;
    return data;
  }

  getTacticsList() {
    return this.index || [];
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
