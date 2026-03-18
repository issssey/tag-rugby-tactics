# タグラグビー戦術アニメーション

タグラグビーの戦術をアニメーションで可視化するWebアプリです。

## 使い方

GitHub Pages でホストされているため、ブラウザからそのままアクセスできます。

## 戦術ファイルの追加

### 1. JSONファイルを作成

`tactics/` フォルダ以下に戦術JSONファイルを追加します。

```json
{
  "name": "戦術名",
  "description": "説明",
  "author": "作成者",
  "players": {
    "attack": [
      { "id": "A1", "gridX": 5, "gridY": 5 }
    ],
    "defense": [
      { "id": "D1", "gridX": 5, "gridY": 3 }
    ]
  },
  "phases": [
    {
      "id": 1,
      "description": "",
      "steps": [
        {
          "type": "run",
          "ballHolder": "A1",
          "players": [
            { "id": "A1", "from": {"x": 5, "y": 5}, "to": {"x": 5, "y": 3}, "duration": 600 }
          ]
        }
      ]
    }
  ]
}
```

**ステップのtype一覧**

| type | 内容 |
|---|---|
| `run` | 選手がランする |
| `pass` | ボールをパスする（`passAnimation` が必要） |
| `tag` | タグを取られる |
| `rollball` | ロールボール |

### 2. index.json を更新

**戦術ファイルを追加・削除した場合は `tactics/index.json` を手動で更新してください。**

```json
[
  {
    "name": "戦術名",
    "path": "tactics/your-tactics.json"
  }
]
```

### 3. pushする

```bash
git add tactics/your-tactics.json tactics/index.json
git commit -m "Add new tactics"
git push
```

GitHub Pagesに自動で反映されます。

## グリッド座標

フィールドは11×11のグリッドです。左上が `(0, 0)`、右下が `(10, 10)` です。

```
  0 1 2 3 4 5 6 7 8 9 10  ← gridX
0
1
2  [ディフェンス]
3
4
5  [ボール]
6
7  [アタック]
8
9
10
↑
gridY
```
