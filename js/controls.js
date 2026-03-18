class Controls {
  constructor(animator) {
    this.animator = animator;
    this.animator.onStateChange = (state) => this.updateDisplay(state);
  }

  init() {
    this._on('btn-play',       'click', () => this._togglePlay());
    this._on('btn-reset',      'click', () => this.animator.reset());
    this._on('btn-prev-step',  'click', () => this.animator.prevStep());
    this._on('btn-next-step',  'click', () => this.animator.nextStep());
    this._on('btn-prev-phase', 'click', () => this.animator.prevPhase());
    this._on('btn-next-phase', 'click', () => this.animator.nextPhase());

    this._on('btn-play-m',       'click', () => this._togglePlay());
    this._on('btn-reset-m',      'click', () => this.animator.reset());
    this._on('btn-prev-step-m',  'click', () => this.animator.prevStep());
    this._on('btn-next-step-m',  'click', () => this.animator.nextStep());
    this._on('btn-prev-phase-m', 'click', () => this.animator.prevPhase());
    this._on('btn-next-phase-m', 'click', () => this.animator.nextPhase());

    this._on('select-speed',   'change', (e) => this.animator.setSpeed(parseFloat(e.target.value)));
    this._on('select-speed-m', 'change', (e) => this.animator.setSpeed(parseFloat(e.target.value)));
  }

  // null セーフなイベント登録ヘルパー
  _on(id, event, handler) {
    const el = document.getElementById(id);
    if (el) el.addEventListener(event, handler);
  }

  _togglePlay() {
    if (this.animator.isPlaying) {
      this.animator.pause();
    } else {
      this.animator.play();
    }
  }

  updateDisplay(state) {
    const playLabel = state.isPlaying ? '⏸ 一時停止' : '▶ 再生';

    this._setText('btn-play',   playLabel);
    this._setText('btn-play-m', playLabel);

    this._setText('status-tag', `タグ: ${state.tagCount} / ${state.totalTags}`);

    const typeEl = document.getElementById('status-step-type');
    if (typeEl) {
      const labels = { pass: 'パス', run: 'ラン', tag: 'タグ', rollball: 'ロールボール' };
      typeEl.textContent = labels[state.currentStepType] || '';
      typeEl.className = `step-type-badge type-${state.currentStepType || 'none'}`;
    }

    const disabled = state.isAnimating || state.isPlaying;
    ['btn-prev-step', 'btn-next-step', 'btn-prev-phase', 'btn-next-phase',
     'btn-prev-step-m', 'btn-next-step-m', 'btn-prev-phase-m', 'btn-next-phase-m'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.disabled = disabled;
    });
  }

  _setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }
}
