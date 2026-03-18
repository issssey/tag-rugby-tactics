# タグラグビー戦術アニメーションシステム 要件定義書

## 1. システム概要
タグラグビーの戦術を視覚的に教えるためのアニメーションシステム。グリッドベースの座標管理により、座標計算を簡素化し、戦術データをJSONファイルで管理することで拡張性を確保する。

---

## 2. プロジェクト構造

```
tag-rugby-tactics/
├── index.html              # メインHTML
├── css/
│   └── styles.css         # スタイルシート
├── js/
│   ├── main.js            # アプリケーションエントリーポイント
│   ├── grid.js            # グリッドシステム（座標変換）
│   ├── player.js          # 選手の描画・管理
│   ├── ball.js            # ボールアイコンの管理
│   ├── animator.js        # アニメーションエンジン
│   ├── controls.js        # 再生コントロールUI
│   └── tacticsLoader.js   # 戦術ロード・セレクト機能
├── tactics/               # 戦術データフォルダ
│   ├── index.json         # 戦術インデックス
│   ├── basic/             # 基本戦術
│   │   ├── simple-pass.json
│   │   ├── wing-attack.json
│   │   └── center-break.json
│   ├── advanced/          # 応用戦術
│   │   ├── switch-play.json
│   │   ├── dummy-pass.json
│   │   └── overlap.json
│   └── defense/           # ディフェンス戦術
│       ├── line-defense.json
│       ├── drift-defense.json
│       └── blitz.json
└── README.md
```

---

## 3. データ構造

### 3.1 グリッドシステム
- **サイズ**: 10×10マス
- **セルサイズ**: 60px × 60px
- **座標系**: `gridX, gridY`（0-9の整数）
- **変換関数**: `gridToPixel(gridX, gridY)` → `{x: px, y: px}`

### 3.2 戦術データフォーマット（JSON）

```javascript
{
  "name": "戦術名",
  "category": "basic" | "advanced" | "defense",
  "description": "戦術の説明文",
  "author": "作成者名",
  "difficulty": 1-5,  // 難易度（1=簡単、5=難しい）
  
  "players": {
    "attack": [
      {
        "id": "A1",           // 選手ID
        "gridX": 2,           // 初期X座標
        "gridY": 7,           // 初期Y座標
        "role": "スクラムハーフ"  // ポジション（オプション）
      }
    ],
    "defense": [
      {
        "id": "D1",
        "gridX": 1,
        "gridY": 3
      }
    ]
  },
  
  "phases": [
    {
      "id": 1,
      "description": "フェーズの説明",
      "steps": [
        {
          "type": "pass" | "run" | "tag" | "rollball",
          "ballHolder": "A1",  // ボール保持者ID
          "passAnimation": {   // type="pass"の場合のみ
            "from": "A1",
            "to": "A2"
          },
          "players": [
            {
              "id": "A2",
              "from": {"x": 3, "y": 7},  // 開始位置（グリッド座標）
              "to": {"x": 3, "y": 6},    // 終了位置（グリッド座標）
              "duration": 800,            // アニメーション時間（ms）
              "isHighlighted": true       // ハイライト表示
            }
          ]
        }
      ]
    }
  ]
}
```

### 3.3 戦術インデックスフォーマット（tactics/index.json）

```json
{
  "basic": [
    {
      "name": "シンプルパス回し",
      "path": "tactics/basic/simple-pass.json",
      "difficulty": 1
    }
  ],
  "advanced": [
    {
      "name": "スイッチプレー",
      "path": "tactics/advanced/switch-play.json",
      "difficulty": 3
    }
  ],
  "defense": [
    {
      "name": "ラインディフェンス",
      "path": "tactics/defense/line-defense.json",
      "difficulty": 2
    }
  ]
}
```

---

## 4. 主要機能

### 4.1 戦術選択・読み込み機能
- カテゴリセレクター（すべて/基本/応用/ディフェンス）
- 戦術セレクター（カテゴリに応じた戦術リスト）
- 読み込みボタン
- 戦術情報表示（名前、説明、難易度、作成者）

### 4.2 再生コントロール機能
- **基本操作**:
  - 再生/一時停止
  - リセット（初期状態に戻す）
  - 速度調整（0.5x, 1x, 2x）
  
