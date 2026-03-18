const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const ROOT = __dirname;

// 戦術フォルダをスキャンして index.json を生成
function generateIndex() {
  const tacticsDir = path.join(ROOT, 'tactics');
  const tactics = [];

  const scan = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scan(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.json') && entry.name !== 'index.json') {
        try {
          const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
          const relativePath = path.relative(ROOT, fullPath).replace(/\\/g, '/');
          tactics.push({ name: data.name, path: relativePath });
        } catch (e) {
          console.warn(`スキップ: ${fullPath} (${e.message})`);
        }
      }
    }
  };

  scan(tacticsDir);
  fs.writeFileSync(path.join(tacticsDir, 'index.json'), JSON.stringify(tactics, null, 2));
  console.log(`index.json を生成しました (${tactics.length}件)`);
  tactics.forEach(t => console.log(`  - ${t.name} (${t.path})`));
}

// MIMEタイプ
const MIME = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
};

// 静的ファイルサーバー
const server = http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';

  const filePath = path.join(ROOT, urlPath);
  const ext = path.extname(filePath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

generateIndex();
server.listen(PORT, () => {
  console.log(`\nhttp://localhost:${PORT} で起動中`);
});
