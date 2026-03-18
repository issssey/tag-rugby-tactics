document.addEventListener('DOMContentLoaded', async () => {
  const svgEl = document.getElementById('field');
  const grid = new Grid(11, 60);
  grid.render(svgEl);

  const animator = new Animator(grid, svgEl);
  const controls = new Controls(animator);
  const loader = new TacticsLoader();

  controls.init();

  let populatingList = false;

  // 戦術選択変更時に自動読み込み（リスト構築中は無視）
  document.getElementById('select-tactics').addEventListener('change', async () => {
    if (populatingList) return;
    await loadSelectedTactics();
  });

  // インデックス読み込み
  try {
    await loader.loadIndex();
    populateTacticsList();
    await loadSelectedTactics();
  } catch (e) {
    showError('戦術データの読み込みに失敗しました。');
  }

  function populateTacticsList() {
    populatingList = true;
    const tactics = loader.getTacticsList();
    const select = document.getElementById('select-tactics');

    select.innerHTML = '';
    tactics.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.path;
      opt.textContent = t.name;
      select.appendChild(opt);
    });
    populatingList = false;
  }

  async function loadSelectedTactics() {
    const path = document.getElementById('select-tactics').value;
    if (!path) return;

    hideError();
    try {
      const data = await loader.loadTactics(path);
      animator.loadTactics(data);
      document.getElementById('tactics-description').textContent = data.description || '';
    } catch (e) {
      showError('戦術の読み込みに失敗しました: ' + e.message);
    }
  }

  function showError(msg) {
    const el = document.getElementById('load-error');
    el.innerHTML = msg;
    el.style.display = 'block';
  }

  function hideError() {
    document.getElementById('load-error').style.display = 'none';
  }
});
