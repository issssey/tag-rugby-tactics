class Player {
  constructor(id, gridX, gridY, team, grid, role = null) {
    this.id = id;
    this.gridX = gridX;
    this.gridY = gridY;
    this.team = team; // 'attack' | 'defense'
    this.grid = grid;
    this.role = role;
    this.color = team === 'attack' ? '#378ADD' : '#D85A30';
    this.group = null;
    this.circle = null;
    this.highlightRing = null;     // アニメーション用（金色）
    this.manualHighlightRing = null; // クリック用（シアン）
    this.isHighlighted = false;
    this.isManualHighlighted = false;
  }

  render(svgElement) {
    const { x, y } = this.grid.gridToPixel(this.gridX, this.gridY);

    this.group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.group.setAttribute('data-player-id', this.id);

    // クリック用ハイライトリング（シアン・外側）
    this.manualHighlightRing = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    this.manualHighlightRing.setAttribute('cx', x);
    this.manualHighlightRing.setAttribute('cy', y);
    this.manualHighlightRing.setAttribute('r', 28);
    this.manualHighlightRing.setAttribute('fill', 'none');
    this.manualHighlightRing.setAttribute('stroke', '#00E5FF');
    this.manualHighlightRing.setAttribute('stroke-width', '2.5');
    this.manualHighlightRing.setAttribute('opacity', '0');
    this.group.appendChild(this.manualHighlightRing);

    // アニメーション用ハイライトリング（金色・内側）
    this.highlightRing = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    this.highlightRing.setAttribute('cx', x);
    this.highlightRing.setAttribute('cy', y);
    this.highlightRing.setAttribute('r', 24);
    this.highlightRing.setAttribute('fill', 'none');
    this.highlightRing.setAttribute('stroke', '#FFD700');
    this.highlightRing.setAttribute('stroke-width', '3');
    this.highlightRing.setAttribute('opacity', '0');
    this.group.appendChild(this.highlightRing);

    // 選手の円
    this.circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    this.circle.setAttribute('cx', x);
    this.circle.setAttribute('cy', y);
    this.circle.setAttribute('r', 20);
    this.circle.setAttribute('fill', this.color);
    this.circle.setAttribute('stroke', '#fff');
    this.circle.setAttribute('stroke-width', '2');
    this.group.appendChild(this.circle);

    // 選手ID テキスト
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', x);
    text.setAttribute('y', y);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'central');
    text.setAttribute('fill', '#fff');
    text.setAttribute('font-size', '13');
    text.setAttribute('font-weight', 'bold');
    text.setAttribute('font-family', 'Arial, sans-serif');
    text.textContent = this.id;
    this.group.appendChild(text);

    this._textEl = text;
    svgElement.appendChild(this.group);
  }

  // アニメーション由来のハイライト（金色）
  setHighlight(enabled) {
    this.isHighlighted = enabled;
    if (this.highlightRing) {
      this.highlightRing.setAttribute('opacity', enabled ? '1' : '0');
    }
  }

  // クリック由来のハイライト（シアン）
  setManualHighlight(enabled) {
    this.isManualHighlighted = enabled;
    if (this.manualHighlightRing) {
      this.manualHighlightRing.setAttribute('opacity', enabled ? '1' : '0');
    }
  }

  setTagged() {
    if (this.circle) {
      this.circle.setAttribute('fill', '#ff4444');
      setTimeout(() => {
        this.circle.setAttribute('fill', this.color);
      }, 500);
    }
  }

  setPosition(gridX, gridY) {
    this.gridX = gridX;
    this.gridY = gridY;
    const { x, y } = this.grid.gridToPixel(gridX, gridY);
    this._applyPixelPosition(x, y);
  }

  _applyPixelPosition(x, y) {
    if (!this.group) return;
    this.circle.setAttribute('cx', x);
    this.circle.setAttribute('cy', y);
    this.highlightRing.setAttribute('cx', x);
    this.highlightRing.setAttribute('cy', y);
    this.manualHighlightRing.setAttribute('cx', x);
    this.manualHighlightRing.setAttribute('cy', y);
    this._textEl.setAttribute('x', x);
    this._textEl.setAttribute('y', y);
  }

  getPixelPosition() {
    return this.grid.gridToPixel(this.gridX, this.gridY);
  }
}
