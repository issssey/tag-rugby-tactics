class Controls {
  constructor(animator) {
    this.animator = animator;
    this.animator.onStateChange = (state) => this.updateDisplay(state);
  }

  init() {
    document.getElementById('btn-play').addEventListener('click', () => {
      if (this.animator.isPlaying) {
        this.animator.pause();
        document.getElementById('btn-play').textContent = '▶ 再生';
      } else {
        this.animator.play();
        document.getElementById('btn-play').textContent = '⏸ 一時停止';
      }
    });

    document.getElementById('btn-reset').addEventListener('click', () => {
      this.animator.reset();
      document.getElementById('btn-play').textContent = '▶ 再生';
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
  }

  updateDisplay(state) {
    const phaseEl = document.getElementById('status-phase');
    const stepEl = document.getElementById('status-step');
    const descEl = document.getElementById('status-description');
    const playBtn = document.getElementById('btn-play');

    if (phaseEl) {
      phaseEl.textContent = `フェーズ: ${state.phaseIndex + 1} / ${state.totalPhases}`;
    }
    if (stepEl) {
      stepEl.textContent = `ステップ: ${state.stepIndex + 1} / ${state.totalSteps}`;
    }
    if (descEl) {
      descEl.textContent = state.phaseDescription || '';
    }
    if (playBtn) {
      playBtn.textContent = state.isPlaying ? '⏸ 一時停止' : '▶ 再生';
    }
  }
}
