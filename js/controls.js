class Controls {
  constructor(animator) {
    this.animator = animator;
    this.animator.onStateChange = (state) => this.updateDisplay(state);
  }

  init() {
    document.getElementById('btn-play').addEventListener('click', () => {
      if (this.animator.isPlaying) {
        this.animator.pause();
      } else {
        this.animator.play();
      }
    });

    document.getElementById('btn-reset').addEventListener('click', () => {
      this.animator.reset();
    });

    document.getElementById('btn-prev-step').addEventListener('click', () => {
      this.animator.prevStep();
    });

    document.getElementById('btn-next-step').addEventListener('click', () => {
      this.animator.nextStep();
    });

    document.getElementById('btn-prev-phase').addEventListener('click', () => {
      this.animator.prevPhase();
    });

    document.getElementById('btn-next-phase').addEventListener('click', () => {
      this.animator.nextPhase();
    });

    document.getElementById('select-speed').addEventListener('change', (e) => {
      this.animator.setSpeed(parseFloat(e.target.value));
    });

    document.getElementById('cb-trail').addEventListener('change', (e) => {
      this.animator.toggleTrail(e.target.checked);
    });

    document.getElementById('btn-clear-highlight').addEventListener('click', () => {
      this.animator.clearAllHighlights();
    });
  }

  updateDisplay(state) {
    // 再生ボタン
    const playBtn = document.getElementById('btn-play');
    if (playBtn) {
      playBtn.textContent = state.isPlaying ? '⏸ 一時停止' : '▶ 再生';
    }

    // ステータス表示
    const phaseEl = document.getElementById('status-phase');
    const stepEl = document.getElementById('status-step');
    const tagEl = document.getElementById('status-tag');
    const descEl = document.getElementById('status-description');
    const typeEl = document.getElementById('status-step-type');

    if (phaseEl) phaseEl.textContent = `フェーズ: ${state.phaseIndex + 1} / ${state.totalPhases}`;
    if (stepEl)  stepEl.textContent  = `ステップ: ${state.stepIndex + 1} / ${state.totalSteps}`;
    if (tagEl)   tagEl.textContent   = `タグ: ${state.tagCount} / ${state.totalTags}`;
    if (descEl)  descEl.textContent  = state.phaseDescription || '';

    if (typeEl) {
      const labels = { pass: 'パス', run: 'ラン', tag: 'タグ', rollball: 'ロールボール' };
      typeEl.textContent = labels[state.currentStepType] || '';
      typeEl.className = `step-type-badge type-${state.currentStepType || 'none'}`;
    }

    // ナビゲーションボタンの非活性制御
    const disabled = state.isAnimating || state.isPlaying;
    ['btn-prev-step', 'btn-next-step', 'btn-prev-phase', 'btn-next-phase'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.disabled = disabled;
    });
  }
}
