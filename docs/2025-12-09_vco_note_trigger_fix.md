# VCO Note Trigger & Keyboard Module Fixes Summary
Date: 2025-12-09

## 概要
VCOがNoteイベント（周波数情報）を正しく受信・発音できるようにするための改修、およびデバッグ用キーボードモジュールの実装を行いました。

## 主な変更点

### 1. Monophonic Keyboard モジュールの実装 (`src/modules/NodeKeyboard.tsx`)
*   **機能**: 1オクターブ（C4-C5）の単音キーボードを作成。
*   **UI改善**:
    *   黒鍵の配置を絶対座標計算により適正化。
    *   `box-sizing: border-box` を適用し、白鍵のボーダーによるズレを解消。
    *   デバッグ用の「Test C4」ボタンを追加。
*   **出力**:
    *   **Note Out**: オレンジ色のハンドル。`connectNote` メソッドを通じてNoteイベント（文字列）を送信。
    *   **Gate Out**: ピンク色のハンドル（Gate Type）。押下時に `1`、離鍵時に `0` を出力。

### 2. AudioNodeManager の接続ロジック修正 (`src/utils/AudioNodeManager.ts`)
*   **Note接続の優先処理**: `targetType === 'note'` の場合、`AudioParam` の妥当性チェック（`targetParam` の存在確認）をスキップし、強制的に `connectNote` メソッドを呼び出すようにロジックを変更。
    *   これにより、`Target property note is not a valid AudioParam` エラーを解消。
    *   VCOの `note` 入力のような、AudioParamではないカスタム入力への接続が可能になりました。
*   **ログ出力の強化**: 接続試行時および成功時に詳細なデバッグログを出力するように変更。

### 3. VCOの周波数更新ロジック修正 (`src/modules/NodeVCO.tsx`)
*   **setValueAtTimeの使用**: `setNote` メソッドにおいて、`this.baseFrequency.value = ...` ではなく `this.baseFrequency.setValueAtTime(frequency, Tone.now())` を使用するように変更。これにより、Tone.jsのタイムライン上で確実な周波数更新が行われるようになりました。
*   **ログ整理**: 頻出していた `[DEBUG] VCO frequency getter called` ログを削除し、コンソールの視認性を向上。

### 4. その他
*   **Sequencer**: Keyboardに合わせてハンドルの配置や色（Note=オレンジ, Gate=ピンク）を統一。

## 現状の課題（Future Work）
*   ブラウザ操作（Puppeteer/Selenium等）によるクリックイベントの発火が不安定な場合がある（デバッグボタンで代用中）。
*   React Flowの再レンダリング時にノードインスタンスが再生成される挙動に伴う、接続状態の永続化・復元の安定性向上。
