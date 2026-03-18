class Grid {
  constructor(size = 10, cellSize = 60) {
    this.size = size;
    this.cellSize = cellSize;
    this.totalSize = size * cellSize;
  }

  gridToPixel(gridX, gridY) {
    return {
      x: gridX * this.cellSize + this.cellSize / 2,
      y: gridY * this.cellSize + this.cellSize / 2,
    };
  }

  pixelToGrid(px, py) {
    return {
      x: Math.floor(px / this.cellSize),
      y: Math.floor(py / this.cellSize),
    };
  }

  render(svgElement) {
    // 既存のグリッド線を削除
    const existing = svgElement.querySelector('.grid-lines');
    if (existing) existing.remove();

    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.classList.add('grid-lines');

    // 縦線
    for (let i = 0; i <= this.size; i++) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', i * this.cellSize);
      line.setAttribute('y1', 0);
      line.setAttribute('x2', i * this.cellSize);
      line.setAttribute('y2', this.totalSize);
      line.setAttribute('stroke', '#ccc');
      line.setAttribute('stroke-width', '1');
      group.appendChild(line);
    }

    // 横線
    for (let i = 0; i <= this.size; i++) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', 0);
      line.setAttribute('y1', i * this.cellSize);
      line.setAttribute('x2', this.totalSize);
      line.setAttribute('y2', i * this.cellSize);
      line.setAttribute('stroke', '#ccc');
      line.setAttribute('stroke-width', '1');
      group.appendChild(line);
    }

    // 背景
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('x', 0);
    bg.setAttribute('y', 0);
    bg.setAttribute('width', this.totalSize);
    bg.setAttribute('height', this.totalSize);
    bg.setAttribute('fill', '#4a7c59');
    bg.setAttribute('rx', '4');
    group.insertBefore(bg, group.firstChild);

    svgElement.insertBefore(group, svgElement.firstChild);
  }
}
