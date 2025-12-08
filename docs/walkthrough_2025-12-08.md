# ウォークスルー - イベントベースのNote接続

「Note」接続ロジックのリファクタリングが完了しました。連続的な周波数信号（Audio/CV）を送信する代わりに、離散的なNoteイベント（例：「C4」、「D#3」）を送信するシステムに変更されました。

## 変更点

### 1. AudioNodeManagerのリファクタリング
- **`connect`メソッドの更新**: `targetType === 'note'`の接続時に、ソースノードが`connectNote`メソッドを持っているかをチェックするようになりました。
- **イベントバスの優先**: `connectNote`が利用可能な場合、イベントベースの接続を確立します。そうでない場合は、従来の信号接続にフォールバックします。

### 2. ノードの更新
- **SequencerNode (`NodeSequencer.tsx`)**:
  - `connectNote(target)`を実装しました。
  - 接続されたターゲットのリスト（`connectedNotes`）を保持します。
  - ステップごとにターゲットを反復処理し、`target.setNote(note)`を呼び出します。
- **VCONode (`NodeVCO.tsx`)**:
  - `setNote(note)`を実装しました。
  - ノート名を周波数に変換し、`baseFrequency`を設定します。
  - `CV In`によるLFOモジュレーションを許可しつつ、Sequencerからピッチを直接制御できるようにしました。
- **NoteToCVNode (`NodeNoteToCV.tsx`)**:
  - `setNote(note)`を実装しました。
  - ノートをHzに変換し、CV信号として出力します。これにより、他のモジュールへの「イベント -> CV」変換が可能になります。

### 3. 検証
- 再生中に`Sequencer`が「Noteイベント」を発行することを確認しました。
- `AudioNodeManager`が正常に`connectNote`を呼び出すことを確認しました。
- このアーキテクチャは、エンベロープのトリガーやボイス割り当てにNoteイベントを必要とする複雑なポリフォニックシンセ（AMSynth、FMSynth）への道を開くものです。

## テスト方法
1.  **直接接続**: **Sequencer Note Out**を**VCO Note In**に接続します。Sequencerを開始します。VCOがシーケンスを再生するはずです。
2.  **CV変換**: **Sequencer Note Out**を**NoteToCV Note In**に接続し、次に**NoteToCV CV Out**を**VCO CV In**に接続します。これもシーケンスを再生し、コンバーターがイベントで動作することを実証します。
