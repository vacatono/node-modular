### Edge の Interface

```typescript
interface Edge {
  id: string; // エッジの一意のID
  source: string; // 接続元ノードのID
  target: string; // 接続先ノードのID
  sourceHandle?: string; // 接続元ノードのハンドルID（オプション）
  targetHandle?: string; // 接続先ノードのハンドルID（オプション）
  data?: any; // エッジに関連付けられた追加データ（オプション）
  style?: React.CSSProperties; // エッジのスタイル（オプション）
  animated?: boolean; // アニメーションの有無（オプション）
  label?: string; // エッジのラベル（オプション）
  labelStyle?: React.CSSProperties; // ラベルのスタイル（オプション）
  labelBgStyle?: React.CSSProperties; // ラベル背景のスタイル（オプション）
  labelBgPadding?: [number, number]; // ラベル背景のパディング（オプション）
  labelBgBorderRadius?: number; // ラベル背景の角丸（オプション）
  interactionWidth?: number; // インタラクション可能な幅（オプション）
}
```

### Connection の Interface

- これは Edge の作成時に使用される一時的な型

```typescript
interface Connection {
  source: string; // 接続元ノードのID
  target: string; // 接続先ノードのID
  sourceHandle?: string; // 接続元ノードのハンドルID
  targetHandle?: string; // 接続先ノードのハンドルID
}
```

### Node の Interface

```typescript
interface Node {
  id: string; // ノードの一意のID
  type?: string; // ノードの種類（オプション）
  position: {
    // ノードの位置
    x: number;
    y: number;
  };
  data: {
    // ノードに関連付けられたデータ
    label: string; // ノードのラベル
    [key: string]: any; // その他のカスタムデータ
  };
  style?: React.CSSProperties; // ノードのスタイル（オプション）
  sourcePosition?: Position; // 出力ハンドルの位置（オプション）
  targetPosition?: Position; // 入力ハンドルの位置（オプション）
  draggable?: boolean; // ドラッグ可能かどうか（オプション）
  selectable?: boolean; // 選択可能かどうか（オプション）
  deletable?: boolean; // 削除可能かどうか（オプション）
  connectable?: boolean; // 接続可能かどうか（オプション）
  hidden?: boolean; // 非表示かどうか（オプション）
  selected?: boolean; // 選択されているかどうか（オプション）
}
```

### NodeTypes の Interface

```typescript
type NodeTypes = {
  [key: string]: React.ComponentType<NodeProps>;
};
```

### module の NodeTypes 定義

```typescript
const nodeTypes: NodeTypes = {
  vco: NodeVCO,
  filter: NodeFilter,
  delay: NodeDelay,
  reverb: NodeReverb,
  toDestination: NodeOutput,
  lfo: NodeLFO,
  oscilloscope: NodeOscilloscope,
};
```
