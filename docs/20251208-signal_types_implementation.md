# 信号タイプ分離実装の記録 (2025-12-08)

## 概要
モジュラーシンセサイザーの信号を4種類（Audio, CV, Gate, Note）に厳密に分離し、色分けと接続制限を実装しました。

## 実装内容

### 1. 信号タイプの定義 (`src/utils/signalTypes.ts`)
新規ファイルを作成し、以下を定義：
- **Audio** (青 `#2196f3`): オーディオ信号
- **CV** (緑 `#4caf50`): コントロール電圧（モジュレーション）
- **Gate** (ピンク `#e91e63`): トリガー/ゲート信号
- **Note** (オレンジ `#ff9800`): ピッチ情報（周波数）

### 2. UI接続検証 (`src/components/NodeEditor.tsx`)
- `isValidConnection` コールバックを実装
- ハンドルIDから信号タイプを抽出し、同じタイプのみ接続可能に
- 異なるタイプの接続試行時は警告を表示

### 3. ハンドルID規則の統一 (`src/modules/common/NodeBox.tsx`)
すべてのハンドルIDに信号タイプのサフィックスを追加：
- Audio: `-audio` (例: `vco-1-output-audio`)
- CV: `-cv` (例: `lfo-1-output-cv`)
- Gate: `-gate` (例: `seq-1-gate-gate`)
- Note: `-note` (例: `seq-1-note-note`)

**ハンドル色の更新:**
- Output/Input (Audio): 青 `#2196f3`
- Control1 (CV or Gate): 緑 `#4caf50` または ピンク `#e91e63`
- Control2 (CV or Note): 緑 `#4caf50` または オレンジ `#ff9800`

### 4. モジュール更新

#### NodeSequencer (`src/modules/NodeSequencer.tsx`)
- Note出力: `${id}-note-note` (オレンジ)
- Gate出力: `${id}-gate-gate` (ピンク)
- 色を正確なカラーコードに更新

#### NodeVCO (`src/modules/NodeVCO.tsx`)
- **Note専用入力を追加**: `control2Handle` (底部、オレンジ色)
- `note` プロパティを `frequency` のエイリアスとして登録
- これにより Sequencer の Note 出力を直接接続可能に

### 5. AudioNodeManager の更新 (`src/utils/AudioNodeManager.ts`)
接続ロジックを信号タイプベースに完全リファクタリング：

```typescript
// ハンドルIDから信号タイプを抽出
const getSignalType = (handleId: string | null | undefined): string | null => {
  if (!handleId) return null;
  const parts = handleId.split('-');
  return parts[parts.length - 1] || null;
};
```

**接続処理の分岐:**
- **Gate**: `connectTrigger()` メソッドを呼び出し（イベント駆動）
- **Note**: 直接接続（周波数値として）
- **CV**: `Tone.Scale` を使用してパラメータ範囲にマッピング
- **Audio**: 通常のオーディオ接続

### 6. テンプレート更新 (`src/modules/TemplateSelector.tsx`)
- "VCO->Envelope->Out" テンプレートのエッジIDを更新
- "Sequencer Test" テンプレートを新しいハンドルID形式に更新
  - Gate: `seq-1-gate-gate` → `env-1-control1-trigger-gate`
  - Note: `seq-1-note-note` → `vco-1-control2-note-note`
  - Audio接続も全て更新

## 技術的な詳細

### ハンドルID命名規則
- **通常ハンドル**: `{nodeId}-{handleName}-{signalType}`
  - 例: `vco-1-output-audio`, `lfo-1-output-cv`
- **コントロールハンドル**: `{nodeId}-control{N}-{property}-{signalType}`
  - 例: `env-1-control1-trigger-gate`, `vco-1-control2-note-note`

### 接続検証ロジック
```typescript
const isValidConnection = (connection: Connection) => {
  const sourceType = getSignalType(connection.sourceHandle);
  const targetType = getSignalType(connection.targetHandle);
  return sourceType && targetType && sourceType === targetType;
};
```

## 残タスク
- [ ] ブラウザでの動作検証
- [ ] 他のテンプレート（VCO+Filter+LFO, Effects Chain等）のエッジID更新
- [ ] LFO, Filter等の他のモジュールのハンドル確認
- [ ] ドキュメント更新（ユーザーガイド）

## 既知の制限事項
- 現在、一部の古いテンプレートは更新されていない可能性があります
- VCOの `note` プロパティは `frequency` のエイリアスとして実装（将来的にV/Oct変換を追加する可能性）

## 次のステップ
1. ブラウザでの動作確認
2. 残りのテンプレート更新
3. 必要に応じてバグ修正
4. ユーザードキュメントの作成
