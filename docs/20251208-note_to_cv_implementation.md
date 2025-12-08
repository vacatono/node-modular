# Note to CV 変換ノードの実装

## 概要

Sequencer の Note 出力を VCO に直結するのではなく、Note から CV（Control Voltage）に変換する専用の Node を実装しました。

## 実装内容

### 新規作成ファイル

- `src/modules/NodeNoteToCV.tsx` - Note to CV 変換ノードコンポーネント

### 変更ファイル

- `src/components/NodeEditor.tsx` - NodeNoteToCV の登録とボタン追加
- `src/modules/common/NodeBox.tsx` - `isSource`プロパティの追加（出力ハンドル対応）
- `src/modules/common/CustomSlider.tsx` - `value`プロパティの追加（制御値表示対応）

## NodeNoteToCV の機能

### 入力/出力

- **Note In（上部ハンドル）**: Sequencer などからの Note 信号を受け取る（オレンジ色）
- **CV Out（下部ハンドル）**: VCO などへの CV 信号を出力する（緑色）

### パラメータ

1. **Octave Offset（オクターブオフセット）**

   - 範囲: -4 ～ +4
   - 機能: 入力された Note 信号をオクターブ単位でシフト
   - 計算式: 出力周波数 = 入力周波数 × 2^(オクターブオフセット)

2. **Tuning（チューニング）**
   - 範囲: -100 ～ +100 cents
   - 機能: 微調整（1 セント = 1/100 半音）
   - 計算式: 出力周波数 = 入力周波数 × 2^(チューニング/1200)

### 表示情報

- **Output**: 現在の出力周波数（Hz）
- **Octave**: 現在のオクターブオフセット値
- **Tuning**: 現在のチューニング値（cents）

## 技術的な実装詳細

### 信号処理チェーン

```
Note Input (Tone.Signal)
  ↓
Octave Multiplier (Tone.Multiply)
  ↓
Tuning Multiplier (Tone.Multiply)
  ↓
CV Output (Tone.Signal)
```

### 主要なメソッド

- `setOctaveOffset(offset: number)`: オクターブオフセットを設定
- `setTuning(cents: number)`: チューニングを設定
- `get note()`: Note 入力用のエイリアス
- `get frequency()`: CV 出力用のエイリアス（VCO の frequency に接続）

## 使用方法

### 基本的な接続例

1. **Sequencer → Note→CV → VCO**

   ```
   Sequencer [Note Out] → Note→CV [Note In]
   Note→CV [CV Out] → VCO [Note/Frequency]
   ```

2. **オクターブシフトの例**

   - Octave Offset = +1: 入力の 1 オクターブ上を出力
   - Octave Offset = -1: 入力の 1 オクターブ下を出力

3. **チューニングの例**
   - Tuning = +50: 入力より 50 セント（半音の半分）高く出力
   - Tuning = -100: 入力より 100 セント（半音）低く出力

## 利点

1. **モジュラー性の向上**: Note 信号と CV 信号を明確に分離
2. **柔軟性**: オクターブシフトやチューニング調整が可能
3. **拡張性**: 将来的に量子化（Quantize）機能などを追加可能
4. **視覚的な明確さ**: 信号の流れが分かりやすい

## 今後の拡張案

- [ ] 量子化機能（特定のスケールに音程を制限）
- [ ] ポルタメント（音程変化の滑らかさ調整）
- [ ] 複数の CV 出力（異なるオクターブを同時出力）
- [ ] MIDI Note 番号からの変換対応

## 動作確認

1. NodeEditor で「Add Note→CV」ボタンをクリック
2. Sequencer の Note Out を Note→CV の Note In に接続
3. Note→CV の CV Out を VCO の Note または Frequency に接続
4. Sequencer を再生して音が出ることを確認
5. Octave Offset や Tuning を調整して音程が変わることを確認

## 注意事項

- Note→CV ノードは信号変換のみを行い、音声信号は生成しません
- VCO の Start ボタンを押さないと音は出ません
- 周波数モニタリングは 100ms ごとに更新されます（デバッグ用）
