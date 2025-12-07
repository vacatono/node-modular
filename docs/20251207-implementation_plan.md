# Implementation Plan - Sequencer Connections

SequencerのGate出力をEnvelopeのTriggerに接続し、Note出力をVCOのFrequencyに接続可能にするための改修計画です。

## User Review Required
> [!IMPORTANT]
> **AudioNodeManagerの拡張**: 
> Gate信号によるEnvelopeのトリガーを実現するため、`AudioNodeManager` に「イベント駆動接続」のロジックを追加します。通常のAudio/CV接続（`connect`）ではなく、ソースノードのメソッドを呼び出してターゲットを登録する方式を採用します。

> [!NOTE]
> **Note出力の仕様変化**:
> `NodeSequencer` のNote出力を `Tone.Gain` から `Tone.Signal` に変更し、周波数値(Hz)を直接出力するようにします。これによりVCOのFrequency入力への直接接続が可能になります。

## Proposed Changes

### `src/utils`

#### [MODIFY] [AudioNodeManager.ts](file:///e:/VSCodeソース/node-modular/src/utils/AudioNodeManager.ts)
- `registerAudioNode` 内の接続ロジックを拡張。
- `property === 'trigger'` の場合、`sourceNode` の `connectTrigger` メソッド（存在すれば）を呼び出す処理を追加。

### `src/modules`

#### [MODIFY] [NodeSequencer.tsx](file:///e:/VSCodeソース/node-modular/src/modules/NodeSequencer.tsx)
- `SequencerNode` クラスの更新:
    - `noteOutput` を `Tone.Gain` から `Tone.Signal` に変更。
    - ステップ処理で `noteOutput.setValueAtTime(frequency, time)` を実行。
    - `connectTrigger(target: any)` メソッドを追加し、接続されたEnvelopeを配列で管理。
    - ステップ処理で、接続されたEnvelopeの `triggerAttackRelease` を呼び出す。
- コンポーネントUIの更新:
    - 必要なハンドルの属性確認（すでに実装済みと思われるが、データ属性を確認）。

#### [MODIFY] [NodeAmplitudeEnvelope.tsx](file:///e:/VSCodeソース/node-modular/src/modules/NodeAmplitudeEnvelope.tsx)
- `NodeBox` に `controlHandle` (Input) を追加。
    - Label: `Trigger`
    - Property: `trigger`

#### [MODIFY] [NodeFrequencyEnvelope.tsx](file:///e:/VSCodeソース/node-modular/src/modules/NodeFrequencyEnvelope.tsx)
- `NodeAmplitudeEnvelope` と同様に `Trigger` 入力を追加（もしあれば）。

## Verification Plan

### Automated Tests
- なし（ユニットテスト環境が未整備のため）

### Manual Verification
1. **Gate -> Envelope Trigger**:
    - ブラウザで **Sequencer** と **Amplitude Envelope** を配置。
    - Sequencerの `Gate` 出力を Envelopeの `Trigger` 入力に接続。
    - Envelopeの出力をVCOの入力へ...ではなく、VCO -> Envelope -> Output の構成にする。
        - VCO (Audio) -> Envelope (Audio In)
        - Envelope (Audio Out) -> Output
        - Sequencer (Gate) -> Envelope (Trigger)
    - Sequencerの `Start` を押す。
    - 音がリズミカルに鳴ることを確認（Envelopeがトリガーされている）。

2. **Note -> VCO Frequency**:
    - **Sequencer** の `Note` 出力を **VCO** の `Frequency` 入力に接続。
    - Sequencerのキー設定を変更（例: C4, E4, G4）。
    - 音程がステップごとに変化することを確認。
