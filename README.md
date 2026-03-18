# Tag Rugby Tactics Animator

A web app for visualizing tag rugby tactics with step-by-step animations.

## Usage

Hosted on GitHub Pages — open in your browser directly.

## Adding Tactics

### 1. Create a JSON file

Add a tactics JSON file anywhere under the `tactics/` folder.

```json
{
  "name": "Tactics Name",
  "description": "Description",
  "author": "Author",
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

**Step types**

| type | description |
|---|---|
| `run` | Player runs |
| `pass` | Ball is passed (requires `passAnimation`) |
| `tag` | Player is tagged |
| `rollball` | Roll ball |

### 2. Update index.json

**Whenever you add or remove a tactics file, manually update `tactics/index.json`.**

```json
[
  {
    "name": "Tactics Name",
    "path": "tactics/your-tactics.json"
  }
]
```

### 3. Push

```bash
git add tactics/your-tactics.json tactics/index.json
git commit -m "Add new tactics"
git push
```

Changes are automatically reflected on GitHub Pages.

## Grid Coordinates

The field is an 11×11 grid. Top-left is `(0, 0)`, bottom-right is `(10, 10)`.

```
  0 1 2 3 4 5 6 7 8 9 10  ← gridX
0
1
2  [Defense]
3
4
5  [Ball]
6
7  [Attack]
8
9
10
↑
gridY
```
