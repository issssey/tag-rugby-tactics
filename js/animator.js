class Animator {
  constructor(grid, svgElement) {
    this.grid = grid;
    this.svgElement = svgElement;
    this.tacticsData = null;
    this.players = {}; // id -> Player
    this.ball = null;

    this.currentPhaseIndex = 0;
    this.currentStepIndex = 0;
    this.isPlaying = false;
    this.speed = 1.0;

    this._animFrameId = null;
    this._stepTimeoutId = null;
    this.onStateChange = null; // コールバック
  }

  loadTactics(tacticsData) {
    this.tacticsData = tacticsData;
    this.currentPhaseIndex = 0;
    this.currentStepIndex = 0;
    this.isPlaying = false;
    this._clearSVG();
    this._initPlayers();
    this._initBall();
    this._notifyStateChange();
  }

  _clearSVG() {
    // グリッド以外の要素を削除
    const toRemove = this.svgElement.querySelectorAll('.player-group, .ball, .pass-line');
    toRemove.forEach(el => el.remove());
    this.players = {};
    this.ball = null;
  }

  _initPlayers() {
    const { attack, defense } = this.tacticsData.players;

    [...attack].forEach(p => {
      const player = new Player(p.id, p.gridX, p.gridY, 'attack', this.grid, p.role || null);
      player.render(this.svgElement);
      if (player.group) player.group.classList.add('player-group');
      this.players[p.id] = player;
    });

    [...defense].forEach(p => {
      const player = new Player(p.id, p.gridX, p.gridY, 'defense', this.grid, null);
      player.render(this.svgElement);
      if (player.group) player.group.classList.add('player-group');
      this.players[p.id] = player;
    });
  }

  _initBall() {
    this.ball = new Ball(this.grid);
    this.ball.render(this.svgElement);

    // 最初のボール保持者を設定
    const firstStep = this._getCurrentStep();
    if (firstStep && firstStep.ballHolder) {
      const holder = this.players[firstStep.ballHolder];
      if (holder) this.ball.attachToPlayer(holder);
    } else {
      // フォールバック: 最初の攻撃選手
      const firstAttack = this.tacticsData.players.attack[0];
      if (firstAttack) this.ball.attachToPlayer(this.players[firstAttack.id]);
    }
  }

  _getCurrentPhase() {
    if (!this.tacticsData) return null;
    return this.tacticsData.phases[this.currentPhaseIndex] || null;
  }

  _getCurrentStep() {
    const phase = this._getCurrentPhase();
    if (!phase) return null;
    return phase.steps[this.currentStepIndex] || null;
  }

  _notifyStateChange() {
    if (this.onStateChange) this.onStateChange(this.getState());
  }

  getState() {
    const phase = this._getCurrentPhase();
    const totalPhases = this.tacticsData ? this.tacticsData.phases.length : 0;
    const totalSteps = phase ? phase.steps.length : 0;
    return {
      phaseIndex: this.currentPhaseIndex,
      stepIndex: this.currentStepIndex,
      totalPhases,
      totalSteps,
      isPlaying: this.isPlaying,
      phaseDescription: phase ? phase.description : '',
    };
  }

  play() {
    if (!this.tacticsData || this.isPlaying) return;
    this.isPlaying = true;
    this._notifyStateChange();
    this._playCurrentStep();
  }

  pause() {
    this.isPlaying = false;
    if (this._stepTimeoutId) clearTimeout(this._stepTimeoutId);
    this._notifyStateChange();
  }

  reset() {
    this.pause();
    this.currentPhaseIndex = 0;
    this.currentStepIndex = 0;
    this._clearSVG();
    this._initPlayers();
    this._initBall();
    this._notifyStateChange();
  }

  nextStep() {
    if (!this.tacticsData) return;
    this.pause();
    this._advanceStep();
  }

  prevStep() {
    if (!this.tacticsData) return;
    this.pause();
    this._rewindStep();
  }

  nextPhase() {
    if (!this.tacticsData) return;
    this.pause();
    const totalPhases = this.tacticsData.phases.length;
    if (this.currentPhaseIndex < totalPhases - 1) {
      this.currentPhaseIndex++;
      this.currentStepIndex = 0;
      this._notifyStateChange();
    }
  }

  prevPhase() {
    if (!this.tacticsData) return;
    this.pause();
    if (this.currentPhaseIndex > 0) {
      this.currentPhaseIndex--;
      this.currentStepIndex = 0;
      this._notifyStateChange();
    }
  }

  setSpeed(speed) {
    this.speed = speed;
  }

  _advanceStep() {
    const phase = this._getCurrentPhase();
    if (!phase) return;

    if (this.currentStepIndex < phase.steps.length - 1) {
      this.currentStepIndex++;
    } else if (this.currentPhaseIndex < this.tacticsData.phases.length - 1) {
      this.currentPhaseIndex++;
      this.currentStepIndex = 0;
    }
    this._notifyStateChange();
  }

  _rewindStep() {
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
    } else if (this.currentPhaseIndex > 0) {
      this.currentPhaseIndex--;
      const phase = this._getCurrentPhase();
      this.currentStepIndex = phase ? phase.steps.length - 1 : 0;
    }
    this._notifyStateChange();
  }

  _playCurrentStep() {
    if (!this.isPlaying) return;

    const step = this._getCurrentStep();
    if (!step) {
      this.isPlaying = false;
      this._notifyStateChange();
      return;
    }

    this._executeStep(step, () => {
      if (!this.isPlaying) return;

      const phase = this._getCurrentPhase();
      const isLastStep = this.currentStepIndex >= phase.steps.length - 1;
      const isLastPhase = this.currentPhaseIndex >= this.tacticsData.phases.length - 1;

      if (isLastStep && isLastPhase) {
        this.isPlaying = false;
        this._notifyStateChange();
        return;
      }

      this._advanceStep();

      // ステップ間のインターバル
      this._stepTimeoutId = setTimeout(() => {
        this._playCurrentStep();
      }, 300 / this.speed);
    });
  }

  _executeStep(step, onComplete) {
    const type = step.type;

    if (type === 'pass' || type === 'rollball') {
      this._executePass(step, onComplete);
    } else if (type === 'run') {
      this._executeRun(step, onComplete);
    } else if (type === 'tag') {
      this._executeTag(step, onComplete);
    } else {
      onComplete();
    }
  }

  _executePass(step, onComplete) {
    const playerMoves = step.players || [];
    const passAnim = step.passAnimation;

    // ハイライト更新
    playerMoves.forEach(pm => {
      if (pm.isHighlighted && this.players[pm.id]) {
        this.players[pm.id].setHighlight(true);
      }
    });

    // 選手の移動を開始
    const moveDuration = playerMoves.length > 0 ? (playerMoves[0].duration || 800) / this.speed : 800 / this.speed;
    playerMoves.forEach(pm => {
      const player = this.players[pm.id];
      if (!player) return;
      const duration = (pm.duration || 800) / this.speed;
      this._animatePlayerMove(player, pm.from, pm.to, duration, null);
    });

    // パスアニメーション
    if (passAnim) {
      const fromPlayer = this.players[passAnim.from];
      const toPlayer = this.players[passAnim.to];
      const passDuration = 800 / this.speed;

      if (fromPlayer && toPlayer) {
        this._showPassLine(fromPlayer, toPlayer);
        this.ball.animatePass(fromPlayer, toPlayer, passDuration, () => {
          // ハイライト解除
          playerMoves.forEach(pm => {
            if (pm.isHighlighted && this.players[pm.id]) {
              this.players[pm.id].setHighlight(false);
            }
          });
          onComplete();
        });
      } else {
        onComplete();
      }
    } else {
      setTimeout(() => {
        playerMoves.forEach(pm => {
          if (pm.isHighlighted && this.players[pm.id]) {
            this.players[pm.id].setHighlight(false);
          }
        });
        onComplete();
      }, moveDuration);
    }
  }

  _executeRun(step, onComplete) {
    const playerMoves = step.players || [];
    const ballHolderId = step.ballHolder;

    let maxDuration = 0;
    playerMoves.forEach(pm => {
      const duration = (pm.duration || 1000) / this.speed;
      if (duration > maxDuration) maxDuration = duration;
    });

    playerMoves.forEach(pm => {
      const player = this.players[pm.id];
      if (!player) return;
      const duration = (pm.duration || 1000) / this.speed;
      const isBallHolder = pm.id === ballHolderId;

      this._animatePlayerMove(player, pm.from, pm.to, duration, isBallHolder ? this.ball : null);
    });

    setTimeout(onComplete, maxDuration);
  }

  _executeTag(step, onComplete) {
    const playerMoves = step.players || [];
    const ballHolderId = step.ballHolder;
    const ballHolder = this.players[ballHolderId];

    let maxDuration = 0;
    playerMoves.forEach(pm => {
      const duration = (pm.duration || 600) / this.speed;
      if (duration > maxDuration) maxDuration = duration;
    });

    playerMoves.forEach(pm => {
      const player = this.players[pm.id];
      if (!player) return;
      const duration = (pm.duration || 600) / this.speed;
      this._animatePlayerMove(player, pm.from, pm.to, duration, null);
    });

    setTimeout(() => {
      if (ballHolder) ballHolder.setTagged();
      onComplete();
    }, maxDuration);
  }

  _animatePlayerMove(player, from, to, duration, ball) {
    const startPixel = this.grid.gridToPixel(from.x, from.y);
    const endPixel = this.grid.gridToPixel(to.x, to.y);
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const et = easeInOutQuad(t);

      const x = startPixel.x + (endPixel.x - startPixel.x) * et;
      const y = startPixel.y + (endPixel.y - startPixel.y) * et;

      player._applyPixelPosition(x, y);

      if (ball) {
        ball._setPosition(x + 14, y - 14);
      }

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        player.gridX = to.x;
        player.gridY = to.y;
        if (ball) ball.attachToPlayer(player);
      }
    };

    requestAnimationFrame(animate);
  }

  _showPassLine(fromPlayer, toPlayer) {
    const from = fromPlayer.getPixelPosition();
    const to = toPlayer.getPixelPosition();

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', from.x);
    line.setAttribute('y1', from.y);
    line.setAttribute('x2', to.x);
    line.setAttribute('y2', to.y);
    line.setAttribute('stroke', '#378ADD');
    line.setAttribute('stroke-width', '2');
    line.setAttribute('stroke-dasharray', '6,4');
    line.setAttribute('class', 'pass-line');

    // 矢印マーカー
    const markerId = 'arrow-' + Date.now();
    const defs = this._getOrCreateDefs();
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', markerId);
    marker.setAttribute('markerWidth', '8');
    marker.setAttribute('markerHeight', '8');
    marker.setAttribute('refX', '6');
    marker.setAttribute('refY', '3');
    marker.setAttribute('orient', 'auto');
    const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    arrow.setAttribute('d', 'M0,0 L0,6 L8,3 z');
    arrow.setAttribute('fill', '#378ADD');
    marker.appendChild(arrow);
    defs.appendChild(marker);

    line.setAttribute('marker-end', `url(#${markerId})`);
    this.svgElement.insertBefore(line, this.svgElement.querySelector('.player-group'));

    setTimeout(() => {
      line.remove();
      marker.remove();
    }, 600 / this.speed);
  }

  _getOrCreateDefs() {
    let defs = this.svgElement.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      this.svgElement.insertBefore(defs, this.svgElement.firstChild);
    }
    return defs;
  }
}
