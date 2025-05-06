# ノードエディタ テンプレート機能実装案

## 1. テンプレート機能の実装案

### 概要

- 複数のノード・エッジの組み合わせ（テンプレート）を定義し、ユーザーが選択して呼び出せるようにします。
- テンプレートはプリセットとして用意しても良いし、ユーザーが作成・保存できるようにもできます。

### 実装ステップ

#### 1. テンプレートの型定義

```typescript
/**
 * ノードとエッジのテンプレート型
 */
type FlowTemplate = {
  name: string; // テンプレート名
  nodes: Node[];
  edges: Edge[];
};
```

#### 2. テンプレートの管理

- プリセットテンプレートを配列で管理
- ユーザーが作成したテンプレートも同じ配列に追加

```typescript
/** プリセットテンプレート例 */
const presetTemplates: FlowTemplate[] = [
  {
    name: '基本VCO→出力',
    nodes: [
      /* ...Node配列... */
    ],
    edges: [
      /* ...Edge配列... */
    ],
  },
  // 他のテンプレート...
];
```

#### 3. テンプレートの選択・適用

- テンプレート選択用の UI（ドロップダウンやボタン）を用意
- 選択時に`setNodes`と`setEdges`で状態を上書き

```typescript
const applyTemplate = (template: FlowTemplate) => {
  setNodes(template.nodes);
  setEdges(template.edges);
};
```

## 2. 状態保存機能の実装案

### 概要

- 現在のノード・エッジの状態を「名前付きテンプレート」として保存
- 保存したテンプレートはローカルストレージやサーバーに保存可能

### 実装ステップ

#### 1. 保存用 UI

- 「現在の状態を保存」ボタン＋テンプレート名入力欄

#### 2. 保存処理

- 現在の`nodes`と`edges`をコピーし、テンプレート名とともに保存

```typescript
const saveCurrentAsTemplate = (name: string) => {
  const newTemplate: FlowTemplate = {
    name,
    nodes: [...nodes],
    edges: [...edges],
  };
  // ローカルストレージや状態管理に追加
};
```

#### 3. ローカルストレージへの保存・読み込み（例）

```typescript
// 保存
localStorage.setItem('userTemplates', JSON.stringify(userTemplates));

// 読み込み
const userTemplates = JSON.parse(localStorage.getItem('userTemplates') || '[]');
```

## 3. UI イメージ

- テンプレート選択用のドロップダウン
- 「テンプレートとして保存」ボタン＋名前入力欄
- 保存済みテンプレートの一覧表示・削除

## 4. 拡張案

- サーバー保存（ユーザーごとにテンプレート管理）
- テンプレートのインポート・エクスポート（JSON 形式）

## まとめ

- テンプレートの型を定義し、プリセットやユーザー保存分を配列で管理
- テンプレート選択時に`setNodes`/`setEdges`で状態を切り替え
- 現在の状態をテンプレートとして保存する UI・処理を追加
