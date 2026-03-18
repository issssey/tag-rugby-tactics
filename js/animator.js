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
    this.isAnimating = false;  // 手動ステップ実行中フラグ
    this.showTrail = false;    // 軌跡表示フラグ
    this.tagCount = 0;
    this.totalTags = 0;
  }

  loadTactics(tacticsData) {
    this.tacticsData = tacticsData;
    this.currentPhaseIndex = 0;
    this.currentStepIndex = 0;
    this.isPlaying = false;
    this.isAnimating = false;
    this.tagCount = 0;
    this.totalTags = tacticsData.phases.flatMap(p => p.steps).filter(s => s.type === 'tag').length;
    this._clearSVG();
    this._initPlayers();
    this._initBall();
    this._notifyStateChange();
  }

  _clearSVG() {
    const toRemove = this.svgElement.querySelectorAll('.player-group, .ball, .pass-line, .trail-layer');
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
    const step = this._getCurrentStep();
    const totalPhases = this.tacticsData ? this.tacticsData.phases.length : 0;
    const totalSteps = phase ? phase.steps.length : 0;
    return {
      phaseIndex: this.currentPhaseIndex,
      stepIndex: this.currentStepIndex,
      totalPhases,
      totalSteps,
      isPlaying: this.isPlaying,
      isAnimating: this.isAnimating,
      phaseDescription: phase ? phase.description : '',
      tagCount: this.tagCount,
      totalTags: this.totalTags,
      currentStepType: step ? step.type : null,
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
    this.isAnimating = false;
    this.tagCount = 0;
    this._clearSVG();
    this._initPlayers();
    this._initBall();
    this._notifyStateChange();
  }

  toggleTrail(enabled) {
    this.showTrail = enabled;
    if (!enabled) {
      const layer = this.svgElement.querySelector('.trail-layer');
      if (layer) layer.innerHTML = '';
    }
  }

  clearAllHighlights() {
    Object.values(this.players).forEach(p => p.setManualHighlight(false));
  }

  nextStep() {
    if (!this.tacticsData || this.isPlaying || this.isAnimating) return;
    const step = this._getCurrentStep();
    if (!step) return;

    this.isAnimating = true;
    this._notifyStateChange();
    this._executeStep(step, () => {
      this.isAnimating = false;
      const phase = this._getCurrentPhase();
      const isLastStep = this.currentStepIndex >= phase.steps.length - 1;
      const isLastPhase = this.currentPhaseIndex >= this.tacticsData.phases.length - 1;
      if (!(isLastStep && isLastPhase)) {
        this._advanceStep();
      }
      this._notifyStateChange();
    });
  }

  prevStep() {
    if (!this.tacticsData || this.isPlaying) return;
    if (this.currentPhaseIndex === 0 && this.currentStepIndex === 0) return;
    this._rewindStep();
    this._replayToCurrentStep();
  }

  nextPhase() {
    if (!this.tacticsData || this.isPlaying) return;
    const totalPhases = this.tacticsData.phases.length;
    if (this.currentPhaseIndex < totalPhases - 1) {
      this.currentPhaseIndex++;
      this.currentStepIndex = 0;
      this._replayToCurrentStep();
      this._notifyStateChange();
    }
  }

  prevPhase() {
    if (!this.tacticsData || this.isPlaying) return;
    if (this.currentStepIndex > 0) {
      // フェーズの先頭へ
      this.currentStepIndex = 0;
    } else if (this.currentPhaseIndex > 0) {
      this.currentPhaseIndex--;
      this.currentStepIndex = 0;
    }
    this._replayToCurrentStep();
    this._notifyStateChange();
  }

  setSpeed(speed) {
    this.speed = speed;
  }

  // 現在のインデックスまでの状態を瞬時に再現する（前ステップ/フェーズ移動用）
  _replayToCurrentStep() {
    this._clearSVG();
    this._initPlayers();
    this.ball = new Ball(this.grid);
    this.ball.render(this.svgElement);

    // 初期ボール保持者を設定
    const firstStep = this.tacticsData.phases[0].steps[0];
    const initialHolder = this.players[firstStep.ballHolder];
    if (initialHolder) this.ball.attachToPlayer(initialHolder);

    // 現在位置より前のステップを瞬時に適用
    for (let pi = 0; pi <= this.currentPhaseIndex; pi++) {
      const phase = this.tacticsData.phases[pi];
      const lastStep = (pi === this.currentPhaseIndex) ? this.currentStepIndex : phase.steps.length;
      for (let si = 0; si < lastStep; si++) {
        this._executeStepInstant(phase.steps[si]);
      }
    }
  }

  // アニメーションなしでステップの最終状態を即時適用する
  _executeStepInstant(step) {
    const playerMoves = step.players || [];
    playerMoves.forEach(pm => {
      const player = this.players[pm.id];
      if (!player) return;
      player.setPosition(pm.to.x, pm.to.y);
    });

    // ボール保持者の更新
    if (step.passAnimation) {
      const toPlayer = this.players[step.passAnimation.to];
      if (toPlayer) this.ball.attachToPlayer(toPlayer);
    } else if (step.ballHolder) {
      const holder = this.players[step.ballHolder];
      if (holder) this.ball.attachToPlayer(holder);
    }
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

    if (passAnim) {
      const fromPlayer = this.players[passAnim.from];
      const toPlayer = this.players[passAnim.to];
      const passDuration = 800 / this.speed;

      if (fromPlayer && toPlayer) {
        // 1. まずボールをレシーバーの現在地へ飛ばす
        this._showPassLine(fromPlayer, toPlayer);
        this.ball.animatePass(fromPlayer, toPlayer, passDuration, () => {
          // 2. ボール到達後にレシーバーが走り出す
          let maxMoveDuration = 0;
          playerMoves.forEach(pm => {
            const player = this.players[pm.id];
            if (!player) return;
            const duration = (pm.duration || 800) / this.speed;
            if (duration > maxMoveDuration) maxMoveDuration = duration;
            const isBallHolder = pm.id === passAnim.to;
            this._animatePlayerMove(player, pm.from, pm.to, duration, isBallHolder ? this.ball : null);
          });

          setTimeout(() => {
            playerMoves.forEach(pm => {
              if (pm.isHighlighted && this.players[pm.id]) {
                this.players[pm.id].setHighlight(false);
              }
            });
            onComplete();
          }, maxMoveDuration);
        });
      } else {
        onComplete();
      }
    } else {
      // passAnimがない場合は選手のみ移動
      let maxDuration = 0;
      playerMoves.forEach(pm => {
        const player = this.players[pm.id];
        if (!player) return;
        const duration = (pm.duration || 800) / this.speed;
        if (duration > maxDuration) maxDuration = duration;
        this._animatePlayerMove(player, pm.from, pm.to, duration, null);
      });
      setTimeout(() => {
        playerMoves.forEach(pm => {
          if (pm.isHighlighted && this.players[pm.id]) {
            this.players[pm.id].setHighlight(false);
          }
        });
        onComplete();
      }, maxDuration);
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
      this.tagCount++;
      this._notifyStateChange();
      onComplete();
    }, maxDuration);
  }

  _animatePlayerMove(player, from, to, duration, ball) {
    const startPixel = this.grid.gridToPixel(from.x, from.y);
    const endPixel = this.grid.gridToPixel(to.x, to.y);
    if (this.showTrail) this._drawTrail(startPixel, endPixel, player.color);
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

  _drawTrail(startPixel, endPixel, color) {
    let layer = this.svgElement.querySelector('.trail-layer');
    if (!layer) {
      layer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      layer.setAttribute('class', 'trail-layer');
      const firstPlayer = this.svgElement.querySelector('.player-group');
      this.svgElement.insertBefore(layer, firstPlayer);
    }
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', startPixel.x);
    line.setAttribute('y1', startPixel.y);
    line.setAttribute('x2', endPixel.x);
    line.setAttribute('y2', endPixel.y);
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', '2');
    line.setAttribute('stroke-dasharray', '4,4');
    line.setAttribute('opacity', '0.45');
    layer.appendChild(line);
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
