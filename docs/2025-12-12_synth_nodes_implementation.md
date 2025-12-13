# 実装ウォークスルー - シンセノードの実装と検証

5つの新しいシンセノード（AMSynth, FMSynth, MonoSynth, MembraneSynth, NoiseSynth）を実装し、動作検証を行いました。

## 変更点
- `src/modules/` に5つの新しい `Node` ラッパーコンポーネントを作成しました。
- Sequencerとの統合をサポートするため、ノートキャッシュ機能付きの `triggerAttack`/`triggerRelease` インターフェースを実装しました。
- `NodeEditor.tsx` を更新し、これらの新しいノードを追加しました。
- `MembraneSynth` のデフォルト `octaves` パラメータを有効範囲内に修正しました。

## 検証結果

### マニュアルテスト
ブラウザ環境を使用して手動テストを実行しました：

1.  **Mono Synth**: Sequencer（Gate & Note）に接続し、音声出力を確認しました。
2.  **Membrane Synth**: Sequencer（Gate & Note）に接続し、パーカッシブな音声出力を確認しました。
3.  **AMSynth**: Sequencer（Gate & Note）に接続し、変調された音声出力を確認しました。

### 主な実装の詳細
`Tone.MonoSynth`、`Tone.MembraneSynth`、`Tone.AMSynth`、`Tone.FMSynth` クラスは、トリガーメソッド（発音開始）にノート（音程）引数を必要とします。
一方、本プロジェクトの `Sequencer` は `setNote` でノート更新を、`triggerAttackRelease` でゲートトリガーを別々に送信する仕様になっています。

これをサポートするため、各ノードラッパーにローカルの `currentNote` キャッシュを実装しました：

```typescript
  setNote(note: Tone.Unit.Frequency, time?: Tone.Unit.Time): void {
    this.currentNote = note;
    this.synth.setNote(note, time);
  }

  triggerAttackRelease(duration: Tone.Unit.Time, time?: Tone.Unit.Time, velocity?: number): this {
    // キャッシュされたノートを使用
    this.synth.triggerAttackRelease(this.currentNote, duration, time, velocity);
    return this;
  }
```

これにより、Gate信号が到着したときに、直前のNote信号によって設定されたピッチで確実にシンセが発音されることが保証されます。
