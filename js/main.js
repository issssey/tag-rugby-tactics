document.addEventListener('DOMContentLoaded', async () => {
  const svgEl = document.getElementById('field');
  const grid = new Grid(10, 60);
  grid.render(svgEl);

  const animator = new Animator(grid, svgEl);
  const controls = new Controls(animator);
  const loader = new TacticsLoader();

  controls.init();

  let populatingList = false;

  // カテゴリ変更時に戦術リストを更新して先頭を自動読み込み
  document.getElementById('select-category').addEventListener('change', async () => {
    populateTacticsList();
    await loadSelectedTactics();
  });

  // 戦術選択変更時に自動読み込み（リスト構築中は無視）
  document.getElementById('select-tactics').addEventListener('change', async () => {
    if (populatingList) return;
    await loadSelectedTactics();
  });

  // インデックス読み込み
  try {
    await loader.loadIndex();
    populateTacticsList();
    // 最初の戦術を自動読み込み
    await loadSelectedTactics();
  } catch (e) {
    showError(
      'JSONファイルの読み込みに失敗しました。ローカルサーバーが必要です。<br>' +
      'ターミナルで以下を実行してください:<br>' +
      '<code>cd ' + window.location.pathname.replace('/index.html', '') + ' &amp;&amp; python3 -m http.server 8080</code><br>' +
      'その後 <a href="http://localhost:8080" style="color:#7ec8e3">http://localhost:8080</a> を開いてください。'
    );
  }

  function populateTacticsList() {
    populatingList = true;
    const category = document.getElementById('select-category').value;
    const tactics = loader.getTacticsByCategory(category);
    const select = document.getElementById('select-tactics');

    select.innerHTML = '';
    tactics.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.path;
      opt.textContent = `${t.name}  ${'★'.repeat(t.difficulty)}${'☆'.repeat(5 - t.difficulty)}`;
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
      updateTacticsInfo(data);
    } catch (e) {
      showError('戦術の読み込みに失敗しました: ' + e.message);
    }
  }

  function updateTacticsInfo(data) {
    document.getElementById('tactics-name').textContent = data.name;
    document.getElementById('tactics-description').textContent = data.description || '';
    document.getElementById('tactics-author').textContent = data.author || '—';
    document.getElementById('tactics-difficulty').textContent =
      '★'.repeat(data.difficulty) + '☆'.repeat(5 - data.difficulty);
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
