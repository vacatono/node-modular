# registerAudioNode 仕様書

## 概要

`registerAudioNode`は、NodeEditor コンポーネントで定義される関数で、Tone.js のオーディオノードを管理し、ノード間の接続を制御する重要な役割を担います。

## 関数シグネチャ

```typescript
type RegisterAudioNode = (nodeId: string, audioNode: Tone.ToneAudioNode) => void;
```

## 呼び出しタイミング

各ノードコンポーネント（例：NodeVCO）の`useEffect`フック内で、以下のタイミングで呼び出されます：

1. コンポーネントのマウント時
2. ノードのパラメータ（frequency, type 等）が変更された時

## 主な処理内容

### 1. 既存ノードのクリーンアップ

- 指定された nodeId に対応する既存の AudioNode があれば、disconnect()を実行

### 2. ノードの登録

- audioNodes Map に新しい AudioNode を登録

```typescript
audioNodes.set(nodeId, audioNode);
```

### 3. 接続の再構築

既存のエッジ情報（edges）に基づいて、以下の接続を再構築：

#### 制御接続（Control Connection）の場合

- ソースノードからターゲットノードの特定のプロパティへの接続
- 必要に応じて Tone.Scale を使用して信号をスケーリング

```typescript
if (edge.targetHandle?.includes('-control')) {
  const property = edge.targetHandle?.split('-').pop();
  // スケーリング処理
  const scaleNode = new Tone.Scale(scaleInfo.min, scaleInfo.max);
  sourceNode.connect(scaleNode);
  scaleNode.connect(targetNode[property]);
}
```

#### オーディオ接続（Audio Connection）の場合

- ソースノードからターゲットノードへの直接接続

```typescript
sourceNode.connect(targetNode);
```

### 4. 出力ノードの特別処理

- nodeId が'toDestination'の場合、Tone.Destination への接続を実行

```typescript
if (nodeId === 'toDestination') {
  audioNode.toDestination();
}
```

## 使用例（NodeVCO）

```typescript
useEffect(() => {
  oscillator.current = new Tone.Oscillator(data.frequency || 440, data.type || 'sine');

  // Tone.jsのオブジェクトを登録
  data.registerAudioNode(id, oscillator.current);

  return () => {
    oscillator.current?.stop();
    oscillator.current?.dispose();
  };
}, [id, data.frequency, data.type, data.registerAudioNode]);
```

## 制御信号のスケーリング

制御接続の場合、以下のスケール情報に基づいて信号をスケーリングします：

```typescript
const controlScales = {
  Oscillator: {
    frequency: { min: 20, max: 2000 },
    detune: { min: -100, max: 100 },
  },
  Filter: {
    frequency: { min: 200, max: 5000 },
    Q: { min: 0.1, max: 20 },
  },
  // ... その他のスケール情報
};
```

## 注意事項

1. ノードの削除時は、必ず disconnect()と dispose()を実行すること
2. 制御接続の場合は、適切なスケーリングが必要
3. エッジの接続/切断時は、既存の接続を適切にクリーンアップすること

## エラーハンドリング

接続処理中にエラーが発生した場合は、コンソールにエラーを出力します：

```typescript
try {
  // 接続処理
} catch (error) {
  console.error('Error connecting audio nodes:', error);
}
```
