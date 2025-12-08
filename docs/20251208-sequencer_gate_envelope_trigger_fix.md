# Sequencer Gate to Envelope Trigger Connection Fix - Walkthrough

**Date**: 2025-12-08

## Problem Statement

SequencerのGate出力をEnvelopeのTrigger入力に接続しても、Envelopeがトリガーされない問題がありました。

## Investigation and Changes Made

### 1. NodeFrequencyEnvelope削除

**問題**: `NodeFrequencyEnvelope`が`Tone.Scale`を登録していたため、Sequencerがトリガーできませんでした。

**対応**: NodeFrequencyEnvelopeを完全に削除しました:
- [NodeEditor.tsx](file:///e:/VSCodeソース/node-modular/src/components/NodeEditor.tsx) からimportと node type登録を削除
- [TemplateSelector.tsx](file:///e:/VSCodeソース/node-modular/src/modules/TemplateSelector.tsx) から FrequencyEnvelopeテンプレートを削除
- `NodeFrequencyEnvelope.tsx` ファイルを削除

### 2. NodeEditorのonConnect修正

**問題**: 新しい接続が作成されたときに、AudioNodeManagerに通知されていませんでした。

**対応**: [NodeEditor.tsx](file:///e:/VSCodeソース/node-modular/src/components/NodeEditor.tsx#L96-L185) の`onConnect`関数を修正し、新しいエッジが追加されたときに即座に接続処理を実行するようにしました:

```typescript
const onConnect = useCallback(
  (params: Connection) => {
    // ... エッジ作成 ...
    
    // 新しい接続を処理するためにAudioNodeManagerを呼び出す
    const sourceNode = audioNodeManager.getAudioNode(params.source!);
    const targetNode = audioNodeManager.getAudioNode(params.target!);
    
    if (sourceNode && targetNode) {
      // 信号タイプに基づいて接続処理を分岐
      if (targetType === 'gate') {
        // Gate信号: トリガー接続
        sourceNode.connectTrigger(targetNode);
      } else if (targetType === 'note' || targetType === 'cv') {
        // Note/CV信号: パラメータへの接続
        sourceNode.connect(targetParam);
      } else if (targetType === 'audio') {
        // Audio信号: 通常のオーディオ接続
        sourceNode.connect(targetNode);
      }
    }
  },
  [setEdges]
);
```

## Browser Testing

### Test 1: Manual Connection

![After Connections](file:///C:/Users/vacat/.gemini/antigravity/brain/2ed6d22b-7983-4475-a981-1a7a1d93481c/after_connections_1765152558409.png)

手動で接続を作成したテスト。Sequencerを追加し、Gate→Envelope Trigger、VCO→Envelope、Envelope→Outputの接続を作成しました。

**結果**: コンソールログに「Processing new connection」と「Connected trigger (Gate)」のメッセージが表示され、接続処理が動作していることを確認しました。

![After Start](file:///C:/Users/vacat/.gemini/antigravity/brain/2ed6d22b-7983-4475-a981-1a7a1d93481c/after_start_1765152715132.png)

Sequencerを開始した後の状態。Sequencerは動作していますが（ステップインジケーターが動いている）、音が出ていません。

### Test 2: Template Loading

![Template Loaded](file:///C:/Users/vacat/.gemini/antigravity/brain/2ed6d22b-7983-4475-a981-1a7a1d93481c/template_loaded_1765152860305.png)

「Sequencer Test」テンプレートを読み込んだ状態。

**重要な発見**: テンプレート適用時には`onConnect`が呼び出されないため、接続が処理されません。コンソールログに「Processing new connection」や「Connected trigger (Gate)」のメッセージが表示されませんでした。

## Remaining Issue

**テンプレート読み込み時の接続処理**: 

`handleApplyTemplate`関数は`setNodes`と`setEdges`を直接呼び出すため、`onConnect`がトリガーされません。その結果、テンプレートで定義された接続が処理されず、AudioNodeManagerが接続を確立しません。

### 解決策の選択肢

1. **テンプレート適用後にedgesを再処理**: `handleApplyTemplate`内で、全てのedgesに対して接続処理を実行する
2. **useEffect でedges変更を監視**: edgesが変更されたときに、新しいedgesを処理する
3. **AudioNodeManagerの登録タイミングを変更**: ノード登録時に現在のedgesを参照するのではなく、edges変更時に再接続する

## Browser Test Recordings

- [Initial State Check](file:///C:/Users/vacat/.gemini/antigravity/brain/2ed6d22b-7983-4475-a981-1a7a1d93481c/localhost_3000_open_1765150572375.webp)
- [Manual Connection Test](file:///C:/Users/vacat/.gemini/antigravity/brain/2ed6d22b-7983-4475-a981-1a7a1d93481c/test_gate_connection_1765152520813.webp)
- [Fixed Connection Test](file:///C:/Users/vacat/.gemini/antigravity/brain/2ed6d22b-7983-4475-a981-1a7a1d93481c/test_fixed_connection_1765152667412.webp)
- [Template Test](file:///C:/Users/vacat/.gemini/antigravity/brain/2ed6d22b-7983-4475-a981-1a7a1d93481c/test_with_template_1765152759429.webp)

## Next Steps

テンプレート読み込み時の接続処理を実装する必要があります。最も簡単な方法は、`handleApplyTemplate`関数内で、テンプレート適用後に全てのedgesを処理することです。
