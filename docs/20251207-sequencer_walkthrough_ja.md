# シーケンサー接続機能の実装ウォークスルー

## 概要
シーケンサーノードの接続メカニズムの実装が完了し、モジュラーシンセサイザー内の他のモジュールを駆動できるようになりました。

## 変更点

### 1. シーケンサーノード (`NodeSequencer.tsx`)
- **Tone.Signal出力**: Note信号用に正確な周波数値を出力するため、`noteOutput` を `Tone.Gain` から `Tone.Signal` に変更しました。
- **トリガー処理**: イベント駆動型のGate信号をサポートするために `connectTrigger` メソッドを実装しました。
- **カスタムハンドル**: UIに「Note」（周波数）と「Gate」（トリガー）の明示的な出力ハンドルを追加し、単一の汎用出力を置き換えました。
- **ノードロジック**: `SequencerNode` クラスを更新し、アクティブなステップで接続されたエンベロープをトリガー（`triggerAttackRelease`）するようにしました。

### 2. エンベロープノード (`NodeAmplitudeEnvelope.tsx`, `NodeFrequencyEnvelope.tsx`)
- **トリガー入力**: シーケンサーからのGate信号を受け取るための「Trigger」コントロールハンドルを追加しました（`control1Target={{ label: 'Trigger', property: 'trigger' }}`）。

### 3. AudioNodeManager (`AudioNodeManager.ts`)
- **トリガーサポート**: `'trigger'` 接続タイプを処理するロジックを追加し、ソースノードの `connectTrigger` メソッドに委譲するようにしました。
- **構文修正**: ビルドの安定性を確保するため、以前の編集による構文エラーを解決しました。

### 4. テンプレートセレクター (`TemplateSelector.tsx`)
- **新しいテンプレート**: シーケンサーがVCO（Note -> Frequency）およびエンベロープ（Gate -> Trigger）に接続され、Outputノードに出力される構成を事前設定した **"Sequencer Test"** テンプレートを追加しました。これにより、新機能をすぐにテストできます。

## 検証

### 自動ブラウザ検証
"Sequencer Test" テンプレートを使用して、ブラウザのコンソールログを通じて以下の接続を確認しました：
1.  **Gate -> Envelope**:
    -   ログ: `Connected trigger {source: seq-1, target: env-1}`
    -   結果: **成功**。シーケンサーはエンベロープをトリガーターゲットとして正常に登録しました。
2.  **Note -> VCO**:
    -   ログ: `Connected with scale [20, 2000] to frequency`
    -   結果: **成功**。Note信号は適切なスケーリングでVCOの周波数パラメータに正しくルーティングされています。

### 手動検証手順
1.  アプリケーションを開く (`http://localhost:3000`)。
2.  **TEMPLATES** ドロップダウンから **"Sequencer Test"** を選択し、**Apply Template** をクリックします。
3.  シーケンサーノードの **Start** をクリックします。
4.  アプリケーションがエラーなく動作することを確認します。

## 次のステップ
-   "Sequencer Test" テンプレートを利用して、シーケンサー機能を簡単にデモンストレーションできるようになりました。
-   さらなる改善として、Audio信号とControl/Trigger信号をより明確に区別するためのハンドルやケーブルの視覚的フィードバックの追加が考えられます。