- **ステップ操作**:
  - 前のステップへ
  - 次のステップへ
  
- **フェーズ操作**:
  - 前のフェーズへ
  - 次のフェーズへ

### 4.3 表示機能
- **グリッド**: 10×10のマス目
- **選手**:
  - 攻撃側: 青色の円（#378ADD）
  - ディフェンス: 赤色の円（#D85A30）
  - 選手ID表示（円の中央）
  
- **ボールアイコン**:
  - 楕円形（rx: 8px, ry: 10px）
  - 茶色（#8B4513）
  - 白枠（stroke: #FFFFFF）
  - ボール保持者の右上に配置
  
- **ハイライト**:
  - 金色のリング（#FFD700）
  - 太さ: 3px
  - 半径: 選手円 + 4px
  
- **パスライン**:
  - 点線矢印
  - 青色（#378ADD）
  - 表示時間: 600ms
  
- **移動軌跡**: オプション表示

- **状態表示**:
  - 現在のフェーズ番号（例: フェーズ 1/4）
  - 現在のステップ番号（例: ステップ 1/5）
  - タグカウンター（例: タグ 0/4）

### 4.4 編集機能（将来拡張）
- 選手のドラッグ&ドロップで初期配置変更
- 選手クリックでハイライトON/OFF
- ステップの追加/削除
- 移動経路の編集
- ボール保持者の指定
- JSON エクスポート/インポート

---

## 5. アニメーション仕様

### 5.1 パスアニメーション
1. ボールアイコンが送り手から受け手へ放物線軌道で移動（800ms）
2. パスライン（点線矢印）を表示
3. 受け手到達後、受け手の右上に固定
4. パスライン消去（600ms後）

### 5.2 ランアニメーション
1. 選手とボールアイコンが同時に移動
2. ボールは常に選手の右上位置を維持
3. イージング関数で加速・減速

### 5.3 タグアニメーション
1. ディフェンス選手がボールホルダーへ移動
2. 接触時にボールホルダーを一瞬赤くハイライト
3. タグカウンター +1
4. ボールホルダーがその場に停止

### 5.4 ロールボールアニメーション
1. ボールホルダーが地面に転がすモーション（前進1マス程度）
2. 次の選手にボールアイコンが移動
3. 次の選手がボール保持者になる

### 5.5 イージング関数
```javascript
// ease-in-out（滑らかな加速・減速）
easeInOutQuad(t) {
  return t < 0.5 
    ? 2 * t * t 
    : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
```

---

## 6. UI構成

```
┌─────────────────────────────────────────────────────────┐
│ タグラグビー戦術アニメーション                              │
├─────────────────────────────────────────────────────────┤
│ [カテゴリ: すべて ▼] [戦術: 選択... ▼] [読み込み]         │
│                                                          │
│ 戦術名: シンプルパス回し                                    │
│ 説明: 基本的な横パス展開                                    │
│ 難易度: ★☆☆☆☆  作成者: コーチ名                           │
├─────────────────────────────────────────────────────────┤
│ [速度: 1x ▼] [◀◀ 前フェーズ] [◀ 前ステップ]              │
│ [▶ 再生] [次ステップ ▶] [次フェーズ ▶▶] [リセット]         │
│                                                          │
│ フェーズ: 1/4  |  ステップ: 1/5  |  タグ: 0/4             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│               [グリッド表示エリア]                          │
│                   10×10マス                              │
│                    600×600px                            │
│                                                          │
├─────────────────────────────────────────────────────────┤
│ 凡例:                                                     │
│ 🔵 攻撃側  🔴 ディフェンス  🏉 ボール  ⭐ ハイライト       │
│                                                          │
│ [軌跡表示 ☐] [グリッド表示 ☑] [ハイライト全解除]          │
└─────────────────────────────────────────────────────────┘
```

---

## 7. 技術仕様

### 7.1 技術スタック
- **フロントエンド**: Pure JavaScript（フレームワーク不使用）
- **描画**: SVG
- **アニメーション**: requestAnimationFrame
- **データ形式**: JSON
- **ストレージ**: localStorage（設定保存用）

### 7.2 ブラウザ対応
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### 7.3 パフォーマンス要件
- アニメーションフレームレート: 60fps
- 戦術読み込み時間: 500ms以内
- メモリ使用量: 50MB以内

