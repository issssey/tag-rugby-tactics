class Ball {
  constructor(grid) {
    this.grid = grid;
    this.group = null;
    this.ellipse = null;
    this.holder = null; // 現在のボール保持者 (Player)
    this._animFrameId = null;
  }

  render(svgElement) {
    this.group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.group.setAttribute('class', 'ball');

    this.ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    this.ellipse.setAttribute('rx', '8');
    this.ellipse.setAttribute('ry', '10');
    this.ellipse.setAttribute('fill', '#8B4513');
    this.ellipse.setAttribute('stroke', '#FFFFFF');
    this.ellipse.setAttribute('stroke-width', '1.5');

    this.group.appendChild(this.ellipse);
    svgElement.appendChild(this.group);
  }

  attachToPlayer(player) {
    this.holder = player;
    const { x, y } = player.getPixelPosition();
    this._setPosition(x + 14, y - 14);
  }

  _setPosition(x, y) {
    this.ellipse.setAttribute('cx', x);
    this.ellipse.setAttribute('cy', y);
  }

  // パスアニメーション（放物線軌道）
  animatePass(fromPlayer, toPlayer, duration, onComplete) {
    if (this._animFrameId) cancelAnimationFrame(this._animFrameId);

    const from = fromPlayer.getPixelPosition();
    const to = toPlayer.getPixelPosition();

    const startX = from.x + 14;
    const startY = from.y - 14;
    const endX = to.x + 14;
    const endY = to.y - 14;

    // 放物線の頂点（中間点より少し上）
    const midX = (startX + endX) / 2;
    const midY = Math.min(startY, endY) - 40;

    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const et = easeInOutQuad(t);

      // 2次ベジェ曲線
      const x = (1 - et) * (1 - et) * startX + 2 * (1 - et) * et * midX + et * et * endX;
      const y = (1 - et) * (1 - et) * startY + 2 * (1 - et) * et * midY + et * et * endY;

      this._setPosition(x, y);

      if (t < 1) {
        this._animFrameId = requestAnimationFrame(animate);
      } else {
        this.attachToPlayer(toPlayer);
        this.holder = toPlayer;
        if (onComplete) onComplete();
      }
    };

    this._animFrameId = requestAnimationFrame(animate);
  }

  // ランアニメーション中にボールを選手に追従させる
  followPlayer(player) {
    this.holder = player;
  }

  updateToHolder() {
    if (this.holder) {
      this.attachToPlayer(this.holder);
    }
  }
}

function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
