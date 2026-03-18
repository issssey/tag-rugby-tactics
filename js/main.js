document.addEventListener('DOMContentLoaded', async () => {
  const svgEl = document.getElementById('field');
  const grid = new Grid(10, 60);
  grid.render(svgEl);

  const animator = new Animator(grid, svgEl);
  const controls = new Controls(animator);
  const loader = new TacticsLoader();

  controls.init();

  // カテゴリ変更時に戦術リストを更新
  document.getElementById('select-category').addEventListener('change', () => {
    populateTacticsList();
  });

  // 読み込みボタン
  document.getElementById('btn-load').addEventListener('click', async () => {
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
  }

  async function loadSelectedTactics() {
    const path = document.getElementById('select-tactics').value;
    if (!path) return;

    hideError();
    document.getElementById('btn-load').disabled = true;
    document.getElementById('btn-load').textContent = '読み込み中...';

    try {
      const data = await loader.loadTactics(path);
      animator.loadTactics(data);
      updateTacticsInfo(data);
    } catch (e) {
      showError('戦術の読み込みに失敗しました: ' + e.message);
    } finally {
      document.getElementById('btn-load').disabled = false;
      document.getElementById('btn-load').textContent = '読み込み';
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