---

## 8. モジュール仕様

### 8.1 grid.js
```javascript
class Grid {
  constructor(size = 10, cellSize = 60) {}
  
  gridToPixel(gridX, gridY) {
    // グリッド座標をピクセル座標に変換
    // 返り値: {x: number, y: number}
  }
  
  pixelToGrid(px, py) {
    // ピクセル座標をグリッド座標に変換
    // 返り値: {x: number, y: number}
  }
  
  render(svgElement) {
    // グリッド線をSVGに描画
  }
}
```

### 8.2 player.js
```javascript
class Player {
  constructor(id, gridX, gridY, color, role = null) {}
  
  render(svgGroup) {
    // 選手をSVGに描画（円 + テキスト）
  }
  
  moveTo(gridX, gridY, duration, easingFunc) {
    // 指定座標へアニメーション移動
  }
  
  setHighlight(enabled) {
    // ハイライト表示ON/OFF
  }
}
```

### 8.3 ball.js
```javascript
class Ball {
  constructor() {}
  
  render(svgGroup) {
    // ボールアイコンをSVGに描画（楕円）
  }
  
  attachToPlayer(player) {
    // 選手の右上に配置
  }
  
  animatePass(fromPlayer, toPlayer, duration) {
    // パスアニメーション（放物線軌道）
  }
}
```

### 8.4 animator.js
```javascript
class Animator {
  constructor(grid, svgElement) {}
  
  loadTactics(tacticsData) {
    // 戦術データを読み込み、初期状態を設定
  }
  
  play() {
    // 再生開始
  }
  
  pause() {
    // 一時停止
  }
  
  reset() {
    // 初期状態にリセット
  }
  
  nextStep() {
    // 次のステップへ
  }
  
  prevStep() {
    // 前のステップへ
  }
  
  nextPhase() {
    // 次のフェーズへ
  }
  
  prevPhase() {
    // 前のフェーズへ
  }
  
  setSpeed(speed) {
    // 再生速度設定（0.5, 1.0, 2.0）
  }
}
```

### 8.5 tacticsLoader.js
```javascript
class TacticsLoader {
  constructor() {}
  
  async loadIndex() {
    // tactics/index.json を読み込み
  }
  
  getCategoriesList() {
    // カテゴリ一覧を取得
  }
  
  getTacticsByCategory(category) {
    // 指定カテゴリの戦術リストを取得
  }
  
  async loadTactics(path) {
    // 指定パスの戦術JSONを読み込み
    // 返り値: tacticsData object
  }
}
```

### 8.6 controls.js
```javascript
class Controls {
  constructor(animator, tacticsLoader) {}
  
  init() {
    // UIイベントリスナーを設定
  }
  
  updateDisplay() {
    // 状態表示を更新（フェーズ、ステップ、タグ数）
  }
  
  updateTacticsInfo(tacticsData) {
    // 戦術情報表示を更新
  }
}
```

### 8.7 main.js
```javascript
// アプリケーションエントリーポイント
document.addEventListener('DOMContentLoaded', () => {
  const grid = new Grid(10, 60);
  const tacticsLoader = new TacticsLoader();
  const animator = new Animator(grid, document.querySelector('svg'));
  const controls = new Controls(animator, tacticsLoader);
  
  tacticsLoader.loadIndex().then(() => {
    controls.init();
  });
});
```

---

## 9. サンプル戦術データ

### 9.1 simple-pass.json（シンプルパス回し）
```json
{
  "name": "シンプルパス回し",
  "category": "basic",
  "description": "基本的な横パス展開。左から右へボールを展開し、ディフェンスの穴を突く。",
  "author": "サンプル",
  "difficulty": 1,
  
  "players": {
    "attack": [
      { "id": "A1", "gridX": 2, "gridY": 7, "role": "スクラムハーフ" },
      { "id": "A2", "gridX": 3, "gridY": 7, "role": "センター" },
      { "id": "A3", "gridX": 4, "gridY": 7, "role": "ウイング" },
      { "id": "A4", "gridX": 5, "gridY": 7, "role": "ウイング" },
      { "id": "A5", "gridX": 6, "gridY": 7, "role": "フルバック" }
    ],
    "defense": [
      { "id": "D1", "gridX": 1, "gridY": 3 },
      { "id": "D2", "gridX": 3, "gridY": 3 },
      { "id": "D3", "gridX": 5, "gridY": 3 },
      { "id": "D4", "gridX": 7, "gridY": 3 }
    ]
  },
  
  "phases": [
    {
      "id": 1,
      "description": "第1フェーズ: 最初のパス展開",
      "steps": [
        {
          "type": "pass",
          "ballHolder": "A1",
          "passAnimation": { "from": "A1", "to": "A2" },
          "players": [
            { "id": "A2", "from": {"x": 3, "y": 7}, "to": {"x": 3, "y": 6}, "duration": 800, "isHighlighted": true }
          ]
        },
        {
          "type": "run",
          "ballHolder": "A2",
          "players": [
            { "id": "A2", "from": {"x": 3, "y": 6}, "to": {"x": 4, "y": 5}, "duration": 1000 }
          ]
        },
        {
          "type": "tag",
          "ballHolder": "A2",
          "players": [
            { "id": "D2", "from": {"x": 3, "y": 3}, "to": {"x": 4, "y": 5}, "duration": 600 }
          ]
        },
        {
          "type": "rollball",
          "ballHolder": "A2",
          "passAnimation": { "from": "A2", "to": "A1" },
          "players": [
            { "id": "A2", "from": {"x": 4, "y": 5}, "to": {"x": 4, "y": 4}, "duration": 400 },
            { "id": "A1", "from": {"x": 2, "y": 7}, "to": {"x": 4, "y": 5}, "duration": 800 }
          ]
        }
      ]
    },
    {
      "id": 2,
      "description": "第2フェーズ: 右サイドへ展開",
      "steps": [
        {
          "type": "pass",
          "ballHolder": "A1",
          "passAnimation": { "from": "A1", "to": "A3" },
          "players": [
            { "id": "A3", "from": {"x": 4, "y": 7}, "to": {"x": 5, "y": 6}, "duration": 800, "isHighlighted": true }
          ]
        },
        {
          "type": "pass",
          "ballHolder": "A3",
          "passAnimation": { "from": "A3", "to": "A4" },
          "players": [
            { "id": "A4", "from": {"x": 5, "y": 7}, "to": {"x": 6, "y": 5}, "duration": 800, "isHighlighted": true }
          ]
        },
        {
          "type": "run",
          "ballHolder": "A4",
          "players": [
            { "id": "A4", "from": {"x": 6, "y": 5}, "to": {"x": 7, "y": 3}, "duration": 1200 }
          ]
        },
        {
          "type": "tag",
          "ballHolder": "A4",
          "players": [
            { "id": "D4", "from": {"x": 7, "y": 3}, "to": {"x": 7, "y": 3}, "duration": 400 }
          ]
        }
      ]
    }
  ]
}
```

---

## 10. 実装優先順位

### Phase 1（最小機能版）
1. グリッドシステム実装
2. 選手とボールの描画
3. 基本アニメーション（パス、ラン）
4. 再生/リセットボタン
5. サンプル戦術1つをハードコード

### Phase 2（戦術管理）
1. JSON戦術データの読み込み
2. 戦術セレクター実装
3. 複数戦術ファイルの作成
4. カテゴリ分け機能

### Phase 3（機能拡張）
1. タグアニメーション
2. ロールボールアニメーション
3. ステップ単位の操作
4. フェーズ単位の操作
5. 速度調整

### Phase 4（UX向上）
1. ハイライト機能
2. 軌跡表示
3. 状態表示の充実
4. エラーハンドリング
5. レスポンシブ対応

### Phase 5（編集機能）- 将来拡張
1. ドラッグ&ドロップ
2. 戦術エディター
3. JSON エクスポート/インポート
4. ローカルストレージ保存

---

## 11. 非機能要件

### 11.1 保守性
- コードはモジュール化し、各ファイルは単一責任を持つ
- 変数名、関数名は分かりやすい日本語または英語を使用
- 複雑なロジックにはコメントを記載

### 11.2 拡張性
- 新しい戦術を簡単に追加できる（JSONファイル配置のみ）
- 新しいアニメーションタイプを追加可能な設計
- カテゴリの追加が容易

### 11.3 ユーザビリティ
- 直感的なUI
- 操作に対する即座のフィードバック
- エラー時のわかりやすいメッセージ
